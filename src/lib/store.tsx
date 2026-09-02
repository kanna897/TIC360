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
} from './mockData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

interface StoreContextType {
  // State
  students: Student[];
  courses: Course[];
  batches: Batch[];
  monthlyAttendance: MonthlyAttendance[];
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
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

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
  STUDENTS: 'tic360_students',
  COURSES: 'tic360_courses',
  BATCHES: 'tic360_batches',
  ATTENDANCE: 'tic360_attendance',
  PAYMENTS: 'tic360_payments',
  DROPOUTS: 'tic360_dropouts',
  ASSESSMENTS: 'tic360_assessments',
  ASSESSMENT_MARKS: 'tic360_marks',
  COMPLETIONS: 'tic360_completions',
  OUTCOMES: 'tic360_outcomes',
  AUDIT_LOGS: 'tic360_audit_logs',
  SETTINGS: 'tic360_settings',
  ORG_PROFILE: 'tic360_org_profile',
  ROLE: 'tic360_current_role',
  THEME: 'tic360_theme',
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendance[]>(
    initialMonthlyAttendance
  );
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

      const sLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (sLogs) setAuditLogs(JSON.parse(sLogs));

      const sProfile = localStorage.getItem(STORAGE_KEYS.ORG_PROFILE);
      if (sProfile) setOrgProfile(JSON.parse(sProfile));

      const sSet = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (sSet) setSettings(JSON.parse(sSet));

      const sRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
      if (sRole) setCurrentRole(sRole);

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
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [
    students,
    courses,
    batches,
    monthlyAttendance,
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
    theme,
    isLoaded,
  ]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addAuditLog = (action: string, entity: string, recordId?: string, details?: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      userName: `${currentRole} User`,
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
  const addStudent = (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
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

      // 1. Upsert attendance record for this month
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

      // 2. Business Rule: Calculate Blossom Monthly Payment for Blossom Students
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
          // CRITICAL BUSINESS RULE: <80% attendance => LKR 0 for that month
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

    // Merge payments
    setBlossomPayments((prev) => {
      const map = new Map<string, BlossomMonthlyPayment>();
      prev.forEach((p) => map.set(`${p.studentId}_${p.month}`, p));
      newPaymentsToUpsert.forEach((p) => map.set(`${p.studentId}_${p.month}`, p));
      return Array.from(map.values());
    });

    addAuditLog('Attendance Recorded', 'Attendance', records[0]?.month, `Saved attendance for ${records.length} students`);
  };

  const recalculateMonthlyPayments = (month: string) => {
    // Manually trigger recalculation for all Blossom students for a given month
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

  // 3. DROPOUT MANAGEMENT
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

    // Update student status
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, currentStatus: 'Dropout' } : s))
    );

    // Add to dropouts list
    setDropouts((prev) => [newDropout, ...prev]);

    // CRITICAL BUSINESS RULE: Future payments after dropoutMonth are cancelled/stopped
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

  // 4. ASSESSMENTS
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

  // 5. COURSE COMPLETION & OUTCOMES
  const recordCompletion = (completionData: Omit<CourseCompletion, 'id'>) => {
    const newCompletion: CourseCompletion = {
      ...completionData,
      id: `CMP-${Date.now()}`,
    };
    setCompletions((prev) => [newCompletion, ...prev.filter((c) => c.studentId !== completionData.studentId)]);

    // Update student status to Completed
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

  // 6. SETTINGS & CONFIGURATION
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
        theme,
        toggleTheme,
        addStudent,
        updateStudent,
        deleteStudent,
        recordAttendance,
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
