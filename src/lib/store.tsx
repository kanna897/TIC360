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
  AbsenceRequest,
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
import { checkIsSupabaseConfigured, supabase } from './supabaseClient';
import {
  fetchAllFromSupabase,
  syncAllToSupabase,
  syncStudent,
  syncDeleteStudent,
  syncAttendanceSessions,
  syncDeleteAttendanceSession,
  syncAttendanceMark,
  syncAttendanceMarksForSession,
  syncMonthlyAttendance,
  syncPayment,
  syncPayments,
  syncDropout,
  syncAssessment,
  syncDeleteAssessment,
  syncAssessmentMarks,
  syncCompletion,
  syncOutcome,
  syncCourse,
  syncBatch,
  syncSettings,
  syncAuditLog,
  resetSeedDataInSupabase,
  syncAbsenceRequests,
} from './supabaseSync';
import {
  UserAccount,
  registerStudentAccount,
  getRegisteredAccounts,
  signOutFromSupabase,
  registerStudentWithSupabase,
} from './auth';

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
  absenceRequests: AbsenceRequest[];
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
  bulkImportAllAttendance: (
    sessions: AttendanceSession[],
    marks: Record<string, Record<string, AttendanceMark>>,
    monthly: MonthlyAttendance[],
    newStudents?: Student[]
  ) => void;
  importGoogleSheetAttendance: (
    month: string,
    newSessions: AttendanceSession[],
    newMarks: Record<string, Record<string, AttendanceMark>>
  ) => void;
  processFingerprintCSV: (logs: DailyTimeLog[], sessionDate: string) => void;
  submitAbsenceRequest: (req: Omit<AbsenceRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateAbsenceRequestStatus: (id: string, status: 'Submitted' | 'Approved' | 'Rejected') => void;

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
  DAILY_LOGS: 'tic360_v2_daily_logs',
  PAYMENTS: 'tic360_v2_payments',
  DROPOUTS: 'tic360_v2_dropouts',
  ASSESSMENTS: 'tic360_v2_assessments',
  ASSESSMENT_MARKS: 'tic360_v2_marks',
  COMPLETIONS: 'tic360_v2_completions',
  OUTCOMES: 'tic360_v2_outcomes',
  AUDIT_LOGS: 'tic360_v2_audit_logs',
  SETTINGS: 'tic360_v2_settings',
  ORG_PROFILE: 'tic360_v2_org_profile',
  ABSENCES: 'tic360_v2_absences',
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
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [orgProfile, setOrgProfile] = useState<OrgProfile>(initialOrgProfile);
  const [settings, setSettings] = useState<SystemSettings>(initialSystemSettings);
  const [currentRole, setCurrentRole] = useState<UserRole>('Admin');
  const [currentAuthUser, setCurrentAuthUser] = useState<UserAccount | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load state from Supabase on startup (fallback to localStorage if offline/not configured)
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!checkIsSupabaseConfigured()) {
          const sStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
          if (sStudents) {
            const parsed: Student[] = JSON.parse(sStudents);
            const seen = new Set<string>();
            const deduped = parsed.filter((s: Student) => {
              const key = s.utNumber.trim().toUpperCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            setStudents(deduped);
          }
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
          const sDropouts = localStorage.getItem(STORAGE_KEYS.DROPOUTS);
          if (sDropouts) setDropouts(JSON.parse(sDropouts));
          const sAssessments = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
          if (sAssessments) setAssessments(JSON.parse(sAssessments));
          const sAssMarks = localStorage.getItem(STORAGE_KEYS.ASSESSMENT_MARKS);
          if (sAssMarks) setAssessmentMarks(JSON.parse(sAssMarks));
          const sCompletions = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
          if (sCompletions) setCompletions(JSON.parse(sCompletions));
          const sOutcomes = localStorage.getItem(STORAGE_KEYS.OUTCOMES);
          if (sOutcomes) setOutcomes(JSON.parse(sOutcomes));
          const sAbs = localStorage.getItem(STORAGE_KEYS.ABSENCES);
          if (sAbs) setAbsenceRequests(JSON.parse(sAbs));
          const sAudit = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
          if (sAudit) setAuditLogs(JSON.parse(sAudit));
          const sOrg = localStorage.getItem(STORAGE_KEYS.ORG_PROFILE);
          if (sOrg) setOrgProfile(JSON.parse(sOrg));
          const sSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
          if (sSettings) setSettings(JSON.parse(sSettings));
          return;
        }

        // Load from Supabase
        const data = await fetchAllFromSupabase();
        if (data.students?.length) {
          const seen = new Set<string>();
          const deduped: Student[] = [];
          data.students.forEach((s: Student) => {
            const key = (s.utNumber || '').trim().toUpperCase();
            if (!key) return;
            if (!seen.has(key)) {
              seen.add(key);
              // Fix UT011700 if accidentally assigned to Frontend Developer
              if (key === 'UT011700' && (s.courseName === 'Frontend Developer' || s.courseId === 'Frontend Developer')) {
                s.courseId = 'CRS-TIC-01';
                s.courseName = 'Full-Stack Web Development';
                s.group = 'Group A';
              }
              deduped.push(s);
            }
          });
          setStudents(deduped);
        }
        if (data.courses?.length) setCourses(data.courses);
        if (data.batches?.length) setBatches(data.batches);
        if (data.monthlyAttendance?.length) setMonthlyAttendance(data.monthlyAttendance);
        if (data.attendanceSessions?.length) setAttendanceSessions(data.attendanceSessions);
        if (data.attendanceMarks && Object.keys(data.attendanceMarks).length) setAttendanceMarks(data.attendanceMarks);
        if (data.blossomPayments?.length) setBlossomPayments(data.blossomPayments);
        if (data.dropouts?.length) setDropouts(data.dropouts);
        if (data.assessments?.length) setAssessments(data.assessments);
        if (data.assessmentMarks?.length) setAssessmentMarks(data.assessmentMarks);
        if (data.completions?.length) setCompletions(data.completions);
        if (data.outcomes?.length) setOutcomes(data.outcomes);
        if (data.absenceRequests?.length) setAbsenceRequests(data.absenceRequests);
        if (data.auditLogs?.length) setAuditLogs(data.auditLogs);
        if (data.settings) setSettings(data.settings);
      } catch (e) {
        console.error('Error loading data from Supabase:', e);
      } finally {
        // UI preferences always from localStorage
        try {
          const sRole = localStorage.getItem(STORAGE_KEYS.ROLE);
          if (sRole) setCurrentRole(sRole as UserRole);
          const sUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
          if (sUser) setCurrentAuthUser(JSON.parse(sUser));
          const sTheme = localStorage.getItem(STORAGE_KEYS.THEME);
          if (sTheme) setTheme(sTheme as 'dark' | 'light');
        } catch (e) {
          console.error('Error loading local preferences:', e);
        }
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Supabase Auth Session Synchronization
  useEffect(() => {
    if (!checkIsSupabaseConfigured()) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && event === 'SIGNED_IN') {
        const u = session.user;
        let role = (u.user_metadata?.role as UserRole) || 'Student';
        let fullName = u.user_metadata?.full_name || u.email?.split('@')[0] || 'User';
        let department = u.user_metadata?.department || '';
        let utNumber = u.user_metadata?.ut_number;
        let studentId = u.user_metadata?.student_id;
        let avatarUrl = u.user_metadata?.avatar_url;

        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', u.id)
            .maybeSingle();

          if (profile) {
            role = (profile.role as UserRole) || role;
            fullName = profile.full_name || fullName;
            department = profile.department || department;
            utNumber = profile.ut_number || utNumber;
            studentId = profile.student_id || studentId;
            avatarUrl = profile.avatar_url || avatarUrl;
          }
        } catch (e) {
          console.warn('[store] error fetching profile:', e);
        }

        const userAcc: UserAccount = {
          id: u.id,
          email: u.email || '',
          fullName,
          role,
          avatarUrl,
          department,
          studentId,
          utNumber,
        };

        setCurrentAuthUser(userAcc);
        setCurrentRole(role);
      } else if (event === 'SIGNED_OUT') {
        setCurrentAuthUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Sync state to Supabase (debounced 2s) & localStorage backup
  useEffect(() => {
    if (!isLoaded) return;

    // UI preferences always go to localStorage
    localStorage.setItem(STORAGE_KEYS.ROLE, currentRole);
    if (currentAuthUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(currentAuthUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    // Always keep localStorage backup as immediate cache & offline fallback
    try {
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
      localStorage.setItem(STORAGE_KEYS.ABSENCES, JSON.stringify(absenceRequests));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEYS.ORG_PROFILE, JSON.stringify(orgProfile));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('localStorage backup error:', e);
    }

    if (checkIsSupabaseConfigured()) {
      const timer = setTimeout(() => {
        syncAllToSupabase({
          students,
          courses,
          batches,
          monthlyAttendance,
          attendanceSessions,
          attendanceMarks,
          blossomPayments,
          dropouts,
          assessments,
          assessmentMarks,
          completions,
          outcomes,
          auditLogs,
          settings,
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
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
    absenceRequests,
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
    signOutFromSupabase();
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
    if (checkIsSupabaseConfigured()) syncAuditLog(newLog);
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
    if (checkIsSupabaseConfigured()) syncStudent(newStudent);
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

    // Register in Supabase Auth & user_profiles
    registerStudentWithSupabase({
      email: newStudent.email,
      password: password || 'Student@123',
      fullName: newStudent.fullName,
      utNumber,
      studentId: newId,
      department: 'Vocational Trainees',
      avatarUrl: newStudent.photoUrl,
    }).catch((err) => console.warn('[store] Supabase auth signup failed:', err));

    if (checkIsSupabaseConfigured()) {
      syncStudent(newStudent);
    }

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

    // If student is being marked as Dropout, auto-stop all future unpaid Blossom payments
    if (updated.currentStatus === 'Dropout') {
      const today = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
      setBlossomPayments((prev) =>
        prev.map((p) => {
          if (p.studentId === id && p.month >= today && p.status !== 'Paid') {
            return {
              ...p,
              isEligible: false,
              amount: 0,
              status: 'Not Eligible' as const,
              ineligibilityReason: 'Disbursement stopped due to Dropout',
            };
          }
          return p;
        })
      );
    }

    addAuditLog('Student Updated', 'Student', id, `Updated profile data for ${id}`);
    if (checkIsSupabaseConfigured()) {
      const updatedStu = students.find((s) => s.id === id);
      if (updatedStu) syncStudent({ ...updatedStu, ...updated, updatedAt: new Date().toISOString().slice(0, 10) });
    }
  };

  const deleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    addAuditLog('Student Removed', 'Student', target?.utNumber || id, `Deleted student record ${target?.fullName}`);
    if (checkIsSupabaseConfigured()) syncDeleteStudent(id);
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

    const parseAmt = (val: string | number | undefined): number => {
      if (val === undefined || val === null) return 15000;
      if (typeof val === 'number') return val;
      const cleaned = String(val).replace(/[^0-9.]/g, '');
      return cleaned ? parseFloat(cleaned) : 15000;
    };

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
            blossomAmount: row.amount !== undefined ? parseAmt(row.amount) : (existing.blossomAmount || 15000),
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
            isDummy: true, // Mark as dummy so it doesn't pollute Directory and Attendance
            blossomAmount: row.amount !== undefined ? parseAmt(row.amount) : 15000,
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

    if (checkIsSupabaseConfigured()) {
      setTimeout(async () => {
        try {
          const { data: currentDbStudents } = await supabase.from('students').select('*');
          rows.forEach((row) => {
            if (!row.fullName && !row.utNumber) return;
            const cleanUt = row.utNumber?.trim().toUpperCase();
            const cleanName = row.fullName?.trim().toLowerCase();
            const match = currentDbStudents?.find(s =>
              (cleanUt && (s.ut_number || '').trim().toUpperCase() === cleanUt) ||
              (cleanName && (s.full_name || '').trim().toLowerCase() === cleanName)
            );
            if (match) {
              const amount = row.amount !== undefined ? parseAmt(row.amount) : 15000;
              // Sync bank details
              supabase.from('student_bank_details').upsert({
                student_id: match.id,
                bank_name: row.bankName || 'Pan Asia Bank',
                branch_name: row.branchName || 'World Trade Center',
                branch_code: row.branchCode || '1',
                account_number: row.accountNumber || 'N/A',
                beneficiary_name: row.beneficiaryName || row.fullName || match.full_name,
                district: row.district || match.district || 'Jaffna',
                updated_at: new Date().toISOString(),
              }, { onConflict: 'student_id' }).then(() => {});

              // Sync base payment
              supabase.from('blossom_payments').upsert({
                id: `PAY-2026-08-${match.ut_number || match.id}`,
                student_id: match.id,
                year: 2026,
                month: '2026-08',
                attendance_percentage: 100,
                is_eligible: true,
                amount,
                status: 'Eligible',
              }, { onConflict: 'id' }).then(() => {});
            }
          });
        } catch (err) {
          console.warn('[store] bulkImportBlossomStudents Supabase sync error:', err);
        }
      }, 100);
    }

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
        const isManualLowAtt = student.currentStatus === 'Low Attendance';
        const isLowAttendance = rec.attendancePercentage < settings.paymentEligibilityAttendanceThreshold;

        let isEligible = true;
        let ineligibilityReason: string | undefined = undefined;
        let amount = student.blossomAmount !== undefined ? student.blossomAmount : settings.blossomMonthlyMax;
        let paymentStatus: BlossomPaymentStatus = 'Eligible';

        if (isDropout) {
          isEligible = false;
          ineligibilityReason = `Student Dropped Out`;
          amount = 0;
          paymentStatus = 'Not Eligible';
        } else if (isManualLowAtt) {
          isEligible = false;
          ineligibilityReason = `Low Attendance (Manually Marked)`;
          amount = 0;
          paymentStatus = 'Not Eligible';
        } else if (isLowAttendance && !student.isDummy) {
          // Normal students are dynamically checked; dummy students skip dynamic low attendance check if not marked manually
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

    if (checkIsSupabaseConfigured()) {
        syncMonthlyAttendance(updatedAttList);
        if (newPaymentsToUpsert.length > 0) syncPayments(newPaymentsToUpsert);
      }

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
      let amount = student.blossomAmount !== undefined ? student.blossomAmount : settings.blossomMonthlyMax;
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
    if (checkIsSupabaseConfigured()) syncAttendanceSessions([newSession]);
    return newSession;
  };

  const updateAttendanceSession = (id: string, updated: Partial<AttendanceSession>) => {
    setAttendanceSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
    if (checkIsSupabaseConfigured()) {
      const ses = attendanceSessions.find((s) => s.id === id);
      if (ses) syncAttendanceSessions([{ ...ses, ...updated }]);
    }
  };

  const deleteAttendanceSession = (id: string) => {
    setAttendanceSessions((prev) => prev.filter((s) => s.id !== id));
    setAttendanceMarks((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (checkIsSupabaseConfigured()) syncDeleteAttendanceSession(id);
  };

  const setDailyMark = (sessionId: string, studentId: string, mark: AttendanceMark) => {
    setAttendanceMarks((prev) => ({
      ...prev,
      [sessionId]: {
        ...(prev[sessionId] || {}),
        [studentId]: mark,
      },
    }));
    if (checkIsSupabaseConfigured()) syncAttendanceMark(sessionId, studentId, mark);
  };

  const batchSetDailyMarks = (sessionId: string, marks: Record<string, AttendanceMark>) => {
    setAttendanceMarks((prev) => ({
      ...prev,
      [sessionId]: {
        ...(prev[sessionId] || {}),
        ...marks,
      },
    }));
    if (checkIsSupabaseConfigured()) syncAttendanceMarksForSession(sessionId, marks);
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
    if (checkIsSupabaseConfigured()) {
      if (sessions.length > 0) syncAttendanceSessions(sessions);
      Object.keys(marks).forEach((sId) => syncAttendanceMarksForSession(sId, marks[sId]));
    }

    const relevantStudents = students.filter(
      (s) => group === 'all' || s.group === group || (group === 'Group A' && (!s.group || s.group === 'A'))
    );

    const year = parseInt(month.split('-')[0], 10) || 2026;
    const sessionCount = sessions.length;

    if (sessionCount > 0) {
      const attendanceToRecord = relevantStudents.map((stu) => {
        let presentCount = 0;
        sessions.forEach((ses) => {
          const m = marks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P');
          if (m === 'P') presentCount += 1;
        });

        const pct = Math.round((presentCount / sessionCount) * 100);
        return {
          id: `${stu.id}_${month}`,
          studentId: stu.id,
          utNumber: stu.utNumber,
          studentName: stu.fullName,
          courseName: stu.courseName,
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
    if (checkIsSupabaseConfigured()) {
      const pay = blossomPayments.find((p) => p.id === paymentId);
      if (pay) syncPayment({ ...pay, status, paymentDate: status === 'Paid' ? new Date().toISOString().slice(0, 10) : pay.paymentDate, referenceNo: referenceNo || pay.referenceNo, notes: notes || pay.notes });
    }
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
    if (checkIsSupabaseConfigured()) {
      syncDropout(newDropout);
      syncStudent({ ...student, currentStatus: 'Dropout' });
    }
  };

  const addAssessment = (assessmentData: Omit<Assessment, 'id' | 'createdAt'>) => {
    const newAssessment: Assessment = {
      ...assessmentData,
      id: `ASM-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setAssessments((prev) => [...prev, newAssessment]);
    addAuditLog('Assessment Created', 'Assessment', newAssessment.title, `Created custom assessment: ${newAssessment.title} (Max: ${newAssessment.maxMarks})`);
    if (checkIsSupabaseConfigured()) syncAssessment(newAssessment);
  };

  const deleteAssessment = (id: string) => {
    setAssessments((prev) => prev.filter((a) => a.id !== id));
    setAssessmentMarks((prev) => prev.filter((m) => m.assessmentId !== id));
    if (checkIsSupabaseConfigured()) syncDeleteAssessment(id);
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
    if (checkIsSupabaseConfigured()) {
      const nowStr = new Date().toISOString().slice(0, 10);
      syncAssessmentMarks(marks.map((m) => ({
        id: `MRK-${assessmentId}-${m.studentId}`,
        assessmentId,
        studentId: m.studentId,
        marksObtained: m.marksObtained,
        feedback: m.feedback,
        gradedAt: nowStr,
      })));
    }
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
    if (checkIsSupabaseConfigured()) {
      syncCompletion(newCompletion);
      const st = students.find((s) => s.id === completionData.studentId);
      if (st) syncStudent({ ...st, currentStatus: 'Completed' });
    }
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
    if (checkIsSupabaseConfigured()) syncOutcome(newOutcome);
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
    if (checkIsSupabaseConfigured()) syncCourse(newCourse);
  };

  const updateCourse = (id: string, updated: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    if (checkIsSupabaseConfigured()) {
      const crs = courses.find((c) => c.id === id);
      if (crs) syncCourse({ ...crs, ...updated });
    }
  };

  const addBatch = (batchData: Omit<Batch, 'id'>) => {
    const newBatch: Batch = {
      ...batchData,
      id: `BAT-${String(batches.length + 1).padStart(2, '0')}`,
    };
    setBatches((prev) => [...prev, newBatch]);
    if (checkIsSupabaseConfigured()) syncBatch(newBatch);
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    addAuditLog('Settings Updated', 'System Settings', 'Config', 'Updated system thresholds and settings');
    if (checkIsSupabaseConfigured()) syncSettings(updated);
  };

  const updateOrgProfile = (profile: Partial<OrgProfile>) => {
    setOrgProfile((prev) => ({ ...prev, ...profile }));
  };

  const resetToDefaults = () => {
    // 1. Reset React state + localStorage immediately (optimistic)
    setStudents(initialStudents);
    setCourses(initialCourses);
    setBatches(initialBatches);
    setAttendanceSessions(initialAttendanceSessions);
    setAttendanceMarks(initialDailyAttendanceMarks);
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

    // 2. Sync seed data to Supabase in the background
    if (checkIsSupabaseConfigured()) {
      resetSeedDataInSupabase({
        students: initialStudents,
        courses: initialCourses,
        batches: initialBatches,
        attendanceSessions: initialAttendanceSessions,
        attendanceMarks: initialDailyAttendanceMarks,
        monthlyAttendance: initialMonthlyAttendance,
        blossomPayments: initialBlossomPayments,
        dropouts: initialDropouts,
        assessments: initialAssessments,
        assessmentMarks: initialAssessmentMarks,
        completions: initialCompletions,
        outcomes: initialStudentOutcomes,
        auditLogs: initialAuditLogs,
        settings: initialSystemSettings,
      }).catch(e => console.warn('[store] resetSeedDataInSupabase failed:', e));
    }
  };

  const bulkImportAllAttendance = (
    sessions: AttendanceSession[],
    marks: Record<string, Record<string, AttendanceMark>>,
    monthly: MonthlyAttendance[],
    newStudents?: Student[]
  ) => {
    // Step 1: Build a UT→realID map by merging new students into existing ones
    // We need the final student list first so we can remap marks correctly.
    const utToIdMap = new Map<string, string>();

    // Start with existing students
    const existingMap = new Map<string, Student>();
    students.forEach((s) => {
      existingMap.set(s.utNumber.toUpperCase(), s);
      utToIdMap.set(s.utNumber.toUpperCase(), s.id);
    });

    // Merge in new students
    if (newStudents && newStudents.length > 0) {
      newStudents.forEach((s) => {
        const normUt = s.utNumber.toUpperCase();
        if (!existingMap.has(normUt)) {
          existingMap.set(normUt, s);
          utToIdMap.set(normUt, s.id);
        } else {
          const existing = existingMap.get(normUt)!;
          existingMap.set(normUt, {
            ...existing,
            group: s.group || existing.group,
            courseId: s.courseId || existing.courseId,
            courseName: s.courseName || existing.courseName,
          });
          utToIdMap.set(normUt, existing.id);
        }
      });
    }

    // Commit merged students
    const mergedStudents = Array.from(existingMap.values());
    setStudents(mergedStudents);
    if (checkIsSupabaseConfigured()) {
      mergedStudents.forEach(s => syncStudent(s));
    }

    // Step 2: Remap marks from parser IDs to real student IDs
    // Parser keys marks by "STU-{UT}" and also "{UT}" — we need to re-key by the real stu.id
    const remappedMarks: Record<string, Record<string, AttendanceMark>> = {};
    Object.keys(marks).forEach((sessionId) => {
      remappedMarks[sessionId] = {};
      const sessionMarks = marks[sessionId];
      // Deduplicate: parser stores both STU-UT011000 and UT011000 — use utNumber keys
      const processed = new Set<string>();
      Object.keys(sessionMarks).forEach((key) => {
        // Normalize: extract UT number from key
        let utNum = key.toUpperCase();
        if (utNum.startsWith('STU-')) utNum = utNum.substring(4);
        
        if (processed.has(utNum)) return;
        processed.add(utNum);

        const realId = utToIdMap.get(utNum);
        if (realId) {
          remappedMarks[sessionId][realId] = sessionMarks[key];
        }
      });
    });

    // Step 3: Remap monthly records to use real student IDs
    const remappedMonthly = monthly.map((m) => {
      const utNum = (m.utNumber || '').toUpperCase();
      const realId = utToIdMap.get(utNum);
      if (realId && realId !== m.studentId) {
        return { ...m, studentId: realId };
      }
      return m;
    });

    // Step 4: Apply to state with smart merging
    const importedGroups = new Set(sessions.map((s) => s.group));
    setAttendanceSessions((prev) => {
      const retained = prev.filter((s) => !importedGroups.has(s.group));
      return [...retained, ...sessions];
    });

    setAttendanceMarks((prev) => ({
      ...prev,
      ...remappedMarks,
    }));

    setMonthlyAttendance((prev) => {
      const importedKeys = new Set(remappedMonthly.map((m) => `${m.studentId}_${m.month}`));
      const retained = prev.filter((m) => !importedKeys.has(`${m.studentId}_${m.month}`));
      return [...retained, ...remappedMonthly];
    });

    // Step 5: Sync to Supabase
    if (checkIsSupabaseConfigured()) {
      if (sessions.length > 0) syncAttendanceSessions(sessions);
      Object.keys(remappedMarks).forEach((sId) => syncAttendanceMarksForSession(sId, remappedMarks[sId]));
      if (remappedMonthly.length > 0) syncMonthlyAttendance(remappedMonthly);
    }
    addAuditLog('Bulk Attendance Import', 'Attendance', 'All', `Imported ${sessions.length} sessions, ${remappedMonthly.length} monthly records, and ${newStudents?.length || 0} students`);
  };

  const importGoogleSheetAttendance = (
    month: string,
    newSessions: AttendanceSession[],
    newMarks: Record<string, Record<string, AttendanceMark>>
  ) => {
    setAttendanceSessions(prev => {
      // Remove old sessions for this month to prevent duplicates if uploading again
      const filtered = prev.filter(s => !s.date.startsWith(month));
      return [...filtered, ...newSessions];
    });

    setAttendanceMarks(prev => {
      const updated = { ...prev };
      // Note: We don't necessarily clear old marks because they are tied to session IDs,
      // and we just replaced the session IDs. We just merge the new ones.
      Object.keys(newMarks).forEach(sessionId => {
        updated[sessionId] = { ...(updated[sessionId] || {}), ...newMarks[sessionId] };
      });
      return updated;
    });

    // After setting, we need to recalculate monthly totals for this month.
    // We will do that by simulating a saveAttendanceMatrix call or just rebuilding it.
    // However, since state updates are async, the best way is to let the effect in Attendance Matrix handle it,
    // or just calculate it right here using the new data!
    
    // We can do it right here:
    let newMonthlyRecords: MonthlyAttendance[] = [];
    setMonthlyAttendance(prev => {
      const year = parseInt(month.split('-')[0], 10) || 2026;
      const filteredMonthly = prev.filter(m => m.month !== month);
      
      const newMonthly = students.map(stu => {
        let pCount = 0;
        newSessions.forEach(ses => {
          const m = newMarks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P');
          if (m === 'P') pCount += 1;
        });
        
        const sessionCount = newSessions.length;
        const pct = sessionCount > 0 ? Math.round((pCount / sessionCount) * 100) : 100;
        
        let attStatus: 'Good Attendance' | 'Low Attendance' | 'Critical Attendance' = 'Good Attendance';
        if (pct < 75) attStatus = 'Critical Attendance';
        else if (pct < 85) attStatus = 'Low Attendance';
        
        return {
          id: `${stu.id}_${month}`,
          studentId: stu.id,
          utNumber: stu.utNumber,
          studentName: stu.fullName || '',
          batchId: stu.batchId || 'B01',
          courseName: stu.courseName || '',
          courseId: stu.courseId || '',
          group: stu.group || '',
          month: month,
          year: year,
          totalHeld: sessionCount,
          totalPresent: pCount,
          attendancePercentage: pct,
          status: attStatus,
          recordedBy: 'Admin',
          updatedAt: new Date().toISOString()
        };
      });
      
      newMonthlyRecords = newMonthly;
      return [...filteredMonthly, ...newMonthly];
    });

    if (checkIsSupabaseConfigured()) {
      if (newSessions.length > 0) syncAttendanceSessions(newSessions);
      Object.keys(newMarks).forEach((sessionId) => syncAttendanceMarksForSession(sessionId, newMarks[sessionId]));
      if (newMonthlyRecords.length > 0) syncMonthlyAttendance(newMonthlyRecords);
    }

    addAuditLog('Google Sheets Import', 'Attendance', month, `Imported ${newSessions.length} sessions`);
  };

  const submitAbsenceRequest = (req: Omit<AbsenceRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: AbsenceRequest = {
      ...req,
      id: `ABS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };
    const updated = [newReq, ...absenceRequests];
    setAbsenceRequests(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.ABSENCES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Local storage write error:', e);
    }
    syncAbsenceRequests(updated);
    addAuditLog('Absence Request', 'Attendance', req.utNumber, `Absence submitted: ${req.fromDate} to ${req.toDate} (${req.reason.substring(0, 30)})`);
  };

  const updateAbsenceRequestStatus = (id: string, status: 'Submitted' | 'Approved' | 'Rejected') => {
    const updated = absenceRequests.map(r => r.id === id ? { ...r, status } : r);
    setAbsenceRequests(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.ABSENCES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Local storage write error:', e);
    }
    syncAbsenceRequests(updated);
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
        absenceRequests,
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
        bulkImportAllAttendance,
        importGoogleSheetAttendance,
        processFingerprintCSV,
        submitAbsenceRequest,
        updateAbsenceRequestStatus,
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
