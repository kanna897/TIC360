import * as XLSX from 'xlsx';
import { AttendanceSession, AttendanceMark, MonthlyAttendance, Student } from './types';
import { getStudentProgrammeAtDate, resolveStudentGroup } from './utils';

export interface AttendanceParseSummary {
  detectedFormat: 'Full Stack Developer (Group A & B)' | 'Frontend Developer (React)' | 'Mixed / Custom';
  courseType: 'Full Stack Developer' | 'Frontend Developer' | 'All';
  totalSheets: number;
  sheetNames: string[];
  totalSessions: number;
  totalStudents: number;
  groupACount: number;
  groupBCount: number;
  frontendCount: number;
  totalMonthlyRecords: number;
  monthBreakdown: Array<{
    monthName: string;
    monthKey: string;
    groupASessions: number;
    groupBSessions: number;
    frontendSessions: number;
    groupAStudents: number;
    groupBStudents: number;
    frontendStudents: number;
  }>;
  warnings: string[];
}

export interface ParsedAttendanceData {
  sessions: AttendanceSession[];
  marks: Record<string, Record<string, AttendanceMark>>;
  monthly: MonthlyAttendance[];
  students: Student[];
  summary: AttendanceParseSummary;
}

const MONTH_MAP: Record<string, string> = {
  january: '2026-01',
  february: '2026-02',
  march: '2026-03',
  april: '2026-04',
  may: '2026-05',
  june: '2026-06',
  july: '2026-07',
  august: '2026-08',
  september: '2026-09',
  october: '2026-10',
  november: '2026-11',
  december: '2026-12',
};

const parseDateStr = (rawDate: unknown, defaultMonth: string): { isoDate: string; displayDate: string } => {
  if (!rawDate) return { isoDate: `${defaultMonth}-01`, displayDate: '' };

  // If Excel numeric date
  if (typeof rawDate === 'number' && rawDate > 40000) {
    const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return { isoDate: `${year}-${month}-${day}`, displayDate: `${day}.${month}.${year}` };
  }

  const str = String(rawDate).trim();
  const match = str.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return { isoDate: `${year}-${month}-${day}`, displayDate: `${day}.${month}.${year}` };
  }
  return { isoDate: `${defaultMonth}-01`, displayDate: str };
};

/**
 * Parses multi-month attendance Excel workbooks:
 * Supports:
 * 1. Full Stack Developer (Group A & Group B sections per sheet)
 * 2. Frontend Developer / React (Single group table per sheet, row 2 subjects, row 3 dates, row 4+ students)
 */
export const parseAttendanceExcel = async (
  fileData: ArrayBuffer | Uint8Array,
  existingStudents?: Student[],
  programmeHistory?: any[] // Using any to avoid circular/missing type issues here, or import ProgrammeHistory
): Promise<ParsedAttendanceData> => {
  const workbook = XLSX.read(fileData, { type: 'array' });

  const allSessions: AttendanceSession[] = [];
  const allMarks: Record<string, Record<string, AttendanceMark>> = {};
  const allMonthly: MonthlyAttendance[] = [];
  const studentsMap = new Map<string, Student>();
  const monthBreakdown: AttendanceParseSummary['monthBreakdown'] = [];

  let hasGroupSections = false;
  let hasFrontendTable = false;
  const warningsList: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    if (!rows || rows.length < 4) continue;

    const monthKey = sheetName.toLowerCase().trim();
    let ym = '2026-05'; // default fallback
    for (const [key, val] of Object.entries(MONTH_MAP)) {
      if (monthKey.includes(key)) {
        ym = val;
        break;
      }
    }
    const year = parseInt(ym.split('-')[0], 10) || 2026;

    let gAHeader = -1;
    let gBHeader = -1;
    let feHeader = -1;

    rows.forEach((r, idx) => {
      const text = (r[0] || '').toString();
      if (/GROUP\s*["“']\s*A\s*["”']/i.test(text)) gAHeader = idx;
      if (/GROUP\s*["“']\s*B\s*["”']/i.test(text)) gBHeader = idx;

      // Check for direct header: row contains "UT NO" or "S . NO"
      if (feHeader === -1 && r.some((c: any) => typeof c === 'string' && (c.includes('UT NO') || c.includes('UT_NO')))) {
        feHeader = idx;
      }
    });

    let gASessionCount = 0;
    let gBSessionCount = 0;
    let feSessionCount = 0;
    let gAStudentCount = 0;
    let gBStudentCount = 0;
    let feStudentCount = 0;


    // Helper to parse a group
    const parseTableBlock = (
      headerRow: number,
      endRow: number,
      groupName: 'Group A' | 'Group B' | 'Frontend Developer',
      groupCode: string,
      courseId: string,
      courseName: string
    ) => {
      if (headerRow === -1) return 0;
      const sessionCols: Array<{ col: number; session: AttendanceSession }> = [];

      // Determine date and subject row index: check which row actually contains dates
      let actualDateRow = headerRow + 2;
      let actualSubjectRow = headerRow + 1;

      const isRowDate = (rowArr: any[]) =>
        rowArr && rowArr.some((c) => (typeof c === 'string' && /\d{1,2}[./-]\d{1,2}[./-]\d{4}/.test(c)) || (typeof c === 'number' && c > 40000));

      if (isRowDate(rows[headerRow + 2])) {
        actualDateRow = headerRow + 2;
        actualSubjectRow = headerRow + 1;
      } else if (isRowDate(rows[headerRow + 3])) {
        actualDateRow = headerRow + 3;
        actualSubjectRow = headerRow + 2;
      } else if (isRowDate(rows[headerRow + 1])) {
        actualDateRow = headerRow + 1;
        actualSubjectRow = headerRow;
      }

      const activeDates = rows[actualDateRow] || [];
      const activeSubjects = rows[actualSubjectRow] || [];

      for (let c = 3; c < activeDates.length; c++) {
        const d = activeDates[c];
        if (!d) continue;
        const str = String(d).trim();
        if (['L', 'A', 'P', 'p', 'total', 'TOTAL', '%', '#DIV/0!', 'Late', 'Absent', 'Present', 'Sessions', 'Ratio'].includes(str)) break;

        const isValidDateStr = /\d{1,2}[./-]\d{1,2}[./-]\d{4}/.test(str) || (typeof d === 'number' && d > 40000);
        if (!isValidDateStr) continue;

        const subj = (activeSubjects[c] || '').toString().trim() || 'Daily Class';
        const { isoDate, displayDate } = parseDateStr(d, ym);
        const sessionId = `SES-${ym}-${groupCode}-${c}`;

        const sessionObj: AttendanceSession = {
          id: sessionId,
          batchId: 'BAT-2026',
          group: groupName,
          month: ym,
          date: isoDate,
          displayDate: displayDate || str,
          subject: subj,
        };

        sessionCols.push({ col: c, session: sessionObj });
        allSessions.push(sessionObj);
        allMarks[sessionId] = {};
      }

      for (let r = actualDateRow + 1; r < endRow; r++) {
        const row = rows[r];
        if (!row) continue;
        const sNo = row[0];
        const utNo = (row[1] || '').toString().trim();
        const name = (row[2] || '').toString().trim();
        if (!utNo || !name) continue;
        if (typeof utNo === 'string' && !utNo.toUpperCase().startsWith('UT')) continue;

        const normUt = utNo.toUpperCase();
        const studentId = `STU-${normUt}`;

        if (existingStudents && programmeHistory) {
          const storeStudent = existingStudents.find(s => s.utNumber === normUt);
          if (storeStudent) {
            const checkDate = `${ym}-28`;
            const actualStudentInfo = getStudentProgrammeAtDate(storeStudent, programmeHistory, checkDate);
            
            let expectedProgramme = courseId;
            if (courseId === 'CRS-TIC-01') expectedProgramme = 'Full Stack Developer';

            if (actualStudentInfo.programme !== expectedProgramme && actualStudentInfo.programme !== courseName) {
              // warningsList.push(`Mismatch: ${name} (${utNo}) in ${ym}: Excel says ${expectedProgramme} but student history says ${actualStudentInfo.programme}.`);
            } else if ((groupName === 'Group A' || groupName === 'Group B') && actualStudentInfo.group !== groupName) {
              // warningsList.push(`Mismatch: ${name} (${utNo}) in ${ym}: Excel says ${groupName} but student history says ${actualStudentInfo.group || 'None'}.`);
            }
          }
        }

        if (!studentsMap.has(normUt)) {
          studentsMap.set(normUt, {
            id: studentId,
            utNumber: normUt,
            fullName: name,
            group: groupName,
            courseId: courseId,
            courseName: courseName,
            batchId: 'BAT-2026',
            batchName: 'Batch 2026',
            currentStatus: 'Active',
            isBlossomTrust: true,
            email: `${normUt.toLowerCase()}@unicomtic.lk`,
            phone: 'N/A',
            address: 'Jaffna, Sri Lanka',
            district: 'Jaffna',
            gender: 'Other',
            dob: '2004-01-01',
            nic: 'N/A',
            emergencyContact: {
              name: 'Parent / Guardian',
              phone: 'N/A',
              relationship: 'Parent',
            },
            createdAt: new Date().toISOString().slice(0, 10),
            updatedAt: new Date().toISOString().slice(0, 10),
          });
        } else {
          const existing = studentsMap.get(normUt)!;
          if (groupName === 'Frontend Developer') {
            existing.courseId = 'Frontend Developer';
            existing.courseName = 'Frontend Developer';
            existing.group = 'Frontend Developer';
          }
        }

        let presentCount = 0;
        let lateCount = 0;
        let absentCount = 0;

        sessionCols.forEach(({ col, session }) => {
          const rawMark = (row[col] || '').toString().trim().toUpperCase();
          let mark: AttendanceMark = 'A';
          if (rawMark === 'P' || rawMark === 'PRESENT') {
            mark = 'P';
            presentCount++;
          } else if (rawMark === 'L' || rawMark === 'LATE') {
            mark = 'L';
            lateCount++;
          } else {
            mark = 'A';
            absentCount++;
          }
          allMarks[session.id][studentId] = mark;
          allMarks[session.id][normUt] = mark;
        });

        const totalHeld = sessionCols.length;
        const pct = totalHeld > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalHeld) * 100) : 100;
        let status: 'Good Attendance' | 'Low Attendance' | 'Critical Attendance' = 'Good Attendance';
        if (pct < 75) status = 'Critical Attendance';
        else if (pct < 85) status = 'Low Attendance';

        allMonthly.push({
          id: `ATT-${ym}-${normUt}`,
          studentId,
          utNumber: normUt,
          studentName: name,
          batchId: 'BAT-2026',
          courseName: courseName,
          year,
          month: ym,
          attendancePercentage: pct,
          status,
          recordedBy: 'Excel Bulk Import',
          updatedAt: new Date().toISOString().slice(0, 10),
        });
      }

      return sessionCols.length;
    };

    if (gAHeader !== -1 || gBHeader !== -1) {
      // Format 1: Full Stack with Group A and Group B
      hasGroupSections = true;
      const gAEnd = gBHeader !== -1 ? gBHeader : rows.length;
      gASessionCount = parseTableBlock(gAHeader, gAEnd, 'Group A', 'GA', 'CRS-TIC-01', 'Full-Stack Web Development');

      for (let r = gAHeader + 4; r < gAEnd; r++) {
        if (rows[r] && typeof rows[r][0] === 'number' && rows[r][1]) gAStudentCount++;
      }

      if (gBHeader !== -1) {
        gBSessionCount = parseTableBlock(gBHeader, rows.length, 'Group B', 'GB', 'CRS-TIC-01', 'Full-Stack Web Development');
        for (let r = gBHeader + 4; r < rows.length; r++) {
          if (rows[r] && typeof rows[r][0] === 'number' && rows[r][1]) gBStudentCount++;
        }
      }
    } else if (feHeader !== -1) {
      // Format 2: Frontend Developer / React (Single group per month)
      hasFrontendTable = true;
      feSessionCount = parseTableBlock(feHeader, rows.length, 'Frontend Developer', 'FE', 'Frontend Developer', 'Frontend Developer');
      for (let r = feHeader + 3; r < rows.length; r++) {
        if (rows[r] && rows[r][1] && String(rows[r][1]).toUpperCase().startsWith('UT')) {
          feStudentCount++;
        }
      }
    }

    monthBreakdown.push({
      monthName: sheetName,
      monthKey: ym,
      groupASessions: gASessionCount,
      groupBSessions: gBSessionCount,
      frontendSessions: feSessionCount,
      groupAStudents: gAStudentCount,
      groupBStudents: gBStudentCount,
      frontendStudents: feStudentCount,
    });
  }

  let groupACount = 0;
  let groupBCount = 0;
  let frontendCount = 0;
  studentsMap.forEach((stu) => {
    if (stu.group === 'Group A') groupACount++;
    else if (stu.group === 'Group B') groupBCount++;
    else if (stu.group === 'Frontend Developer' || stu.courseId === 'Frontend Developer') frontendCount++;
  });

  let detectedFormat: AttendanceParseSummary['detectedFormat'] = 'Mixed / Custom';
  let courseType: AttendanceParseSummary['courseType'] = 'All';

  if (hasFrontendTable && !hasGroupSections) {
    detectedFormat = 'Frontend Developer (React)';
    courseType = 'Frontend Developer';
  } else if (hasGroupSections && !hasFrontendTable) {
    detectedFormat = 'Full Stack Developer (Group A & B)';
    courseType = 'Full Stack Developer';
  }

  const summary: AttendanceParseSummary = {
    detectedFormat,
    courseType,
    totalSheets: workbook.SheetNames.length,
    sheetNames: workbook.SheetNames,
    totalSessions: allSessions.length,
    totalStudents: studentsMap.size,
    groupACount,
    groupBCount,
    frontendCount,
    totalMonthlyRecords: allMonthly.length,
    monthBreakdown,
    warnings: warningsList,
  };

  return {
    sessions: allSessions,
    marks: allMarks,
    monthly: allMonthly,
    students: Array.from(studentsMap.values()),
    summary,
  };
};
