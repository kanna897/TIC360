'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  UserRole,
  AttendanceStatus,
  BlossomPaymentStatus,
  DropoutReason,
  RejoinPossibility,
  AttendanceSession,
  AttendanceMark,
  DailyTimeLog,
} from './types';
import {
  initialStudents,
  initialCourses,
  initialBatches,
  initialMonthlyAttendance,
  initialBlossomPayments,
  initialDropouts,
  initialAssessments,
  initialAssessmentMarks,
  initialCompletions,
  initialStudentOutcomes,
  initialAuditLogs,
  initialOrgProfile,
  initialSystemSettings,
  initialAttendanceSessions,
  initialDailyAttendanceMarks,
} from './mockData';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserAccount, registerStudentAccount, getRegisteredAccounts } from './auth';

interface StoreContextType {
  // State
  students: Student[];
  courses: Course[];
  batches: Batch[];
  monthlyAttendance: MonthlyAttendance[];
  attendanceSessions: AttendanceSession[];
  attendanceMarks: Record<string, Record<string, AttendanceMark>>;
  dailyTimeLogs: DailyTimeLog[];
  blossomPayments: BlossomMonthlyPayment[];
  dropouts: DropoutRecord[];
  assessments: Assessment[];
  assessmentMarks: AssessmentMark[];
  completions: CourseCompletion[];
  outcomes: StudentOutcome[];
  auditLogs: AuditLog[];
  orgProfile: OrgProfile;
  settings: SystemSettings;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentAuthUser: UserAccount | null;
  setCurrentAuthUser: (user: UserAccount | null) => void;
  currentStudent: Student | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  logoutUser: () => void;

  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Student;
  registerNewStudent: (
    studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'utNumber'>,
    password: string
  ) => { student: Student; account: UserAccount };
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  bulkImportBlossomStudents: (
    rows: Array<{
      utNumber?: string;
      fullName: string;
      phone?: string;
      district?: string;
      beneficiaryName?: string;
      bankName?: string;
      branchName?: string;
      branchCode?: string;
      accountNumber?: string;
      amount?: string | number;
    }>
  ) => { updatedCount: number; createdCount: number };

  // Attendance Actions
  recordAttendance: (
    records: Array<{
      studentId: string;
      batchId: string;
      year: number;
      month: string;
      attendancePercentage: number;
    }>
  ) => void;
  addAttendanceSession: (session: Omit<AttendanceSession, 'id'>) => AttendanceSession;
  updateAttendanceSession: (id: string, updated: Partial<AttendanceSession>) => void;
  deleteAttendanceSession: (id: string) => void;
  setDailyMark: (sessionId: string, studentId: string, mark: AttendanceMark) => void;
  batchSetDailyMarks: (sessionId: string, marks: Record<string, AttendanceMark>) => void;
  markAllPresentForSession: (sessionId: string, studentIds: string[]) => void;
  saveAttendanceMatrix: (
    month: string,
    group: string,
    sessions: AttendanceSession[],
    marks: Record<string, Record<string, AttendanceMark>>
  ) => void;
  processFingerprintCSV: (logs: DailyTimeLog[], sessionDate: string) => void;

  // Blossom Payment Actions
  updatePaymentStatus: (
    paymentId: string,
    status: BlossomPaymentStatus,
    referenceNo?: string,
    notes?: string
  ) => void;
  recalculateMonthlyPayments: (month: string) => void;

  // Dropout Actions
  recordDropout: (params: {
    studentId: string;
    dropoutMonth: string;
    reason: DropoutReason;
    rejoinPossibility: RejoinPossibility;
    remarks?: string;
  }) => void;

  // Assessment Actions
  addAssessment: (assessment: Omit<Assessment, 'id' | 'createdAt'>) => void;
  deleteAssessment: (id: string) => void;
  saveAssessmentMarks: (
    assessmentId: string,
    marks: Array<{ studentId: string; marksObtained: number; feedback?: string }>
  ) => void;

  // Course Completion & Outcomes
  recordCompletion: (completion: Omit<CourseCompletion, 'id'>) => void;
  saveStudentOutcome: (outcome: Omit<StudentOutcome, 'id' | 'updatedAt'>) => void;

  // Settings & Configuration
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, updated: Partial<Course>) => void;
  addBatch: (batch: Omit<Batch, 'id'>) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  updateOrgProfile: (profile: Partial<OrgProfile>) => void;

  // Database tools
  resetToDefaults: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STUDENTS: 'tic360_v2_students',
  COURSES: 'tic360_v2_courses',
  BATCHES: 'tic360_v2_batches',
  ATTENDANCE: 'tic360_v2_attendance',
  ATT_SESSIONS: 'tic360_v2_att_sessions',
  ATT_MARKS: 'tic360_v2_att_marks',
  PAYMENTS: 'tic360_v2_payments',
  DROPOUTS: 'tic360_v2_dropouts',
  ASSESSMENTS: 'tic360_v2_assessments',
  ASSESSMENT_MARKS: 'tic360_v2_marks',
  COMPLETIONS: 'tic360_v2_completions',
  OUTCOMES: 'tic360_v2_outcomes',
  AUDIT_LOGS: 'tic360_v2_audit_logs',
  SETTINGS: 'tic360_v2_settings',
  ORG_PROFILE: 'tic360_v2_org_profile',
  ROLE: 'tic360_v2_current_role',
  THEME: 'tic360_v2_theme',
  AUTH_USER: 'tic360_v2_auth_user',
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendance[]>(
    initialMonthlyAttendance
  );
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(
    initialAttendanceSessions
  );
  const [attendanceMarks, setAttendanceMarks] = useState<Record<string, Record<string, AttendanceMark>>>(
    initialDailyAttendanceMarks
  );
  const [dailyTimeLogs, setDailyTimeLogs] = useState<DailyTimeLog[]>([]);
  const [blossomPayments, setBlossomPayments] = useState<BlossomMonthlyPayment[]>(
    initialBlossomPayments
  );
  const [dropouts, setDropouts] = useState<DropoutRecord[]>(initialDropouts);
  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments);
  const [assessmentMarks, setAssessmentMarks] = useState<AssessmentMark[]>(
    initialAssessmentMarks
  );
  const [completions, setCompletions] = useState<CourseCompletion[]>(initialCompletions);
  const [outcomes, setOutcomes] = useState<StudentOutcome[]>(initialStudentOutcomes);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [orgProfile, setOrgProfile] = useState<OrgProfile>(initialOrgProfile);
  const [settings, setSettings] = useState<SystemSettings>(initialSystemSettings);
  const [currentRole, setCurrentRole] = useState<UserRole>('Admin');
  const [currentAuthUser, setCurrentAuthUser] = useState<UserAccount | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load state from localStorage on startup
  useEffect(() => {
    try {
      const sStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (sStudents) setStudents(JSON.parse(sStudents));

      const sCourses = localStorage.getItem(STORAGE_KEYS.COURSES);
      if (sCourses) setCourses(JSON.parse(sCourses));

      const sBatches = localStorage.getItem(STORAGE_KEYS.BATCHES);
      if (sBatches) setBatches(JSON.parse(sBatches));

      const sAtt = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (sAtt) setMonthlyAttendance(JSON.parse(sAtt));

      const sSessions = localStorage.getItem(STORAGE_KEYS.ATT_SESSIONS);
      if (sSessions) setAttendanceSessions(JSON.parse(sSessions));

      const sMarks = localStorage.getItem(STORAGE_KEYS.ATT_MARKS);
      if (sMarks) setAttendanceMarks(JSON.parse(sMarks));

      const sLogs = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
      if (sLogs) setDailyTimeLogs(JSON.parse(sLogs));

      const sPay = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      if (sPay) setBlossomPayments(JSON.parse(sPay));

      const sDrp = localStorage.getItem(STORAGE_KEYS.DROPOUTS);
      if (sDrp) setDropouts(JSON.parse(sDrp));

      const sAsm = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
      if (sAsm) setAssessments(JSON.parse(sAsm));

      const sMrk = localStorage.getItem(STORAGE_KEYS.ASSESSMENT_MARKS);
      if (sMrk) setAssessmentMarks(JSON.parse(sMrk));

      const sCmp = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
      if (sCmp) setCompletions(JSON.parse(sCmp));

      const sOut = localStorage.getItem(STORAGE_KEYS.OUTCOMES);
      if (sOut) setOutcomes(JSON.parse(sOut));

      const sAudit = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (sAudit) setAuditLogs(JSON.parse(sAudit));

      const sProfile = localStorage.getItem(STORAGE_KEYS.ORG_PROFILE);
      if (sProfile) setOrgProfile(JSON.parse(sProfile));

      const sSet = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (sSet) setSettings(JSON.parse(sSet));

      const sRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
      if (sRole) setCurrentRole(sRole);

      const sUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (sUser) setCurrentAuthUser(JSON.parse(sUser));

      const sTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light' | null;
      if (sTheme) setTheme(sTheme);
    } catch (e) {
      console.error('Error loading TIC360 local state', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(monthlyAttendance));
    localStorage.setItem(STORAGE_KEYS.ATT_SESSIONS, JSON.stringify(attendanceSessions));
    localStorage.setItem(STORAGE_KEYS.ATT_MARKS, JSON.stringify(attendanceMarks));
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(dailyTimeLogs));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(blossomPayments));
    localStorage.setItem(STORAGE_KEYS.DROPOUTS, JSON.stringify(dropouts));
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(assessments));
    localStorage.setItem(STORAGE_KEYS.ASSESSMENT_MARKS, JSON.stringify(assessmentMarks));
    localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
    localStorage.setItem(STORAGE_KEYS.OUTCOMES, JSON.stringify(outcomes));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    localStorage.setItem(STORAGE_KEYS.ORG_PROFILE, JSON.stringify(orgProfile));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEYS.ROLE, currentRole);
    if (currentAuthUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(currentAuthUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [
    students,
    courses,
    batches,
    monthlyAttendance,
    attendanceSessions,
    attendanceMarks,
    dailyTimeLogs,
    blossomPayments,
    dropouts,
    assessments,
    assessmentMarks,
    completions,
    outcomes,
    auditLogs,
    orgProfile,
    settings,
    currentRole,
    currentAuthUser,
    theme,
    isLoaded,
  ]);

  const currentStudent = React.useMemo(() => {
    if (currentAuthUser?.studentId) {
      const found = students.find((s) => s.id === currentAuthUser.studentId);
      if (found) return found;
    }
    if (currentAuthUser?.utNumber) {
      const found = students.find(
        (s) => s.utNumber.toLowerCase() === currentAuthUser.utNumber?.toLowerCase()
      );
      if (found) return found;
    }
    if (currentAuthUser?.email) {
      const found = students.find(
        (s) => s.email.toLowerCase() === currentAuthUser.email.toLowerCase()
      );
      if (found) return found;
    }
    if (currentRole === 'Student' && students.length > 0) {
      return students[0];
    }
    return null;
  }, [currentAuthUser, currentRole, students]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const logoutUser = () => {
    setCurrentAuthUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
    setCurrentRole('Admin');
  };

  const addAuditLog = (action: string, entity: string, recordId?: string, details?: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      userName: currentAuthUser?.fullName || `${currentRole} User`,
      userRole: currentRole,
      action,
      entity,
      recordId,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // 1. STUDENT ACTIONS
  const addStudent = (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Student => {
    const newId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString().slice(0, 10);
    const newStudent: Student = {
      ...studentData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    setStudents((prev) => [newStudent, ...prev]);
    addAuditLog('Student Registered', 'Student', newStudent.utNumber, `Registered ${newStudent.fullName} (${newStudent.courseName})`);
    return newStudent;
  };

  const registerNewStudent = (
    studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'utNumber'>,
    password: string
  ): { student: Student; account: UserAccount } => {
    const existingUtNumbers = students
      .map((s) => {
        const match = s.utNumber.match(/UT-\d{4}-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = existingUtNumbers.length > 0 ? Math.max(...existingUtNumbers) : students.length;
    const nextNum = maxNum + 1;
    const utNumber = `UT-2026-${String(nextNum).padStart(3, '0')}`;
    const newId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString().slice(0, 10);

    const newStudent: Student = {
      ...studentData,
      id: newId,
      utNumber,
      createdAt: now,
      updatedAt: now,
    };

    setStudents((prev) => [newStudent, ...prev]);

    const newAccount: UserAccount = {
      id: `USR-${newId}`,
      email: newStudent.email,
      fullName: newStudent.fullName,
      role: 'Student',
      password: password || 'Student@123',
      avatarUrl: newStudent.photoUrl,
      department: 'Vocational Trainees',
      studentId: newId,
      utNumber: utNumber,
    };

    registerStudentAccount(newAccount);
    setCurrentAuthUser(newAccount);
    setCurrentRole('Student');

    addAuditLog(
      'Student Self-Registered',
      'Student',
      utNumber,
      `Self-registered trainee ${newStudent.fullName} for ${newStudent.courseName}`
    );

    return { student: newStudent, account: newAccount };
  };

  const updateStudent = (id: string, updated: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              ...updated,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : s
      )
    );
    addAuditLog('Student Updated', 'Student', id, `Updated profile data for ${id}`);
  };

  const deleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    addAuditLog('Student Removed', 'Student', target?.utNumber || id, `Deleted student record ${target?.fullName}`);
  };

  const bulkImportBlossomStudents = (
    rows: Array<{
      utNumber?: string;
      fullName: string;
      phone?: string;
      district?: string;
      beneficiaryName?: string;
      bankName?: string;
      branchName?: string;
      branchCode?: string;
      accountNumber?: string;
      amount?: string | number;
    }>
  ) => {
    let updatedCount = 0;
    let createdCount = 0;
    const now = new Date().toISOString().slice(0, 10);

    setStudents((prev) => {
      const nextStudents = [...prev];

      rows.forEach((row) => {
        if (!row.fullName && !row.utNumber) return;

        const cleanUt = row.utNumber?.trim();
        const cleanName = row.fullName?.trim().toLowerCase();

        // Search for matching student
        const existingIdx = nextStudents.findIndex((s) => {
          if (cleanUt && s.utNumber.toLowerCase() === cleanUt.toLowerCase()) return true;
          if (cleanName && s.fullName.toLowerCase() === cleanName) return true;
          return false;
        });

        const bankDetails = {
          bankName: row.bankName || 'Commercial Bank of Ceylon',
          branchName: row.branchName || 'Jaffna Main Branch',
          branchCode: row.branchCode || '045',
          accountNumber: row.accountNumber || '8004529103',
          beneficiaryName: row.beneficiaryName || row.fullName || 'Beneficiary',
          district: row.district || 'Jaffna',
        };

        if (existingIdx >= 0) {
          const existing = nextStudents[existingIdx];
          nextStudents[existingIdx] = {
            ...existing,
            isBlossomTrust: true,
            phone: row.phone || existing.phone,
            district: row.district || existing.district,
            bankDetails: {
              ...existing.bankDetails,
              ...bankDetails,
              bankName: row.bankName || existing.bankDetails?.bankName || bankDetails.bankName,
              branchName: row.branchName || existing.bankDetails?.branchName || bankDetails.branchName,
              branchCode: row.branchCode || existing.bankDetails?.branchCode || bankDetails.branchCode,
              accountNumber: row.accountNumber || existing.bankDetails?.accountNumber || bankDetails.accountNumber,
              beneficiaryName: row.beneficiaryName || existing.bankDetails?.beneficiaryName || existing.fullName,
              district: row.district || existing.district || bankDetails.district,
            },
            updatedAt: now,
          };
          updatedCount++;
        } else {
          // Calculate next UT number if not specified
          let ut = cleanUt;
          if (!ut) {
            const existingNums = nextStudents
              .map((s) => {
                const match = s.utNumber.match(/UT-\d{4}-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
              })
              .filter((n) => !isNaN(n));
            const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : nextStudents.length;
            ut = `UT-2026-${String(maxNum + 1).padStart(3, '0')}`;
          }

          const newStudent: Student = {
            id: `STU-${Math.floor(10000 + Math.random() * 90000)}`,
            utNumber: ut,
            fullName: row.fullName || `Student ${ut}`,
            nic: `${Math.floor(100000000 + Math.random() * 900000000)}V`,
            dob: '2004-01-01',
            gender: 'Male',
            phone: row.phone || '0774521180',
            email: `${ut.toLowerCase().replace(/[^a-z0-9]/g, '')}@tic360.lk`,
            address: `${row.district || 'Jaffna'}, Sri Lanka`,
            district: row.district || 'Jaffna',
            emergencyContact: {
              name: 'Parent/Guardian',
              phone: row.phone || '0774521180',
              relationship: 'Parent',
            },
            batchId: 'BATCH-2026-A',
            batchName: 'Batch 2026',
            courseId: 'CRS-ICT-01',
            courseName: 'ICT & Software Engineering',
            isBlossomTrust: true,
            currentStatus: 'Active',
            bankDetails,
            createdAt: now,
            updatedAt: now,
          };
          nextStudents.push(newStudent);
          createdCount++;
        }
      });

      return nextStudents;
    });

    addAuditLog(
      'Blossom Excel Import',
      'Student',
      'Batch Import',
      `Imported ${rows.length} Blossom Trust records (${updatedCount} updated, ${createdCount} created)`
    );

    return { updatedCount, createdCount };
  };

  // 2. ATTENDANCE & AUTOMATIC PAYMENT CALCULATION
  const recordAttendance = (
    records: Array<{
      studentId: string;
      batchId: string;
      year: number;
      month: string;
      attendancePercentage: number;
    }>
  ) => {
    const updatedAttList = [...monthlyAttendance];
    const newPaymentsToUpsert: BlossomMonthlyPayment[] = [];

    for (const rec of records) {
      const student = students.find((s) => s.id === rec.studentId);
      if (!student) continue;

      let status: AttendanceStatus = 'Good Attendance';
      if (rec.attendancePercentage < settings.attendanceLowThreshold) {
        status = 'Critical Attendance';
      } else if (rec.attendancePercentage < settings.attendanceGoodThreshold) {
        status = 'Low Attendance';
      }

      const existingIdx = updatedAttList.findIndex(
        (a) => a.studentId === rec.studentId && a.month === rec.month
      );

      const attItem: MonthlyAttendance = {
        id: existingIdx >= 0 ? updatedAttList[existingIdx].id : `ATT-${rec.month}-${student.utNumber}`,
        studentId: rec.studentId,
        utNumber: student.utNumber,
        studentName: student.fullName,
        batchId: rec.batchId,
        courseName: student.courseName,
        year: rec.year,
        month: rec.month,
        attendancePercentage: rec.attendancePercentage,
        status,
        recordedBy: `${currentRole} User`,
        updatedAt: new Date().toISOString().slice(0, 10),
      };

      if (existingIdx >= 0) {
        updatedAttList[existingIdx] = attItem;
      } else {
        updatedAttList.push(attItem);
      }

      if (student.isBlossomTrust) {
        const isDropout = student.currentStatus === 'Dropout';
        const isLowAttendance = rec.attendancePercentage < settings.paymentEligibilityAttendanceThreshold;

        let isEligible = true;
        let ineligibilityReason: string | undefined = undefined;
        let amount = settings.blossomMonthlyMax;
        let paymentStatus: BlossomPaymentStatus = 'Eligible';

        if (isDropout) {
          isEligible = false;
          ineligibilityReason = `Student Dropped Out`;
          amount = 0;
          paymentStatus = 'Not Eligible';
        } else if (isLowAttendance) {
          isEligible = false;
          ineligibilityReason = `Low Attendance (${rec.attendancePercentage.toFixed(1)}% < ${settings.paymentEligibilityAttendanceThreshold}% threshold)`;
          amount = 0;
          paymentStatus = 'Not Eligible';
        }

        const existingPayment = blossomPayments.find(
          (p) => p.studentId === rec.studentId && p.month === rec.month
        );

        const paymentItem: BlossomMonthlyPayment = {
          id: existingPayment ? existingPayment.id : `PAY-${rec.month}-${student.utNumber}`,
          studentId: rec.studentId,
          utNumber: student.utNumber,
          studentName: student.fullName,
          year: rec.year,
          month: rec.month,
          attendancePercentage: rec.attendancePercentage,
          isEligible,
          ineligibilityReason,
          amount,
          status: existingPayment?.status === 'Paid' ? 'Paid' : paymentStatus,
          paymentDate: existingPayment?.paymentDate,
          referenceNo: existingPayment?.referenceNo,
          notes: existingPayment?.notes || ineligibilityReason,
        };

        newPaymentsToUpsert.push(paymentItem);
      }
    }

    setMonthlyAttendance(updatedAttList);

    setBlossomPayments((prev) => {
      const map = new Map<string, BlossomMonthlyPayment>();
      prev.forEach((p) => map.set(`${p.studentId}_${p.month}`, p));
      newPaymentsToUpsert.forEach((p) => map.set(`${p.studentId}_${p.month}`, p));
      return Array.from(map.values());
    });

    addAuditLog('Attendance Recorded', 'Attendance', records[0]?.month, `Saved attendance for ${records.length} students`);
  };

  const processFingerprintCSV = (logs: DailyTimeLog[], sessionDate: string) => {
    setDailyTimeLogs((prev) => {
      const filtered = prev.filter(log => log.date !== sessionDate);
      return [...filtered, ...logs];
    });
    addAuditLog('CSV Upload', 'Attendance', sessionDate, `Processed fingerprint CSV for ${logs.length} records`);
  };

  const recalculateMonthlyPayments = (month: string) => {
    const blossomStudents = students.filter((s) => s.isBlossomTrust);
    const newPayments: BlossomMonthlyPayment[] = [];

    blossomStudents.forEach((student) => {
      const att = monthlyAttendance.find((a) => a.studentId === student.id && a.month === month);
      const attPct = att ? att.attendancePercentage : 0;
      const isDropout = student.currentStatus === 'Dropout';
      const isLowAtt = attPct < settings.paymentEligibilityAttendanceThreshold;

      let isEligible = true;
      let ineligibilityReason: string | undefined = undefined;
      let amount = settings.blossomMonthlyMax;
      let paymentStatus: BlossomPaymentStatus = 'Eligible';

      if (isDropout) {
        isEligible = false;
        ineligibilityReason = 'Student Dropped Out';
        amount = 0;
        paymentStatus = 'Not Eligible';
      } else if (isLowAtt) {
        isEligible = false;
        ineligibilityReason = `Low Attendance (${attPct.toFixed(1)}% < ${settings.paymentEligibilityAttendanceThreshold}%)`;
        amount = 0;
        paymentStatus = 'Not Eligible';
      }

      const existing = blossomPayments.find((p) => p.studentId === student.id && p.month === month);

      newPayments.push({
        id: existing ? existing.id : `PAY-${month}-${student.utNumber}`,
        studentId: student.id,
        utNumber: student.utNumber,
        studentName: student.fullName,
        year: parseInt(month.split('-')[0]),
        month,
        attendancePercentage: attPct,
        isEligible,
        ineligibilityReason,
        amount,
        status: existing?.status === 'Paid' ? 'Paid' : paymentStatus,
        paymentDate: existing?.paymentDate,
        referenceNo: existing?.referenceNo,
      });
    });

    setBlossomPayments((prev) => {
      const map = new Map<string, BlossomMonthlyPayment>();
      prev.forEach((p) => map.set(`${p.studentId}_${p.month}`, p));
      newPayments.forEach((p) => map.set(`${p.studentId}_${p.month}`, p));
      return Array.from(map.values());
    });
  };

  const addAttendanceSession = (session: Omit<AttendanceSession, 'id'>) => {
    const newSession: AttendanceSession = {
      ...session,
      id: `SES-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    };
    setAttendanceSessions((prev) => [...prev, newSession]);
    return newSession;
  };

  const updateAttendanceSession = (id: string, updated: Partial<AttendanceSession>) => {
    setAttendanceSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
  };

  const deleteAttendanceSession = (id: string) => {
    setAttendanceSessions((prev) => prev.filter((s) => s.id !== id));
    setAttendanceMarks((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const setDailyMark = (sessionId: string, studentId: string, mark: AttendanceMark) => {
    setAttendanceMarks((prev) => ({
      ...prev,
      [sessionId]: {
        ...(prev[sessionId] || {}),
        [studentId]: mark,
      },
    }));
  };

  const batchSetDailyMarks = (sessionId: string, marks: Record<string, AttendanceMark>) => {
    setAttendanceMarks((prev) => ({
      ...prev,
      [sessionId]: {
        ...(prev[sessionId] || {}),
        ...marks,
      },
    }));
  };

  const markAllPresentForSession = (sessionId: string, studentIds: string[]) => {
    const allP: Record<string, AttendanceMark> = {};
    studentIds.forEach((id) => (allP[id] = 'P'));
    batchSetDailyMarks(sessionId, allP);
  };

  const saveAttendanceMatrix = (
    month: string,
    group: string,
    sessions: AttendanceSession[],
    marks: Record<string, Record<string, AttendanceMark>>
  ) => {
    setAttendanceSessions(sessions);
    setAttendanceMarks(marks);

    const relevantStudents = students.filter(
      (s) => group === 'all' || s.group === group || (group === 'Group A' && (!s.group || s.group === 'A'))
    );

    const year = parseInt(month.split('-')[0], 10) || 2026;
    const sessionCount = sessions.length;

    if (sessionCount > 0) {
      const attendanceToRecord = relevantStudents.map((stu) => {
        let presentCount = 0;
        sessions.forEach((ses) => {
          const m = marks[ses.id]?.[stu.id] ?? 'P';
          if (m === 'P') presentCount += 1;
        });

        const pct = Math.round((presentCount / sessionCount) * 100);
        return {
          studentId: stu.id,
          batchId: stu.batchId,
          year,
          month,
          attendancePercentage: pct,
        };
      });

      recordAttendance(attendanceToRecord);
    }
  };

  const updatePaymentStatus = (
    paymentId: string,
    status: BlossomPaymentStatus,
    referenceNo?: string,
    notes?: string
  ) => {
    setBlossomPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status,
              paymentDate: status === 'Paid' ? new Date().toISOString().slice(0, 10) : p.paymentDate,
              referenceNo: referenceNo || p.referenceNo,
              notes: notes || p.notes,
            }
          : p
      )
    );
    addAuditLog('Payment Status Updated', 'Blossom Payment', paymentId, `Marked payment as ${status}`);
  };

  const recordDropout = ({
    studentId,
    dropoutMonth,
    reason,
    rejoinPossibility,
    remarks,
  }: {
    studentId: string;
    dropoutMonth: string;
    reason: DropoutReason;
    rejoinPossibility: RejoinPossibility;
    remarks?: string;
  }) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const newDropout: DropoutRecord = {
      id: `DRP-${Date.now()}`,
      studentId,
      utNumber: student.utNumber,
      studentName: student.fullName,
      batchId: student.batchId,
      courseId: student.courseId,
      courseName: student.courseName,
      dropoutMonth,
      reason,
      rejoinPossibility,
      remarks,
      recordedAt: new Date().toISOString().slice(0, 10),
    };

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, currentStatus: 'Dropout' } : s))
    );

    setDropouts((prev) => [newDropout, ...prev]);

    setBlossomPayments((prev) =>
      prev.map((p) => {
        if (p.studentId === studentId && p.month >= dropoutMonth && p.status !== 'Paid') {
          return {
            ...p,
            isEligible: false,
            amount: 0,
            status: 'Not Eligible',
            ineligibilityReason: `Disbursement stopped due to Dropout (${reason})`,
          };
        }
        return p;
      })
    );

    addAuditLog('Dropout Recorded', 'Dropout', student.utNumber, `Marked ${student.fullName} as Dropout (${reason})`);
  };

  const addAssessment = (assessmentData: Omit<Assessment, 'id' | 'createdAt'>) => {
    const newAssessment: Assessment = {
      ...assessmentData,
      id: `ASM-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setAssessments((prev) => [...prev, newAssessment]);
    addAuditLog('Assessment Created', 'Assessment', newAssessment.title, `Created custom assessment: ${newAssessment.title} (Max: ${newAssessment.maxMarks})`);
  };

  const deleteAssessment = (id: string) => {
    setAssessments((prev) => prev.filter((a) => a.id !== id));
    setAssessmentMarks((prev) => prev.filter((m) => m.assessmentId !== id));
  };

  const saveAssessmentMarks = (
    assessmentId: string,
    marks: Array<{ studentId: string; marksObtained: number; feedback?: string }>
  ) => {
    const now = new Date().toISOString().slice(0, 10);
    setAssessmentMarks((prev) => {
      const filtered = prev.filter((m) => m.assessmentId !== assessmentId);
      const newMarks: AssessmentMark[] = marks.map((m) => ({
        id: `MRK-${assessmentId}-${m.studentId}`,
        assessmentId,
        studentId: m.studentId,
        marksObtained: m.marksObtained,
        feedback: m.feedback,
        gradedAt: now,
      }));
      return [...filtered, ...newMarks];
    });
    addAuditLog('Marks Graded', 'Assessment Marks', assessmentId, `Graded marks for ${marks.length} students`);
  };

  const recordCompletion = (completionData: Omit<CourseCompletion, 'id'>) => {
    const newCompletion: CourseCompletion = {
      ...completionData,
      id: `CMP-${Date.now()}`,
    };
    setCompletions((prev) => [newCompletion, ...prev.filter((c) => c.studentId !== completionData.studentId)]);

    setStudents((prev) =>
      prev.map((s) => (s.id === completionData.studentId ? { ...s, currentStatus: 'Completed' } : s))
    );

    addAuditLog('Course Completed', 'Completion', completionData.utNumber, `Completed course with Grade ${completionData.overallGrade}`);
  };

  const saveStudentOutcome = (outcomeData: Omit<StudentOutcome, 'id' | 'updatedAt'>) => {
    const now = new Date().toISOString().slice(0, 10);
    const existing = outcomes.find((o) => o.studentId === outcomeData.studentId);

    const newOutcome: StudentOutcome = {
      ...outcomeData,
      id: existing ? existing.id : `OUT-${Date.now()}`,
      updatedAt: now,
    };

    setOutcomes((prev) => [
      newOutcome,
      ...prev.filter((o) => o.studentId !== outcomeData.studentId),
    ]);

    addAuditLog('Student Outcome Recorded', 'Outcome', outcomeData.utNumber, `Current Status: ${outcomeData.outcomeStatus} (${outcomeData.companyOrInstitution || 'N/A'})`);
  };

  const addCourse = (courseData: Omit<Course, 'id'>) => {
    const newCourse: Course = {
      ...courseData,
      id: `CRS-${String(courses.length + 1).padStart(2, '0')}`,
    };
    setCourses((prev) => [...prev, newCourse]);
    setSettings((prev) => ({
      ...prev,
      courses: [...prev.courses, newCourse],
    }));
  };

  const updateCourse = (id: string, updated: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const addBatch = (batchData: Omit<Batch, 'id'>) => {
    const newBatch: Batch = {
      ...batchData,
      id: `BAT-${String(batches.length + 1).padStart(2, '0')}`,
    };
    setBatches((prev) => [...prev, newBatch]);
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addAuditLog('Settings Updated', 'System Settings', 'Config', 'Updated system thresholds and settings');
  };

  const updateOrgProfile = (profile: Partial<OrgProfile>) => {
    setOrgProfile((prev) => ({ ...prev, ...profile }));
  };

  const resetToDefaults = () => {
    setStudents(initialStudents);
    setCourses(initialCourses);
    setBatches(initialBatches);
    setMonthlyAttendance(initialMonthlyAttendance);
    setBlossomPayments(initialBlossomPayments);
    setDropouts(initialDropouts);
    setAssessments(initialAssessments);
    setAssessmentMarks(initialAssessmentMarks);
    setCompletions(initialCompletions);
    setOutcomes(initialStudentOutcomes);
    setAuditLogs(initialAuditLogs);
    setOrgProfile(initialOrgProfile);
    setSettings(initialSystemSettings);
    addAuditLog('System Reset', 'Database', 'All', 'Restored system database to initial factory defaults');
  };

  return (
    <StoreContext.Provider
      value={{
        students,
        courses,
        batches,
        monthlyAttendance,
        attendanceSessions,
        attendanceMarks,
        dailyTimeLogs,
        blossomPayments,
        dropouts,
        assessments,
        assessmentMarks,
        completions,
        outcomes,
        auditLogs,
        orgProfile,
        settings,
        currentRole,
        setCurrentRole,
        currentAuthUser,
        setCurrentAuthUser,
        currentStudent,
        theme,
        toggleTheme,
        logoutUser,
        addStudent,
        registerNewStudent,
        updateStudent,
        deleteStudent,
        bulkImportBlossomStudents,
        recordAttendance,
        addAttendanceSession,
        updateAttendanceSession,
        deleteAttendanceSession,
        setDailyMark,
        batchSetDailyMarks,
        markAllPresentForSession,
        saveAttendanceMatrix,
        processFingerprintCSV,
        updatePaymentStatus,
        recalculateMonthlyPayments,
        recordDropout,
        addAssessment,
        deleteAssessment,
        saveAssessmentMarks,
        recordCompletion,
        saveStudentOutcome,
        addCourse,
        updateCourse,
        addBatch,
        updateSettings,
        updateOrgProfile,
        resetToDefaults,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
