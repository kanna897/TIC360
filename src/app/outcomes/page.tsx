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

  const [activeTab, setActiveTab] = useState<'outcomes' | 'completions'>('outcomes');
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');

  // Modals
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);

  // Completion Form
  const [completionForm, setCompletionForm] = useState({
    studentId: '',
    completionDate: new Date().toISOString().slice(0, 10),
    finalResult: 'Distinction' as 'Passed' | 'Distinction' | 'Merit' | 'Failed',
    finalProjectName: '',
    githubLink: '',
    overallGrade: 'A' as FinalGrade,
  });

  // Outcome Form
  const [outcomeForm, setOutcomeForm] = useState({
    studentId: '',
    outcomeStatus: 'Employed' as OutcomeStatus,
    outcomeDate: new Date().toISOString().slice(0, 10),
    companyOrInstitution: '',
    jobTitle: '',
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

    saveStudentOutcome({
      studentId: student.id,
      utNumber: student.utNumber,
      studentName: student.fullName,
      isBlossomTrust: student.isBlossomTrust,
      outcomeStatus: outcomeForm.outcomeStatus,
      outcomeDate: outcomeForm.outcomeDate,
      companyOrInstitution: outcomeForm.companyOrInstitution,
      jobTitle: outcomeForm.jobTitle,
      remarks: outcomeForm.remarks,
    });

    setIsOutcomeModalOpen(false);
  };

  const filteredOutcomes = outcomes.filter((o) => {
    const matchesSearch =
      o.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.utNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.companyOrInstitution && o.companyOrInstitution.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = outcomeFilter === 'all' || o.outcomeStatus === outcomeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleExportCSV = () => {
    const exportData = filteredOutcomes.map((o) => ({
      UT_Number: o.utNumber,
      Student_Name: o.studentName,
      Blossom_Scholar: o.isBlossomTrust ? 'YES' : 'NO',
      Current_Outcome: o.outcomeStatus,
      Outcome_Date: o.outcomeDate,
      Company_or_Institution: o.companyOrInstitution || 'N/A',
      Job_Title: o.jobTitle || 'N/A',
      Remarks: o.remarks || '',
    }));

    exportToCSV('TIC360_Student_Outcomes', exportData);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Course Completions & Current Student Outcomes
            </h1>
            <Badge variant="emerald">{outcomes.length} Tracked Outcomes</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track student capstone projects, final grades, and longitudinal post-graduation employment & study status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Outcomes CSV
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
            onClick={() => setIsOutcomeModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Update Student Outcome
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('outcomes')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'outcomes'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Current Student Outcomes ({outcomes.length})
        </button>
        <button
          onClick={() => setActiveTab('completions')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'completions'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Course Completions ({completions.length})
        </button>
      </div>

      {/* TAB 1: CURRENT STUDENT OUTCOMES */}
      {activeTab === 'outcomes' && (
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
                    placeholder="Search outcome by student, company, job title..."
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
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4 sm:px-6">Student</th>
                    <th className="py-3 px-4">Scholarship</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Company / Institution</th>
                    <th className="py-3 px-4">Job Title / Role</th>
                    <th className="py-3 px-4">Effective Date</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredOutcomes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No outcome records found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOutcomes.map((out) => (
                      <tr key={out.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <p className="font-bold text-slate-100">{out.studentName}</p>
                          <p className="text-[11px] font-mono text-slate-400">{out.utNumber}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          {out.isBlossomTrust ? (
                            <Badge variant="emerald">Blossom Scholar</Badge>
                          ) : (
                            <Badge variant="neutral">Self-Funded</Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              out.outcomeStatus === 'Employed'
                                ? 'active'
                                : out.outcomeStatus === 'Internship'
                                ? 'blue'
                                : out.outcomeStatus === 'Higher Studies'
                                ? 'purple'
                                : 'amber'
                            }
                          >
                            {out.outcomeStatus}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-200">
                          {out.companyOrInstitution || '—'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-300">
                          {out.jobTitle || '—'}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {formatDate(out.outcomeDate)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                          {out.remarks || 'None'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setOutcomeForm({
                                studentId: out.studentId,
                                outcomeStatus: out.outcomeStatus,
                                outcomeDate: out.outcomeDate,
                                companyOrInstitution: out.companyOrInstitution || '',
                                jobTitle: out.jobTitle || '',
                                remarks: out.remarks || '',
                              });
                              setIsOutcomeModalOpen(true);
                            }}
                          >
                            Update
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
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
                      <td className="py-3.5 px-4">
                        <Badge variant="active">{cmp.finalResult}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-medium">
                        {cmp.finalProjectName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center justify-center font-mono">
                          {cmp.overallGrade}
                        </span>
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
        title="Record Course Completion"
        subtitle="Log student graduation, capstone project, and overall grade"
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
            required
            placeholder="e.g. Healthcare Patient Appointment Portal"
            value={completionForm.finalProjectName}
            onChange={(e) =>
              setCompletionForm({ ...completionForm, finalProjectName: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="GitHub Repository Link"
              placeholder="https://github.com/..."
              value={completionForm.githubLink}
              onChange={(e) =>
                setCompletionForm({ ...completionForm, githubLink: e.target.value })
              }
            />
            <Select
              label="Overall Grade (A - E) *"
              value={completionForm.overallGrade}
              onChange={(e) =>
                setCompletionForm({
                  ...completionForm,
                  overallGrade: e.target.value as FinalGrade,
                })
              }
              options={[
                { value: 'A', label: 'Grade A (Excellent)' },
                { value: 'B', label: 'Grade B (Very Good)' },
                { value: 'C', label: 'Grade C (Good)' },
                { value: 'D', label: 'Grade D (Pass)' },
                { value: 'E', label: 'Grade E (Marginal)' },
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

      {/* UPDATE OUTCOME MODAL */}
      <Modal
        isOpen={isOutcomeModalOpen}
        onClose={() => setIsOutcomeModalOpen(false)}
        title="Update Student Current Outcome"
        subtitle="Track employment, startup, internship, or higher education status"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveOutcomeSubmit} className="space-y-4">
          <Select
            label="Select Student *"
            value={outcomeForm.studentId}
            onChange={(e) => setOutcomeForm({ ...outcomeForm, studentId: e.target.value })}
            options={[
              { value: '', label: '-- Choose a Student --' },
              ...students.map((s) => ({
                value: s.id,
                label: `${s.fullName} (${s.utNumber}) - ${s.currentStatus}`,
              })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Current Outcome Status *"
              value={outcomeForm.outcomeStatus}
              onChange={(e) =>
                setOutcomeForm({
                  ...outcomeForm,
                  outcomeStatus: e.target.value as OutcomeStatus,
                })
              }
              options={[
                { value: 'Employed', label: 'Employed (Full-time / Permanent)' },
                { value: 'Self Employed', label: 'Self Employed / Freelancer' },
                { value: 'Higher Studies', label: 'Higher Studies (University / MSc)' },
                { value: 'Internship', label: 'Internship / Industrial Training' },
                { value: 'Looking for Job', label: 'Looking for Job (Actively Interviewing)' },
                { value: 'Unemployed', label: 'Unemployed' },
                { value: 'Foreign Employment', label: 'Foreign Employment (Overseas Tech Role)' },
                { value: 'Other', label: 'Other' },
              ]}
            />
            <Input
              label="Status Effective Date *"
              type="date"
              value={outcomeForm.outcomeDate}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, outcomeDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Company / Institution Name"
              placeholder="e.g. CodeGen International / WSO2 / Univ of Moratuwa"
              value={outcomeForm.companyOrInstitution}
              onChange={(e) =>
                setOutcomeForm({ ...outcomeForm, companyOrInstitution: e.target.value })
              }
            />
            <Input
              label="Job Title / Role"
              placeholder="e.g. Associate Full Stack Engineer"
              value={outcomeForm.jobTitle}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, jobTitle: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Remarks & Placement Notes</label>
            <textarea
              rows={3}
              value={outcomeForm.remarks}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, remarks: e.target.value })}
              placeholder="e.g. Received offer with starting salary LKR 100,000; joined after capstone presentation..."
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
