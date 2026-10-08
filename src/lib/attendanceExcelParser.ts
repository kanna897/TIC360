import * as XLSX from 'xlsx';
import { AttendanceSession, AttendanceMark, MonthlyAttendance, Student, ProgrammeHistory } from './types';
import { getStudentProgrammeAtDate, resolveStudentGroup } from './utils';

export interface AttendanceParseSummary {
  detectedFormat:
    | 'Full Stack Developer (Group A & B)'
    | 'Frontend Developer (React)'
    | 'Full Stack & Specializations (2026 Semester)'
    | 'Mixed / Custom';
  courseType: 'Full Stack Developer' | 'Frontend Developer' | 'All';
  totalSheets: number;
  sheetNames: string[];
  totalSessions: number;
  totalStudents: number;
  groupACount: number;
  groupBCount: number;
  frontendCount: number;
  aiAgentsCount: number;
  flutterCount: number;
  embeddedCount: number;
  totalMonthlyRecords: number;
  monthBreakdown: Array<{
    monthName: string;
    monthKey: string;
    groupASessions: number;
    groupBSessions: number;
    frontendSessions: number;
    aiAgentsSessions: number;
    flutterSessions: number;
    embeddedSessions: number;
    groupAStudents: number;
    groupBStudents: number;
    frontendStudents: number;
    aiAgentsStudents: number;
    flutterStudents: number;
    embeddedStudents: number;
  }>;
  warnings: string[];
}

export interface ParsedAttendanceData {
  sessions: AttendanceSession[];
  marks: Record<string, Record<string, AttendanceMark>>;
  monthly: MonthlyAttendance[];
  students: Student[];
  programmeHistories: ProgrammeHistory[];
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

const parseDateStr = (rawDate: unknown, defaultYm: string): { isoDate: string; displayDate: string } => {
  if (!rawDate) return { isoDate: `${defaultYm}-01`, displayDate: '' };

  const [defY, defM] = defaultYm.split('-');

  // Excel serial date number
  if (typeof rawDate === 'number' && rawDate > 40000) {
    const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
    const day = String(d.getDate()).padStart(2, '0');
    // Lock year to 2026 (or default semester year) and month to default sheet month
    return {
      isoDate: `${defY}-${defM}-${day}`,
      displayDate: `${day}.${defM}.${defY}`,
    };
  }

  const str = String(rawDate).trim();
  // Handle single date or date range: "06.05.2026 - 07.05.2027" -> extract first date "06.05.2026"
  const match = str.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    // Normalize year: In this 2026 workbook, typo years like 2027/2028/2029/2030 are mapped to 2026
    return {
      isoDate: `${defY}-${defM}-${day}`,
      displayDate: `${day}.${defM}.${defY}`,
    };
  }

  return { isoDate: `${defaultYm}-01`, displayDate: str };
};

/**
 * Parses multi-month attendance Excel workbooks:
 * Supports:
 * 1. Full Stack Developer (Group A & Group B sections per sheet: April–Sept)
 * 2. Specializations (AI Agents, Flutter Development, Embedded Systems & Robotics: Specialization Sept & Oct)
 * 3. Frontend Developer / React (Single group table per sheet)
 */
export const parseAttendanceExcel = async (
  fileData: ArrayBuffer | Uint8Array,
  existingStudents?: Student[],
  programmeHistory?: ProgrammeHistory[]
): Promise<ParsedAttendanceData> => {
  const workbook = XLSX.read(fileData, { type: 'array' });

  const allSessions: AttendanceSession[] = [];
  const allMarks: Record<string, Record<string, AttendanceMark>> = {};
  const allMonthly: MonthlyAttendance[] = [];
  const studentsMap = new Map<string, Student>();
  const progHistoriesMap = new Map<string, ProgrammeHistory>();
  const monthBreakdown: AttendanceParseSummary['monthBreakdown'] = [];

  let hasGroupSections = false;
  let hasSpecializationSections = false;
  let hasFrontendTable = false;
  const warningsList: string[] = [];

  // Seed existing students into studentsMap to preserve their IDs and details
  if (existingStudents && existingStudents.length > 0) {
    existingStudents.forEach((stu) => {
      const cleanUt = (stu.utNumber || '').trim().toUpperCase();
      if (cleanUt) {
        studentsMap.set(cleanUt, stu);
      }
    });
  }

  // Pre-scan workbook to check if this workbook is Frontend Developer (React)
  let hasAnyGroupBInWorkbook = false;
  let hasAnyReactKeywordsInWorkbook = false;
  for (const name of workbook.SheetNames) {
    const s = workbook.Sheets[name];
    if (!s) continue;
    const rws = XLSX.utils.sheet_to_json<any[]>(s, { header: 1 });
    rws.forEach((r) => {
      if (!r) return;
      r.forEach((cell) => {
        if (typeof cell === 'string') {
          const u = cell.toUpperCase();
          if (u.includes('GROUP "B"') || u.includes('GROUP B') || u.includes("GROUP 'B'") || u.includes('GROUP “B”')) {
            hasAnyGroupBInWorkbook = true;
          }
          if (u.includes('REACT') || u.includes('FRONTEND')) {
            hasAnyReactKeywordsInWorkbook = true;
          }
        }
      });
    });
  }
  const isWorkbookFrontendReact = hasAnyReactKeywordsInWorkbook && !hasAnyGroupBInWorkbook;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    if (!rows || rows.length < 4) continue;

    const lowerName = sheetName.toLowerCase().trim();
    let ym = '2026-05'; // default fallback
    for (const [key, val] of Object.entries(MONTH_MAP)) {
      if (lowerName.includes(key)) {
        ym = val;
        break;
      }
    }
    const year = parseInt(ym.split('-')[0], 10) || 2026;

    // Check if this particular sheet has React subjects or lacks Group B
    let sheetHasGroupB = false;
    let sheetHasGroupA = false;
    let sheetHasReact = false;
    rows.forEach((r) => {
      if (!r) return;
      r.forEach((cell) => {
        if (typeof cell === 'string') {
          const u = cell.toUpperCase();
          if (u.includes('GROUP "B"') || u.includes('GROUP B') || u.includes("GROUP 'B'") || u.includes('GROUP “B”')) {
            sheetHasGroupB = true;
          }
          if (u.includes('GROUP "A"') || u.includes('GROUP A') || u.includes("GROUP 'A'") || u.includes('GROUP “A”')) {
            sheetHasGroupA = true;
          }
          if (u.includes('REACT') || u.includes('FRONTEND')) {
            sheetHasReact = true;
          }
        }
      });
    });

    const isThisSheetFrontend = isWorkbookFrontendReact || (sheetHasReact && !sheetHasGroupB && !sheetHasGroupA);

    // Detect all sections in this sheet
    interface DetectedSection {
      startRow: number;
      title: string;
      groupName: string;
      groupSlug: string;
      courseName: string;
      courseId: string;
    }

    const sections: DetectedSection[] = [];

    rows.forEach((r, idx) => {
      const firstCell = String((r && r[0]) || '').trim();
      const isAttendanceHeader =
        firstCell.includes('Attendance Details') ||
        /GROUP\s*["'“]?\s*[AB]/i.test(firstCell) ||
        firstCell.includes('Students Attendance');

      if (isAttendanceHeader) {
        const upper = firstCell.toUpperCase();
        let groupName = 'Group A';
        let groupSlug = 'GA';
        let courseName = 'Full Stack Developer';
        let courseId = 'CRS-TIC-01';

        if (
          upper.includes('GROUP "B"') ||
          upper.includes('GROUP B') ||
          upper.includes("GROUP 'B'") ||
          upper.includes('GROUP “B”')
        ) {
          groupName = 'Group B';
          groupSlug = 'GB';
          hasGroupSections = true;
        } else if (
          upper.includes('GROUP "A"') ||
          upper.includes('GROUP A') ||
          upper.includes("GROUP 'A'") ||
          upper.includes('GROUP “A”')
        ) {
          groupName = 'Group A';
          groupSlug = 'GA';
          hasGroupSections = true;
        } else if (upper.includes('AI AGENTS') || upper.includes('AI AGENT')) {
          groupName = 'AI Agents';
          groupSlug = 'AI_Agents';
          courseName = 'AI Agents';
          courseId = 'AI Agents';
          hasSpecializationSections = true;
        } else if (upper.includes('FLUTTER')) {
          groupName = 'Flutter Development';
          groupSlug = 'Flutter';
          courseName = 'Flutter Development';
          courseId = 'Flutter Development';
          hasSpecializationSections = true;
        } else if (upper.includes('EMBEDDED') || upper.includes('ROBOTICS')) {
          groupName = 'Embedded Systems & Robotics';
          groupSlug = 'Embedded';
          courseName = 'Embedded Systems & Robotics';
          courseId = 'Embedded Systems & Robotics';
          hasSpecializationSections = true;
        } else if (isThisSheetFrontend) {
          groupName = 'Frontend Developer';
          groupSlug = 'FE';
          courseName = 'Frontend Developer';
          courseId = 'Frontend Developer';
          hasFrontendTable = true;
        } else {
          // Defaults to Group A for Full Stack
          hasGroupSections = true;
        }

        sections.push({ startRow: idx, title: firstCell, groupName, groupSlug, courseName, courseId });
      }
    });

    // Check for Frontend Developer / React single-table sheet format if no section headers found
    if (sections.length === 0) {
      let feHeader = -1;
      rows.forEach((r, idx) => {
        if (
          feHeader === -1 &&
          r.some(
            (c: any) =>
              typeof c === 'string' &&
              (c.includes('UT NO') || c.includes('UT_NO') || c.includes('S . NO') || c.includes('S. NO'))
          )
        ) {
          feHeader = idx;
        }
      });

      if (feHeader !== -1) {
        if (isThisSheetFrontend) {
          hasFrontendTable = true;
          sections.push({
            startRow: feHeader,
            title: 'Frontend Developer Attendance',
            groupName: 'Frontend Developer',
            groupSlug: 'FE',
            courseName: 'Frontend Developer',
            courseId: 'Frontend Developer',
          });
        } else {
          hasGroupSections = true;
          sections.push({
            startRow: feHeader,
            title: 'Group A Attendance',
            groupName: 'Group A',
            groupSlug: 'GA',
            courseName: 'Full Stack Developer',
            courseId: 'CRS-TIC-01',
          });
        }
      }
    }

    let gASessionCount = 0;
    let gBSessionCount = 0;
    let feSessionCount = 0;
    let aiSessionCount = 0;
    let flSessionCount = 0;
    let emSessionCount = 0;

    let gAStudentCount = 0;
    let gBStudentCount = 0;
    let feStudentCount = 0;
    let aiStudentCount = 0;
    let flStudentCount = 0;
    let emStudentCount = 0;

    // Process each section within this sheet
    sections.forEach((sec, sIdx) => {
      const nextStart = sIdx + 1 < sections.length ? sections[sIdx + 1].startRow : rows.length;

      // Locate date row and subject row within the first few rows of the section
      let dateRow = -1;
      let subjectRow = -1;
      for (let r = sec.startRow; r < Math.min(sec.startRow + 6, nextStart); r++) {
        const row = rows[r] || [];
        if (
          row.some(
            (c) =>
              (typeof c === 'string' && /\d{1,2}[./-]\d{1,2}[./-]\d{4}/.test(c)) ||
              (typeof c === 'number' && c > 40000)
          )
        ) {
          dateRow = r;
          subjectRow = r - 1;
          break;
        }
      }

      if (dateRow === -1) return;

      const dRow = rows[dateRow] || [];
      const sRow = rows[subjectRow] || [];
      const sessionCols: Array<{ col: number; session: AttendanceSession }> = [];

      for (let c = 3; c < dRow.length; c++) {
        const d = dRow[c];
        if (!d) continue;
        const str = String(d).trim();
        if (['L', 'A', 'P', 'p', 'total', 'TOTAL', '%', 'Late', 'Absent', 'Present', 'Ratio'].includes(str)) {
          break;
        }

        const isValidDateStr =
          /\d{1,2}[./-]\d{1,2}[./-]\d{4}/.test(str) || (typeof d === 'number' && d > 40000);
        if (!isValidDateStr) continue;

        const subj = (sRow[c] || '').toString().trim() || sec.courseName;
        const { isoDate, displayDate } = parseDateStr(d, ym);
        const sessionId = `SES-${ym}-${sec.groupSlug}-${c}`;

        const sessionObj: AttendanceSession = {
          id: sessionId,
          batchId: 'BAT-2026',
          group: sec.groupName,
          month: ym,
          date: isoDate,
          displayDate: displayDate || str,
          subject: subj,
        };

        sessionCols.push({ col: c, session: sessionObj });
        allSessions.push(sessionObj);
        allMarks[sessionId] = {};
      }

      // Parse student rows for this section
      for (let r = dateRow + 1; r < nextStart; r++) {
        const row = rows[r] || [];
        if (!row || !row.length) continue;

        const c1 = String(row[1] || '').trim().toUpperCase();
        const c0 = String(row[0] || '').trim().toUpperCase();
        const utNo =
          c1.startsWith('UT') && c1 !== 'UT NO' && c1 !== 'UT_NO'
            ? c1
            : c0.startsWith('UT') && c0 !== 'UT NO' && c0 !== 'UT_NO'
            ? c0
            : null;

        if (!utNo) continue;

        const name = String(row[2] || row[1] || utNo).trim();
        const studentId = `STU-${utNo}`;

        const isFrontendSection = sec.groupName === 'Frontend Developer';

        // Register or update student
        if (!studentsMap.has(utNo) || isFrontendSection) {
          const existingStu = studentsMap.get(utNo);
          studentsMap.set(utNo, {
            id: existingStu?.id || studentId,
            utNumber: utNo,
            fullName: existingStu?.fullName || name,
            group: isFrontendSection ? 'Frontend Developer' : (sec.groupName === 'Group B' ? 'Group B' : 'Group A'),
            courseId: isFrontendSection ? 'Frontend Developer' : (existingStu?.courseId || 'CRS-TIC-01'),
            courseName: isFrontendSection ? 'Frontend Developer' : (existingStu?.courseName || 'Full Stack Developer'),
            batchId: 'BAT-2026',
            batchName: 'Batch 2026',
            currentStatus: existingStu?.currentStatus || 'Active',
            isBlossomTrust: existingStu?.isBlossomTrust ?? false,
            email: existingStu?.email || `${utNo.toLowerCase()}@unicomtic.lk`,
            phone: existingStu?.phone || 'N/A',
            address: existingStu?.address || 'Jaffna, Sri Lanka',
            district: existingStu?.district || 'Jaffna',
            gender: existingStu?.gender || 'Other',
            dob: existingStu?.dob || '2004-01-01',
            nic: existingStu?.nic || 'N/A',
            emergencyContact: existingStu?.emergencyContact || {
              name: 'Parent / Guardian',
              phone: 'N/A',
              relationship: 'Parent',
            },
            createdAt: existingStu?.createdAt || '2026-04-01',
            updatedAt: new Date().toISOString().slice(0, 10),
          });
        }

        // For specialization programmes starting in September, record ProgrammeHistory
        if (
          sec.groupName === 'AI Agents' ||
          sec.groupName === 'Flutter Development' ||
          sec.groupName === 'Embedded Systems & Robotics'
        ) {
          const progId = `PROG-${utNo}-${sec.groupSlug}`;
          if (!progHistoriesMap.has(progId)) {
            progHistoriesMap.set(progId, {
              id: progId,
              studentId: studentId,
              programme: sec.courseName,
              groupName: sec.groupName,
              effectiveFrom: '2026-09-01',
            });
          }
        } else if (sec.groupName === 'Frontend Developer') {
          const progId = `PROG-${utNo}-Frontend`;
          if (!progHistoriesMap.has(progId)) {
            progHistoriesMap.set(progId, {
              id: progId,
              studentId: studentId,
              programme: 'Frontend Developer',
              groupName: 'Frontend Developer',
              effectiveFrom: '2026-05-01',
            });
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
          allMarks[session.id][utNo] = mark;
        });

        const totalHeld = sessionCols.length;
        const pct = totalHeld > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalHeld) * 100) : 100;
        let status: 'Good Attendance' | 'Low Attendance' | 'Critical Attendance' = 'Good Attendance';
        if (pct < 75) status = 'Critical Attendance';
        else if (pct < 85) status = 'Low Attendance';

        allMonthly.push({
          id: `ATT-${ym}-${sec.groupSlug}-${utNo}`,
          studentId,
          utNumber: utNo,
          studentName: name,
          batchId: 'BAT-2026',
          courseName: sec.courseName,
          year,
          month: ym,
          attendancePercentage: pct,
          status,
          recordedBy: 'Excel Bulk Import',
          updatedAt: new Date().toISOString().slice(0, 10),
        });

        // Increment student counts
        if (sec.groupName === 'Group A') gAStudentCount++;
        else if (sec.groupName === 'Group B') gBStudentCount++;
        else if (sec.groupName === 'Frontend Developer') feStudentCount++;
        else if (sec.groupName === 'AI Agents') aiStudentCount++;
        else if (sec.groupName === 'Flutter Development') flStudentCount++;
        else if (sec.groupName === 'Embedded Systems & Robotics') emStudentCount++;
      }

      // Increment session counts
      if (sec.groupName === 'Group A') gASessionCount += sessionCols.length;
      else if (sec.groupName === 'Group B') gBSessionCount += sessionCols.length;
      else if (sec.groupName === 'Frontend Developer') feSessionCount += sessionCols.length;
      else if (sec.groupName === 'AI Agents') aiSessionCount += sessionCols.length;
      else if (sec.groupName === 'Flutter Development') flSessionCount += sessionCols.length;
      else if (sec.groupName === 'Embedded Systems & Robotics') emSessionCount += sessionCols.length;
    });

    monthBreakdown.push({
      monthName: sheetName,
      monthKey: ym,
      groupASessions: gASessionCount,
      groupBSessions: gBSessionCount,
      frontendSessions: feSessionCount,
      aiAgentsSessions: aiSessionCount,
      flutterSessions: flSessionCount,
      embeddedSessions: emSessionCount,
      groupAStudents: gAStudentCount,
      groupBStudents: gBStudentCount,
      frontendStudents: feStudentCount,
      aiAgentsStudents: aiStudentCount,
      flutterStudents: flStudentCount,
      embeddedStudents: emStudentCount,
    });
  }

  // Count students across groups
  let groupACount = 0;
  let groupBCount = 0;
  let frontendCount = 0;
  let aiAgentsCount = 0;
  let flutterCount = 0;
  let embeddedCount = 0;

  progHistoriesMap.forEach((p) => {
    if (p.programme === 'AI Agents') aiAgentsCount++;
    else if (p.programme === 'Flutter Development') flutterCount++;
    else if (p.programme === 'Embedded Systems & Robotics') embeddedCount++;
  });

  studentsMap.forEach((stu) => {
    if (stu.courseId === 'Frontend Developer' || stu.group === 'Frontend Developer') frontendCount++;
    else if (stu.group === 'Group B') groupBCount++;
    else groupACount++;
  });

  let detectedFormat: AttendanceParseSummary['detectedFormat'] = 'Mixed / Custom';
  let courseType: AttendanceParseSummary['courseType'] = 'All';

  if (hasGroupSections && hasSpecializationSections) {
    detectedFormat = 'Full Stack & Specializations (2026 Semester)';
    courseType = 'All';
  } else if (hasFrontendTable && !hasGroupSections && !hasSpecializationSections) {
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
    aiAgentsCount,
    flutterCount,
    embeddedCount,
    totalMonthlyRecords: allMonthly.length,
    monthBreakdown,
    warnings: warningsList,
  };

  return {
    sessions: allSessions,
    marks: allMarks,
    monthly: allMonthly,
    students: Array.from(studentsMap.values()),
    programmeHistories: Array.from(progHistoriesMap.values()),
    summary,
  };
};
