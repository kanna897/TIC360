import { UserRole, Student } from './types';

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  password: string;
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
    if (account.password !== passwordInput) {
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
    // Check common default passwords for demo students
    const validPasswords = ['Student@TIC360#2026', 'Student@123', 'Password123', student.nic, '123456'];
    if (!validPasswords.includes(passwordInput)) {
      return {
        success: false,
        error: 'Incorrect password. For existing student demo accounts, try "Student@TIC360#2026" or "Student@123".',
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
