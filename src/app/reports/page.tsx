'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  CalendarCheck,
  AlertTriangle,
  UserX,
  HeartHandshake,
  FileSpreadsheet,
  GraduationCap,
  Briefcase,
  Layers,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import {
  formatCurrency,
  formatDate,
  formatMonthName,
  exportToCSV,
  exportToExcel,
  calculateBlossomComparison,
} from '@/lib/utils';

export default function ReportsPage() {
  const {
    students,
    courses,
    batches,
    monthlyAttendance,
    blossomPayments,
    dropouts,
    assessments,
    assessmentMarks,
    completions,
    outcomes,
    settings,
    orgProfile,
  } = useStore();

  const [activeReportTab, setActiveReportTab] = useState<
    | 'monthly_att'
    | 'low_att'
    | 'dropouts'
    | 'blossom_pay'
    | 'academic'
    | 'completions'
    | 'outcomes'
    | 'comparison'
    | 'master'
  >('master');

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthOnly, setSelectedMonthOnly] = useState<string>('08');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');

  const selectedMonthString = `${selectedYear}-${selectedMonthOnly}`; // '2026-08'

  // Data aggregations
  const comparison = calculateBlossomComparison(students, outcomes);

  // Month attendance
  const currentAtt = monthlyAttendance.filter((a) => a.month === selectedMonthString);
  const lowAttStudents = currentAtt.filter(
    (a) => a.attendancePercentage < settings.attendanceGoodThreshold
  );

  // Month payments
  const currentPayments = blossomPayments.filter((p) => p.month === selectedMonthString);
  const eligiblePay = currentPayments.filter((p) => p.isEligible);
  const paidPay = currentPayments.filter((p) => p.status === 'Paid');
  const notPaidLowAtt = currentPayments.filter(
    (p) => !p.isEligible && p.ineligibilityReason?.includes('Low Attendance')
  );
  const stoppedDropout = currentPayments.filter(
    (p) => !p.isEligible && p.ineligibilityReason?.includes('Dropout')
  );
  const totalPayable = eligiblePay.reduce((s, p) => s + p.amount, 0);
  const totalPaid = paidPay.reduce((s, p) => s + p.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportMasterExcel = () => {
    const studentSheet = students.map((s) => ({
      'UT Number': s.utNumber,
      'Full Name': s.fullName,
      'Course': s.courseName,
      'Batch': s.batchName,
      'Status': s.currentStatus,
      'Blossom Trust': s.isBlossomTrust ? 'YES' : 'NO',
      'District': s.district,
    }));

    const attendanceSheet = currentAtt.map((a) => ({
      'UT Number': a.utNumber,
      'Student Name': a.studentName,
      'Month': a.month,
      'Attendance %': a.attendancePercentage,
      'Status': a.status,
    }));

    const paymentSheet = currentPayments.map((p) => ({
      'UT Number': p.utNumber,
      'Student Name': p.studentName,
      'Month': p.month,
      'Eligibility': p.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE',
      'Amount (LKR)': p.amount,
      'Payment Status': p.status,
      'Reason': p.ineligibilityReason || '',
    }));

    const outcomeSheet = outcomes.map((o) => ({
      'UT Number': o.utNumber,
      'Student Name': o.studentName,
      'Blossom Scholar': o.isBlossomTrust ? 'YES' : 'NO',
      'Outcome Status': o.outcomeStatus,
      'Company / Institution': o.companyOrInstitution || '',
      'Job Title': o.jobTitle || '',
    }));

    exportToExcel(`TIC360_Master_Report_${selectedMonthString}`, [
      { sheetName: 'Students Overview', data: studentSheet },
      { sheetName: 'Monthly Attendance', data: attendanceSheet },
      { sheetName: 'Blossom Payments', data: paymentSheet },
      { sheetName: 'Student Outcomes', data: outcomeSheet },
    ]);
  };

  const comparisonChartData = [
    {
      metric: 'Employed / Tech Careers',
      Blossom: comparison.employed.blossomPct + comparison.selfEmployed.blossomPct,
      NonBlossom: comparison.employed.nonBlossomPct + comparison.selfEmployed.nonBlossomPct,
    },
    {
      metric: 'Industrial Internship',
      Blossom: comparison.internship.blossomPct,
      NonBlossom: comparison.internship.nonBlossomPct,
    },
    {
      metric: 'Higher Education',
      Blossom: comparison.higherStudies.blossomPct,
      NonBlossom: comparison.higherStudies.nonBlossomPct,
    },
    {
      metric: 'Course Completion',
      Blossom: comparison.completed.blossomPct,
      NonBlossom: comparison.completed.nonBlossomPct,
    },
    {
      metric: 'Dropout Rate',
      Blossom: comparison.dropouts.blossomPct,
      NonBlossom: comparison.dropouts.nonBlossomPct,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              TIC360 Comprehensive Outcome Reports
            </h1>
            <Badge variant="blue">Official Audit & Analysis</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Standard reporting suites for Unicom TIC Training Centre & Blossom Trust Trustees
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMasterExcel}
            leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
          >
            Export All to Excel (.xlsx)
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Executive Report (PDF)
          </Button>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveReportTab('master')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeReportTab === 'master'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Overall Master Report
        </button>
        <button
          onClick={() => setActiveReportTab('monthly_att')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeReportTab === 'monthly_att'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Monthly Attendance
        </button>
        <button
          onClick={() => setActiveReportTab('low_att')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeReportTab === 'low_att'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Low Attendance (&lt;80%)
        </button>
        <button
          onClick={() => setActiveReportTab('blossom_pay')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeReportTab === 'blossom_pay'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Blossom Payments
        </button>
        <button
          onClick={() => setActiveReportTab('dropouts')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeReportTab === 'dropouts'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Dropouts Report
        </button>
        <button
          onClick={() => setActiveReportTab('academic')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeReportTab === 'academic'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Academic Marks
        </button>
        <button
          onClick={() => setActiveReportTab('completions')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeReportTab === 'completions'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Completions
        </button>
        <button
          onClick={() => setActiveReportTab('outcomes')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeReportTab === 'outcomes'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Student Outcomes
        </button>
        <button
          onClick={() => setActiveReportTab('comparison')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeReportTab === 'comparison'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Blossom vs Non-Blossom
        </button>
      </div>

      {/* Month & Filter Controls */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Academic Year"
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              options={[
                { value: '2026', label: '2026 Fiscal' },
                { value: '2027', label: '2027 Fiscal' },
              ]}
            />
            <Select
              label="Reporting Month"
              value={selectedMonthOnly}
              onChange={(e) => setSelectedMonthOnly(e.target.value)}
              options={[
                { value: '07', label: 'July 2026' },
                { value: '08', label: 'August 2026' },
                { value: '09', label: 'September 2026' },
              ]}
            />
            <Select
              label="Course Filter"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              options={[
                { value: 'all', label: 'All Courses' },
                ...courses.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* REPORT VIEW 1: OVERALL MASTER REPORT */}
      {activeReportTab === 'master' && (
        <div className="space-y-6">
          {/* Executive Header Banner */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-white">{orgProfile.orgName}</h2>
                <p className="text-xs text-slate-400">
                  TIC360 Master Executive Report • {orgProfile.trustName} • Month: {formatMonthName(selectedMonthString)}
                </p>
              </div>
              <Badge variant="emerald">Audit Verified</Badge>
            </div>

            {/* 6 High Level Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 py-4 border-b border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Total Trainees</span>
                <p className="text-lg font-extrabold text-white mt-0.5">{students.length}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Active</span>
                <p className="text-lg font-extrabold text-emerald-400 mt-0.5">
                  {students.filter((s) => s.currentStatus === 'Active').length}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Graduated</span>
                <p className="text-lg font-extrabold text-purple-400 mt-0.5">{completions.length}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Dropouts</span>
                <p className="text-lg font-extrabold text-rose-400 mt-0.5">{dropouts.length}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Blossom Paid</span>
                <p className="text-lg font-extrabold text-emerald-400 mt-0.5">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Employment Rate</span>
                <p className="text-lg font-extrabold text-cyan-400 mt-0.5">
                  {comparison.employed.blossomPct}%
                </p>
              </div>
            </div>

            {/* Blossom vs Non-Blossom Comparison in Master Report */}
            <div className="pt-6 space-y-3">
              <h3 className="text-sm font-bold text-white">
                Blossom Trust Scholars vs Non-Blossom Comparative Outcome Metrics
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                      formatter={(v: unknown) => [`${v}%`, '']}
                    />
                    <Legend />
                    <Bar name="Blossom Trust Scholars" dataKey="Blossom" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar name="Non-Blossom Students" dataKey="NonBlossom" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* REPORT VIEW 2: MONTHLY ATTENDANCE REPORT */}
      {activeReportTab === 'monthly_att' && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Monthly Attendance Report: {formatMonthName(selectedMonthString)}</CardTitle>
            <CardDescription>
              Total Records: {currentAtt.length} • Overall Batch Attendance Average: {Math.round(currentAtt.reduce((s, a) => s + a.attendancePercentage, 0) / (currentAtt.length || 1))}%
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-3">UT Number</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Course & Batch</th>
                  <th className="p-3">Attendance %</th>
                  <th className="p-3">Standing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {currentAtt.map((a) => (
                  <tr key={a.id}>
                    <td className="p-3 font-mono text-slate-400">{a.utNumber}</td>
                    <td className="p-3 font-bold text-slate-100">{a.studentName}</td>
                    <td className="p-3 text-slate-300">{a.courseName}</td>
                    <td className="p-3 font-mono font-bold text-white">{a.attendancePercentage.toFixed(1)}%</td>
                    <td className="p-3">
                      <Badge variant={a.attendancePercentage >= 80 ? 'active' : 'rose'}>{a.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* REPORT VIEW 3: LOW ATTENDANCE REPORT */}
      {activeReportTab === 'low_att' && (
        <Card className="overflow-hidden border-rose-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <CardTitle>Low Attendance Report (&lt;80% Threshold)</CardTitle>
            </div>
            <CardDescription>
              Students who forfeited Blossom Trust monthly support due to low attendance in {formatMonthName(selectedMonthString)}
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-3">UT Number</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Recorded Attendance</th>
                  <th className="p-3">Support Amount</th>
                  <th className="p-3">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {lowAttStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No students below 80% attendance in this month!
                    </td>
                  </tr>
                ) : (
                  lowAttStudents.map((a) => (
                    <tr key={a.id}>
                      <td className="p-3 font-mono text-slate-400">{a.utNumber}</td>
                      <td className="p-3 font-bold text-slate-100">{a.studentName}</td>
                      <td className="p-3 text-slate-300">{a.courseName}</td>
                      <td className="p-3 font-mono font-bold text-rose-400">{a.attendancePercentage.toFixed(1)}%</td>
                      <td className="p-3 font-mono text-slate-400 font-bold">LKR 0</td>
                      <td className="p-3">
                        <span className="text-rose-400 text-xs font-semibold">Payment Forfeited</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* REPORT VIEW 4: MONTHLY BLOSSOM PAYMENT REPORT */}
      {activeReportTab === 'blossom_pay' && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Monthly Blossom Trust Payment Report: {formatMonthName(selectedMonthString)}</CardTitle>
            <CardDescription>
              Complete disbursement audit showing eligible, low attendance forfeiture, and dropout suspensions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Eligible Scholars</span>
                <span className="text-lg font-bold text-emerald-400 mt-1 block">{eligiblePay.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Not Eligible (Low Att)</span>
                <span className="text-lg font-bold text-rose-400 mt-1 block">{notPaidLowAtt.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Stopped (Dropout)</span>
                <span className="text-lg font-bold text-rose-400 mt-1 block">{stoppedDropout.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Total Disbursed</span>
                <span className="text-lg font-bold text-blue-400 mt-1 block">{formatCurrency(totalPaid)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">Scholar</th>
                    <th className="p-3">Attendance %</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {currentPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3">
                        <p className="font-bold text-slate-100">{p.studentName}</p>
                        <p className="text-[10px] font-mono text-slate-400">{p.utNumber}</p>
                      </td>
                      <td className="p-3 font-mono font-bold">{p.attendancePercentage.toFixed(1)}%</td>
                      <td className="p-3 font-mono font-bold text-white">{formatCurrency(p.amount)}</td>
                      <td className="p-3">
                        <Badge variant={p.status === 'Paid' ? 'active' : p.isEligible ? 'blue' : 'rose'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-400 text-xs">{p.ineligibilityReason || 'Eligible (>80%)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* REPORT VIEW 5: BLOSSOM VS NON-BLOSSOM COMPARISON REPORT */}
      {activeReportTab === 'comparison' && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-white">
              Blossom Trust Scholars vs Non-Blossom Comparative Success Report
            </h2>
            <p className="text-xs text-slate-400">
              Detailed breakdown of employment, internships, degree pursuits, completion and retention rates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400">Blossom Trust Scholars ({comparison.totals.blossom} Students)</h3>
              <div className="space-y-2 text-slate-200">
                <div className="flex justify-between">
                  <span>Full-Time Employment / Careers:</span>
                  <span className="font-bold text-emerald-400">{comparison.employed.blossomPct}% ({comparison.employed.blossomCount})</span>
                </div>
                <div className="flex justify-between">
                  <span>Industrial Internships:</span>
                  <span className="font-bold text-blue-400">{comparison.internship.blossomPct}% ({comparison.internship.blossomCount})</span>
                </div>
                <div className="flex justify-between">
                  <span>Course Completion Rate:</span>
                  <span className="font-bold text-purple-400">{comparison.completed.blossomPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Dropout Rate:</span>
                  <span className="font-bold text-rose-400">{comparison.dropouts.blossomPct}%</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3">
              <h3 className="text-sm font-bold text-blue-400">Non-Blossom Students ({comparison.totals.nonBlossom} Students)</h3>
              <div className="space-y-2 text-slate-200">
                <div className="flex justify-between">
                  <span>Full-Time Employment / Careers:</span>
                  <span className="font-bold text-emerald-400">{comparison.employed.nonBlossomPct}% ({comparison.employed.nonBlossomCount})</span>
                </div>
                <div className="flex justify-between">
                  <span>Industrial Internships:</span>
                  <span className="font-bold text-blue-400">{comparison.internship.nonBlossomPct}% ({comparison.internship.nonBlossomCount})</span>
                </div>
                <div className="flex justify-between">
                  <span>Course Completion Rate:</span>
                  <span className="font-bold text-purple-400">{comparison.completed.nonBlossomPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Dropout Rate:</span>
                  <span className="font-bold text-rose-400">{comparison.dropouts.nonBlossomPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* REPORT VIEW 6: DROPOUTS REPORT */}
      {activeReportTab === 'dropouts' && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Monthly Dropout Report</CardTitle>
            <CardDescription>Breakdown by reason and potential rejoin status</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-3">Student</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Dropout Month</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Rejoin Possibility</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dropouts.map((d) => (
                  <tr key={d.id}>
                    <td className="p-3 font-bold text-slate-100">{d.studentName}</td>
                    <td className="p-3 text-slate-300">{d.courseName}</td>
                    <td className="p-3 font-mono">{d.dropoutMonth}</td>
                    <td className="p-3 font-bold text-rose-400">{d.reason}</td>
                    <td className="p-3">{d.rejoinPossibility}</td>
                    <td className="p-3 text-slate-400">{d.remarks || 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* REPORT VIEW 7: STUDENT OUTCOME REPORT */}
      {activeReportTab === 'outcomes' && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Student Outcome Status Report</CardTitle>
            <CardDescription>Post-graduation careers, higher studies, and industry roles</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-3">Student</th>
                  <th className="p-3">Blossom Trust</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Company / Institution</th>
                  <th className="p-3">Job Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {outcomes.map((o) => (
                  <tr key={o.id}>
                    <td className="p-3 font-bold text-slate-100">{o.studentName}</td>
                    <td className="p-3">{o.isBlossomTrust ? 'YES' : 'NO'}</td>
                    <td className="p-3 font-semibold text-emerald-400">{o.outcomeStatus}</td>
                    <td className="p-3 text-slate-200">{o.companyOrInstitution || '—'}</td>
                    <td className="p-3 text-slate-300">{o.jobTitle || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* REPORT VIEW 8: ACADEMIC REPORT */}
      {activeReportTab === 'academic' && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Academic & Assessment Report</CardTitle>
            <CardDescription>Assessment mark distributions across batches</CardDescription>
          </CardHeader>
          <div className="p-4">
            <p className="text-xs text-slate-300">
              Total {assessments.length} custom assessment columns active across courses with {assessmentMarks.length} recorded grading entries.
            </p>
          </div>
        </Card>
      )}

      {/* REPORT VIEW 9: COMPLETIONS REPORT */}
      {activeReportTab === 'completions' && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Course Completion & Graduation Report</CardTitle>
            <CardDescription>Certified graduates and capstone project submissions</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-3">Graduate</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {completions.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-bold text-slate-100">{c.studentName}</td>
                    <td className="p-3 text-slate-300">{c.courseName}</td>
                    <td className="p-3 font-mono">{formatDate(c.completionDate)}</td>
                    <td className="p-3 text-slate-200">{c.finalProjectName}</td>
                    <td className="p-3 font-bold text-purple-400">{c.overallGrade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
