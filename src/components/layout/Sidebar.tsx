'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  HeartHandshake,
  UserX,
  FileSpreadsheet,
  GraduationCap,
  BarChart3,
  Settings,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: 'Students',
    href: '/students',
    icon: Users,
    badge: null,
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: CalendarCheck,
    badge: 'Monthly',
  },
  {
    label: 'Blossom Payments',
    href: '/blossom-payments',
    icon: HeartHandshake,
    badge: 'Rule: 80%',
  },
  {
    label: 'Dropout Management',
    href: '/dropouts',
    icon: UserX,
    badge: null,
  },
  {
    label: 'Assessments & Marks',
    href: '/assessments',
    icon: FileSpreadsheet,
    badge: null,
  },
  {
    label: 'Completions & Outcomes',
    href: '/outcomes',
    icon: GraduationCap,
    badge: null,
  },
  {
    label: 'Comprehensive Reports',
    href: '/reports',
    icon: BarChart3,
    badge: '9 Reports',
  },
  {
    label: 'Admin Settings',
    href: '/settings',
    icon: Settings,
    badge: null,
  },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const { orgProfile, students, currentRole } = useStore();

  const blossomCount = students.filter((s) => s.isBlossomTrust).length;
  const activeCount = students.filter((s) => s.currentStatus === 'Active').length;

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 bottom-0 z-40 w-72 bg-slate-950 border-r border-slate-800/80 backdrop-blur-2xl transition-transform duration-300 ease-in-out flex flex-col justify-between',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-900 border border-slate-700/80 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300 shrink-0 ring-2 ring-blue-500/20">
              <img
                src="/logo-badge.jpg"
                alt="TIC360 Training Centre"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-white tracking-tight">TIC360</span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  TRAINING
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[160px]">
                {orgProfile.orgName}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-4 space-y-1 max-h-[calc(100vh-210px)] overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Student Lifecycle Modules
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 select-none',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors shrink-0',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Status Card */}
      <div className="p-3.5 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Blossom Scholars</span>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
              {blossomCount} Students
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>Active Trainees:</span>
            <span className="text-slate-200 font-bold">{activeCount} / {students.length}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Signed in as:</span>
            <span className="text-blue-400 font-semibold">{currentRole}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
