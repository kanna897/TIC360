'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  HeartHandshake,
  UserX,
  CalendarCheck,
  Briefcase,
  TrendingUp,
  Award,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, calculateBlossomComparison } from '@/lib/utils';
import { ROLE_PERMISSIONS } from '@/lib/permissions';
import { ThreeDPieChart } from '@/components/ui/ThreeDPieChart';

export default function DashboardPage() {
  const {
    students,
    monthlyAttendance,
    blossomPayments,
    dropouts,
    outcomes,
    completions,
    settings,
    orgProfile,
    currentRole,
  } = useStore();

  const roleConfig = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.Admin;

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.currentStatus === 'Active').length;
  const completedStudents = students.filter((s) => s.currentStatus === 'Completed').length;
  const dropoutStudents = students.filter((s) => s.currentStatus === 'Dropout').length;
  const blossomDropoutCount = students.filter((s) => s.isBlossomTrust && s.currentStatus === 'Dropout').length;
  const blossomCount = students.filter((s) => s.isBlossomTrust && s.currentStatus !== 'Dropout').length;
  const totalBlossomCount = students.filter((s) => s.isBlossomTrust).length; // All Blossom (including dropouts)
  const nonBlossomCount = students.filter((s) => !s.isBlossomTrust).length;
  const frontEndCount = students.filter(s => s.courseId === 'Frontend Developer' || s.courseName === 'Frontend Developer').length;
  const fullStackCount = totalStudents - frontEndCount;

  // Monthly Attendance KPI
  const latestMonth = '2026-08';
  const currentMonthAttendance = monthlyAttendance.filter((a) => a.month === latestMonth);
  const avgAttendance =
    currentMonthAttendance.length > 0
      ? Math.round(
          currentMonthAttendance.reduce((acc, curr) => acc + curr.attendancePercentage, 0) /
            currentMonthAttendance.length
        )
      : 0;

  const goodAttendanceCount = currentMonthAttendance.filter(
    (a) => a.attendancePercentage >= settings.attendanceGoodThreshold
  ).length;
  const lowAttendanceCount = currentMonthAttendance.filter(
    (a) =>
      a.attendancePercentage >= settings.attendanceLowThreshold &&
      a.attendancePercentage < settings.attendanceGoodThreshold
  ).length;
  const criticalAttendanceCount = currentMonthAttendance.filter(
    (a) => a.attendancePercentage < settings.attendanceLowThreshold
  ).length;

  // Monthly Blossom Payments
  const currentMonthPayments = blossomPayments.filter((p) => p.month === latestMonth);
  const eligiblePayments = currentMonthPayments.filter((p) => p.isEligible).length;
  const paidPayments = currentMonthPayments.filter((p) => p.status === 'Paid').length;
  const notEligiblePayments = currentMonthPayments.filter((p) => !p.isEligible).length;
  const totalPayableAmount = currentMonthPayments
    .filter((p) => p.isEligible)
    .reduce((sum, p) => sum + p.amount, 0);

  // Outcome statistics
  const totalOutcomes = outcomes.length || 1;
  const employedCount = outcomes.filter((o) => o.outcomeStatus === 'Employed').length;
  const selfEmployedCount = outcomes.filter((o) => o.outcomeStatus === 'Self Employed').length;
  const higherStudiesCount = outcomes.filter((o) => o.outcomeStatus === 'Higher Studies').length;
  const internshipCount = outcomes.filter((o) => o.outcomeStatus === 'Internship').length;
  const unemployedCount = outcomes.filter((o) => o.outcomeStatus === 'Unemployed').length;

  const employedPct = Math.round(((employedCount + selfEmployedCount) / totalOutcomes) * 100);
  const internshipPct = Math.round((internshipCount / totalOutcomes) * 100);
  const higherStudiesPct = Math.round((higherStudiesCount / totalOutcomes) * 100);

  // Blossom vs Non-Blossom Comparative Stats
  const comparison = calculateBlossomComparison(students, outcomes);

  const comparisonChartData = [
    {
      category: 'Employment %',
      Blossom: comparison.employed.blossomPct + comparison.selfEmployed.blossomPct,
      NonBlossom: comparison.employed.nonBlossomPct + comparison.selfEmployed.nonBlossomPct,
    },
    {
      category: 'Internship %',
      Blossom: comparison.internship.blossomPct,
      NonBlossom: comparison.internship.nonBlossomPct,
    },
    {
      category: 'Higher Studies %',
      Blossom: comparison.higherStudies.blossomPct,
      NonBlossom: comparison.higherStudies.nonBlossomPct,
    },
    {
      category: 'Completion %',
      Blossom: comparison.completed.blossomPct,
      NonBlossom: comparison.completed.nonBlossomPct,
    },
    {
      category: 'Dropout %',
      Blossom: comparison.dropouts.blossomPct,
      NonBlossom: comparison.dropouts.nonBlossomPct,
    },
  ];

  const outcomePieData = [
    { name: 'Employed', value: employedCount || 0, color: '#10b981' },
    { name: 'Internship', value: internshipCount || 0, color: '#3b82f6' },
    { name: 'Higher Studies', value: higherStudiesCount || 0, color: '#8b5cf6' },
    { name: 'Self Employed', value: selfEmployedCount || 0, color: '#06b6d4' },
    { name: 'Looking / Unemployed', value: unemployedCount || 0, color: '#f59e0b' },
  ];

  // Real historical trend data for Stacked Bar Charts (currently showing only latest month since we have no history)
  const attendanceTrendData = [
    { month: 'Aug', excellent: goodAttendanceCount || 0, average: lowAttendanceCount || 0, critical: criticalAttendanceCount || 0 },
  ];

  const paymentTrendData = [
    { month: 'Aug', eligible: eligiblePayments || 0, paid: paidPayments || 0, notEligible: notEligiblePayments || 0 },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-900 border border-slate-700/80 shadow-xl shadow-blue-500/20 shrink-0 ring-2 ring-blue-500/30 flex items-center justify-center">
              <img
                src="/logo-badge.jpg"
                alt="TIC360 Training Centre"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{orgProfile.tagline}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${roleConfig.badgeColor}`}>
                  {roleConfig.title}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Student Lifecycle Management & Blossom Trust MIS
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {roleConfig.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            {roleConfig.navItems.slice(1, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="secondary" size="sm" leftIcon={<Icon className="w-4 h-4" />}>
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Students */}
        <Card className="p-4 border-blue-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Total Enrolled</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{totalStudents}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total database count</p>
        </Card>

        {/* Active Students */}
        <Card className="p-4 border-emerald-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Active Trainees</span>
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">{activeStudents}</p>
          <p className="text-[11px] text-slate-400 mt-1">In current batches</p>
        </Card>

        {/* Completed */}
        <Card className="p-4 border-purple-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Completed</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-purple-400 mt-2">{completedStudents}</p>
          <p className="text-[11px] text-slate-400 mt-1">Graduated & certified</p>
        </Card>

        {/* Dropouts */}
        <Card className="p-4 border-rose-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Dropouts</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-rose-400 mt-2">{dropoutStudents}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {Math.round((dropoutStudents / (totalStudents || 1)) * 100)}% Dropout rate
          </p>
        </Card>

        {/* Blossom Students */}
        <Card className="p-4 border-amber-500/20">
          {/* Header row: Label + Total */}
          <div className="flex items-center justify-between text-xs font-bold uppercase">
            <span className="text-slate-400">Blossom Scholars</span>
            <span className="text-amber-300 font-extrabold text-sm bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">{totalBlossomCount}</span>
          </div>
          {/* Center: Active count big */}
          <p className="text-3xl font-extrabold text-amber-400 mt-2 text-center">{blossomCount}</p>
          <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">Active</p>
          {/* Bottom: Dropout */}
          {blossomDropoutCount > 0 && (
            <p className="text-[11px] text-red-400 font-bold text-center mt-1">
              🔴 {blossomDropoutCount} Dropout
            </p>
          )}
        </Card>

        {/* Non-Blossom */}
        <Card className="p-4 border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Non-Blossom</span>
            <Briefcase className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-cyan-400 mt-2">{nonBlossomCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Non-Blossom learners</p>
        </Card>
      </div>

      {/* Section 2: Attendance & Blossom Payment Eligibility Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance KPI Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-400" />
                <CardTitle>August 2026 Attendance Summary</CardTitle>
              </div>
              <CardDescription>Monthly student attendance & threshold metrics</CardDescription>
            </div>
            <Link href="/attendance">
              <Button size="sm" variant="ghost" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                Attendance Log
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceTrendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="excellent" name=">= 80% (Excellent)" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="average" name="60-79% (Average)" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="critical" name="< 60% (Critical)" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Current Month Average</span>
              <span className="text-sm font-bold text-white">{avgAttendance}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Blossom Monthly Payment Support */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                <CardTitle>Blossom Trust Monthly Payments</CardTitle>
              </div>
              <CardDescription>
                Rule: &lt;80% attendance = LKR 0 support for that month
              </CardDescription>
            </div>
            <Link href="/blossom-payments">
              <Button size="sm" variant="ghost" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                Payment Register
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentTrendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="paid" name="Paid/Disbursed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="eligible" name="Eligible (Not Paid Yet)" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="notEligible" name="Not Eligible (Forfeited)" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Current Month Payable</span>
              <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalPayableAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: 3D Pie Chart Analytics Grid */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <PieIcon className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Student Repository Analytics</h2>
          <span className="text-xs text-slate-400 ml-1">— Live overview · {totalStudents} students</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">

          {/* 1. Dropout Status */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/40 transition-all flex justify-center">
            <ThreeDPieChart
              title="Dropout Status"
              subtitle="Active vs Dropped Out"
              width={280}
              height={200}
              depth={26}
              data={[
                { name: 'Active Students', value: activeStudents || 0, color: '#10b981' },
                { name: 'Dropped Out', value: dropoutStudents || 0, color: '#f43f5e' },
              ]}
            />
          </div>

          {/* 2. Course Specialization */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all flex justify-center">
            <ThreeDPieChart
              title="Course Specialization"
              subtitle="Full Stack vs Front End"
              width={280}
              height={200}
              depth={26}
              data={[
                { name: 'Full Stack', value: fullStackCount || 0, color: '#8b5cf6' },
                { name: 'Front End', value: frontEndCount || 0, color: '#06b6d4' },
              ]}
            />
          </div>

          {/* 3. Course Completion */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition-all flex justify-center">
            <ThreeDPieChart
              title="Course Completion"
              subtitle="Completion status breakdown"
              width={280}
              height={200}
              depth={26}
              data={[
                { name: 'Completed', value: completedStudents || 0, color: '#f59e0b' },
                { name: 'In Progress', value: activeStudents || 0, color: '#3b82f6' },
                { name: 'Not Started', value: Math.max(0, totalStudents - completedStudents - activeStudents) || 0, color: '#475569' },
              ]}
            />
          </div>

          {/* 4. Employment Status */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/40 transition-all flex justify-center">
            <ThreeDPieChart
              title="Employment Status"
              subtitle="Industry placement distribution"
              width={280}
              height={200}
              depth={26}
              data={[
                { name: 'Employed', value: employedCount || 0, color: '#10b981' },
                { name: 'Internship', value: internshipCount || 0, color: '#3b82f6' },
                { name: 'Unemployed', value: unemployedCount || 0, color: '#64748b' },
              ]}
            />
          </div>

          {/* 5. Other Status */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-purple-500/40 transition-all flex justify-center">
            <ThreeDPieChart
              title="Other Status"
              subtitle="Further study & placement"
              width={280}
              height={200}
              depth={26}
              data={[
                { name: 'Higher Studies', value: higherStudiesCount || 0, color: '#c084fc' },
                { name: 'Self Employed', value: selfEmployedCount || 0, color: '#f472b6' },
                { name: 'Looking', value: unemployedCount || 0, color: '#94a3b8' },
              ]}
            />
          </div>

          {/* 6. Student Type Split */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-rose-500/40 transition-all flex justify-center">
            <ThreeDPieChart
              title="Student Type Split"
              subtitle="Blossom vs Non-Blossom vs Dropout"
              width={280}
              height={200}
              depth={26}
              data={[
                { name: 'Blossom Trust', value: blossomCount || 0, color: '#f43f5e' },
                { name: 'Non-Blossom', value: nonBlossomCount || 0, color: '#6366f1' },
                { name: 'Blossom Dropout', value: blossomDropoutCount || 0, color: '#f97316' },
              ]}
            />
          </div>

        </div>
      </div>

      {/* Section 4: Quick Workflow Launchpad */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Link href="/students" className="block group">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500 transition-all text-center">
            <Users className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-slate-200 block group-hover:text-blue-300">
              Students
            </span>
          </div>
        </Link>
        <Link href="/attendance" className="block group">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 transition-all text-center">
            <CalendarCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-slate-200 block group-hover:text-emerald-300">
              Attendance
            </span>
          </div>
        </Link>
        <Link href="/blossom-payments" className="block group">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500 transition-all text-center">
            <HeartHandshake className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-slate-200 block group-hover:text-amber-300">
              Payments
            </span>
          </div>
        </Link>
        <Link href="/dropouts" className="block group">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500 transition-all text-center">
            <UserX className="w-5 h-5 text-rose-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-slate-200 block group-hover:text-rose-300">
              Dropouts
            </span>
          </div>
        </Link>
        <Link href="/assessments" className="block group">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 transition-all text-center">
            <Briefcase className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-slate-200 block group-hover:text-purple-300">
              Assessments
            </span>
          </div>
        </Link>
        <Link href="/outcomes" className="block group">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 transition-all text-center">
            <GraduationCap className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-slate-200 block group-hover:text-cyan-300">
              Outcomes
            </span>
          </div>
        </Link>
        <Link href="/reports" className="block group">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 transition-all text-center">
            <BarChart3 className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-slate-200 block group-hover:text-indigo-300">
              Reports
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
