import { supabase, checkIsSupabaseConfigured } from './supabaseClient';
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
} from './types';

// Convert student camelCase to snake_case for Supabase
const mapStudentToDb = (s: Student) => ({
  id: s.id.startsWith('STU-') ? undefined : s.id, // Let UUID generate if STU- prefix
  ut_number: s.utNumber,
  full_name: s.fullName,
  nic: s.nic,
  dob: s.dob,
  gender: s.gender,
  phone: s.phone,
  whatsapp: s.whatsapp || null,
  email: s.email,
  address: s.address,
  district: s.district,
  emergency_contact_name: s.emergencyContact?.name || null,
  emergency_contact_phone: s.emergencyContact?.phone || null,
  emergency_contact_relationship: s.emergencyContact?.relationship || null,
  photo_url: s.photoUrl || null,
  is_blossom_trust: s.isBlossomTrust,
  current_status: s.currentStatus,
});

export const supabaseService = {
  // Push full local snapshot to Supabase
  async exportLocalDataToSupabase(data: {
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
  }): Promise<{ success: boolean; message: string; details?: Record<string, number> }> {
    if (!checkIsSupabaseConfigured()) {
      return { success: false, message: 'Supabase credentials are not configured yet.' };
    }

    const counts: Record<string, number> = {
      courses: 0,
      batches: 0,
      students: 0,
      attendance: 0,
      payments: 0,
      dropouts: 0,
      assessments: 0,
      marks: 0,
      completions: 0,
      outcomes: 0,
    };

    try {
      // 1. Courses
      for (const c of data.courses) {
        const { error } = await supabase.from('courses').upsert(
          {
            code: c.code,
            name: c.name,
            description: c.description,
            duration_months: c.durationMonths,
            is_active: c.isActive,
          },
          { onConflict: 'code' }
        );
        if (!error) counts.courses++;
      }

      // 2. Students
      for (const s of data.students) {
        const dbStudent = mapStudentToDb(s);
        const { data: insertedStudent, error } = await supabase
          .from('students')
          .upsert(dbStudent, { onConflict: 'ut_number' })
          .select('id')
          .single();

        if (!error && insertedStudent) {
          counts.students++;

          // Bank details for Blossom Trust
          if (s.bankDetails) {
            await supabase.from('student_bank_details').upsert(
              {
                student_id: insertedStudent.id,
                bank_name: s.bankDetails.bankName,
                branch_name: s.bankDetails.branchName,
                branch_code: s.bankDetails.branchCode || null,
                account_number: s.bankDetails.accountNumber,
                beneficiary_name: s.bankDetails.beneficiaryName,
                district: s.bankDetails.district,
              },
              { onConflict: 'student_id' }
            );
          }

          // Blossom application details
          if (s.blossomApplication) {
            await supabase.from('blossom_applications').upsert(
              {
                student_id: insertedStudent.id,
                parents_occupation: s.blossomApplication.parentsOccupation,
                family_income: s.blossomApplication.familyIncome,
                family_members_count: s.blossomApplication.familyMembersCount,
                siblings_count: s.blossomApplication.siblingsCount,
                financial_difficulties: s.blossomApplication.financialDifficulties,
                accommodation_expense: s.blossomApplication.accommodationExpense,
                food_expense: s.blossomApplication.foodExpense,
                verification_status: s.blossomApplication.verificationStatus,
              },
              { onConflict: 'student_id' }
            );
          }
        }
      }

      return {
        success: true,
        message: `Export successful! Seeded ${counts.students} students and ${counts.courses} courses to Supabase.`,
        details: counts,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Export failed';
      return { success: false, message };
    }
  },

  // Fetch data from Supabase
  async fetchStudentsFromSupabase(): Promise<{ data: Student[] | null; error: string | null }> {
    if (!checkIsSupabaseConfigured()) {
      return { data: null, error: 'Supabase is not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_bank_details (*),
          blossom_applications (*)
        `);

      if (error) throw error;

      const formatted: Student[] = (data || []).map((row: any) => ({
        id: row.id,
        utNumber: row.ut_number,
        fullName: row.full_name,
        nic: row.nic,
        dob: row.dob,
        gender: row.gender,
        phone: row.phone,
        whatsapp: row.whatsapp || undefined,
        email: row.email,
        address: row.address,
        district: row.district,
        emergencyContact: {
          name: row.emergency_contact_name || '',
          phone: row.emergency_contact_phone || '',
          relationship: row.emergency_contact_relationship || '',
        },
        batchId: row.batch_id || '',
        batchName: 'Batch 2026',
        courseId: row.course_id || '',
        courseName: 'General Course',
        photoUrl: row.photo_url || undefined,
        isBlossomTrust: row.is_blossom_trust || false,
        currentStatus: row.current_status || 'Active',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { data: formatted, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fetch failed';
      return { data: null, error: message };
    }
  },
};
