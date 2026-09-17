import { supabase } from './supabaseClient';
import {
  Student, Course, Batch, MonthlyAttendance, BlossomMonthlyPayment, DropoutRecord,
  Assessment, AssessmentMark, CourseCompletion, StudentOutcome, AuditLog,
  SystemSettings, AttendanceSession, AttendanceMark
} from './types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};

/** Fire-and-forget: logs errors but never throws. */
const safeUpsert = async (table: string, rows: object[]) => {
  if (!rows.length) return;
  try {
    const chunks = chunkArray(rows, 500);
    for (const chunk of chunks) {
      const { error } = await supabase.from(table).upsert(chunk as never);
      if (error) console.warn(`[supabaseSync] upsert ${table}:`, error.message);
    }
  } catch (e) {
    console.warn(`[supabaseSync] safeUpsert ${table}:`, e);
  }
};

const safeDelete = async (table: string, id: string) => {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.warn(`[supabaseSync] delete ${table}:`, error.message);
  } catch (e) {
    console.warn(`[supabaseSync] safeDelete ${table}:`, e);
  }
};

// ─── DB-row mappers (camelCase → snake_case) ───────────────────────────────

const toDbStudent = (s: Student) => ({
  id: s.id,
  ut_number: s.utNumber,
  full_name: s.fullName,
  nic: s.nic || 'N/A',
  dob: s.dob || '2000-01-01',
  gender: s.gender || 'Other',
  phone: s.phone || 'N/A',
  whatsapp: s.whatsapp || null,
  email: s.email || 'N/A',
  address: s.address || 'N/A',
  district: s.district || 'N/A',
  emergency_contact_name: s.emergencyContact?.name || null,
  emergency_contact_phone: s.emergencyContact?.phone || null,
  emergency_contact_relationship: s.emergencyContact?.relationship || null,
  photo_url: s.photoUrl || null,
  is_blossom_trust: s.isBlossomTrust ?? false,
  current_status: s.currentStatus || 'Active',
  batch_id: s.batchId || null,
  course_id: s.courseId || null,
});

const toDbCourse = (c: Course) => ({
  id: c.id,
  code: c.code,
  name: c.name,
  description: c.description || null,
  duration_months: c.durationMonths || 6,
  is_active: c.isActive ?? true,
});

const toDbBatch = (b: Batch) => ({
  id: b.id,
  name: b.name,
  course_id: b.courseId || null,
  start_date: b.startDate,
  end_date: b.endDate || null,
  status: b.status || 'Active',
});

const toDbAttendanceSession = (s: AttendanceSession) => ({
  id: s.id,
  batch_id: s.batchId || null,
  group: s.group || null,
  month: s.month,
  date: s.date,
  display_date: s.displayDate || null,
  subject: s.subject || null,
});

const toDbMonthlyAttendance = (m: MonthlyAttendance) => ({
  id: m.id,
  student_id: m.studentId,
  batch_id: m.batchId || null,
  year: m.year,
  month: m.month,
  attendance_percentage: m.attendancePercentage,
  status: m.status,
  recorded_by: m.recordedBy || null,
});

const toDbPayment = (p: BlossomMonthlyPayment) => ({
  id: p.id,
  student_id: p.studentId,
  year: p.year,
  month: p.month,
  attendance_percentage: p.attendancePercentage ?? 0,
  is_eligible: p.isEligible ?? false,
  ineligibility_reason: p.ineligibilityReason || null,
  amount: p.amount ?? 0,
  status: p.status || 'Pending',
  payment_date: p.paymentDate || null,
  reference_no: p.referenceNo || null,
  notes: p.notes || null,
});

const toDbDropout = (d: DropoutRecord) => ({
  id: d.id,
  student_id: d.studentId,
  dropout_month: d.dropoutMonth,
  reason: d.reason,
  rejoin_possibility: d.rejoinPossibility || 'Unknown',
  remarks: d.remarks || null,
});

const toDbAssessment = (a: Assessment) => ({
  id: a.id,
  course_id: a.courseId || null,
  batch_id: a.batchId || null,
  title: a.title,
  category: a.category || 'Assignment',
  max_marks: a.maxMarks ?? 100,
});

const toDbAssessmentMark = (m: AssessmentMark) => ({
  id: m.id,
  assessment_id: m.assessmentId,
  student_id: m.studentId,
  marks_obtained: m.marksObtained,
  feedback: m.feedback || null,
});

const toDbCompletion = (c: CourseCompletion) => ({
  id: c.id,
  student_id: c.studentId,
  course_id: c.courseId || null,
  batch_id: c.batchId || null,
  completion_date: c.completionDate,
  final_result: c.finalResult || 'Passed',
  final_project_name: c.finalProjectName || null,
  github_link: c.githubLink || null,
  overall_grade: c.overallGrade || null,
  certificate_issued: c.certificateIssued ?? false,
});

const toDbOutcome = (o: StudentOutcome) => ({
  id: o.id,
  student_id: o.studentId,
  outcome_status: o.outcomeStatus,
  outcome_date: o.outcomeDate,
  company_or_institution: o.companyOrInstitution || null,
  job_title: o.jobTitle || null,
  remarks: o.remarks || null,
});

const toDbAuditLog = (l: AuditLog) => ({
  id: l.id,
  user_name: l.userName,
  user_role: l.userRole,
  action: l.action,
  entity: l.entity,
  record_id: l.recordId || null,
  details: l.details ? { text: l.details } : null,
  timestamp: l.timestamp,
});

// ─── App-row mappers (snake_case → camelCase) ──────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
const fromDbStudent = (s: any): Student => ({
  id: s.id,
  utNumber: s.ut_number,
  fullName: s.full_name,
  nic: s.nic,
  dob: s.dob,
  gender: s.gender,
  phone: s.phone,
  whatsapp: s.whatsapp || undefined,
  email: s.email,
  address: s.address,
  district: s.district,
  emergencyContact: {
    name: s.emergency_contact_name || '',
    phone: s.emergency_contact_phone || '',
    relationship: s.emergency_contact_relationship || '',
  },
  batchId: s.batch_id || '',
  batchName: '',
  courseId: s.course_id || '',
  courseName: '',
  photoUrl: s.photo_url || undefined,
  isBlossomTrust: s.is_blossom_trust ?? false,
  currentStatus: s.current_status || 'Active',
  createdAt: s.created_at || '',
  updatedAt: s.updated_at || '',
});

const fromDbCourse = (c: any): Course => ({
  id: c.id,
  code: c.code,
  name: c.name,
  description: c.description || '',
  durationMonths: c.duration_months ?? 6,
  isActive: c.is_active ?? true,
});

const fromDbBatch = (b: any): Batch => ({
  id: b.id,
  name: b.name,
  courseId: b.course_id || '',
  courseName: '',
  startDate: b.start_date,
  endDate: b.end_date || undefined,
  status: b.status || 'Active',
});

const fromDbAttendanceSession = (s: any): AttendanceSession => ({
  id: s.id,
  batchId: s.batch_id || undefined,
  group: s.group || '',
  month: s.month,
  date: s.date,
  displayDate: s.display_date || s.date,
  subject: s.subject || '',
});

const fromDbMonthlyAttendance = (a: any): MonthlyAttendance => ({
  id: a.id,
  studentId: a.student_id,
  utNumber: '',
  studentName: '',
  batchId: a.batch_id || '',
  courseName: '',
  year: a.year,
  month: a.month,
  attendancePercentage: a.attendance_percentage,
  status: a.status,
  recordedBy: a.recorded_by || '',
  updatedAt: a.updated_at || '',
});

const fromDbPayment = (p: any): BlossomMonthlyPayment => ({
  id: p.id,
  studentId: p.student_id,
  utNumber: '',
  studentName: '',
  year: p.year,
  month: p.month,
  attendancePercentage: p.attendance_percentage ?? 0,
  isEligible: p.is_eligible ?? false,
  ineligibilityReason: p.ineligibility_reason || undefined,
  amount: p.amount ?? 0,
  status: p.status || 'Pending',
  paymentDate: p.payment_date || undefined,
  referenceNo: p.reference_no || undefined,
  notes: p.notes || undefined,
});

const fromDbDropout = (d: any): DropoutRecord => ({
  id: d.id,
  studentId: d.student_id,
  utNumber: '',
  studentName: '',
  batchId: '',
  courseId: '',
  courseName: '',
  dropoutMonth: d.dropout_month,
  reason: d.reason,
  rejoinPossibility: d.rejoin_possibility || 'Unknown',
  remarks: d.remarks || undefined,
  recordedAt: d.recorded_at || '',
});

const fromDbAssessment = (a: any): Assessment => ({
  id: a.id,
  courseId: a.course_id || '',
  batchId: a.batch_id || '',
  title: a.title,
  category: a.category || 'Assignment',
  maxMarks: a.max_marks ?? 100,
  createdAt: a.created_at || '',
});

const fromDbAssessmentMark = (m: any): AssessmentMark => ({
  id: m.id,
  assessmentId: m.assessment_id,
  studentId: m.student_id,
  marksObtained: m.marks_obtained,
  feedback: m.feedback || undefined,
  gradedAt: m.graded_at || '',
});

const fromDbCompletion = (c: any): CourseCompletion => ({
  id: c.id,
  studentId: c.student_id,
  utNumber: '',
  studentName: '',
  courseId: c.course_id || '',
  courseName: '',
  batchId: c.batch_id || '',
  completionDate: c.completion_date,
  finalResult: c.final_result || 'Passed',
  finalProjectName: c.final_project_name || '',
  githubLink: c.github_link || undefined,
  overallGrade: c.overall_grade || 'C',
  certificateIssued: c.certificate_issued ?? false,
});

const fromDbOutcome = (o: any): StudentOutcome => ({
  id: o.id,
  studentId: o.student_id,
  utNumber: '',
  studentName: '',
  isBlossomTrust: false,
  outcomeStatus: o.outcome_status,
  outcomeDate: o.outcome_date,
  companyOrInstitution: o.company_or_institution || undefined,
  jobTitle: o.job_title || undefined,
  remarks: o.remarks || undefined,
  updatedAt: o.updated_at || '',
});

const fromDbAuditLog = (l: any): AuditLog => ({
  id: l.id,
  userName: l.user_name,
  userRole: l.user_role,
  action: l.action,
  entity: l.entity,
  recordId: l.record_id || undefined,
  details: l.details?.text || undefined,
  timestamp: l.timestamp,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Fetch All ──────────────────────────────────────────────────────────────

export const fetchAllFromSupabase = async () => {
  console.log('[supabaseSync] Fetching initial state from Supabase...');

  const [
    { data: studentsRaw, error: eStudents },
    { data: coursesRaw, error: eCourses },
    { data: batchesRaw, error: eBatches },
    { data: monthlyAttRaw },
    { data: blossomPayRaw },
    { data: dropoutsRaw },
    { data: assessmentsRaw },
    { data: assessmentMarksRaw },
    { data: completionsRaw },
    { data: outcomesRaw },
    { data: auditLogsRaw },
    { data: settingsData },
    { data: attSessionsRaw },
    { data: attMarksRaw },
    { data: bankDetailsRaw },
  ] = await Promise.all([
    supabase.from('students').select('*').order('created_at', { ascending: false }),
    supabase.from('courses').select('*'),
    supabase.from('batches').select('*'),
    supabase.from('attendance').select('*'),
    supabase.from('blossom_payments').select('*'),
    supabase.from('dropouts').select('*'),
    supabase.from('assessments').select('*'),
    supabase.from('assessment_marks').select('*'),
    supabase.from('course_completions').select('*'),
    supabase.from('student_outcomes').select('*'),
    supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200),
    supabase.from('system_settings').select('*'),
    supabase.from('attendance_sessions').select('*').order('date', { ascending: true }),
    supabase.from('attendance_marks').select('*'),
    supabase.from('student_bank_details').select('*'),
  ]);

  if (eStudents) console.warn('[supabaseSync] fetch students:', eStudents.message);
  if (eCourses) console.warn('[supabaseSync] fetch courses:', eCourses.message);
  if (eBatches) console.warn('[supabaseSync] fetch batches:', eBatches.message);

  const courses = (coursesRaw || []).map(fromDbCourse);
  const batches = (batchesRaw || []).map(b => {
    const batch = fromDbBatch(b);
    batch.courseName = courses.find(c => c.id === batch.courseId)?.name || '';
    return batch;
  });

  const bankMap = new Map((bankDetailsRaw || []).map((b: any) => [b.student_id, b]));
  const paymentMap = new Map((blossomPayRaw || []).map((p: any) => [p.student_id, p]));

  // Enrich students with batch/course names, bank details, and blossomAmount
  const students = (studentsRaw || []).map(s => {
    const student = fromDbStudent(s);
    student.batchName = batches.find(b => b.id === student.batchId)?.name || '';
    student.courseName = courses.find(c => c.id === student.courseId)?.name || '';

    const bank = bankMap.get(student.id);
    if (bank) {
      student.bankDetails = {
        bankName: bank.bank_name,
        branchName: bank.branch_name,
        branchCode: bank.branch_code || '1',
        accountNumber: bank.account_number,
        beneficiaryName: bank.beneficiary_name || student.fullName,
        district: bank.district || student.district,
      };
    }

    const pay = paymentMap.get(student.id);
    if (pay && pay.amount !== undefined && pay.amount !== null) {
      student.blossomAmount = Number(pay.amount);
    }

    return student;
  });

  // Rebuild marks dictionary { [sessionId]: { [studentId]: mark } }
  const attendanceMarks: Record<string, Record<string, AttendanceMark>> =
    (attMarksRaw || []).reduce((acc: Record<string, Record<string, AttendanceMark>>, m: { session_id: string; student_id: string; mark: AttendanceMark }) => {
      if (!acc[m.session_id]) acc[m.session_id] = {};
      acc[m.session_id][m.student_id] = m.mark;
      return acc;
    }, {});

  const studentMap = new Map(students.map(s => [s.id, s]));

  const dropouts = (dropoutsRaw || []).map(d => {
    const rec = fromDbDropout(d);
    const stu = studentMap.get(rec.studentId);
    if (stu) {
      rec.utNumber = stu.utNumber;
      rec.studentName = stu.fullName;
      rec.batchId = stu.batchId;
      rec.courseId = stu.courseId;
      rec.courseName = stu.courseName;
    }
    return rec;
  });

  const completions = (completionsRaw || []).map(c => {
    const rec = fromDbCompletion(c);
    const stu = studentMap.get(rec.studentId);
    if (stu) {
      rec.utNumber = stu.utNumber;
      rec.studentName = stu.fullName;
      rec.courseName = courses.find(cc => cc.id === rec.courseId)?.name || stu.courseName;
    }
    return rec;
  });

  const outcomes = (outcomesRaw || []).map(o => {
    const rec = fromDbOutcome(o);
    const stu = studentMap.get(rec.studentId);
    if (stu) {
      rec.utNumber = stu.utNumber;
      rec.studentName = stu.fullName;
      rec.isBlossomTrust = stu.isBlossomTrust;
    }
    return rec;
  });

  const monthlyAttendance = (monthlyAttRaw || []).map(a => {
    const rec = fromDbMonthlyAttendance(a);
    const stu = studentMap.get(rec.studentId);
    if (stu) {
      rec.utNumber = stu.utNumber;
      rec.studentName = stu.fullName;
      rec.courseName = stu.courseName;
    }
    return rec;
  });

  const blossomPayments = (blossomPayRaw || []).map(p => {
    const rec = fromDbPayment(p);
    const stu = studentMap.get(rec.studentId);
    if (stu) {
      rec.utNumber = stu.utNumber;
      rec.studentName = stu.fullName;
    }
    return rec;
  });

  return {
    students,
    courses,
    batches,
    monthlyAttendance,
    attendanceSessions: (attSessionsRaw || []).map(fromDbAttendanceSession),
    attendanceMarks,
    blossomPayments,
    dropouts,
    assessments: (assessmentsRaw || []).map(fromDbAssessment),
    assessmentMarks: (assessmentMarksRaw || []).map(fromDbAssessmentMark),
    completions,
    outcomes,
    auditLogs: (auditLogsRaw || []).map(fromDbAuditLog),
    settings: (settingsData?.[0]?.value as SystemSettings) || null,
  };
};

// ─── Full bulk sync (debounced background sync) ─────────────────────────────

export const syncAllToSupabase = async (state: {
  students: Student[];
  courses: Course[];
  batches: Batch[];
  attendanceSessions: AttendanceSession[];
  attendanceMarks: Record<string, Record<string, AttendanceMark>>;
  monthlyAttendance: MonthlyAttendance[];
  blossomPayments: BlossomMonthlyPayment[];
  dropouts: DropoutRecord[];
  assessments: Assessment[];
  assessmentMarks: AssessmentMark[];
  completions: CourseCompletion[];
  outcomes: StudentOutcome[];
  auditLogs: AuditLog[];
  settings: SystemSettings | null;
}) => {
  console.log('[supabaseSync] Background full sync...');

  // Courses & batches first (FK dependencies)
  await Promise.all([
    safeUpsert('courses', state.courses.map(toDbCourse)),
    safeUpsert('batches', state.batches.map(toDbBatch)),
  ]);

  await safeUpsert('students', state.students.map(toDbStudent));

  await safeUpsert('attendance_sessions', state.attendanceSessions.map(toDbAttendanceSession));

  const marksArray: object[] = [];
  Object.keys(state.attendanceMarks).forEach(sessionId => {
    Object.keys(state.attendanceMarks[sessionId]).forEach(studentId => {
      marksArray.push({
        id: `MARK-${sessionId}-${studentId}`,
        session_id: sessionId,
        student_id: studentId,
        mark: state.attendanceMarks[sessionId][studentId],
      });
    });
  });
  await safeUpsert('attendance_marks', marksArray);

  await Promise.all([
    safeUpsert('attendance', state.monthlyAttendance.map(toDbMonthlyAttendance)),
    safeUpsert('blossom_payments', state.blossomPayments.map(toDbPayment)),
    safeUpsert('dropouts', state.dropouts.map(toDbDropout)),
    safeUpsert('assessments', state.assessments.map(toDbAssessment)),
    safeUpsert('assessment_marks', state.assessmentMarks.map(toDbAssessmentMark)),
    safeUpsert('course_completions', state.completions.map(toDbCompletion)),
    safeUpsert('student_outcomes', state.outcomes.map(toDbOutcome)),
    safeUpsert('audit_logs', state.auditLogs.slice(0, 100).map(toDbAuditLog)),
    state.settings
      ? supabase.from('system_settings').upsert({ key: 'default', value: state.settings }).then(() => {})
      : Promise.resolve(),
  ]);

  console.log('[supabaseSync] Full sync complete.');
};

// ─── Granular write-through helpers (fire-and-forget per action) ─────────────

export const syncStudent = async (student: Student) => {
  await safeUpsert('students', [toDbStudent(student)]);
  if (student.bankDetails) {
    await safeUpsert('student_bank_details', [{
      student_id: student.id,
      bank_name: student.bankDetails.bankName,
      branch_name: student.bankDetails.branchName,
      branch_code: student.bankDetails.branchCode || '1',
      account_number: student.bankDetails.accountNumber,
      beneficiary_name: student.bankDetails.beneficiaryName || student.fullName,
      district: student.bankDetails.district || student.district,
      updated_at: new Date().toISOString(),
    }]);
  }
};

export const syncStudentBankDetails = (studentId: string, bankDetails: any, fullName?: string, district?: string) =>
  safeUpsert('student_bank_details', [{
    student_id: studentId,
    bank_name: bankDetails.bankName,
    branch_name: bankDetails.branchName,
    branch_code: bankDetails.branchCode || '1',
    account_number: bankDetails.accountNumber,
    beneficiary_name: bankDetails.beneficiaryName || fullName || 'Beneficiary',
    district: bankDetails.district || district || 'Jaffna',
    updated_at: new Date().toISOString(),
  }]);

export const syncDeleteStudent = (id: string) => safeDelete('students', id);

export const syncAttendanceSessions = (sessions: AttendanceSession[]) =>
  safeUpsert('attendance_sessions', sessions.map(toDbAttendanceSession));

export const syncDeleteAttendanceSession = (id: string) =>
  safeDelete('attendance_sessions', id);

export const syncAttendanceMark = (sessionId: string, studentId: string, mark: AttendanceMark) =>
  safeUpsert('attendance_marks', [{
    id: `MARK-${sessionId}-${studentId}`,
    session_id: sessionId,
    student_id: studentId,
    mark,
  }]);

export const syncAttendanceMarksForSession = (sessionId: string, marks: Record<string, AttendanceMark>) => {
  const rows = Object.entries(marks).map(([studentId, mark]) => ({
    id: `MARK-${sessionId}-${studentId}`,
    session_id: sessionId,
    student_id: studentId,
    mark,
  }));
  return safeUpsert('attendance_marks', rows);
};

export const syncMonthlyAttendance = (records: MonthlyAttendance[]) =>
  safeUpsert('attendance', records.map(toDbMonthlyAttendance));

export const syncPayment = (payment: BlossomMonthlyPayment) =>
  safeUpsert('blossom_payments', [toDbPayment(payment)]);

export const syncPayments = (payments: BlossomMonthlyPayment[]) =>
  safeUpsert('blossom_payments', payments.map(toDbPayment));

export const syncDropout = (dropout: DropoutRecord) =>
  safeUpsert('dropouts', [toDbDropout(dropout)]);

export const syncAssessment = (assessment: Assessment) =>
  safeUpsert('assessments', [toDbAssessment(assessment)]);

export const syncDeleteAssessment = (id: string) => safeDelete('assessments', id);

export const syncAssessmentMarks = (marks: AssessmentMark[]) =>
  safeUpsert('assessment_marks', marks.map(toDbAssessmentMark));

export const syncCompletion = (completion: CourseCompletion) =>
  safeUpsert('course_completions', [toDbCompletion(completion)]);

export const syncOutcome = (outcome: StudentOutcome) =>
  safeUpsert('student_outcomes', [toDbOutcome(outcome)]);

export const syncCourse = (course: Course) =>
  safeUpsert('courses', [toDbCourse(course)]);

export const syncBatch = (batch: Batch) =>
  safeUpsert('batches', [toDbBatch(batch)]);

export const syncSettings = (settings: SystemSettings) =>
  supabase.from('system_settings').upsert({ key: 'default', value: settings }).then(() => {});

export const syncAuditLog = (log: AuditLog) =>
  safeUpsert('audit_logs', [toDbAuditLog(log)]);

// ─── Seed Reset: wipe TIC360 tables then write seed data ─────────────────────

/** Safely truncates a table by deleting all rows (uses neq trick for RLS). */
const safeTruncate = async (table: string) => {
  try {
    // Delete all rows: filter id != '' covers all rows including empty-string ids
    const { error } = await supabase.from(table).delete().neq('id', '___NONE___');
    if (error) console.warn(`[supabaseSync] truncate ${table}:`, error.message);
  } catch (e) {
    console.warn(`[supabaseSync] safeTruncate ${table}:`, e);
  }
};

export const resetSeedDataInSupabase = async (state: {
  students: Student[];
  courses: Course[];
  batches: Batch[];
  attendanceSessions: AttendanceSession[];
  attendanceMarks: Record<string, Record<string, AttendanceMark>>;
  monthlyAttendance: MonthlyAttendance[];
  blossomPayments: BlossomMonthlyPayment[];
  dropouts: DropoutRecord[];
  assessments: Assessment[];
  assessmentMarks: AssessmentMark[];
  completions: CourseCompletion[];
  outcomes: StudentOutcome[];
  auditLogs: AuditLog[];
  settings: SystemSettings | null;
}) => {
  console.log('[supabaseSync] Resetting Supabase to seed data...');

  // Step 1: Delete in reverse FK order (children first)
  await Promise.all([
    safeTruncate('audit_logs'),
    safeTruncate('student_outcomes'),
    safeTruncate('course_completions'),
    safeTruncate('assessment_marks'),
    safeTruncate('assessments'),
    safeTruncate('blossom_payments'),
    safeTruncate('dropouts'),
    safeTruncate('attendance_marks'),
    safeTruncate('attendance_sessions'),
    safeTruncate('attendance'),
  ]);
  await safeTruncate('students');
  await Promise.all([
    safeTruncate('batches'),
  ]);
  await safeTruncate('courses');

  // Step 2: Insert seed data in FK order (parents first)
  await Promise.all([
    safeUpsert('courses', state.courses.map(toDbCourse)),
  ]);
  await Promise.all([
    safeUpsert('batches', state.batches.map(toDbBatch)),
  ]);
  await safeUpsert('students', state.students.map(toDbStudent));

  await safeUpsert('attendance_sessions', state.attendanceSessions.map(toDbAttendanceSession));

  const marksArray: object[] = [];
  Object.keys(state.attendanceMarks).forEach(sessionId => {
    Object.keys(state.attendanceMarks[sessionId]).forEach(studentId => {
      marksArray.push({
        id: `MARK-${sessionId}-${studentId}`,
        session_id: sessionId,
        student_id: studentId,
        mark: state.attendanceMarks[sessionId][studentId],
      });
    });
  });
  if (marksArray.length) await safeUpsert('attendance_marks', marksArray);

  await Promise.all([
    safeUpsert('attendance', state.monthlyAttendance.map(toDbMonthlyAttendance)),
    safeUpsert('blossom_payments', state.blossomPayments.map(toDbPayment)),
    safeUpsert('dropouts', state.dropouts.map(toDbDropout)),
    safeUpsert('assessments', state.assessments.map(toDbAssessment)),
    safeUpsert('assessment_marks', state.assessmentMarks.map(toDbAssessmentMark)),
    safeUpsert('course_completions', state.completions.map(toDbCompletion)),
    safeUpsert('student_outcomes', state.outcomes.map(toDbOutcome)),
    safeUpsert('audit_logs', state.auditLogs.slice(0, 100).map(toDbAuditLog)),
    state.settings
      ? supabase.from('system_settings').upsert({ key: 'default', value: state.settings }).then(() => {})
      : Promise.resolve(),
  ]);

  console.log('[supabaseSync] Seed reset complete.');
};
