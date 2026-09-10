'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  CalendarCheck,
  HeartHandshake,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  LogOut,
  Sparkles,
  Calendar,
  Layers,
  FileCheck2,
  Check,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

export default function StudentPortalPage() {
  const router = useRouter();
  const {
    currentStudent,
    currentRole,
    students,
    monthlyAttendance,
    blossomPayments,
    settings,
    orgProfile,
    logoutUser,
  } = useStore();

  // Tab State: strictly only profile, attendance, and payments
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'payments'>('profile');

  // Fallback to first student if currentStudent is null for demo purposes
  const student = currentStudent || students[0];

  // Redirect non-student roles away from portal
  const nonStudentRoles = ['Admin', 'Trainer', 'Blossom Trust Officer', 'Data Entry Officer'];
  const isNonStudent = currentRole ? nonStudentRoles.includes(currentRole) : false;

  useEffect(() => {
    if (isNonStudent) {
      router.replace('/students');
    }
  }, [isNonStudent, router]);

  if (isNonStudent) return null;


  if (!student) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <GraduationCap className="w-16 h-16 text-blue-400" />
        <h2 className="text-xl font-bold text-white">No Student Profile Found</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          You are not currently logged in as a trainee. Please register or log in with your Student UT Number.
        </p>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => router.push('/register')}>
            Register as Student
          </Button>
          <Button variant="secondary" onClick={() => router.push('/login?type=student')}>
            Student Login
          </Button>
        </div>
      </div>
    );
  }

  // Student specific records
  const studentAttendance = monthlyAttendance
    .filter((a) => a.studentId === student.id || a.utNumber === student.utNumber)
    .sort((a, b) => b.month.localeCompare(a.month));

  const studentPayments = blossomPayments
    .filter((p) => p.studentId === student.id || p.utNumber === student.utNumber)
    .sort((a, b) => b.month.localeCompare(a.month));

  // Latest month attendance
  const latestAtt = studentAttendance[0];
  const latestPct = latestAtt ? latestAtt.attendancePercentage : 88;
  const isAttendanceGood = latestPct >= settings.paymentEligibilityAttendanceThreshold;

  // Total blossom received
  const totalBlossomPaid = studentPayments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950/80 border border-blue-800/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            {/* Student Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border-2 border-blue-500/40 shadow-xl overflow-hidden shrink-0 flex items-center justify-center ring-4 ring-blue-500/10">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {student.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  {student.utNumber}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    student.currentStatus === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : student.currentStatus === 'Completed'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {student.currentStatus}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-2">
                <span className="text-blue-400 font-semibold">{student.courseName} (9 Months)</span> •{' '}
                <span className="text-slate-300">{student.batchName}</span>
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {student.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {student.phone}
                </span>
                {student.isBlossomTrust && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Blossom Trust Scholar
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards (3 Essential Cards Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Attendance Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Monthly Attendance
            </span>
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{latestPct}%</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                isAttendanceGood
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {isAttendanceGood ? 'Eligible (≥80%)' : 'Below 80%'}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAttendanceGood ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, latestPct)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {latestAtt ? `${latestAtt.month} record` : 'Current session'}
          </p>
        </div>

        {/* Blossom Stipend KPI */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Blossom Support
            </span>
            <HeartHandshake className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {student.isBlossomTrust
                ? isAttendanceGood
                  ? formatCurrency(settings.blossomMonthlyMax)
                  : formatCurrency(0)
                : 'N/A'}
            </span>
            <span className="text-[11px] text-slate-400">/ month</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {student.isBlossomTrust
              ? isAttendanceGood
                ? '✅ 80% attendance met for monthly stipend'
                : '⚠️ Attendance below 80% (LKR 0 for this month)'
              : 'Standard non-trust enrollment'}
          </p>
        </div>

        {/* Total Stipend Received */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Disbursed
            </span>
            <CreditCard className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {formatCurrency(totalBlossomPaid)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {studentPayments.filter((p) => p.status === 'Paid').length} successful bank transfers
          </p>
        </div>
      </div>

      {/* Navigation Tabs (Profile, Attendance, Blossom Payments) */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>My Profile & Enrollment</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>My Attendance & 80% Rule</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Blossom Monthly Stipend</span>
        </button>
      </div>

      {/* TAB 1: PROFILE & ENROLLMENT */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Academic Enrollment Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <GraduationCap className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Academic Enrollment Details</h3>
                <p className="text-[11px] text-slate-400">Official Vocational Registration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Course
                </span>
                <p className="text-white font-bold text-sm">Software Development (9 Months)</p>
                <span className="inline-block px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                  TIC-SD
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Intake Cohort
                </span>
                <p className="text-white font-bold text-sm">{student.batchName}</p>
                <span className="inline-block px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                  Active Intake
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Student ID
                </span>
                <p className="text-emerald-400 font-mono font-bold text-sm">{student.utNumber}</p>
                <span className="text-[10px] text-slate-400">Unique Trainee No</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Enrollment Status
                </span>
                <p className="text-white font-bold text-sm">{student.currentStatus}</p>
                <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Personal Trainee Details */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Personal Information</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Full Name</span>
                <span className="text-white font-bold text-sm">{student.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">National Identity Card (NIC)</span>
                <span className="text-white font-mono font-bold">{student.nic}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                <span className="text-slate-200 font-medium">{student.dob}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Gender</span>
                <span className="text-slate-200 font-medium">{student.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Residential District</span>
                <span className="text-slate-200 font-medium">{student.district}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Primary Phone</span>
                <span className="text-slate-200 font-mono font-medium">{student.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">WhatsApp Number</span>
                <span className="text-slate-200 font-mono font-medium">
                  {student.whatsapp || student.phone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email Address</span>
                <span className="text-slate-200 font-medium">{student.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Emergency Contact</span>
                <span className="text-slate-200 font-medium">
                  {student.emergencyContact.name} ({student.emergencyContact.relationship}) -{' '}
                  <span className="font-mono">{student.emergencyContact.phone}</span>
                </span>
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <span className="text-slate-400 block text-[11px]">Permanent Address</span>
                <span className="text-slate-200 font-medium">{student.address}</span>
              </div>
            </div>
          </div>

          {/* Blossom Trust Bank Account Info */}
          {student.bankDetails && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    Blossom Trust Disbursement Bank Details
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Direct Bank Transfer
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-sans">Bank Name</span>
                  <span className="text-white font-bold text-sm">{student.bankDetails.bankName}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-sans">Branch Name</span>
                  <span className="text-white font-bold text-sm">{student.bankDetails.branchName}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-sans">Branch Code</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {student.bankDetails.branchCode || 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-sans">Student Account Number</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {student.bankDetails.accountNumber}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 sm:col-span-2">
                  <span className="text-slate-400 block text-[10px] font-sans">
                    Beneficiary / Account Holder Name
                  </span>
                  <span className="text-white font-bold text-sm">
                    {student.bankDetails.beneficiaryName}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ATTENDANCE & 80% RULE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4 animate-fadeIn">
          {/* 80% Rule Guidance Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-emerald-950/60 border border-blue-800/40 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Blossom Trust Attendance Policy & Monthly Eligibility
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              To support dedicated students, the Blossom Trust provides an educational living stipend of{' '}
              <span className="text-white font-bold">{formatCurrency(settings.blossomMonthlyMax)}</span> per month.
              In order to qualify for the monthly stipend, trainees must maintain a monthly attendance rate of{' '}
              <span className="text-emerald-400 font-bold">80% or higher</span>. If attendance drops below 80% for any month, no stipend is paid for that month.
            </p>
          </div>

          {/* Attendance History Table */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Monthly Attendance Breakdown</h3>
              </div>
              <span className="text-xs text-slate-400">Total records: {studentAttendance.length}</span>
            </div>

            {studentAttendance.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No attendance logs recorded for this student yet. Attendance is uploaded by the faculty at the end of each month.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Month</th>
                      <th className="py-3 px-3">Course / Batch</th>
                      <th className="py-3 px-3">Attendance %</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Blossom Eligibility</th>
                      <th className="py-3 px-3">Recorded Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {studentAttendance.map((att) => {
                      const isElig = att.attendancePercentage >= settings.paymentEligibilityAttendanceThreshold;
                      return (
                        <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-bold text-white">{att.month}</td>
                          <td className="py-3 px-3 text-slate-300">{att.courseName}</td>
                          <td className="py-3 px-3 font-mono font-bold text-sm">
                            <span className={isElig ? 'text-emerald-400' : 'text-rose-400'}>
                              {att.attendancePercentage}%
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                att.status === 'Good Attendance'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : att.status === 'Low Attendance'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {att.status}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {student.isBlossomTrust ? (
                              isElig ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Eligible ({formatCurrency(settings.blossomMonthlyMax)})
                                </span>
                              ) : (
                                <span className="text-rose-400 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Not Eligible (LKR 0)
                                </span>
                              )
                            ) : (
                              <span className="text-slate-500">Non-Trust</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                            {att.updatedAt}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BLOSSOM MONTHLY STIPEND */}
      {activeTab === 'payments' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Linked Bank Card */}
          {student.bankDetails && (
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Direct Deposit Bank Details</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Verified Account
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Bank Name</span>
                  <span className="text-white font-bold">{student.bankDetails.bankName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Branch</span>
                  <span className="text-white">{student.bankDetails.branchName} ({student.bankDetails.branchCode || 'N/A'})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Account Number</span>
                  <span className="text-emerald-400 font-bold">{student.bankDetails.accountNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Beneficiary Name</span>
                  <span className="text-white">{student.bankDetails.beneficiaryName}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Register */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Monthly Stipend Disbursements</h3>
              </div>
              <span className="text-xs text-emerald-400 font-bold">
                Total Paid: {formatCurrency(totalBlossomPaid)}
              </span>
            </div>

            {studentPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No stipend records generated yet for this student.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Month</th>
                      <th className="py-3 px-3">Attendance</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Payment Date</th>
                      <th className="py-3 px-3">Bank Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {studentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-white">{p.month}</td>
                        <td className="py-3 px-3 font-mono">{p.attendancePercentage}%</td>
                        <td className="py-3 px-3 font-bold font-mono text-sm">
                          <span className={p.amount > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                            {formatCurrency(p.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === 'Paid'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : p.status === 'Pending'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          {p.paymentDate || 'Processing'}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          {p.referenceNo || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
