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
export const initialStudents: Student[] = [];
export const initialAttendanceSessions: AttendanceSession[] = [];
export const initialDailyAttendanceMarks: Record<string, Record<string, AttendanceMark>> = {};
export const initialMonthlyAttendance: MonthlyAttendance[] = [];
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
