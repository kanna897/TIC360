import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { Student, StudentOutcome, DropoutRecord } from './types';

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
