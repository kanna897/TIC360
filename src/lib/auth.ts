import { UserRole, Student } from './types';
import { supabase, checkIsSupabaseConfigured } from './supabaseClient';

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  password?: string;
  avatarUrl?: string;
  department: string;
  studentId?: string;
  utNumber?: string;
}

// Display-only account catalogue. Credentials must never be shipped to the browser.
export const SYSTEM_ACCOUNTS: UserAccount[] = [
  { id: 'staff-admin', email: 'admin@unicomtic.lk', fullName: 'System Administrator', role: 'Admin', department: 'Executive Administration' },
  { id: 'staff-trustee', email: 'trustee@blossom.org', fullName: 'Blossom Trust Compliance Officer', role: 'Blossom Trust Officer', department: 'Blossom Trust Foundation' },
  { id: 'staff-trainer', email: 'trainer@unicomtic.lk', fullName: 'Senior Lead Instructor', role: 'Trainer', department: 'Academic Faculty' },
  { id: 'staff-data', email: 'dataentry@unicomtic.lk', fullName: 'Data Entry Officer', role: 'Data Entry Officer', department: 'Operations & Admissions' },
];

const LEGACY_ACCOUNTS_KEY = 'tic360_registered_accounts';

export const getRegisteredAccounts = (): UserAccount[] => {
  if (typeof window !== 'undefined') localStorage.removeItem(LEGACY_ACCOUNTS_KEY);
  return [];
};

export const registerStudentAccount = (_account: UserAccount): void => {
  if (typeof window !== 'undefined') localStorage.removeItem(LEGACY_ACCOUNTS_KEY);
};

export const authenticateUser = (
  _identifierInput: string,
  _passwordInput: string,
  _extraStudents: Student[] = []
): { success: boolean; error: string } => ({
  success: false,
  error: 'Offline/local authentication is disabled. Sign in with your Supabase account.',
});

const profileToAccount = (
  user: { id: string; email?: string | null },
  profile: Record<string, unknown>
): UserAccount => ({
  id: user.id,
  email: String(profile.email || user.email || ''),
  fullName: String(profile.full_name || user.email?.split('@')[0] || 'User'),
  role: (profile.role as UserRole) || 'Student',
  department: String(profile.department || ''),
  studentId: profile.student_id ? String(profile.student_id) : undefined,
  utNumber: profile.ut_number ? String(profile.ut_number) : undefined,
  avatarUrl: profile.avatar_url ? String(profile.avatar_url) : undefined,
});

export const signInWithSupabase = async (
  identifierInput: string,
  passwordInput: string,
  _extraStudents: Student[] = []
): Promise<{ success: boolean; user?: UserAccount; error?: string; isSupabaseAuth?: boolean }> => {
  const email = identifierInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!email || !password) return { success: false, error: 'Enter both email and password.' };
  if (!email.includes('@')) {
    return { success: false, error: 'For secure sign-in, enter the email linked to your account.' };
  }
  if (!checkIsSupabaseConfigured()) {
    return { success: false, error: 'Authentication service is not configured.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { success: false, error: 'Invalid email or password.' };

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id,email,full_name,role,department,student_id,ut_number,avatar_url')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { success: false, error: 'Your account profile is unavailable. Contact an administrator.' };
  }

  return { success: true, user: profileToAccount(data.user, profile), isSupabaseAuth: true };
};

export const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
  if (!checkIsSupabaseConfigured()) {
    return { success: false, error: 'Authentication service is not configured.' };
  }

  // Always return OAuth users to the public production domain. Using
  // window.location.origin here sends preview deployments to Vercel's
  // deployment-protection login instead of back to TIC360.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tic-360.vercel.app';
  const redirectTo = `${siteUrl.replace(/\/$/, '')}/`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  return error ? { success: false, error: error.message } : { success: true };
};

export const registerStudentWithSupabase = async (accountData: {
  email: string;
  password: string;
  fullName: string;
  utNumber: string;
  studentId: string;
  department?: string;
  avatarUrl?: string;
}): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
  if (!checkIsSupabaseConfigured()) {
    return { success: false, error: 'Registration service is not configured.' };
  }

  const { email, password, fullName, utNumber, studentId, department, avatarUrl } = accountData;
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName,
        ut_number: utNumber,
        student_id: studentId,
        department: department || 'Vocational Trainees',
        avatar_url: avatarUrl,
      },
    },
  });

  if (error || !data.user) return { success: false, error: error?.message || 'Registration failed.' };

  return {
    success: true,
    user: {
      id: data.user.id,
      email: email.trim().toLowerCase(),
      fullName,
      role: 'Student',
      department: department || 'Vocational Trainees',
      studentId,
      utNumber,
      avatarUrl,
    },
  };
};

export const provisionUserInSupabase = async (): Promise<boolean> => false;

export const seedAllSystemAccountsToSupabase = async (): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  details: string[];
}> => ({
  total: SYSTEM_ACCOUNTS.length,
  succeeded: 0,
  failed: SYSTEM_ACCOUNTS.length,
  details: ['Browser-based staff account seeding is disabled. Create staff users in Supabase Auth and assign roles using the security migration instructions.'],
});

export const signOutFromSupabase = async (): Promise<void> => {
  if (checkIsSupabaseConfigured()) await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LEGACY_ACCOUNTS_KEY);
    localStorage.removeItem('tic360_v2_current_role');
    localStorage.removeItem('tic360_v2_auth_user');
  }
};
