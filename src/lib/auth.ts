import { UserRole } from './types';

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  password: string;
  avatarUrl?: string;
  department: string;
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
    fullName: 'Trainee Portal User',
    role: 'Student',
    password: 'Student@TIC360#2026',
    department: 'Vocational Trainees',
  },
];

export const authenticateUser = (
  emailInput: string,
  passwordInput: string
): { success: boolean; user?: UserAccount; error?: string } => {
  const email = emailInput.trim().toLowerCase();
  const account = SYSTEM_ACCOUNTS.find((a) => a.email.toLowerCase() === email);

  if (!account) {
    return { success: false, error: 'Account not found with this email address.' };
  }

  if (account.password !== passwordInput) {
    return { success: false, error: 'Incorrect password. Please verify and try again.' };
  }

  return { success: true, user: account };
};
