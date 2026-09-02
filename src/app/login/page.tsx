'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SYSTEM_ACCOUNTS, authenticateUser, UserAccount } from '@/lib/auth';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentRole, orgProfile } = useStore();

  const [email, setEmail] = useState('admin@unicomtic.lk');
  const [password, setPassword] = useState('Admin@TIC360#2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = authenticateUser(email, password);
    if (!res.success || !res.user) {
      setErrorMsg(res.error || 'Authentication failed');
      return;
    }

    // Set role and current user
    setCurrentRole(res.user.role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tic360_auth_user', JSON.stringify(res.user));
    }

    setIsSuccess(true);
    setTimeout(() => {
      router.push('/');
    }, 800);
  };

  const handleQuickFill = (account: UserAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
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
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Staff Portal
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">{orgProfile.orgName} • Blossom Trust</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl shadow-2xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Sign In to Workspace</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your official administrative or staff credentials
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Official Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@unicomtic.lk"
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
                <span>Authentication verified! Redirecting to Dashboard...</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 text-xs font-bold"
              disabled={isSuccess}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isSuccess ? 'Signing In...' : 'Sign In to TIC360'}
            </Button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                Quick Role Credentials
              </span>
              <span className="text-[10px] text-slate-400">Click to autofill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {SYSTEM_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    email === acc.email
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-[11px] text-slate-200">{acc.role}</span>
                  <span className="text-[10px] text-slate-400 font-mono truncate">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Security Notice */}
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured by TIC360 RBAC & Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}
