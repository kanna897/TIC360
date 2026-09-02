'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Save,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Users,
  Percent,
  Calendar,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { exportToCSV, exportToExcel, formatMonthName } from '@/lib/utils';

export default function AttendancePage() {
  const {
    students,
    batches,
    courses,
    monthlyAttendance,
    recordAttendance,
    settings,
  } = useStore();

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthOnly, setSelectedMonthOnly] = useState<string>('08'); // '08' = August
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const selectedMonthString = `${selectedYear}-${selectedMonthOnly}`; // '2026-08'

  // Filter students for the selected batch
  const targetStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesBatch = selectedBatch === 'all' || s.batchId === selectedBatch;
      const matchesSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.utNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesBatch && matchesSearch;
    });
  }, [students, selectedBatch, searchQuery]);

  // Local state for table editing
  const [editingPercentages, setEditingPercentages] = useState<Record<string, number>>({});

  // Sync current month values into editing state when month or student list changes
  React.useEffect(() => {
    const initial: Record<string, number> = {};
    students.forEach((s) => {
      const existing = monthlyAttendance.find(
        (a) => a.studentId === s.id && a.month === selectedMonthString
      );
      initial[s.id] = existing ? existing.attendancePercentage : 85;
    });
    setEditingPercentages(initial);
  }, [selectedMonthString, students, monthlyAttendance]);

  const handlePercentageChange = (studentId: string, val: string) => {
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setEditingPercentages((prev) => ({ ...prev, [studentId]: num }));
  };

  const handleSaveAttendance = () => {
    const recordsToSave = targetStudents.map((s) => ({
      studentId: s.id,
      batchId: s.batchId,
      year: selectedYear,
      month: selectedMonthString,
      attendancePercentage: editingPercentages[s.id] ?? 85,
    }));

    recordAttendance(recordsToSave);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3500);
  };

  const handleExportCSV = () => {
    const exportData = targetStudents.map((s) => {
      const pct = editingPercentages[s.id] ?? 85;
      let status = 'Good Attendance';
      if (pct < settings.attendanceLowThreshold) status = 'Critical Attendance';
      else if (pct < settings.attendanceGoodThreshold) status = 'Low Attendance';

      return {
        UT_Number: s.utNumber,
        Student_Name: s.fullName,
        Course: s.courseName,
        Batch: s.batchName,
        Year: selectedYear,
        Month: selectedMonthString,
        Attendance_Percentage: pct,
        Status: status,
      };
    });

    exportToCSV(`TIC360_Attendance_${selectedMonthString}`, exportData);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Monthly Attendance Register
            </h1>
            <Badge variant="blue">Historical by Month</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Month-by-month student attendance records with automatic threshold status & Blossom support eligibility
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Attendance CSV
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handleSaveAttendance}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Attendance
          </Button>
        </div>
      </div>

      {/* Month & Batch Selector Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
            {/* Year Selector */}
            <Select
              label="Academic Year"
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              options={[
                { value: '2026', label: '2026 Academic Year' },
                { value: '2027', label: '2027 Academic Year' },
              ]}
            />

            {/* Month Selector */}
            <Select
              label="Target Month"
              value={selectedMonthOnly}
              onChange={(e) => setSelectedMonthOnly(e.target.value)}
              options={[
                { value: '01', label: 'January' },
                { value: '02', label: 'February' },
                { value: '03', label: 'March' },
                { value: '04', label: 'April' },
                { value: '05', label: 'May' },
                { value: '06', label: 'June' },
                { value: '07', label: 'July' },
                { value: '08', label: 'August' },
                { value: '09', label: 'September' },
                { value: '10', label: 'October' },
                { value: '11', label: 'November' },
                { value: '12', label: 'December' },
              ]}
            />

            {/* Batch Selector */}
            <Select
              label="Assigned Batch"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              options={[
                { value: 'all', label: 'All Active Batches' },
                ...batches.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />

            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Filter Student
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or UT#..."
                className="w-full rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder:text-slate-500 px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Success Alert */}
      {isSavedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 font-semibold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Attendance for {formatMonthName(selectedMonthString)} saved and Blossom monthly payments recalculated!
            </span>
          </div>
        </div>
      )}

      {/* Attendance Register Table */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Attendance Register: {formatMonthName(selectedMonthString)}</CardTitle>
              <CardDescription>
                Thresholds: Good (&gt;= {settings.attendanceGoodThreshold}%), Low ({settings.attendanceLowThreshold}-{settings.attendanceGoodThreshold - 1}%), Critical (&lt; {settings.attendanceLowThreshold}%)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const updated: Record<string, number> = {};
                  targetStudents.forEach((s) => (updated[s.id] = 100));
                  setEditingPercentages((prev) => ({ ...prev, ...updated }));
                }}
              >
                Set All 100%
              </Button>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4 sm:px-6">Student</th>
                <th className="py-3 px-4">Course & Batch</th>
                <th className="py-3 px-4">Blossom Support</th>
                <th className="py-3 px-4 w-44">Attendance % (Input)</th>
                <th className="py-3 px-4">Status & Rule Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {targetStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No students found for this batch.
                  </td>
                </tr>
              ) : (
                targetStudents.map((stu) => {
                  const pct = editingPercentages[stu.id] ?? 85;

                  let statusBadge = <Badge variant="active">Good Attendance</Badge>;
                  let impactNotice = 'Eligible for Monthly Support';

                  if (stu.currentStatus === 'Dropout') {
                    statusBadge = <Badge variant="rose">Dropout</Badge>;
                    impactNotice = 'Payment Stopped (Dropout)';
                  } else if (pct < settings.attendanceLowThreshold) {
                    statusBadge = <Badge variant="rose">Critical Attendance</Badge>;
                    impactNotice = 'Forfeits Support (LKR 0)';
                  } else if (pct < settings.attendanceGoodThreshold) {
                    statusBadge = <Badge variant="pending">Low Attendance</Badge>;
                    impactNotice = 'Forfeits Support (LKR 0)';
                  }

                  return (
                    <tr key={stu.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <p className="font-bold text-slate-100">{stu.fullName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{stu.utNumber}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-200">{stu.courseName}</p>
                        <p className="text-[11px] text-slate-400">{stu.batchName}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {stu.isBlossomTrust ? (
                          <span className="text-emerald-400 font-bold text-xs">Blossom Scholar</span>
                        ) : (
                          <span className="text-slate-400 text-xs">Self-Funded</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={pct}
                            onChange={(e) => handlePercentageChange(stu.id, e.target.value)}
                            className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
                          />
                          <span className="font-bold text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div>{statusBadge}</div>
                          {stu.isBlossomTrust && (
                            <span
                              className={`text-[10px] block font-medium ${
                                pct < settings.attendanceGoodThreshold || stu.currentStatus === 'Dropout'
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {impactNotice}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
