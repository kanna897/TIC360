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
  } = useStore();

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.currentStatus === 'Active').length;
  const completedStudents = students.filter((s) => s.currentStatus === 'Completed').length;
  const dropoutStudents = students.filter((s) => s.currentStatus === 'Dropout').length;
  const blossomCount = students.filter((s) => s.isBlossomTrust).length;
  const nonBlossomCount = students.filter((s) => !s.isBlossomTrust).length;

  // Monthly Attendance KPI
  const latestMonth = '2026-08';
  const currentMonthAttendance = monthlyAttendance.filter((a) => a.month === latestMonth);
  const avgAttendance =
    currentMonthAttendance.length > 0
      ? Math.round(
          currentMonthAttendance.reduce((acc, curr) => acc + curr.attendancePercentage, 0) /
            currentMonthAttendance.length
        )
      : 88;

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
    { name: 'Employed', value: employedCount || 1, color: '#10b981' },
    { name: 'Internship', value: internshipCount || 1, color: '#3b82f6' },
    { name: 'Higher Studies', value: higherStudiesCount || 0, color: '#8b5cf6' },
    { name: 'Self Employed', value: selfEmployedCount || 0, color: '#06b6d4' },
    { name: 'Looking / Unemployed', value: unemployedCount || 0, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{orgProfile.tagline}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Student Management & Outcome Reporting Platform
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Tracking student progress from registration through monthly attendance, academic project milestones, Blossom Trust monthly eligibility, and post-graduation industry outcomes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link href="/students">
              <Button variant="primary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
                Register Student
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="secondary" size="sm" leftIcon={<BarChart3 className="w-4 h-4" />}>
                View Reports
              </Button>
            </Link>
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
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Blossom Scholars</span>
            <HeartHandshake className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400 mt-2">{blossomCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {Math.round((blossomCount / (totalStudents || 1)) * 100)}% of total students
          </p>
        </Card>

        {/* Non-Blossom */}
        <Card className="p-4 border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Self-Funded</span>
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
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Batch Overall Average</span>
                <p className="text-3xl font-extrabold text-white mt-1">{avgAttendance}%</p>
              </div>
              <div className="text-right">
                <Badge variant={avgAttendance >= 80 ? 'active' : 'amber'}>
                  {avgAttendance >= 80 ? 'Good Standing' : 'Needs Review'}
                </Badge>
                <p className="text-[11px] text-slate-400 mt-1">Threshold: {settings.attendanceGoodThreshold}%</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-emerald-400 font-bold block">&gt;= 80% (Good)</span>
                <span className="text-lg font-extrabold text-white mt-1 block">
                  {goodAttendanceCount} students
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-amber-400 font-bold block">60-79% (Low)</span>
                <span className="text-lg font-extrabold text-white mt-1 block">
                  {lowAttendanceCount} students
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-rose-400 font-bold block">&lt; 60% (Critical)</span>
                <span className="text-lg font-extrabold text-white mt-1 block">
                  {criticalAttendanceCount} students
                </span>
              </div>
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
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Total Monthly Payable (Aug 2026)</span>
                <p className="text-3xl font-extrabold text-emerald-400 mt-1">
                  {formatCurrency(totalPayableAmount)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-300">
                  Rate: {formatCurrency(settings.blossomMonthlyMax)} / Mo
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Direct Bank Transfers</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-emerald-400 font-bold block">Eligible (&gt;=80%)</span>
                <span className="text-lg font-extrabold text-white mt-1 block">
                  {eligiblePayments} Scholars
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-rose-400 font-bold block">Forfeited (LKR 0)</span>
                <span className="text-lg font-extrabold text-white mt-1 block">
                  {notEligiblePayments} Low / Drop
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-blue-400 font-bold block">Paid / Disbursed</span>
                <span className="text-lg font-extrabold text-white mt-1 block">
                  {paidPayments} Completed
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Blossom vs Non-Blossom Analytics Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparison Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Blossom Trust vs Non-Blossom Comparative Analytics</CardTitle>
                <CardDescription>
                  Percentage performance & post-graduation success comparison
                </CardDescription>
              </div>
              <Badge variant="blue">Percentage %</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: unknown) => [`${val}%`, '']}
                  />
                  <Legend />
                  <Bar
                    name="Blossom Trust Scholars"
                    dataKey="Blossom"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    name="Non-Blossom Students"
                    dataKey="NonBlossom"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Current Student Outcomes Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Current Student Outcomes</CardTitle>
            <CardDescription>Post-course employment & study status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {outcomePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 text-xs pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Employed / Tech Careers:</span>
                <span className="font-bold text-emerald-400">{employedPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Internship Placements:</span>
                <span className="font-bold text-blue-400">{internshipPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Higher IT Degrees:</span>
                <span className="font-bold text-purple-400">{higherStudiesPct}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
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
