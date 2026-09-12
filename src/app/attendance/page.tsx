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
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { AttendanceSession, AttendanceMark, Student } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { exportToCSV, exportToExcel, formatMonthName } from '@/lib/utils';
import { FingerprintUploadModal } from '@/components/attendance/FingerprintUploadModal';

export default function AttendancePage() {
  const {
    students,
    batches,
    attendanceSessions,
    attendanceMarks,
    addAttendanceSession,
    updateAttendanceSession,
    deleteAttendanceSession,
    setDailyMark,
    batchSetDailyMarks,
    markAllPresentForSession,
    saveAttendanceMatrix,
    settings,
    currentRole,
  } = useStore();

  const [selectedGroup, setSelectedGroup] = useState<'Full Stack - Group A' | 'Full Stack - Group B' | 'Frontend Developer' | 'all'>('Full Stack - Group A');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthOnly, setSelectedMonthOnly] = useState<string>('04'); // Default '04' = April (Matches user's Excel)
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Modals
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = useState(false);
  const [isFingerprintModalOpen, setIsFingerprintModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AttendanceSession | null>(null);

  // Add Session Form
  const [newSessionForm, setNewSessionForm] = useState({
    subject: 'JAVASCRIPT & DOM',
    date: '2026-04-12',
    group: 'Group A' as string,
  });

  const selectedMonthString = `${selectedYear}-${selectedMonthOnly}`; // '2026-04'

  // Filter students by selected Group and Batch
  const groupStudents = useMemo(() => {
    return students.filter((s) => {
      // Hide dummy students created via Blossom Excel import from attendance view
      if (s.isDummy) return false;

      const isFrontend = s.courseName === 'Frontend Developer' || s.courseId === 'Frontend Developer';
      const isFullStack = !isFrontend;

      let matchesGroup = false;
      if (selectedGroup === 'all') matchesGroup = true;
      else if (selectedGroup === 'Full Stack - Group A') {
        matchesGroup = isFullStack && (s.group === 'Group A' || s.group === 'A');
      } else if (selectedGroup === 'Full Stack - Group B') {
        matchesGroup = isFullStack && (s.group === 'Group B' || s.group === 'B');
      } else if (selectedGroup === 'Frontend Developer') {
        matchesGroup = isFrontend;
      }
      const matchesBatch = selectedBatch === 'all' || s.batchId === selectedBatch;
      const matchesSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.utNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesBatch && matchesSearch;
    });
  }, [students, selectedGroup, selectedBatch, searchQuery]);

  const monthSessions = useMemo(() => {
    return attendanceSessions
      .filter((ses) => {
        const matchesMonth = ses.month === selectedMonthString;
        
        let targetGroup = 'All';
        if (selectedGroup === 'Full Stack - Group A') targetGroup = 'Group A';
        if (selectedGroup === 'Full Stack - Group B') targetGroup = 'Group B';
        if (selectedGroup === 'Frontend Developer') targetGroup = 'Frontend Developer';

        const matchesGroup =
          selectedGroup === 'all' ||
          ses.group === 'All' ||
          ses.group === targetGroup ||
          ses.group === (selectedGroup as string) ||
          (targetGroup === 'Group A' && ses.group === ('A' as any));
          
        return matchesMonth && matchesGroup;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [attendanceSessions, selectedMonthString, selectedGroup]);

  // Handle cell click (Toggle: P -> A -> L -> P)
  const handleToggleCell = (sessionId: string, studentId: string) => {
    const stu = students.find(s => s.id === studentId);
    const currentMark = attendanceMarks[sessionId]?.[studentId] ?? (stu?.currentStatus === 'Dropout' ? 'A' : 'P');
    let nextMark: AttendanceMark = 'P';
    if (currentMark === 'P') nextMark = 'A';
    else if (currentMark === 'A') nextMark = 'L';
    else nextMark = 'P';

    setDailyMark(sessionId, studentId, nextMark);
  };

  // Quick action: Mark all students in current view present for a session
  const handleMarkAllPresent = (sessionId: string) => {
    markAllPresentForSession(
      sessionId,
      groupStudents.map((s) => s.id)
    );
  };

  // Quick action: Mark all present for all sessions of the month
  const handleMarkAllMonthPresent = () => {
    monthSessions.forEach((ses) => {
      markAllPresentForSession(
        ses.id,
        groupStudents.map((s) => s.id)
      );
    });
  };

  // Add new session submit
  const handleAddSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionForm.subject || !newSessionForm.date) return;

    const [y, m, d] = newSessionForm.date.split('-');
    const displayDate = `${d}.${m}.${y}`;
    const sessionMonth = `${y}-${m}`;

    addAttendanceSession({
      subject: newSessionForm.subject.toUpperCase(),
      date: newSessionForm.date,
      displayDate,
      group: newSessionForm.group,
      month: sessionMonth,
      batchId: selectedBatch !== 'all' ? selectedBatch : 'BAT-2026',
    });

    setIsAddSessionModalOpen(false);
  };

  // Edit session submit
  const handleEditSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    const [y, m, d] = editingSession.date.split('-');
    const displayDate = `${d}.${m}.${y}`;
    const sessionMonth = `${y}-${m}`;

    updateAttendanceSession(editingSession.id, {
      subject: editingSession.subject.toUpperCase(),
      date: editingSession.date,
      displayDate,
      month: sessionMonth,
      group: editingSession.group,
    });

    setIsEditSessionModalOpen(false);
    setEditingSession(null);
  };

  // Save Attendance Matrix & Recalculate Blossom Payments
  const handleSaveAttendance = () => {
    saveAttendanceMatrix(selectedMonthString, selectedGroup, attendanceSessions, attendanceMarks);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 4000);
  };

  // Export to Excel Matching User's Exact Format
  const handleExportMatrixExcel = () => {
    const exportData = groupStudents.map((stu, index) => {
      const row: Record<string, any> = {
        'S. NO': index + 1,
        'UT NO': stu.utNumber,
        "STUDENT'S NAME": stu.fullName,
      };

      let pCount = 0;
      let aCount = 0;
      let lCount = 0;

      monthSessions.forEach((ses) => {
        const mark = attendanceMarks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P');
        row[`${ses.subject}\n${ses.displayDate}`] = mark;
        if (mark === 'P') pCount += 1;
        else if (mark === 'A') aCount += 1;
        else if (mark === 'L') lCount += 1;
      });

      const totalHeld = monthSessions.length;
      const pct = totalHeld > 0 ? Math.round((pCount / totalHeld) * 100) : 100;

      row['L'] = lCount;
      row['A'] = aCount;
      row['P'] = pCount;
      row['total'] = totalHeld;
      row['%'] = `${pct}%`;

      return row;
    });

    // Summary Row
    const summaryRow: Record<string, any> = {
      'S. NO': '',
      'UT NO': 'TOTAL PRESENT',
      "STUDENT'S NAME": '',
    };
    monthSessions.forEach((ses) => {
      let presentSum = 0;
      groupStudents.forEach((stu) => {
        const mark = attendanceMarks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P');
        if (mark === 'P') presentSum += 1;
      });
      summaryRow[`${ses.subject}\n${ses.displayDate}`] = presentSum;
    });

    exportToExcel(`TIC360_${selectedGroup.replace(' ', '_')}_Attendance_${selectedMonthString}`, [
      {
        sheetName: `${selectedGroup} Attendance`,
        data: [...exportData, summaryRow],
      },
    ]);
  };

  // Export CSV
  const handleExportCSV = () => {
    const exportData = groupStudents.map((stu, index) => {
      let pCount = 0;
      let aCount = 0;
      let lCount = 0;

      monthSessions.forEach((ses) => {
        const mark = attendanceMarks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P');
        if (mark === 'P') pCount += 1;
        else if (mark === 'A') aCount += 1;
        else if (mark === 'L') lCount += 1;
      });

      const totalHeld = monthSessions.length;
      const pct = totalHeld > 0 ? Math.round((pCount / totalHeld) * 100) : 100;

      return {
        No: index + 1,
        UT_Number: stu.utNumber,
        Student_Name: stu.fullName,
        Group: stu.group || 'Group A',
        Month: selectedMonthString,
        Sessions_Held: totalHeld,
        Presents: pCount,
        Absents: aCount,
        Leaves: lCount,
        Attendance_Percentage: `${pct}%`,
        Blossom_Status: pct >= 80 ? 'Eligible (>=80%)' : 'Critical (<80%)',
      };
    });

    exportToCSV(`TIC360_Attendance_${selectedGroup}_${selectedMonthString}`, exportData);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-emerald-400" />
              <span>Student Attendance Matrix & Daily Subject Register</span>
            </h1>
            <Badge variant="emerald">{groupStudents.length} Students in View</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Group-based daily session attendance tracking with manual subject updates, 1-click P/A marking, and Blossom 80% rule compliance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setNewSessionForm({
                subject: 'JAVASCRIPT & LAB',
                date: `${selectedYear}-${selectedMonthOnly}-15`,
                group: selectedGroup === 'all' ? 'Group A' : selectedGroup,
              });
              setIsAddSessionModalOpen(true);
            }}
            className="bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200"
            leftIcon={<Plus className="w-4 h-4 text-emerald-400" />}
          >
            ➕ Add Class Session / Date
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFingerprintModalOpen(true)}
            leftIcon={<UploadCloud className="w-4 h-4 text-blue-400" />}
          >
            Upload Fingerprint CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMatrixExcel}
            leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
          >
            Export Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>

          <Button
            variant="success"
            size="sm"
            onClick={handleSaveAttendance}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save & Sync Attendance
          </Button>
        </div>
      </div>

      {/* Main 2-Tab Switcher (Matching Exact Green Pill Design) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: FULL STACK - GROUP A */}
          <button
            onClick={() => setSelectedGroup('Full Stack - Group A')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 ${
              selectedGroup === 'Full Stack - Group A'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👨‍💻 FULL STACK - GROUP &quot;A&quot;</span>
          </button>

          {/* Tab 2: FULL STACK - GROUP B */}
          <button
            onClick={() => setSelectedGroup('Full Stack - Group B')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 ${
              selectedGroup === 'Full Stack - Group B'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👨‍💻 FULL STACK - GROUP &quot;B&quot;</span>
          </button>

          {/* Tab 3: FRONTEND DEVELOPER */}
          <button
            onClick={() => setSelectedGroup('Frontend Developer')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 ${
              selectedGroup === 'Frontend Developer'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>⚛️ FRONTEND DEVELOPER</span>
          </button>


        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 hidden lg:flex pr-2">
          <span className="font-semibold text-slate-300">
            {formatMonthName(selectedMonthString)} &bull; {monthSessions.length} Sessions Logged
          </span>
        </div>
      </div>

      {/* Month & Batch Filter Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
            {/* Month Selector */}
            <Select
              label="Target Academic Month"
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

            {/* Academic Year */}
            <Select
              label="Academic Year"
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              options={[
                { value: '2026', label: '2026 Academic Year' },
                { value: '2027', label: '2027 Academic Year' },
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

            {/* Student Search */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Search Trainee
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or UT#..."
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder:text-slate-500 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
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
              Attendance matrix for {formatMonthName(selectedMonthString)} ({selectedGroup}) saved successfully! Blossom monthly stipends and student profiles updated.
            </span>
          </div>
        </div>
      )}

      {/* QUICK INSTRUCTIONS & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-300">Cell Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-emerald-600 text-white font-extrabold flex items-center justify-center text-[11px]">P</span>
            <span className="text-slate-300 font-medium">= Present (Green)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-rose-600 text-white font-extrabold flex items-center justify-center text-[11px]">A</span>
            <span className="text-slate-300 font-medium">= Absent (Red)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-amber-500 text-white font-extrabold flex items-center justify-center text-[11px]">L</span>
            <span className="text-slate-300 font-medium">= Late (Amber)</span>
          </span>
          <span className="text-slate-400 italic hidden sm:inline">&bull; Click any cell to toggle P &harr; A &harr; L</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleMarkAllMonthPresent}
            className="text-[11px] py-1 h-7"
          >
            ⚡ Mark All Present for Month
          </Button>
        </div>
      </div>

      {/* ATTENDANCE MATRIX TABLE (EXACT REPLICA OF EXCEL SHEET) */}
      <div className="rounded-2xl border-2 border-emerald-500/60 bg-slate-950/95 shadow-2xl overflow-hidden animate-fadeIn">
        {/* Table Title Banner */}
        <div className="px-6 py-3 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-white uppercase tracking-wider">
              {selectedGroup === 'all' ? 'All Groups' : selectedGroup} Students Attendance Details
            </span>
            <Badge variant="blue">{formatMonthName(selectedMonthString)}</Badge>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {monthSessions.length} Class Dates &bull; {groupStudents.length} Registered Students
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* ROW 1: SUBJECTS / TOPICS */}
              <tr className="bg-slate-900/90 text-slate-200 border-b border-slate-800">
                <th className="py-2.5 px-2 text-center w-8 text-slate-400 font-bold border-r border-slate-800 sticky left-0 bg-slate-900 z-10">
                  S. NO
                </th>
                <th className="py-2.5 px-3 text-white font-mono font-extrabold whitespace-nowrap border-r border-slate-800 sticky left-10 bg-slate-900 z-10">
                  UT NO
                </th>
                <th className="py-2.5 px-4 text-slate-100 font-bold whitespace-nowrap min-w-[200px] border-r border-slate-800 sticky left-36 bg-slate-900 z-10 shadow-lg">
                  STUDENT&apos;S NAME
                </th>

                {/* Dynamic Subject Headers */}
                {monthSessions.map((ses) => (
                  <th
                    key={`subj-${ses.id}`}
                    className="p-1 text-center font-bold text-[10px] text-slate-200 border-r border-slate-800/80 bg-slate-900/70 min-w-[58px] max-w-[70px] select-none hover:bg-slate-800/60 transition-colors group cursor-pointer"
                    title={`Click to edit subject: ${ses.subject}`}
                    onClick={() => {
                      setEditingSession(ses);
                      setIsEditSessionModalOpen(true);
                    }}
                  >
                    <div className="flex flex-col items-center justify-center py-1">
                      <span className="text-[9px] font-extrabold text-indigo-300 line-clamp-2 leading-tight uppercase">
                        {ses.subject}
                      </span>
                      <Edit2 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                    </div>
                  </th>
                ))}

                {/* Right Summary Headers */}
                <th className="py-2.5 px-2 text-center w-8 text-amber-400 font-extrabold border-r border-slate-800 bg-slate-900">
                  L
                </th>
                <th className="py-2.5 px-2 text-center w-8 text-rose-400 font-extrabold border-r border-slate-800 bg-slate-900">
                  A
                </th>
                <th className="py-2.5 px-2 text-center w-8 text-emerald-400 font-extrabold border-r border-slate-800 bg-slate-900">
                  P
                </th>
                <th className="py-2.5 px-2.5 text-center w-12 text-slate-300 font-extrabold border-r border-slate-800 bg-slate-900">
                  total
                </th>
                <th className="py-2.5 px-3 text-center w-16 text-white font-extrabold bg-slate-900">
                  %
                </th>
              </tr>

              {/* ROW 2: DATES */}
              <tr className="bg-slate-900/80 text-slate-300 border-b-2 border-slate-700 text-[10px]">
                <th className="py-2 px-2 border-r border-slate-800 sticky left-0 bg-slate-900 z-10"></th>
                <th className="py-2 px-3 border-r border-slate-800 sticky left-10 bg-slate-900 z-10"></th>
                <th className="py-2 px-4 border-r border-slate-800 sticky left-36 bg-slate-900 z-10 font-bold text-slate-400">
                  Class Session Dates &darr;
                </th>

                {/* Date Columns */}
                {monthSessions.map((ses) => (
                  <th
                    key={`date-${ses.id}`}
                    className="py-1.5 px-1 text-center font-mono font-bold text-[10px] text-slate-200 border-r border-slate-800/80 bg-slate-900/90 whitespace-nowrap"
                  >
                    {ses.displayDate}
                  </th>
                ))}

                {/* Right Summary Columns */}
                <th className="py-1 px-1 border-r border-slate-800 bg-slate-900 text-[9px] text-amber-400 text-center font-bold">Late</th>
                <th className="py-1 px-1 border-r border-slate-800 bg-slate-900 text-[9px] text-slate-400 text-center">Absent</th>
                <th className="py-1 px-1 border-r border-slate-800 bg-slate-900 text-[9px] text-slate-400 text-center">Present</th>
                <th className="py-1 px-1 border-r border-slate-800 bg-slate-900 text-[9px] text-slate-400 text-center">Sessions</th>
                <th className="py-1 px-1 bg-slate-900 text-[9px] text-slate-400 text-center">Ratio</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium">
              {groupStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={monthSessions.length + 8}
                    className="py-12 text-center text-sm text-slate-400"
                  >
                    No students found for this group/batch. Click &quot;➕ Add Class Session&quot; to begin.
                  </td>
                </tr>
              ) : (
                groupStudents.map((stu, index) => {
                  let pCount = 0;
                  let aCount = 0;
                  let lCount = 0;

                  monthSessions.forEach((ses) => {
                    const mark = attendanceMarks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P');
                    if (mark === 'P') pCount += 1;
                    else if (mark === 'A') aCount += 1;
                    else if (mark === 'L') lCount += 1;
                  });

                  const totalHeld = monthSessions.length;
                  const pct = totalHeld > 0 ? Math.round((pCount / totalHeld) * 100) : 100;
                  const meetsThreshold = pct >= settings.paymentEligibilityAttendanceThreshold;

                  return (
                    <tr
                      key={stu.id}
                      className="hover:bg-slate-900/60 transition-colors group border-b border-slate-800/40"
                    >
                      {/* S. NO */}
                      <td className="py-2 px-2 text-center font-bold text-slate-400 border-r border-slate-800 sticky left-0 bg-slate-950 group-hover:bg-slate-900 z-10">
                        {index + 1}
                      </td>

                      {/* UT NO */}
                      <td className={`py-2 px-3 font-black text-sm font-mono border-r border-slate-800 whitespace-nowrap sticky left-10 bg-slate-950 group-hover:bg-slate-900 z-10 tracking-wide ${stu.currentStatus === 'Dropout' ? 'text-rose-500 line-through decoration-rose-500/50' : 'text-cyan-300'}`}>
                        {stu.utNumber}
                      </td>

                      {/* STUDENT'S NAME */}
                      <td className={`py-2 px-4 whitespace-nowrap font-extrabold text-sm transition-colors border-r border-slate-800 sticky left-36 bg-slate-950 group-hover:bg-slate-900 z-10 shadow-lg ${stu.currentStatus === 'Dropout' ? 'text-rose-400 group-hover:text-rose-300' : 'text-white group-hover:text-emerald-300'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={stu.currentStatus === 'Dropout' ? 'line-through decoration-rose-500/50' : ''}>{stu.fullName}</span>
                          <div className="flex gap-1 items-center">
                            {stu.currentStatus === 'Dropout' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-500/30 font-extrabold">
                                DROPOUT
                              </span>
                            )}
                            {stu.isBlossomTrust && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-extrabold">
                                🌸
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SESSION P/A CELLS */}
                      {monthSessions.map((ses) => {
                        const mark = attendanceMarks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P');

                        return (
                          <td
                            key={`cell-${ses.id}-${stu.id}`}
                            className="p-0.5 text-center border-r border-slate-800/60 select-none"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleCell(ses.id, stu.id)}
                              className={`w-6 h-6 rounded font-bold text-[10px] transition-all duration-150 flex items-center justify-center mx-auto shadow-sm active:scale-90 ${
                                mark === 'P'
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : mark === 'A'
                                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                  : 'bg-amber-500 hover:bg-amber-400 text-white'
                              }`}
                              title={`Click to toggle attendance for ${stu.fullName} on ${ses.displayDate}`}
                            >
                              {mark}
                            </button>
                          </td>
                        );
                      })}

                      {/* L Count */}
                      <td className="py-2 px-2 text-center font-bold text-amber-400 border-r border-slate-800 bg-slate-900/40">
                        {lCount}
                      </td>

                      {/* A Count */}
                      <td className="py-2 px-2 text-center font-bold text-rose-400 border-r border-slate-800 bg-slate-900/40">
                        {aCount}
                      </td>

                      {/* P Count */}
                      <td className="py-2 px-2 text-center font-bold text-emerald-400 border-r border-slate-800 bg-slate-900/40">
                        {pCount}
                      </td>

                      {/* Total Sessions */}
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-300 border-r border-slate-800 bg-slate-900/40">
                        {totalHeld}
                      </td>

                      {/* % Attendance */}
                      <td className="py-2 px-2 text-center bg-slate-900/60">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-extrabold text-[11px] ${
                            meetsThreshold
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* BOTTOM SUMMARY ROW 1: TOTAL (Present Count) */}
              <tr className="bg-amber-300 text-slate-950 font-black border-t-2 border-slate-700 text-xs select-none">
                <td className="py-2 px-2 text-center border-r border-amber-400 sticky left-0 bg-amber-300 z-10"></td>
                <td className="py-2 px-3 border-r border-amber-400 sticky left-10 bg-amber-300 z-10"></td>
                <td className="py-2 px-4 uppercase font-black tracking-wider text-right border-r border-amber-400 sticky left-36 bg-amber-300 z-10 shadow-lg">
                  TOTAL PRESENT (P)
                </td>

                {/* Sum of Presents for each session */}
                {monthSessions.map((ses) => {
                  let presentCount = 0;
                  groupStudents.forEach((stu) => {
                    const mark = attendanceMarks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P');
                    if (mark === 'P') presentCount += 1;
                  });

                  return (
                    <td
                      key={`total-p-${ses.id}`}
                      className="py-2 px-1 text-center font-black border-r border-amber-400 text-xs"
                    >
                      {presentCount}
                    </td>
                  );
                })}

                <td className="py-2 px-2 text-center border-r border-amber-400">
                  {groupStudents.reduce((sum, stu) => {
                    let l = 0;
                    monthSessions.forEach((ses) => {
                      if ((attendanceMarks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P')) === 'L') l += 1;
                    });
                    return sum + l;
                  }, 0)}
                </td>
                <td className="py-2 px-2 text-center border-r border-amber-400">
                  {groupStudents.reduce((sum, stu) => {
                    let a = 0;
                    monthSessions.forEach((ses) => {
                      if ((attendanceMarks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P')) === 'A') a += 1;
                    });
                    return sum + a;
                  }, 0)}
                </td>
                <td className="py-2 px-2 text-center border-r border-amber-400">
                  {groupStudents.reduce((sum, stu) => {
                    let p = 0;
                    monthSessions.forEach((ses) => {
                      if ((attendanceMarks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P')) === 'P') p += 1;
                    });
                    return sum + p;
                  }, 0)}
                </td>
                <td className="py-2 px-2.5 text-center border-r border-amber-400 font-mono">
                  {monthSessions.length * groupStudents.length}
                </td>
                <td className="py-2 px-2 text-center font-mono font-black">
                  {monthSessions.length * groupStudents.length > 0
                    ? `${Math.round(
                        (groupStudents.reduce((sum, stu) => {
                          let p = 0;
                          monthSessions.forEach((ses) => {
                            if ((attendanceMarks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P')) === 'P') p += 1;
                          });
                          return sum + p;
                        }, 0) /
                          (monthSessions.length * groupStudents.length)) *
                          100
                      )}%`
                    : '100%'}
                </td>
              </tr>

              {/* BOTTOM SUMMARY ROW 2: TOTAL S NO */}
              <tr className="bg-slate-200 text-slate-900 font-bold border-t border-slate-300 text-xs select-none">
                <td className="py-1.5 px-2 text-center border-r border-slate-300 sticky left-0 bg-slate-200 z-10"></td>
                <td className="py-1.5 px-3 border-r border-slate-300 sticky left-10 bg-slate-200 z-10"></td>
                <td className="py-1.5 px-4 uppercase font-bold tracking-wider text-right border-r border-slate-300 sticky left-36 bg-slate-200 z-10 shadow-lg text-[11px]">
                  TOTAL S NO (STUDENTS)
                </td>

                {monthSessions.map((ses) => (
                  <td
                    key={`total-sno-${ses.id}`}
                    className="py-1.5 px-1 text-center font-bold border-r border-slate-300 text-xs"
                  >
                    {groupStudents.length}
                  </td>
                ))}

                <td colSpan={5} className="py-1.5 px-2 text-center font-bold text-xs">
                  {groupStudents.length} Students Registered in {selectedGroup}
                </td>
              </tr>

              {/* BOTTOM SUMMARY ROW 3: TOTAL % */}
              <tr className="bg-sky-200 text-sky-950 font-black border-t border-slate-300 text-xs select-none">
                <td className="py-1.5 px-2 text-center border-r border-sky-300 sticky left-0 bg-sky-200 z-10"></td>
                <td className="py-1.5 px-3 border-r border-sky-300 sticky left-10 bg-sky-200 z-10"></td>
                <td className="py-1.5 px-4 uppercase font-black tracking-wider text-right border-r border-sky-300 sticky left-36 bg-sky-200 z-10 shadow-lg text-[11px]">
                  TOTAL % (DAILY ATTENDANCE)
                </td>

                {monthSessions.map((ses) => {
                  let presentCount = 0;
                  groupStudents.forEach((stu) => {
                    const mark = attendanceMarks[ses.id]?.[stu.id] ?? (stu.currentStatus === 'Dropout' ? 'A' : 'P');
                    if (mark === 'P') presentCount += 1;
                  });
                  const dailyPct =
                    groupStudents.length > 0
                      ? Math.round((presentCount / groupStudents.length) * 100)
                      : 100;

                  return (
                    <td
                      key={`daily-pct-${ses.id}`}
                      className="py-1.5 px-1 text-center font-black border-r border-sky-300 text-xs"
                    >
                      {dailyPct}%
                    </td>
                  );
                })}

                <td colSpan={5} className="py-1.5 px-2 text-center font-black text-xs">
                  Target Compliance: &gt;= 80% (Blossom Trust Rule)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD CLASS SESSION MODAL */}
      <Modal
        isOpen={isAddSessionModalOpen}
        onClose={() => setIsAddSessionModalOpen(false)}
        title="Add Class Session / Date Column"
        subtitle="Create a new class date with custom subject/module title"
        maxWidth="md"
      >
        <form onSubmit={handleAddSessionSubmit} className="space-y-4">
          <Input
            label="Subject / Topic Title *"
            placeholder="e.g. HTML & LAB, JAVASCRIPT, REACT HOOKS"
            value={newSessionForm.subject}
            onChange={(e) =>
              setNewSessionForm({ ...newSessionForm, subject: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Session Date *"
              type="date"
              value={newSessionForm.date}
              onChange={(e) =>
                setNewSessionForm({ ...newSessionForm, date: e.target.value })
              }
            />

            <Select
              label="Assigned Group *"
              value={newSessionForm.group}
              onChange={(e) =>
                setNewSessionForm({
                  ...newSessionForm,
                  group: e.target.value as 'Group A' | 'Group B' | 'All',
                })
              }
              options={[
                { value: 'Group A', label: 'Group A' },
                { value: 'Group B', label: 'Group B' },
                { value: 'All', label: 'All Groups (Shared Session)' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddSessionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Session Column
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT CLASS SESSION MODAL */}
      <Modal
        isOpen={isEditSessionModalOpen}
        onClose={() => {
          setIsEditSessionModalOpen(false);
          setEditingSession(null);
        }}
        title="Edit Subject & Session Date"
        subtitle="Update module title or date for this attendance column"
        maxWidth="md"
      >
        {editingSession && (
          <form onSubmit={handleEditSessionSubmit} className="space-y-4">
            <Input
              label="Subject / Topic Title *"
              placeholder="e.g. JAVASCRIPT & DOM"
              value={editingSession.subject}
              onChange={(e) =>
                setEditingSession({ ...editingSession, subject: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Session Date *"
                type="date"
                value={editingSession.date}
                onChange={(e) =>
                  setEditingSession({ ...editingSession, date: e.target.value })
                }
              />

              <Select
                label="Assigned Group *"
                value={editingSession.group}
                onChange={(e) =>
                  setEditingSession({
                    ...editingSession,
                    group: e.target.value as 'Group A' | 'Group B' | 'All',
                  })
                }
                options={[
                  { value: 'Group A', label: 'Group A' },
                  { value: 'Group B', label: 'Group B' },
                  { value: 'All', label: 'All Groups' },
                ]}
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete session "${editingSession.subject}" (${editingSession.displayDate})?`)) {
                    deleteAttendanceSession(editingSession.id);
                    setIsEditSessionModalOpen(false);
                    setEditingSession(null);
                  }
                }}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete Column
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsEditSessionModalOpen(false);
                    setEditingSession(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Fingerprint CSV Upload Modal */}
      <FingerprintUploadModal
        isOpen={isFingerprintModalOpen}
        onClose={() => setIsFingerprintModalOpen(false)}
      />
    </div>
  );
}
