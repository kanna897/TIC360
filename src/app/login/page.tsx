'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Key,
  Users,
  GraduationCap,
  UserPlus,
  ArrowLeft,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { SYSTEM_ACCOUNTS, authenticateUser, UserAccount, getRegisteredAccounts } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentRole, setCurrentAuthUser, orgProfile, students } = useStore();

  const [activeTab, setActiveTab] = useState<'student' | 'staff'>('student');
  const [identifier, setIdentifier] = useState('UT-2026-001');
  const [password, setPassword] = useState('Student@TIC360#2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredAccounts, setRegisteredAccounts] = useState<UserAccount[]>([]);

  useEffect(() => {
    // Check url params for type
    const type = searchParams.get('type');
    if (type === 'staff') {
      setActiveTab('staff');
      setIdentifier('admin@unicomtic.lk');
      setPassword('Admin@TIC360#2026');
    } else {
      setActiveTab('student');
      setIdentifier('UT-2026-001');
      setPassword('Student@TIC360#2026');
    }

    if (typeof window !== 'undefined') {
      setRegisteredAccounts(getRegisteredAccounts());
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'student' | 'staff') => {
    setActiveTab(tab);
    setErrorMsg('');
    if (tab === 'student') {
      setIdentifier(registeredAccounts[0]?.utNumber || 'UT-2026-001');
      setPassword('Student@TIC360#2026');
    } else {
      setIdentifier('admin@unicomtic.lk');
      setPassword('Admin@TIC360#2026');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = authenticateUser(identifier, password, students);
    if (!res.success || !res.user) {
      setErrorMsg(res.error || 'Authentication failed');
      return;
    }

    // Set role and current authenticated user in store and localStorage
    setCurrentRole(res.user.role);
    setCurrentAuthUser(res.user);

    setIsSuccess(true);
    setTimeout(() => {
      if (res.user?.role === 'Student') {
        router.push('/portal');
      } else {
        router.push('/');
      }
    }, 700);
  };

  const handleQuickFill = (account: { identifier: string; pass: string }) => {
    setIdentifier(account.identifier);
    setPassword(account.pass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Top return link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal Home</span>
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold hover:underline"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Student Register</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-900 border border-slate-700 shadow-2xl ring-4 ring-blue-500/20 p-1 mb-1">
            <img
              src="/logo-badge.jpg"
              alt="TIC360 Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>TIC360</span>
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {activeTab === 'student' ? 'Student Portal' : 'Staff Portal'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">{orgProfile.orgName} • {orgProfile.trustName}</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl shadow-2xl space-y-5">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabChange('student')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Login</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('staff')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'staff'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Staff / Admin</span>
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              {activeTab === 'student' ? 'Student Portal Sign In' : 'Administrative Sign In'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === 'student'
                ? 'Enter your Student UT Number (e.g. UT-2026-001) or Registered Email'
                : 'Enter your official administrative or faculty email credentials'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {activeTab === 'student' ? 'Student UT Number or Email' : 'Official Email'}
              </label>
              <div className="relative">
                {activeTab === 'student' ? (
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                ) : (
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeTab === 'student' ? 'UT-2026-001 or priya.s@unicomtic.lk' : 'admin@unicomtic.lk'}
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Authentication verified! Entering {activeTab === 'student' ? 'Student Portal' : 'Workspace'}...</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 text-xs font-bold"
              disabled={isSuccess}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isSuccess ? 'Signing In...' : activeTab === 'student' ? 'Enter Student Portal' : 'Sign In as Staff'}
            </Button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                {activeTab === 'student' ? 'Demo Student Logins' : 'Staff Role Logins'}
              </span>
              <span className="text-[10px] text-slate-400">Click to fill</span>
            </div>

            {activeTab === 'student' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {/* Dynamically registered students first if any */}
                {registeredAccounts.slice(0, 2).map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickFill({ identifier: acc.utNumber || acc.email, pass: acc.password })}
                    className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      identifier === acc.utNumber || identifier === acc.email
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-[11px] text-emerald-300 truncate">✨ {acc.fullName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{acc.utNumber || acc.email}</span>
                  </button>
                ))}

                {/* Standard demo student */}
                <button
                  type="button"
                  onClick={() => handleQuickFill({ identifier: 'UT-2026-001', pass: 'Student@TIC360#2026' })}
                  className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    identifier === 'UT-2026-001'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-[11px] text-slate-200">Priya S. (UT-2026-001)</span>
                  <span className="text-[10px] text-slate-400 font-mono">UT-2026-001</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill({ identifier: 'UT-2026-002', pass: 'Student@123' })}
                  className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    identifier === 'UT-2026-002'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-[11px] text-slate-200">K. Tharsan (UT-2026-002)</span>
                  <span className="text-[10px] text-slate-400 font-mono">UT-2026-002</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {SYSTEM_ACCOUNTS.filter((a) => a.role !== 'Student').map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickFill({ identifier: acc.email, pass: acc.password })}
                    className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      identifier === acc.email
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-[11px] text-slate-200">{acc.role}</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate">{acc.email}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Registration Promotion Link */}
            <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between text-xs text-emerald-300">
              <span className="text-[11px]">Haven't registered yet as a trainee?</span>
              <Link
                href="/register"
                className="font-bold text-white hover:text-emerald-300 underline shrink-0"
              >
                Register Now →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Security Notice */}
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>TIC360 Trainee Authentication & Blossom Trust MIS</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading TIC360 Portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
