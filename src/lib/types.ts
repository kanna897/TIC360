export type UserRole =
  | 'Admin'
  | 'Blossom Trust Officer'
  | 'Trainer'
  | 'Data Entry Officer'
  | 'Student';

export type StudentStatus = 'Active' | 'Completed' | 'Dropout' | 'Other';
export type Gender = 'Male' | 'Female' | 'Other';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface StudentBankDetails {
  bankName: string;
  branchName: string;
  branchCode?: string;
  accountNumber: string;
  beneficiaryName: string;
  district: string;
}

export interface BlossomApplication {
  parentsOccupation: string;
  familyIncome: number;
  familyMembersCount: number;
  siblingsCount: number;
  financialDifficulties: string;
  accommodationExpense: number;
  foodExpense: number;
  supportingDocs?: string[];
  declarationSigned: boolean;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  verifiedAt?: string;
}

export interface Student {
  id: string;
  utNumber: string;
  fullName: string;
  nic: string;
  dob: string;
  gender: Gender;
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  district: string;
  emergencyContact: EmergencyContact;
  batchId: string;
  batchName: string;
  courseId: string;
  courseName: string;
  photoUrl?: string;
  isBlossomTrust: boolean;
  currentStatus: StudentStatus;
  bankDetails?: StudentBankDetails;
  blossomApplication?: BlossomApplication;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  durationMonths: number;
  isActive: boolean;
}

export interface Batch {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Completed' | 'Upcoming';
}

export type AttendanceStatus = 'Good Attendance' | 'Low Attendance' | 'Critical Attendance';

export interface MonthlyAttendance {
  id: string;
  studentId: string;
  utNumber: string;
  studentName: string;
  batchId: string;
  courseName: string;
  year: number;
  month: string; // 'YYYY-MM' e.g. '2026-08'
  attendancePercentage: number;
  status: AttendanceStatus;
  recordedBy: string;
  updatedAt: string;
}

export type BlossomPaymentStatus = 'Eligible' | 'Not Eligible' | 'Paid' | 'Pending';

export interface BlossomMonthlyPayment {
  id: string;
  studentId: string;
  utNumber: string;
  studentName: string;
  year: number;
  month: string; // 'YYYY-MM'
  attendancePercentage: number;
  isEligible: boolean;
  ineligibilityReason?: string;
  amount: number; // LKR 15,000 or 0
  status: BlossomPaymentStatus;
  paymentDate?: string;
  referenceNo?: string;
  notes?: string;
}

export type DropoutReason =
  | 'Financial Problem'
  | 'Employment'
  | 'Higher Studies'
  | 'Family Problem'
  | 'Health/Personal'
  | 'Migration'
  | 'Lack of Interest'
  | 'Unknown';

export type RejoinPossibility = 'High' | 'Medium' | 'Low' | 'No' | 'Unknown';

export interface DropoutRecord {
  id: string;
  studentId: string;
  utNumber: string;
  studentName: string;
  batchId: string;
  courseId: string;
  courseName: string;
  dropoutMonth: string; // 'YYYY-MM'
  reason: DropoutReason;
  rejoinPossibility: RejoinPossibility;
  remarks?: string;
  recordedAt: string;
}

export type AssessmentCategory =
  | 'Assignment'
  | 'Project'
  | 'Presentation'
  | 'Practical'
  | 'Final Project'
  | 'Custom';

export interface Assessment {
  id: string;
  courseId: string;
  batchId: string;
  title: string;
  category: AssessmentCategory;
  maxMarks: number;
  createdAt: string;
}

export interface AssessmentMark {
  id: string;
  assessmentId: string;
  studentId: string;
  marksObtained: number;
  feedback?: string;
  gradedAt: string;
}

export type FinalGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface CourseCompletion {
  id: string;
  studentId: string;
  utNumber: string;
  studentName: string;
  courseId: string;
  courseName: string;
  batchId: string;
  completionDate: string;
  finalResult: 'Passed' | 'Distinction' | 'Merit' | 'Failed';
  finalProjectName: string;
  githubLink?: string;
  overallGrade: FinalGrade;
  certificateIssued: boolean;
}

export type OutcomeStatus =
  | 'Employed'
  | 'Self Employed'
  | 'Higher Studies'
  | 'Internship'
  | 'Looking for Job'
  | 'Unemployed'
  | 'Foreign Employment'
  | 'Other';

export interface StudentOutcome {
  id: string;
  studentId: string;
  utNumber: string;
  studentName: string;
  isBlossomTrust: boolean;
  outcomeStatus: OutcomeStatus;
  outcomeDate: string;
  companyOrInstitution?: string;
  jobTitle?: string;
  remarks?: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  recordId?: string;
  details?: string;
  timestamp: string;
}

export interface OrgProfile {
  orgName: string;
  tagline: string;
  regNumber: string;
  trustName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  currencySymbol: string;
  establishedYear: string;
}

export interface SystemSettings {
  attendanceGoodThreshold: number; // e.g. 80
  attendanceLowThreshold: number; // e.g. 60
  blossomMonthlyMax: number; // e.g. 15000
  paymentEligibilityAttendanceThreshold: number; // e.g. 80
  courses: Course[];
  batches: Batch[];
  dropoutReasons: DropoutReason[];
  outcomeStatuses: OutcomeStatus[];
  grades: FinalGrade[];
}
