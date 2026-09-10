'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  Plus,
  Edit2,
  Download,
  Search,
  ExternalLink,
  Building,
  CheckCircle2,
  Award,
  Sparkles,
  Calendar,
  HeartHandshake,
  Users,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { CourseCompletion, StudentOutcome, OutcomeStatus, FinalGrade } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { exportToCSV, exportToExcel, formatDate } from '@/lib/utils';

export default function OutcomesPage() {
  const {
    students,
    courses,
    batches,
    completions,
    outcomes,
    recordCompletion,
    saveStudentOutcome,
    currentRole,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'blossom' | 'non-blossom' | 'completions'>('blossom');
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');

  // Modals
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);

  const [copiedLinkToast, setCopiedLinkToast] = useState(false);

  // Completion Form
  const [completionForm, setCompletionForm] = useState({
    studentId: '',
    completionDate: new Date().toISOString().slice(0, 10),
    finalResult: 'Distinction' as 'Passed' | 'Distinction' | 'Merit' | 'Failed',
    finalProjectName: '',
    githubLink: '',
    overallGrade: 'A' as FinalGrade,
  });

  // Outcome Form with Screenshot Fields
  const [outcomeForm, setOutcomeForm] = useState({
    studentId: '',
    currentStatus: 'Employed',
    workingCompanyName: '',
    salary: '0',
    courseCompletionStatus: 'Completed (9 Months)',
    courseSpecialization: 'Software Development (Full-Stack Web)',
    employmentStatus: 'Employed (Full-Time)',
    otherStatus: 'None',
    jobTitle: '',
    workLocation: '',
    outcomeDate: new Date().toISOString().slice(0, 10),
    remarks: '',
  });

  const handleRecordCompletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === completionForm.studentId);
    if (!student) {
      alert('Please select a student');
      return;
    }

    recordCompletion({
      studentId: student.id,
      utNumber: student.utNumber,
      studentName: student.fullName,
      courseId: student.courseId,
      courseName: student.courseName,
      batchId: student.batchId,
      completionDate: completionForm.completionDate,
      finalResult: completionForm.finalResult,
      finalProjectName: completionForm.finalProjectName,
      githubLink: completionForm.githubLink,
      overallGrade: completionForm.overallGrade,
      certificateIssued: true,
    });

    setIsCompletionModalOpen(false);
  };

  const handleSaveOutcomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === outcomeForm.studentId);
    if (!student) {
      alert('Please select a student');
      return;
    }

    let outcomeStatusMapped: OutcomeStatus = 'Other';
    if (outcomeForm.currentStatus.toLowerCase().includes('employed') || outcomeForm.employmentStatus.toLowerCase().includes('employed')) {
      outcomeStatusMapped = 'Employed';
    } else if (outcomeForm.currentStatus.toLowerCase().includes('internship') || outcomeForm.employmentStatus.toLowerCase().includes('internship')) {
      outcomeStatusMapped = 'Internship';
    } else if (outcomeForm.currentStatus.toLowerCase().includes('self') || outcomeForm.employmentStatus.toLowerCase().includes('freelance')) {
      outcomeStatusMapped = 'Self Employed';
    } else if (outcomeForm.currentStatus.toLowerCase().includes('study') || outcomeForm.employmentStatus.toLowerCase().includes('higher studies')) {
      outcomeStatusMapped = 'Higher Studies';
    } else if (outcomeForm.currentStatus.toLowerCase().includes('unemployed') || outcomeForm.employmentStatus.toLowerCase().includes('unemployed')) {
      outcomeStatusMapped = 'Unemployed';
    } else if (outcomeForm.employmentStatus.toLowerCase().includes('foreign')) {
      outcomeStatusMapped = 'Foreign Employment';
    }

    saveStudentOutcome({
      studentId: student.id,
      utNumber: student.utNumber,
      studentName: student.fullName,
      isBlossomTrust: student.isBlossomTrust,
      outcomeStatus: outcomeStatusMapped,
      outcomeDate: outcomeForm.outcomeDate,
      companyOrInstitution: outcomeForm.workingCompanyName || 'N/A',
      workingCompanyName: outcomeForm.workingCompanyName || 'N/A',
      salary: Number(outcomeForm.salary) || 0,
      currentStatus: outcomeForm.currentStatus,
      courseCompletionStatus: outcomeForm.courseCompletionStatus,
      courseSpecialization: outcomeForm.courseSpecialization,
      employmentStatus: outcomeForm.employmentStatus,
      otherStatus: outcomeForm.otherStatus,
      workLocation: outcomeForm.workLocation,
      jobTitle: outcomeForm.jobTitle,
      remarks: outcomeForm.remarks,
    });

    setIsOutcomeModalOpen(false);
  };

  const filteredOutcomes = outcomes.filter((o) => {
    const matchesSearch =
      o.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.utNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.workingCompanyName && o.workingCompanyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.companyOrInstitution && o.companyOrInstitution.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatusFilter = outcomeFilter === 'all' || o.outcomeStatus === outcomeFilter || o.currentStatus === outcomeFilter;
    const matchesCategoryFilter =
      (activeTab === 'blossom' && o.isBlossomTrust) ||
      (activeTab === 'non-blossom' && !o.isBlossomTrust) ||
      activeTab === 'completions';
    return matchesSearch && matchesStatusFilter && matchesCategoryFilter;
  });

  const handleExportCSV = () => {
    const exportData = filteredOutcomes.map((o, idx) => ({
      No: idx + 1,
      UT_Number: o.utNumber,
      Student_Name: o.studentName,
      Category: o.isBlossomTrust ? 'Blossom Scholar' : 'Non-Blossom',
      Current_Status: o.currentStatus || o.outcomeStatus,
      Working_Company: o.workingCompanyName || o.companyOrInstitution || 'N/A',
      Salary_LKR: o.salary || 0,
      Course_Completion_Status: o.courseCompletionStatus || 'N/A',
      Specialization: o.courseSpecialization || 'N/A',
      Employment_Status: o.employmentStatus || 'N/A',
      Other_Status: o.otherStatus || 'N/A',
      Job_Title: o.jobTitle || 'N/A',
      Remarks: o.remarks || '',
    }));

    exportToCSV(`TIC360_${activeTab === 'blossom' ? 'Blossom_Trust' : 'Non_Blossom'}_Outcomes`, exportData);
  };

  const handleExportExcel = () => {
    const exportData = filteredOutcomes.map((o, idx) => ({
      No: idx + 1,
      UT_Number: o.utNumber,
      Student_Name: o.studentName,
      Category: o.isBlossomTrust ? 'Blossom Scholar' : 'Non-Blossom',
      Current_Status: o.currentStatus || o.outcomeStatus,
      Working_Company: o.workingCompanyName || o.companyOrInstitution || 'N/A',
      Salary_LKR: o.salary || 0,
      Course_Completion_Status: o.courseCompletionStatus || 'N/A',
      Specialization: o.courseSpecialization || 'N/A',
      Employment_Status: o.employmentStatus || 'N/A',
      Other_Status: o.otherStatus || 'N/A',
      Job_Title: o.jobTitle || 'N/A',
      Remarks: o.remarks || '',
    }));

    exportToExcel(
      `TIC360_${activeTab === 'blossom' ? 'Blossom_Trust' : 'Non_Blossom'}_Outcomes`,
      [
        {
          sheetName: activeTab === 'blossom' ? 'Blossom Outcomes' : 'Non-Blossom Outcomes',
          data: exportData,
        },
      ]
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              9-Month Course Completions & Career Placements
            </h1>
            <Badge variant="emerald">{outcomes.length} Tracked Outcomes</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track student capstone projects, post-9-month career positions, working companies, salaries, and survey submissions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const surveyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/survey`;
              navigator.clipboard.writeText(surveyUrl);
              setCopiedLinkToast(true);
              setTimeout(() => setCopiedLinkToast(false), 3000);
            }}
            className="bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200"
            leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
          >
            {copiedLinkToast ? 'Survey Link Copied! ✓' : '📋 Copy Survey Link for Students'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
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
            variant="secondary"
            size="sm"
            onClick={() => setIsCompletionModalOpen(true)}
            leftIcon={<Award className="w-4 h-4" />}
          >
            Record Completion
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setOutcomeForm({
                studentId: students[0]?.id || '',
                currentStatus: 'Employed',
                workingCompanyName: '',
                salary: '65000',
                courseCompletionStatus: 'Completed (9 Months)',
                courseSpecialization: 'Software Development (Full-Stack Web)',
                employmentStatus: 'Employed (Full-Time)',
                otherStatus: 'None',
                jobTitle: '',
                workLocation: 'Jaffna',
                outcomeDate: new Date().toISOString().slice(0, 10),
                remarks: '',
              });
              setIsOutcomeModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Update Student Outcome
          </Button>
        </div>
      </div>

      {/* Main 2-Tab Switcher (Matching Exact Green Pill Design) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Blossom Trust Students */}
          <button
            onClick={() => setActiveTab('blossom')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'blossom'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>🌸 Blossom Trust Student Outcomes (9-Month Placements)</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'blossom'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {outcomes.filter((o) => o.isBlossomTrust).length}
            </span>
          </button>

          {/* Tab 2: Non-Blossom Students */}
          <button
            onClick={() => setActiveTab('non-blossom')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'non-blossom'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>🎓 Non-Blossom Student Outcomes (9-Month Placements)</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'non-blossom'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {outcomes.filter((o) => !o.isBlossomTrust).length}
            </span>
          </button>

          {/* Tab 3: Course Completions */}
          <button
            onClick={() => setActiveTab('completions')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'completions'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>📜 Course Completions & Capstone Projects</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'completions'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {completions.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 hidden lg:flex pr-2">
          <span className="font-semibold text-slate-300">
            {activeTab === 'blossom'
              ? '🌸 Blossom Trust Scholar Career Placements'
              : activeTab === 'non-blossom'
              ? '🎓 Non-Blossom Trainee Career Placements'
              : '📜 Capstone Evaluation'}
          </span>
        </div>
      </div>

      {/* TAB 1 & TAB 2: STUDENT OUTCOMES */}
      {(activeTab === 'blossom' || activeTab === 'non-blossom') && (
        <div className="space-y-4">

          {/* Search & Filter */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search outcome by student, UT number, company, job title..."
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="w-full sm:w-56">
                  <Select
                    value={outcomeFilter}
                    onChange={(e) => setOutcomeFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Outcomes' },
                      { value: 'Employed', label: 'Employed' },
                      { value: 'Self Employed', label: 'Self Employed' },
                      { value: 'Higher Studies', label: 'Higher Studies' },
                      { value: 'Internship', label: 'Internship' },
                      { value: 'Looking for Job', label: 'Looking for Job' },
                      { value: 'Unemployed', label: 'Unemployed' },
                      { value: 'Foreign Employment', label: 'Foreign Employment' },
                      { value: 'Other', label: 'Other' },
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outcomes Table */}
          <div
            className={`rounded-2xl border-2 ${
              activeTab === 'blossom'
                ? 'border-lime-500/60'
                : 'border-indigo-500/60'
            } bg-slate-950/95 shadow-2xl overflow-hidden animate-fadeIn`}
          >
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-800 bg-slate-900/90 text-xs uppercase tracking-wider font-extrabold text-slate-300 select-none">
                    <th className="py-3.5 px-2 text-center w-8 text-slate-400">NO</th>
                    <th className="py-3.5 px-2.5 text-white whitespace-nowrap">UT NO</th>
                    <th className="py-3.5 px-3 text-slate-100 whitespace-nowrap">STUDENT NAME</th>
                    <th className="py-3.5 px-2.5 text-slate-100 whitespace-nowrap">CURRENT STATUS</th>
                    <th className="py-3.5 px-3 text-slate-100 whitespace-nowrap">WORKING COMPANY</th>
                    <th className="py-3.5 px-2.5 font-mono text-emerald-400 whitespace-nowrap">SALARY (LKR)</th>
                    <th className="py-3.5 px-3 text-slate-200 whitespace-nowrap">SPECIALIZATION</th>
                    <th className="py-3.5 px-2.5 text-slate-200 whitespace-nowrap">COMPLETION STATUS</th>
                    <th className="py-3.5 px-2.5 text-slate-200 whitespace-nowrap">EMPLOYMENT STATUS</th>
                    <th className="py-3.5 px-2 text-center text-slate-400 whitespace-nowrap">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm">
                  {filteredOutcomes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-14 text-center text-base text-slate-400">
                        No outcome records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOutcomes.map((out, index) => (
                      <tr key={out.id} className="hover:bg-slate-900/80 transition-colors group border-b border-slate-800/60">
                        {/* NO */}
                        <td className="py-3.5 px-2 text-center font-bold text-slate-300 text-sm">
                          {index + 1}
                        </td>

                        {/* UT NO */}
                        <td className="py-3.5 px-2.5 font-extrabold text-white font-mono text-sm tracking-wide whitespace-nowrap">
                          {out.utNumber}
                        </td>

                        {/* STUDENT NAME */}
                        <td className="py-3.5 px-3 whitespace-nowrap font-bold text-slate-100 group-hover:text-blue-400 transition-colors text-sm">
                          {out.studentName}
                        </td>

                        {/* CURRENT STATUS */}
                        <td className="py-3.5 px-2.5 whitespace-nowrap">
                          <Badge
                            variant={
                              (out.currentStatus || out.outcomeStatus) === 'Employed'
                                ? 'active'
                                : (out.currentStatus || out.outcomeStatus) === 'Internship'
                                ? 'blue'
                                : (out.currentStatus || out.outcomeStatus) === 'Higher Studies'
                                ? 'purple'
                                : 'amber'
                            }
                          >
                            {(out.currentStatus || out.outcomeStatus).toUpperCase()}
                          </Badge>
                        </td>

                        {/* WORKING COMPANY */}
                        <td className="py-3.5 px-3 font-bold text-slate-100 whitespace-nowrap">
                          {out.workingCompanyName || out.companyOrInstitution || 'N/A'}
                        </td>

                        {/* SALARY (LKR) */}
                        <td className="py-3.5 px-2.5 font-mono font-extrabold text-emerald-400 whitespace-nowrap">
                          {out.salary ? `LKR ${out.salary.toLocaleString()}` : 'LKR 0'}
                        </td>

                        {/* SPECIALIZATION */}
                        <td className="py-3.5 px-3 text-slate-200 font-medium whitespace-nowrap">
                          {out.courseSpecialization || 'Software Development'}
                        </td>

                        {/* COMPLETION STATUS */}
                        <td className="py-3.5 px-2.5 text-slate-300 font-medium whitespace-nowrap">
                          {out.courseCompletionStatus || 'Completed (9 Months)'}
                        </td>

                        {/* EMPLOYMENT STATUS */}
                        <td className="py-3.5 px-2.5 text-slate-300 whitespace-nowrap">
                          {out.employmentStatus || out.outcomeStatus}
                        </td>

                        {/* ACTION */}
                        <td className="py-3.5 px-2 text-center whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1.5 hover:bg-slate-800 text-blue-400"
                            onClick={() => {
                              setOutcomeForm({
                                studentId: out.studentId,
                                currentStatus: out.currentStatus || out.outcomeStatus,
                                workingCompanyName: out.workingCompanyName || out.companyOrInstitution || '',
                                salary: out.salary ? String(out.salary) : '0',
                                courseCompletionStatus: out.courseCompletionStatus || 'Completed (9 Months)',
                                courseSpecialization: out.courseSpecialization || 'Software Development (Full-Stack Web)',
                                employmentStatus: out.employmentStatus || 'Employed (Full-Time)',
                                otherStatus: out.otherStatus || 'None',
                                jobTitle: out.jobTitle || '',
                                workLocation: out.workLocation || '',
                                outcomeDate: out.outcomeDate,
                                remarks: out.remarks || '',
                              });
                              setIsOutcomeModalOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COURSE COMPLETIONS */}
      {activeTab === 'completions' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 sm:px-6">Graduated Student</th>
                  <th className="py-3 px-4">Course & Batch</th>
                  <th className="py-3 px-4">Completion Date</th>
                  <th className="py-3 px-4">Final Result</th>
                  <th className="py-3 px-4">Final Project Name</th>
                  <th className="py-3 px-4">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {completions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No completion records logged yet.
                    </td>
                  </tr>
                ) : (
                  completions.map((cmp) => (
                    <tr key={cmp.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-4 sm:px-6">
                        <p className="font-bold text-slate-100">{cmp.studentName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{cmp.utNumber}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {cmp.courseName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {formatDate(cmp.completionDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400">
                        {cmp.finalResult}
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">
                        {cmp.finalProjectName}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="emerald">{cmp.overallGrade}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* RECORD COMPLETION MODAL */}
      <Modal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        title="Record Course Completion & Capstone Project"
        subtitle="Log student graduation and final project evaluation"
        maxWidth="lg"
      >
        <form onSubmit={handleRecordCompletionSubmit} className="space-y-4">
          <Select
            label="Select Student *"
            value={completionForm.studentId}
            onChange={(e) => setCompletionForm({ ...completionForm, studentId: e.target.value })}
            options={[
              { value: '', label: '-- Choose a Student --' },
              ...students.map((s) => ({
                value: s.id,
                label: `${s.fullName} (${s.utNumber}) - ${s.courseName}`,
              })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Completion Date *"
              type="date"
              value={completionForm.completionDate}
              onChange={(e) =>
                setCompletionForm({ ...completionForm, completionDate: e.target.value })
              }
            />
            <Select
              label="Final Result *"
              value={completionForm.finalResult}
              onChange={(e) =>
                setCompletionForm({
                  ...completionForm,
                  finalResult: e.target.value as any,
                })
              }
              options={[
                { value: 'Distinction', label: 'Distinction' },
                { value: 'Merit', label: 'Merit' },
                { value: 'Passed', label: 'Passed' },
                { value: 'Failed', label: 'Failed' },
              ]}
            />
          </div>

          <Input
            label="Final Project Name *"
            placeholder="e.g. AI-Powered Medical Inventory System"
            value={completionForm.finalProjectName}
            onChange={(e) =>
              setCompletionForm({ ...completionForm, finalProjectName: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Project GitHub / Demo Link"
              placeholder="https://github.com/username/project"
              value={completionForm.githubLink}
              onChange={(e) => setCompletionForm({ ...completionForm, githubLink: e.target.value })}
            />
            <Select
              label="Overall Grade *"
              value={completionForm.overallGrade}
              onChange={(e) =>
                setCompletionForm({
                  ...completionForm,
                  overallGrade: e.target.value as FinalGrade,
                })
              }
              options={[
                { value: 'A', label: 'Grade A (80% - 100%)' },
                { value: 'B', label: 'Grade B (65% - 79%)' },
                { value: 'C', label: 'Grade C (50% - 64%)' },
                { value: 'S', label: 'Grade S (35% - 49%)' },
                { value: 'F', label: 'Grade F (<35%)' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsCompletionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Log Course Completion
            </Button>
          </div>
        </form>
      </Modal>

      {/* UPDATE OUTCOME MODAL (MATCHING SCREENSHOT) */}
      <Modal
        isOpen={isOutcomeModalOpen}
        onClose={() => setIsOutcomeModalOpen(false)}
        title="Update Student 9-Month Career Outcome"
        subtitle="Track post-course employment, organization, salary, and survey data"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveOutcomeSubmit} className="space-y-4">
          <Select
            label="Select Student *"
            value={outcomeForm.studentId}
            onChange={(e) => {
              const selectedStu = students.find((s) => s.id === e.target.value);
              const existingOut = outcomes.find((o) => o.studentId === e.target.value);
              setOutcomeForm({
                ...outcomeForm,
                studentId: e.target.value,
                currentStatus: existingOut?.currentStatus || 'Employed',
                workingCompanyName: existingOut?.workingCompanyName || '',
                salary: existingOut?.salary !== undefined ? String(existingOut.salary) : '65000',
                courseCompletionStatus: existingOut?.courseCompletionStatus || 'Completed (9 Months)',
                courseSpecialization: existingOut?.courseSpecialization || 'Software Development (Full-Stack Web)',
                employmentStatus: existingOut?.employmentStatus || 'Employed (Full-Time)',
                otherStatus: existingOut?.otherStatus || 'None',
                jobTitle: existingOut?.jobTitle || '',
                workLocation: existingOut?.workLocation || selectedStu?.district || '',
                remarks: existingOut?.remarks || '',
              });
            }}
            options={[
              { value: '', label: '-- Choose a Student --' },
              ...students.map((s) => ({
                value: s.id,
                label: `${s.fullName} (${s.utNumber}) - ${s.isBlossomTrust ? '🌸 Blossom' : '🎓 Non-Blossom'}`,
              })),
            ]}
          />

          {/* CURRENT STATUS & WORKING COMPANY NAME */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                CURRENT STATUS *
              </label>
              <Select
                value={outcomeForm.currentStatus}
                onChange={(e) => setOutcomeForm({ ...outcomeForm, currentStatus: e.target.value })}
                options={[
                  { value: 'Unemployed', label: 'Unemployed' },
                  { value: 'Employed', label: 'Employed' },
                  { value: 'Internship', label: 'Internship' },
                  { value: 'Self Employed', label: 'Self Employed / Freelancer' },
                  { value: 'Higher Studies', label: 'Higher Studies' },
                  { value: 'Foreign Employment', label: 'Foreign Employment' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>

            <Input
              label="WORKING COMPANY NAME *"
              placeholder="e.g. WSO2, Virtusa, IFS, N/A"
              value={outcomeForm.workingCompanyName}
              onChange={(e) =>
                setOutcomeForm({ ...outcomeForm, workingCompanyName: e.target.value })
              }
            />
          </div>

          {/* SALARY (LKR) & COURSE COMPLETION STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="SALARY (LKR) *"
              type="number"
              placeholder="e.g. 85000 (Enter 0 if unemployed)"
              value={outcomeForm.salary}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, salary: e.target.value })}
            />

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                COURSE COMPLETION STATUS *
              </label>
              <Select
                value={outcomeForm.courseCompletionStatus}
                onChange={(e) =>
                  setOutcomeForm({ ...outcomeForm, courseCompletionStatus: e.target.value })
                }
                options={[
                  { value: 'Select Course Completion Status', label: 'Select Course Completion Status' },
                  { value: 'Completed (9 Months)', label: 'Completed (9 Months)' },
                  { value: 'Course Completed - Project Pending', label: 'Course Completed - Project Pending' },
                  { value: 'Graduated with Distinction', label: 'Graduated with Distinction' },
                  { value: 'Graduated with Merit', label: 'Graduated with Merit' },
                  { value: 'Completed - Certificate Issued', label: 'Completed - Certificate Issued' },
                  { value: 'Incomplete / Dropped Out', label: 'Incomplete / Dropped Out' },
                ]}
              />
            </div>
          </div>

          {/* COURSE SPECIALIZATION & EMPLOYMENT STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                COURSE SPECIALIZATION *
              </label>
              <Select
                value={outcomeForm.courseSpecialization}
                onChange={(e) =>
                  setOutcomeForm({ ...outcomeForm, courseSpecialization: e.target.value })
                }
                options={[
                  { value: 'Select Specialization', label: 'Select Specialization' },
                  { value: 'Software Development (Full-Stack Web)', label: 'Software Development (Full-Stack Web)' },
                  { value: 'Frontend React / Next.js Development', label: 'Frontend React / Next.js Development' },
                  { value: 'Backend Node.js & Database Systems', label: 'Backend Node.js & Database Systems' },
                  { value: 'Mobile Application Development (React Native / Flutter)', label: 'Mobile Application Development (React Native / Flutter)' },
                  { value: 'UI/UX & Frontend Engineering', label: 'UI/UX & Frontend Engineering' },
                  { value: 'Cloud Computing & DevOps', label: 'Cloud Computing & DevOps' },
                  { value: 'IT & Network Infrastructure', label: 'IT & Network Infrastructure' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                EMPLOYMENT STATUS *
              </label>
              <Select
                value={outcomeForm.employmentStatus}
                onChange={(e) => setOutcomeForm({ ...outcomeForm, employmentStatus: e.target.value })}
                options={[
                  { value: 'Select Employment Status', label: 'Select Employment Status' },
                  { value: 'Employed (Full-Time)', label: 'Employed (Full-Time)' },
                  { value: 'Employed (Part-Time)', label: 'Employed (Part-Time)' },
                  { value: 'Internship / Trainee', label: 'Internship / Trainee' },
                  { value: 'Freelance / Remote Contractor', label: 'Freelance / Remote Contractor' },
                  { value: 'Self-Employed / Entrepreneur', label: 'Self-Employed / Entrepreneur' },
                  { value: 'Unemployed / Looking for Job', label: 'Unemployed / Looking for Job' },
                  { value: 'Higher Studies / University', label: 'Higher Studies / University' },
                  { value: 'Foreign Employment', label: 'Foreign Employment' },
                ]}
              />
            </div>
          </div>

          {/* OTHER STATUS & JOB TITLE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                OTHER STATUS
              </label>
              <Select
                value={outcomeForm.otherStatus}
                onChange={(e) => setOutcomeForm({ ...outcomeForm, otherStatus: e.target.value })}
                options={[
                  { value: 'Select Other Status', label: 'Select Other Status' },
                  { value: 'Seeking Placement Assistance', label: 'Seeking Placement Assistance' },
                  { value: 'Preparing for Tech Interviews', label: 'Preparing for Tech Interviews' },
                  { value: 'Higher Studies in Progress', label: 'Higher Studies in Progress' },
                  { value: 'Relocating / Foreign Studies', label: 'Relocating / Foreign Studies' },
                  { value: 'Not Seeking Employment', label: 'Not Seeking Employment' },
                  { value: 'None', label: 'None' },
                ]}
              />
            </div>

            <Input
              label="Job Designation / Role Title"
              placeholder="e.g. Associate Full Stack Engineer"
              value={outcomeForm.jobTitle}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, jobTitle: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Status Effective Date *"
              type="date"
              value={outcomeForm.outcomeDate}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, outcomeDate: e.target.value })}
            />
            <Input
              label="Work Location"
              placeholder="e.g. Colombo / Jaffna / Remote"
              value={outcomeForm.workLocation}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, workLocation: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Remarks & Placement Notes</label>
            <textarea
              rows={2}
              value={outcomeForm.remarks}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, remarks: e.target.value })}
              placeholder="e.g. Offer accepted with starting salary LKR 85,000; joined after capstone evaluation..."
              className="w-full rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsOutcomeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Outcome Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
