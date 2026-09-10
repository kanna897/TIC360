import { UserRole } from './types';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  HeartHandshake,
  UserX,
  FileSpreadsheet,
  GraduationCap,
  Briefcase,
  BarChart3,
  Settings,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge: string | null;
  description?: string;
}

export interface RolePermissionConfig {
  role: UserRole;
  title: string;
  badgeColor: string;
  description: string;
  defaultRoute: string;
  allowedRoutes: string[];
  navItems: NavItem[];
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissionConfig> = {
  Admin: {
    role: 'Admin',
    title: 'System Administrator',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    description: 'Full unrestricted super-admin access across all modules, settings & finances.',
    defaultRoute: '/',
    allowedRoutes: [
      '/',
      '/students',
      '/attendance',
      '/blossom-payments',
      '/dropouts',
      '/assessments',
      '/outcomes',
      '/reports',
      '/settings',
      '/portal',
      '/register',
      '/members',
      '/stickers',
      '/finance',
      '/courses',
      '/login',
    ],
    navItems: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
      { label: 'Students Directory', href: '/students', icon: Users, badge: null },
      { label: 'Attendance', href: '/attendance', icon: CalendarCheck, badge: 'Monthly' },
      { label: 'Blossom Payments', href: '/blossom-payments', icon: HeartHandshake, badge: 'Rule: 80%' },
      { label: 'Dropout Management', href: '/dropouts', icon: UserX, badge: null },
      { label: 'Assessments & Marks', href: '/assessments', icon: FileSpreadsheet, badge: null },
      { label: 'Completions & Outcomes', href: '/outcomes', icon: GraduationCap, badge: null },
      { label: 'Comprehensive Reports', href: '/reports', icon: BarChart3, badge: '9 Reports' },
      { label: 'Admin Settings', href: '/settings', icon: Settings, badge: null },
    ],
  },

  'Blossom Trust Officer': {
    role: 'Blossom Trust Officer',
    title: 'Blossom Trust Compliance Officer',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    description: 'Manage Blossom Trust scholars, stipend disbursements, 80% attendance verification & audit reports.',
    defaultRoute: '/blossom-payments',
    allowedRoutes: [
      '/',
      '/blossom-payments',
      '/students',
      '/attendance',
      '/dropouts',
      '/reports',
      '/portal',
      '/login',
    ],
    navItems: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
      { label: 'Blossom Payments', href: '/blossom-payments', icon: HeartHandshake, badge: 'Disburse' },
      { label: 'Attendance (80% Rule)', href: '/attendance', icon: CalendarCheck, badge: 'Audit' },
      { label: 'Scholars Directory', href: '/students', icon: Users, badge: null },
      { label: 'Dropout Settlements', href: '/dropouts', icon: UserX, badge: null },
      { label: 'Trust Reports', href: '/reports', icon: BarChart3, badge: 'Reports' },
    ],
  },

  Trainer: {
    role: 'Trainer',
    title: 'Academic Faculty & Instructor',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: 'Record student attendance, grade project & assessment marks, manage completions & outcomes.',
    defaultRoute: '/attendance',
    allowedRoutes: [
      '/',
      '/attendance',
      '/assessments',
      '/outcomes',
      '/students',
      '/login',
    ],
    navItems: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
      { label: 'Record Attendance', href: '/attendance', icon: CalendarCheck, badge: 'Daily/Mo' },
      { label: 'Assessments & Marks', href: '/assessments', icon: FileSpreadsheet, badge: 'Grading' },
      { label: 'Course Completions', href: '/outcomes', icon: GraduationCap, badge: 'Certify' },
      { label: 'Trainees Roster', href: '/students', icon: Users, badge: null },
    ],
  },

  'Data Entry Officer': {
    role: 'Data Entry Officer',
    title: 'Data Operations & Admissions Officer',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Enrol trainees, update personal profiles, enter monthly attendance and log dropouts.',
    defaultRoute: '/students',
    allowedRoutes: [
      '/',
      '/register',
      '/students',
      '/attendance',
      '/dropouts',
      '/login',
    ],
    navItems: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
      { label: 'New Registration', href: '/register', icon: GraduationCap, badge: 'Enrol' },
      { label: 'Students Roster', href: '/students', icon: Users, badge: 'Edit' },
      { label: 'Enter Attendance', href: '/attendance', icon: CalendarCheck, badge: 'Logs' },
      { label: 'Record Dropouts', href: '/dropouts', icon: UserX, badge: null },
    ],
  },

  Student: {
    role: 'Student',
    title: 'Vocational Trainee',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    description: 'View personal trainee profile, monthly attendance breakdown, and Blossom Trust stipend status.',
    defaultRoute: '/portal',
    allowedRoutes: [
      '/portal',
      '/register',
      '/survey',
      '/graduate-survey',
      '/login',
    ],
    navItems: [
      { label: 'My Trainee Portal', href: '/portal', icon: Sparkles, badge: 'Profile & Stipend' },
      { label: 'Admission Application', href: '/register', icon: GraduationCap, badge: null },
      { label: 'Graduate Career Survey', href: '/survey', icon: Briefcase, badge: 'Placement' },
    ],
  },
};

/**
 * Check if a given role is authorized to view a specific pathname
 */
export const canAccessRoute = (role: UserRole | undefined, pathname: string): boolean => {
  // Public universally accessible routes
  if (
    pathname === '/survey' ||
    pathname.startsWith('/survey/') ||
    pathname === '/graduate-survey' ||
    pathname.startsWith('/graduate-survey/')
  ) {
    return true;
  }

  if (!role) return false;
  const config = ROLE_PERMISSIONS[role];
  if (!config) return false;

  // Exact match or prefix match for sub-routes
  return config.allowedRoutes.some((route) => {
    if (route === '/') return pathname === '/';
    return pathname === route || pathname.startsWith(`${route}/`);
  });
};

/**
 * Get the default home route for a given user role
 */
export const getDefaultRouteForRole = (role: UserRole | undefined): string => {
  if (!role) return '/login';
  const config = ROLE_PERMISSIONS[role];
  return config?.defaultRoute || '/';
};
