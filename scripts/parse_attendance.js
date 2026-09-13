const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\unico.UNICOMTIC85\\Downloads\\Students Attendance Record - 2026 (4).xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const subjectsRow = data[2];
const datesRow = data[3];

let sessions = [];
let marks = {};
let students = [];
let monthlyAttendance = [];

const month = "2026-04";
const year = 2026;
const batchId = "BATCH-2026-A";

// Find date columns
let dateCols = [];
for (let i = 3; i < datesRow.length; i++) {
  if (datesRow[i] && datesRow[i].match(/\d{2}\.\d{2}\.\d{4}/)) {
    dateCols.push(i);
    const dateStr = datesRow[i]; // DD.MM.YYYY
    const parts = dateStr.split('.');
    const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    const subject = subjectsRow[i] || 'Class';
    
    sessions.push({
      id: `SESS-${isoDate}-A`,
      date: isoDate,
      displayDate: dateStr,
      month: month,
      group: 'A',
      subject: subject
    });
  }
}

// Process students and marks
for (let r = 4; r < data.length; r++) {
  const row = data[r];
  if (!row[1] || !row[1].startsWith('UT')) continue; // Skip if no UT number
  
  const sno = row[0];
  const utNumber = row[1];
  const name = row[2];
  
  const studentId = `STU-${utNumber}`;
  
  students.push({
    id: studentId,
    utNumber: utNumber,
    fullName: name,
    nic: '123456789V',
    dob: '2004-01-01',
    gender: 'Male',
    phone: '0770000000',
    email: `${utNumber.toLowerCase()}@tic360.lk`,
    address: 'Jaffna, Sri Lanka',
    district: 'Jaffna',
    emergencyContact: {
      name: 'Parent',
      phone: '0770000000',
      relationship: 'Parent'
    },
    batchId: batchId,
    batchName: 'Batch 2026',
    courseId: 'CRS-ICT-01',
    courseName: 'ICT & Software Engineering',
    isBlossomTrust: true,
    isDummy: false,
    blossomAmount: 15000,
    currentStatus: 'Active',
    bankDetails: {
      bankName: 'Commercial Bank',
      branchName: 'Jaffna',
      branchCode: '045',
      accountNumber: '8004529103',
      beneficiaryName: name,
      district: 'Jaffna'
    },
    createdAt: '2026-04-01',
    updatedAt: '2026-04-01'
  });
  
  let presentCount = 0;
  
  dateCols.forEach((colIdx, idx) => {
    const session = sessions[idx];
    const markValue = (row[colIdx] || '').toString().trim().toUpperCase();
    
    if (!marks[session.id]) marks[session.id] = {};
    
    let markType = 'A';
    if (markValue === 'P') { markType = 'P'; presentCount++; }
    else if (markValue === 'L') markType = 'L';
    
    marks[session.id][studentId] = markType;
  });
  
  const attPct = Math.round((presentCount / dateCols.length) * 100);
  
  monthlyAttendance.push({
    id: `ATT-${month}-${utNumber}`,
    studentId: studentId,
    utNumber: utNumber,
    studentName: name,
    batchId: batchId,
    courseName: 'ICT & Software Engineering',
    year: year,
    month: month,
    attendancePercentage: attPct,
    status: attPct >= 75 ? 'Good Attendance' : 'Low Attendance',
    recordedBy: 'Admin User',
    updatedAt: '2026-04-30'
  });
}

// Generate the TS output
const tsOutput = `
// GENERATED DATA
import {
  Student,
  Course,
  Batch,
  MonthlyAttendance,
  BlossomMonthlyPayment,
  DropoutRecord,
  Assessment,
  AssessmentMark,
  CourseCompletion,
  StudentOutcome,
  AuditLog,
  OrgProfile,
  SystemSettings,
  AttendanceSession,
  AttendanceMark,
} from './types';

export const initialOrgProfile: OrgProfile = {
  orgName: 'Unicom TIC Training Centre',
  tagline: 'Center for Technology, Innovation & Blossom Trust Scholars',
  regNumber: 'TIC-LK/2026/8842',
  trustName: 'Blossom Trust Educational Foundation',
  email: 'admin@unicomtic.org',
  phone: '+94 21 222 4589 / +94 77 123 4567',
  address: 'No. 360, Innovation Square, Jaffna, Sri Lanka',
  website: 'https://unicomtic.org',
  currencySymbol: 'LKR',
  establishedYear: '2021',
};

export const initialCourses: Course[] = [];
export const initialBatches: Batch[] = [];
export const initialStudents: Student[] = ${JSON.stringify(students, null, 2)};
export const initialAttendanceSessions: AttendanceSession[] = ${JSON.stringify(sessions, null, 2)};
export const initialDailyAttendanceMarks: Record<string, Record<string, AttendanceMark>> = ${JSON.stringify(marks, null, 2)};
export const initialMonthlyAttendance: MonthlyAttendance[] = ${JSON.stringify(monthlyAttendance, null, 2)};
export const initialBlossomPayments: BlossomMonthlyPayment[] = [];
export const initialDropouts: DropoutRecord[] = [];
export const initialAssessments: Assessment[] = [];
export const initialAssessmentMarks: AssessmentMark[] = [];
export const initialCompletions: CourseCompletion[] = [];
export const initialStudentOutcomes: StudentOutcome[] = [];
export const initialAuditLogs: AuditLog[] = [];

export const initialSystemSettings: SystemSettings = {
  attendanceGoodThreshold: 75,
  attendanceLowThreshold: 60,
  blossomMonthlyMax: 15000,
  paymentEligibilityAttendanceThreshold: 75,
  courses: initialCourses,
  batches: initialBatches,
  dropoutReasons: [
    'Financial Problem',
    'Employment',
    'Higher Studies',
    'Family Problem',
    'Health/Personal',
    'Migration',
    'Lack of Interest',
    'Unknown',
  ],
  outcomeStatuses: [
    'Employed',
    'Self Employed',
    'Higher Studies',
    'Internship',
    'Looking for Job',
    'Unemployed',
    'Foreign Employment',
    'Other',
  ],
  grades: ['A', 'B', 'C', 'D', 'E'],
};
`;

fs.writeFileSync(path.join(__dirname, '../src/lib/mockData.ts'), tsOutput);
console.log('Successfully updated src/lib/mockData.ts with parsed Excel data.');
