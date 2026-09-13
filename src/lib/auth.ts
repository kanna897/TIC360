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

export const SYSTEM_ACCOUNTS: UserAccount[] = [
  {
    id: 'USR-ADMIN-01',
    email: 'admin@unicomtic.lk',
    fullName: 'System Administrator',
    role: 'Admin',
    password: 'Admin@TIC360#2026',
    department: 'Executive Administration',
  },
  {
    id: 'USR-TRUSTEE-02',
    email: 'trustee@blossom.org',
    fullName: 'Blossom Trust Compliance Officer',
    role: 'Blossom Trust Officer',
    password: 'Trustee@TIC360#2026',
    department: 'Blossom Trust Foundation',
  },
  {
    id: 'USR-TRAINER-03',
    email: 'trainer@unicomtic.lk',
    fullName: 'Senior Lead Instructor',
    role: 'Trainer',
    password: 'Trainer@TIC360#2026',
    department: 'Academic Faculty',
  },
  {
    id: 'USR-DATA-04',
    email: 'dataentry@unicomtic.lk',
    fullName: 'Data Entry Officer',
    role: 'Data Entry Officer',
    password: 'Data@TIC360#2026',
    department: 'Operations & Admissions',
  },
  {
    id: 'USR-STUDENT-05',
    email: 'student@unicomtic.lk',
    fullName: 'Priya Sundaramoorthy (Demo)',
    role: 'Student',
    password: 'Student@TIC360#2026',
    department: 'Vocational Trainees',
    studentId: 'STU-01',
    utNumber: 'UT-2026-001',
  },
];

const REGISTERED_ACCOUNTS_KEY = 'tic360_registered_accounts';

export const getRegisteredAccounts = (): UserAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const registerStudentAccount = (account: UserAccount): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRegisteredAccounts();
    const filtered = existing.filter(
      (a) =>
        a.email.toLowerCase() !== account.email.toLowerCase() &&
        (!account.utNumber || a.utNumber !== account.utNumber)
    );
    const updated = [account, ...filtered];
    localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving registered student account', e);
  }
};

// Synchronous local authentication (fallback)
export const authenticateUser = (
  identifierInput: string,
  passwordInput: string,
  extraStudents: Student[] = []
): { success: boolean; user?: UserAccount; error?: string } => {
  const query = identifierInput.trim().toLowerCase();
  const regAccounts = getRegisteredAccounts();
  const allAccounts = [...regAccounts, ...SYSTEM_ACCOUNTS];

  // 1. Direct match on registered/system accounts (by email or utNumber)
  const account = allAccounts.find(
    (a) =>
      a.email.toLowerCase() === query ||
      (a.utNumber && a.utNumber.toLowerCase() === query)
  );

  if (account) {
    if (account.password && account.password !== passwordInput) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }
    return { success: true, user: account };
  }

  // 2. Dynamic match on mock / store students list if not yet registered in accounts
  const student = extraStudents.find(
    (s) =>
      s.email.toLowerCase() === query ||
      s.utNumber.toLowerCase() === query ||
      s.nic.toLowerCase() === query
  );

  if (student) {
    const validPasswords = ['Student@TIC360#2026', 'Student@123', 'Password123', student.nic, '123456'];
    if (!validPasswords.includes(passwordInput)) {
      return {
        success: false,
        error: 'Incorrect password. Try "Student@TIC360#2026" or "Student@123".',
      };
    }

    const dynamicAccount: UserAccount = {
      id: `USR-${student.id}`,
      email: student.email,
      fullName: student.fullName,
      role: 'Student',
      password: passwordInput,
      avatarUrl: student.photoUrl,
      department: 'Vocational Trainees',
      studentId: student.id,
      utNumber: student.utNumber,
    };

    registerStudentAccount(dynamicAccount);
    return { success: true, user: dynamicAccount };
  }

  return {
    success: false,
    error: 'Account not found. Please enter a valid Email address or Student UT Number (e.g. UT-2026-001).',
  };
};

/**
 * Resolves a UT Number or username to an email address using Supabase or local cache
 */
export const resolveEmailFromIdentifier = async (
  identifier: string,
  extraStudents: Student[] = []
): Promise<string> => {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) return trimmed.toLowerCase();

  // Look in local system accounts
  const matchedSys = SYSTEM_ACCOUNTS.find(
    (a) => a.utNumber && a.utNumber.toLowerCase() === trimmed.toLowerCase()
  );
  if (matchedSys) return matchedSys.email.toLowerCase();

  // Look in registered accounts
  const regAccounts = getRegisteredAccounts();
  const matchedReg = regAccounts.find(
    (a) => a.utNumber && a.utNumber.toLowerCase() === trimmed.toLowerCase()
  );
  if (matchedReg) return matchedReg.email.toLowerCase();

  // Look in extraStudents
  const matchedStudent = extraStudents.find(
    (s) => s.utNumber.toLowerCase() === trimmed.toLowerCase()
  );
  if (matchedStudent?.email) return matchedStudent.email.toLowerCase();

  // If Supabase is configured, search in user_profiles or students table
  if (checkIsSupabaseConfigured()) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email')
        .ilike('ut_number', trimmed)
        .maybeSingle();

      if (profile?.email) return profile.email.toLowerCase();

      const { data: dbStudent } = await supabase
        .from('students')
        .select('email')
        .ilike('ut_number', trimmed)
        .maybeSingle();

      if (dbStudent?.email) return dbStudent.email.toLowerCase();
    } catch (e) {
      console.warn('[auth] Error resolving email from Supabase:', e);
    }
  }

  return trimmed.toLowerCase();
};

/**
 * Authenticates user using Supabase Auth, with automatic fallback to local credentials
 */
export const signInWithSupabase = async (
  identifierInput: string,
  passwordInput: string,
  extraStudents: Student[] = []
): Promise<{ success: boolean; user?: UserAccount; error?: string; isSupabaseAuth?: boolean }> => {
  const trimmedIdent = identifierInput.trim();
  const trimmedPass = passwordInput.trim();

  if (!trimmedIdent || !trimmedPass) {
    return { success: false, error: 'Please enter both identifier and password.' };
  }

  // 1. If Supabase is configured, try Supabase Auth first
  if (checkIsSupabaseConfigured()) {
    try {
      const email = await resolveEmailFromIdentifier(trimmedIdent, extraStudents);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: trimmedPass,
      });

      if (!error && data?.user) {
        // Fetch extended profile
        let userRole: UserRole = (data.user.user_metadata?.role as UserRole) || 'Student';
        let fullName = data.user.user_metadata?.full_name || email.split('@')[0];
        let department = data.user.user_metadata?.department || '';
        let utNumber = data.user.user_metadata?.ut_number;
        let studentId = data.user.user_metadata?.student_id;
        let avatarUrl = data.user.user_metadata?.avatar_url;

        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile) {
            userRole = (profile.role as UserRole) || userRole;
            fullName = profile.full_name || fullName;
            department = profile.department || department;
            utNumber = profile.ut_number || utNumber;
            studentId = profile.student_id || studentId;
            avatarUrl = profile.avatar_url || avatarUrl;
          }
        } catch (pe) {
          console.warn('[auth] could not fetch user_profile', pe);
        }

        const userAccount: UserAccount = {
          id: data.user.id,
          email: data.user.email || email,
          fullName,
          role: userRole,
          avatarUrl,
          department,
          studentId,
          utNumber,
        };

        // Cache locally for offline availability
        registerStudentAccount(userAccount);

        return { success: true, user: userAccount, isSupabaseAuth: true };
      }

      // If Supabase returned an error (e.g. invalid credentials or user not found in auth.users)
      console.warn('[auth] Supabase signIn error, checking fallback:', error?.message);

      // Check if this is a known system or local account (seamless transition)
      const localResult = authenticateUser(trimmedIdent, trimmedPass, extraStudents);
      if (localResult.success && localResult.user) {
        // Local account verified! Try to auto-provision into Supabase in background
        provisionUserInSupabase(localResult.user, trimmedPass).catch((err) =>
          console.warn('[auth] Background provision failed:', err)
        );
        return { ...localResult, isSupabaseAuth: false };
      }

      // Return Supabase's specific error if not found in local fallback
      const friendlyError =
        error?.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please verify your credentials.'
          : error?.message || 'Authentication failed.';

      return { success: false, error: friendlyError };
    } catch (err: unknown) {
      console.error('[auth] Supabase authentication exception:', err);
    }
  }

  // 2. Fallback to local authentication when Supabase is not configured or network error
  const fallbackRes = authenticateUser(trimmedIdent, trimmedPass, extraStudents);
  return { ...fallbackRes, isSupabaseAuth: false };
};

/**
 * Registers a student account with Supabase Auth and creates user_profile
 */
export const registerStudentWithSupabase = async (
  accountData: {
    email: string;
    password: string;
    fullName: string;
    utNumber: string;
    studentId: string;
    department?: string;
    avatarUrl?: string;
  }
): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
  const { email, password, fullName, utNumber, studentId, department, avatarUrl } = accountData;

  const localAccount: UserAccount = {
    id: `USR-${studentId}`,
    email: email.toLowerCase(),
    fullName,
    role: 'Student',
    password,
    avatarUrl,
    department: department || 'Vocational Trainees',
    studentId,
    utNumber,
  };

  // Always keep in local storage
  registerStudentAccount(localAccount);

  if (checkIsSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'Student',
            ut_number: utNumber,
            student_id: studentId,
            department: department || 'Vocational Trainees',
            avatar_url: avatarUrl,
          },
        },
      });

      if (error) {
        console.warn('[auth] Supabase signUp warning:', error.message);
        // If user already registered in Supabase, try to sign in
        if (error.message.includes('already registered')) {
          const signin = await supabase.auth.signInWithPassword({
            email: email.toLowerCase(),
            password,
          });
          if (signin.data?.user) {
            return {
              success: true,
              user: {
                ...localAccount,
                id: signin.data.user.id,
              },
            };
          }
        }
        // Still return success with localAccount so registration flow doesn't break
        return { success: true, user: localAccount };
      }

      if (data?.user) {
        // Upsert user_profile
        try {
          await supabase.from('user_profiles').upsert({
            id: data.user.id,
            email: email.toLowerCase(),
            full_name: fullName,
            role: 'Student',
            department: department || 'Vocational Trainees',
            student_id: studentId,
            ut_number: utNumber,
            avatar_url: avatarUrl || null,
          });
        } catch (pe) {
          console.warn('[auth] profile upsert error', pe);
        }

        return {
          success: true,
          user: {
            ...localAccount,
            id: data.user.id,
          },
        };
      }
    } catch (e) {
      console.error('[auth] Supabase signUp failed:', e);
    }
  }

  return { success: true, user: localAccount };
};

/**
 * Attempts to provision or sign up a user in Supabase Auth
 */
export const provisionUserInSupabase = async (
  user: UserAccount,
  password: string
): Promise<boolean> => {
  if (!checkIsSupabaseConfigured() || !user.email) return false;
  try {
    const { data, error } = await supabase.auth.signUp({
      email: user.email.toLowerCase(),
      password,
      options: {
        data: {
          full_name: user.fullName,
          role: user.role,
          department: user.department,
          ut_number: user.utNumber,
          student_id: user.studentId,
          avatar_url: user.avatarUrl,
        },
      },
    });

    if (error) {
      console.warn(`[auth] auto-provision ${user.email}:`, error.message);
      return false;
    }

    if (data?.user) {
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        email: user.email.toLowerCase(),
        full_name: user.fullName,
        role: user.role,
        department: user.department,
        ut_number: user.utNumber,
        student_id: user.studentId,
        avatar_url: user.avatarUrl,
      });
      return true;
    }
  } catch (err) {
    console.warn('[auth] provision error:', err);
  }
  return false;
};

/**
 * Seeds all 5 core system accounts into Supabase Auth
 */
export const seedAllSystemAccountsToSupabase = async (): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  details: string[];
}> => {
  const results = {
    total: SYSTEM_ACCOUNTS.length,
    succeeded: 0,
    failed: 0,
    details: [] as string[],
  };

  if (!checkIsSupabaseConfigured()) {
    results.details.push('Supabase is not configured yet.');
    return results;
  }

  for (const account of SYSTEM_ACCOUNTS) {
    if (!account.password) continue;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: account.email.toLowerCase(),
        password: account.password,
        options: {
          data: {
            full_name: account.fullName,
            role: account.role,
            department: account.department,
            ut_number: account.utNumber,
            student_id: account.studentId,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          results.succeeded++;
          results.details.push(`${account.email}: Already registered in Supabase.`);
        } else {
          results.failed++;
          results.details.push(`${account.email}: ${error.message}`);
        }
      } else if (data?.user) {
        results.succeeded++;
        results.details.push(`${account.email}: Successfully created in Supabase Auth.`);

        // Ensure user_profiles row
        await supabase.from('user_profiles').upsert({
          id: data.user.id,
          email: account.email.toLowerCase(),
          full_name: account.fullName,
          role: account.role,
          department: account.department,
          ut_number: account.utNumber,
          student_id: account.studentId,
        });
      }
    } catch (e) {
      results.failed++;
      const msg = e instanceof Error ? e.message : 'Unknown error';
      results.details.push(`${account.email}: ${msg}`);
    }
  }

  return results;
};

/**
 * Signs out from Supabase and clears local auth
 */
export const signOutFromSupabase = async (): Promise<void> => {
  if (checkIsSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[auth] signOut error:', e);
    }
  }
};

