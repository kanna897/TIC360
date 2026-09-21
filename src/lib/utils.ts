import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { Student, StudentOutcome, DropoutRecord, Batch, ProgrammeHistory } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol: string = 'LKR'): string {
  return `${symbol} ${amount.toLocaleString('en-LK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatMonthName(monthStr: string): string {
  // input format: '2026-08'
  if (!monthStr) return '';
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  } catch {
    return monthStr;
  }
}

export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  headers?: { key: keyof T; label: string }[]
) {
  if (!rows || !rows.length) {
    alert('No data available to export');
    return;
  }

  const columns =
    headers ||
    Object.keys(rows[0]).map((key) => ({
      key: key as keyof T,
      label: key.toUpperCase(),
    }));

  const csvRows: string[] = [];
  csvRows.push(columns.map((c) => `"${c.label}"`).join(','));

  for (const row of rows) {
    const values = columns.map((col) => {
      const rawVal = row[col.key];
      const stringVal =
        rawVal === undefined || rawVal === null
          ? ''
          : typeof rawVal === 'object'
          ? JSON.stringify(rawVal)
          : String(rawVal);
      return `"${stringVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(
  filename: string,
  sheets: Array<{ sheetName: string; data: Record<string, any>[] }>
) {
  if (!sheets || !sheets.length) {
    alert('No data to export');
    return;
  }

  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName || 'Sheet1');
  }

  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Calculates comparative statistics for Blossom vs Non-Blossom students
 */
export function calculateBlossomComparison(
  students: Student[],
  outcomes: StudentOutcome[]
) {
  const blossomStudents = students.filter((s) => s.isBlossomTrust);
  const nonBlossomStudents = students.filter((s) => !s.isBlossomTrust);

  const totalBlossom = blossomStudents.length || 1;
  const totalNonBlossom = nonBlossomStudents.length || 1;

  // Active
  const blossomActive = blossomStudents.filter((s) => s.currentStatus === 'Active').length;
  const nonBlossomActive = nonBlossomStudents.filter((s) => s.currentStatus === 'Active').length;

  // Completed
  const blossomCompleted = blossomStudents.filter((s) => s.currentStatus === 'Completed').length;
  const nonBlossomCompleted = nonBlossomStudents.filter((s) => s.currentStatus === 'Completed').length;

  // Dropouts
  const blossomDropouts = blossomStudents.filter((s) => s.currentStatus === 'Dropout').length;
  const nonBlossomDropouts = nonBlossomStudents.filter((s) => s.currentStatus === 'Dropout').length;

  // Outcomes calculation based on student id matching
  const getOutcomeCount = (studentsList: Student[], status: string) => {
    const studentIds = new Set(studentsList.map((s) => s.id));
    return outcomes.filter((o) => studentIds.has(o.studentId) && o.outcomeStatus === status).length;
  };

  const blossomEmployed = getOutcomeCount(blossomStudents, 'Employed');
  const nonBlossomEmployed = getOutcomeCount(nonBlossomStudents, 'Employed');

  const blossomSelfEmployed = getOutcomeCount(blossomStudents, 'Self Employed');
  const nonBlossomSelfEmployed = getOutcomeCount(nonBlossomStudents, 'Self Employed');

  const blossomHigherStudies = getOutcomeCount(blossomStudents, 'Higher Studies');
  const nonBlossomHigherStudies = getOutcomeCount(nonBlossomStudents, 'Higher Studies');

  const blossomInternship = getOutcomeCount(blossomStudents, 'Internship');
  const nonBlossomInternship = getOutcomeCount(nonBlossomStudents, 'Internship');

  const blossomUnemployed = getOutcomeCount(blossomStudents, 'Unemployed');
  const nonBlossomUnemployed = getOutcomeCount(nonBlossomStudents, 'Unemployed');

  return {
    totals: {
      blossom: blossomStudents.length,
      nonBlossom: nonBlossomStudents.length,
    },
    active: {
      blossomCount: blossomActive,
      blossomPct: Math.round((blossomActive / totalBlossom) * 100),
      nonBlossomCount: nonBlossomActive,
      nonBlossomPct: Math.round((nonBlossomActive / totalNonBlossom) * 100),
    },
    completed: {
      blossomCount: blossomCompleted,
      blossomPct: Math.round((blossomCompleted / totalBlossom) * 100),
      nonBlossomCount: nonBlossomCompleted,
      nonBlossomPct: Math.round((nonBlossomCompleted / totalNonBlossom) * 100),
    },
    dropouts: {
      blossomCount: blossomDropouts,
      blossomPct: Math.round((blossomDropouts / totalBlossom) * 100),
      nonBlossomCount: nonBlossomDropouts,
      nonBlossomPct: Math.round((nonBlossomDropouts / totalNonBlossom) * 100),
    },
    employed: {
      blossomCount: blossomEmployed,
      blossomPct: Math.round((blossomEmployed / totalBlossom) * 100),
      nonBlossomCount: nonBlossomEmployed,
      nonBlossomPct: Math.round((nonBlossomEmployed / totalNonBlossom) * 100),
    },
    selfEmployed: {
      blossomCount: blossomSelfEmployed,
      blossomPct: Math.round((blossomSelfEmployed / totalBlossom) * 100),
      nonBlossomCount: nonBlossomSelfEmployed,
      nonBlossomPct: Math.round((nonBlossomSelfEmployed / totalNonBlossom) * 100),
    },
    higherStudies: {
      blossomCount: blossomHigherStudies,
      blossomPct: Math.round((blossomHigherStudies / totalBlossom) * 100),
      nonBlossomCount: nonBlossomHigherStudies,
      nonBlossomPct: Math.round((nonBlossomHigherStudies / totalNonBlossom) * 100),
    },
    internship: {
      blossomCount: blossomInternship,
      blossomPct: Math.round((blossomInternship / totalBlossom) * 100),
      nonBlossomCount: nonBlossomInternship,
      nonBlossomPct: Math.round((nonBlossomInternship / totalNonBlossom) * 100),
    },
    unemployed: {
      blossomCount: blossomUnemployed,
      blossomPct: Math.round((blossomUnemployed / totalBlossom) * 100),
      nonBlossomCount: nonBlossomUnemployed,
      nonBlossomPct: Math.round((nonBlossomUnemployed / totalNonBlossom) * 100),
    },
  };
}

/**
 * Determine a student's dropout status for a specific target month (YYYY-MM).
 *
 * Rules:
 * 1. Before dropout month (targetMonth < dropoutMonth): Treat as normal ACTIVE student.
 * 2. Exact dropout month (targetMonth === dropoutMonth): Treat as DROPOUT (show badge & line-through).
 * 3. After dropout month (targetMonth > dropoutMonth): Completely HIDE student from attendance list.
 */
export function getStudentDropoutStatusInMonth(
  stu: { id: string; utNumber?: string; currentStatus?: string },
  dropouts: DropoutRecord[],
  targetMonth: string // 'YYYY-MM'
) {
  const cleanUt = (stu.utNumber || '').trim().toUpperCase();
  const dropoutRecord = dropouts.find(
    (d) =>
      (d.studentId && d.studentId === stu.id) ||
      (d.utNumber && d.utNumber.trim().toUpperCase() === cleanUt)
  );

  if (!dropoutRecord) {
    return {
      hasDropoutRecord: false,
      dropoutMonth: null,
      isBeforeDropoutMonth: false,
      isDroppedOutThisMonth: false,
      isAfterDropoutMonth: false,
      isDropoutInMonth: false,
      isActiveInMonth: true,
    };
  }

  // Normalize formats: YYYY-MM
  const rawMonth = (dropoutRecord.dropoutMonth || '').trim();
  const dropoutMonth = rawMonth.length >= 7 ? rawMonth.substring(0, 7) : rawMonth;
  const currentViewMonth = targetMonth.trim().substring(0, 7);

  const isBeforeDropoutMonth = Boolean(dropoutMonth && currentViewMonth < dropoutMonth);
  const isDroppedOutThisMonth = Boolean(dropoutMonth && currentViewMonth === dropoutMonth);
  const isAfterDropoutMonth = Boolean(dropoutMonth && currentViewMonth > dropoutMonth);

  return {
    hasDropoutRecord: true,
    dropoutMonth,
    isBeforeDropoutMonth,
    isDroppedOutThisMonth,
    isAfterDropoutMonth,
    // Visual badge and styling only active in the exact dropout month!
    isDropoutInMonth: isDroppedOutThisMonth,
    // In any month strictly before the dropout month, they are fully ACTIVE:
    isActiveInMonth: isBeforeDropoutMonth || !dropoutRecord,
  };
}

export const GROUP_B_STUDENT_UTS = new Set([
  'UT011003','UT011004','UT011007','UT011008','UT011009','UT011010','UT011014','UT011037',
  'UT011046','UT011052','UT011080','UT011083','UT011111','UT011117','UT011145','UT011148',
  'UT011166','UT011167','UT011197','UT011205','UT011206','UT011207','UT011210','UT011211',
  'UT011214','UT011216','UT011219','UT011222','UT011242','UT011267','UT011284','UT011303',
  'UT011305','UT011307','UT011309','UT011311','UT011312','UT011314','UT011331','UT011333',
  'UT011351','UT011406','UT011412','UT011421','UT011436','UT011442','UT011506','UT011510',
  'UT011518','UT011524','UT011527','UT011528','UT011537','UT011602','UT011611','UT011612',
  'UT011648','UT011651','UT011689','UT011715','UT011718','UT011724','UT011732','UT011733',
  'UT011734','UT011742','UT011748','UT011751','UT011753','UT011760','UT011764','UT011767',
  'UT011776','UT011780','UT011781','UT011787','UT011809','UT011810','UT011819','UT011825',
  'UT011828'
]);

export function resolveStudentGroup(stu: {
  utNumber?: string;
  courseId?: string;
  courseName?: string;
  group?: string;
}): 'Group A' | 'Group B' | 'Frontend Developer' {
  if (stu.group === 'Group A' || stu.group === 'Group B' || stu.group === 'Frontend Developer') {
    return stu.group;
  }
  const cleanUt = (stu.utNumber || '').trim().toUpperCase();
  if (cleanUt === 'UT011700') return 'Group A';

  if (
    stu.courseId === 'Frontend Developer' ||
    stu.courseName === 'Frontend Developer' ||
    stu.group === 'Frontend Developer'
  ) {
    return 'Frontend Developer';
  }

  if (GROUP_B_STUDENT_UTS.has(cleanUt)) {
    return 'Group B';
  }

  return 'Group A';
}

/**
 * Determines the student's programme and group at a given date using programmeHistory.
 * Finds the latest assignment where effectiveFrom <= date.
 * If no such record exists, falls back to the student's current profile values (which was their initial state).
 */
export function getStudentProgrammeAtDate(
  student: { id: string; courseId?: string; group?: string; utNumber?: string; courseName?: string; },
  history: ProgrammeHistory[],
  date: string
): { programme: string; group: string | null } {
  // Filter history for this student and sort ascending by effectiveFrom date
  const studentHistory = history
    .filter(h => h.studentId === student.id)
    .sort((a, b) => new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime());

  let applicableRecord = null;
  for (const record of studentHistory) {
    if (new Date(record.effectiveFrom) <= new Date(date)) {
      applicableRecord = record;
    } else {
      break;
    }
  }

  if (applicableRecord) {
    return {
      programme: applicableRecord.programme,
      group: applicableRecord.groupName,
    };
  }

  // Fallback to their current profile. In a true event-sourced system, we'd have their 
  // initial state in history. Since we don't, we assume their current state is their 
  // initial state if no history exists for this date.
  return {
    programme: student.courseId || '',
    group: resolveStudentGroup(student)
  };
}
