'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  UserCheck,
  Shield,
  GraduationCap,
  CalendarCheck,
  HeartHandshake,
  UserX,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/lib/types';
import { ROLE_PERMISSIONS } from '@/lib/permissions';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const {
    currentRole,
    setCurrentRole,
    currentAuthUser,
    currentStudent,
    theme,
    toggleTheme,
    auditLogs,
    orgProfile,
  } = useStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const roles: UserRole[] = [
    'Admin',
    'Blossom Trust Officer',
    'Trainer',
    'Data Entry Officer',
    'Student',
  ];

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-2xl flex items-center justify-between px-3 sm:px-6">
      {/* Left side: Hamburger & Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 lg:hidden transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden md:flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students, UT numbers, courses, NIC..."
            className="w-64 lg:w-80 rounded-xl bg-slate-900/90 border border-slate-800/80 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action Button */}
        <div className="relative">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Quick Action</span>
          </Button>

          {showQuickMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-fadeIn">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {currentRole} Actions
              </p>
              {(ROLE_PERMISSIONS[currentRole]?.navItems || []).slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowQuickMenu(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-blue-600/20 rounded-xl transition-colors"
                  >
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* RBAC Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 flex items-center gap-1.5 transition-colors"
            title="Switch User Role for RBAC Testing"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{currentRole}</span>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2.5 z-50 animate-fadeIn">
              <div className="px-2 pb-2 mb-1 border-b border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Role-Based Access Control
                </p>
                <p className="text-[11px] text-slate-300">Switch role to test access boundaries:</p>
              </div>
              <div className="space-y-1">
                {roles.map((r) => {
                  const p = ROLE_PERMISSIONS[r];
                  const isCur = currentRole === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        setCurrentRole(r);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex flex-col p-2 text-xs font-semibold rounded-xl transition-colors text-left ${
                        isCur
                          ? 'bg-blue-600/30 border border-blue-500/50 text-white'
                          : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-white">{r}</span>
                        {isCur && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal line-clamp-1 mt-0.5">
                        {p?.description || ''}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-blue-400" />
          )}
        </button>

        {/* Notifications / Audit Logs Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 relative transition-colors"
            title="Audit Logs"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl p-4 z-50 animate-fadeIn backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">System Audit Trail</span>
                </div>
                <span className="text-[10px] text-slate-400">Live</span>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
                {auditLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">
                        {log.action} <span className="text-[10px] font-normal text-slate-400">by {log.userName}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {log.details || log.entity}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Login Link */}
        <Link
          href={currentRole === 'Student' ? '/portal' : '/login'}
          className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-500 transition-all text-xs font-semibold group"
          title={currentRole === 'Student' ? 'View My Student Portal' : 'Sign in or Switch Account'}
        >
          <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-[10px] overflow-hidden">
            {currentStudent?.photoUrl ? (
              <img src={currentStudent.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              currentRole.charAt(0)
            )}
          </div>
          <span className="hidden md:inline text-slate-200 group-hover:text-white truncate max-w-[120px]">
            {currentRole === 'Student' && currentStudent
              ? currentStudent.fullName.split(' ')[0]
              : currentRole}
          </span>
        </Link>
      </div>
    </header>
  );
};
