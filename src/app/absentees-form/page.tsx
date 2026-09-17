'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Calendar,
  User,
  Hash,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { AbsenceRequest } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export default function AbsenteesFormPage() {
  const { students, absenceRequests, submitAbsenceRequest, updateAbsenceRequestStatus, currentRole } = useStore();

  const [activeTab, setActiveTab] = useState<'form' | 'ledger'>('form');

  // Form State
  const [utNumber, setUtNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [studentId, setStudentId] = useState('');

  // UI state
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Ledger Filter State
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Submitted' | 'Approved' | 'Rejected'>('all');

  // Autocomplete UT selection
  const filteredStudents = useMemo(() => {
    if (!utNumber) return [];
    const q = utNumber.trim().toUpperCase();
    return students
      .filter((s) => s.utNumber.toUpperCase().includes(q) || s.fullName.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 6);
  }, [students, utNumber]);

  const handleSelectStudent = (stu: (typeof students)[0]) => {
    setUtNumber(stu.utNumber);
    setFullName(stu.fullName);
    setStudentId(stu.id);
  };

  const handleUtChange = (val: string) => {
    setUtNumber(val);
    const exact = students.find((s) => s.utNumber.toUpperCase() === val.trim().toUpperCase());
    if (exact) {
      setFullName(exact.fullName);
      setStudentId(exact.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!utNumber.trim()) {
      setErrorMessage('Please provide a valid UT number.');
      return;
    }
    if (!fromDate) {
      setErrorMessage('Please select the first day of absence (From Date).');
      return;
    }
    if (!toDate) {
      setErrorMessage('Please select the last day of absence (To Date).');
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setErrorMessage('The "To Date" cannot be earlier than the "From Date".');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Please provide a reason for absence.');
      return;
    }

    // Lookup student ID if not set
    let finalStudentId = studentId;
    let finalFullName = fullName.trim();
    const matched = students.find((s) => s.utNumber.toUpperCase() === utNumber.trim().toUpperCase());
    if (matched) {
      finalStudentId = matched.id;
      if (!finalFullName) finalFullName = matched.fullName;
    }

    submitAbsenceRequest({
      studentId: finalStudentId || `STU-${utNumber.trim().toUpperCase()}`,
      utNumber: utNumber.trim().toUpperCase(),
      fullName: finalFullName || utNumber.trim().toUpperCase(),
      fromDate,
      toDate,
      reason: reason.trim(),
    });

    setIsSubmittedSuccess(true);
    setLastSubmittedId(utNumber.trim().toUpperCase());

    // Reset Form
    setUtNumber('');
    setFullName('');
    setFromDate('');
    setToDate('');
    setReason('');
    setStudentId('');
  };

  // Filtered requests for the Ledger tab
  const displayedRequests = useMemo(() => {
    return absenceRequests.filter((req) => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        req.utNumber.toLowerCase().includes(q) ||
        req.fullName.toLowerCase().includes(q) ||
        req.reason.toLowerCase().includes(q) ||
        req.fromDate.includes(q) ||
        req.toDate.includes(q)
      );
    });
  }, [absenceRequests, statusFilter, searchFilter]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="blue">Student Services & Attendance</Badge>
            <span className="text-xs text-slate-500">&bull;</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Real-time Attendance Integration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-500" />
            Absentees Form
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            This form is to be filled when leave is taken, prior to the date.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/attendance">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CalendarCheck className="w-4 h-4 text-emerald-400" />}
              className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            >
              View Attendance Matrix
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 max-w-md">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'form'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Absentees Form</span>
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'ledger'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Requests History ({absenceRequests.length})</span>
        </button>
      </div>

      {/* TAB 1: FORM VIEW */}
      {activeTab === 'form' && (
        <div className="space-y-6">
          {/* Success Banner */}
          {isSubmittedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/40">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Leave Application Submitted Successfully!</h4>
                  <p className="text-xs text-emerald-300/90 mt-0.5">
                    Absence record for trainee <strong>{lastSubmittedId}</strong> has been logged. When hovering over their date in the Attendance section, the leave reason will now display in a popover!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/attendance">
                  <Button size="sm" variant="success" className="text-xs py-1.5 h-8">
                    Open Attendance Grid <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsSubmittedSuccess(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Form Card (Google Form Aesthetic) */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Top Google Form Color Accent Banner */}
            <div className="h-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Form Title & Description Section */}
              <div className="border-b border-slate-800/80 pb-5">
                <h2 className="text-2xl font-black text-white tracking-tight">Absentees Form</h2>
                <p className="text-sm text-slate-300 mt-2 font-medium">
                  This form is to be filled when leave is taken, prior to the date.
                </p>
                <div className="mt-3 text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                  <span>* Indicates required question</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. UT Number Field */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 focus-within:border-blue-500 transition-colors">
                  <label className="block text-sm font-bold text-slate-100">
                    UT number <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-xs text-slate-400">
                    Enter your trainee ID (e.g. UT011500)
                  </p>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={utNumber}
                      onChange={(e) => handleUtChange(e.target.value)}
                      placeholder="Your answer (e.g. UT011500)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Autocomplete Dropdown suggestions */}
                  {filteredStudents.length > 0 && utNumber && !students.some((s) => s.utNumber.toUpperCase() === utNumber.trim().toUpperCase()) && (
                    <div className="mt-2 p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Matching Trainees:</div>
                      {filteredStudents.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectStudent(s)}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-blue-600/20 hover:text-blue-300 text-slate-200 transition-colors"
                        >
                          <span className="font-mono font-bold">{s.utNumber}</span>
                          <span className="truncate max-w-[200px]">{s.fullName}</span>
                          <span className="text-[10px] text-slate-400">{s.courseName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Full Name Field */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 focus-within:border-blue-500 transition-colors">
                  <label className="block text-sm font-bold text-slate-100">
                    Full Name
                  </label>
                  <p className="text-xs text-slate-400">
                    Auto-fills when UT number is entered or enter manually
                  </p>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your answer"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* 3. Date of absence (From) */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 focus-within:border-blue-500 transition-colors">
                  <label className="block text-sm font-bold text-slate-100">
                    Date of absence (From) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-xs text-slate-400 font-medium">
                    Mark the first day of Absence
                  </p>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        if (!toDate) setToDate(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* 4. Date of absence (To) */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 focus-within:border-blue-500 transition-colors">
                  <label className="block text-sm font-bold text-slate-100">
                    Date of absence (To) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-xs text-slate-400 font-medium">
                    Mark the last day of Absence
                  </p>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* 5. Reason for Absence */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 focus-within:border-blue-500 transition-colors">
                  <label className="block text-sm font-bold text-slate-100">
                    Reason for Absence <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-xs text-slate-400">
                    State the specific reason for your leave (e.g., Medical treatment, family emergency, official event)
                  </p>
                  <div className="relative">
                    <textarea
                      required
                      rows={4}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Your answer..."
                      className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Submission Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 shadow-lg shadow-blue-600/30"
                  >
                    Submit Form
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setUtNumber('');
                      setFullName('');
                      setFromDate('');
                      setToDate('');
                      setReason('');
                      setErrorMessage('');
                    }}
                    className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-semibold"
                  >
                    Clear form
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REQUESTS HISTORY / LEDGER VIEW */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Absence Requests & Leaves Ledger</CardTitle>
                  <CardDescription>
                    All submitted student leave requests synchronized with the Attendance Matrix
                  </CardDescription>
                </div>

                {/* Filter and Search */}
                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search UT, name or reason..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
                      <th className="py-3 px-3 text-center w-10">#</th>
                      <th className="py-3 px-3">UT NUMBER</th>
                      <th className="py-3 px-4">TRAINEE NAME</th>
                      <th className="py-3 px-3">ABSENCE PERIOD</th>
                      <th className="py-3 px-4 min-w-[200px]">REASON FOR ABSENCE</th>
                      <th className="py-3 px-3 text-center">STATUS</th>
                      <th className="py-3 px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {displayedRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No leave applications found. Switch to the &quot;Absentees Form&quot; tab to submit a new leave request.
                        </td>
                      </tr>
                    ) : (
                      displayedRequests.map((req, idx) => {
                        const daysDiff = Math.max(
                          1,
                          Math.round((new Date(req.toDate).getTime() - new Date(req.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                        );

                        return (
                          <tr key={req.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-3 font-mono font-bold text-cyan-300 whitespace-nowrap">
                              {req.utNumber}
                            </td>
                            <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                              {req.fullName}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-200">
                                  {req.fromDate} &rarr; {req.toDate}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {daysDiff} {daysDiff === 1 ? 'day' : 'days'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-amber-200/90 italic font-medium">
                              &ldquo;{req.reason}&rdquo;
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  req.status === 'Approved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : req.status === 'Rejected'
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                {req.status !== 'Approved' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateAbsenceRequestStatus(req.id, 'Approved')}
                                    className="text-[10px] h-6 px-2 text-emerald-400 hover:bg-emerald-500/10"
                                    title="Approve Leave"
                                  >
                                    Approve
                                  </Button>
                                )}
                                {req.status !== 'Rejected' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateAbsenceRequestStatus(req.id, 'Rejected')}
                                    className="text-[10px] h-6 px-2 text-rose-400 hover:bg-rose-500/10"
                                    title="Reject Leave"
                                  >
                                    Reject
                                  </Button>
                                )}
                                <Link href="/attendance">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="text-[10px] h-6 px-2"
                                    title="View student on attendance grid"
                                  >
                                    Grid &rarr;
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
