'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Save,
  Download,
  Award,
  CheckCircle2,
  Trash2,
  Filter,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { AssessmentCategory } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { exportToCSV, exportToExcel } from '@/lib/utils';

export default function AssessmentsPage() {
  const {
    students,
    courses,
    batches,
    assessments,
    assessmentMarks,
    addAssessment,
    deleteAssessment,
    saveAssessmentMarks,
    currentRole,
  } = useStore();

  const [selectedCourse, setSelectedCourse] = useState<string>(courses[0]?.id || 'CRS-02');
  const [selectedBatch, setSelectedBatch] = useState<string>(batches[0]?.id || 'BAT-02');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // New Assessment Form
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    category: 'Project' as AssessmentCategory,
    maxMarks: 100,
  });

  // Assessments for this course/batch
  const currentAssessments = useMemo(() => {
    return assessments.filter((a) => a.courseId === selectedCourse);
  }, [assessments, selectedCourse]);

  // Students for this batch
  const batchStudents = useMemo(() => {
    return students.filter((s) => s.batchId === selectedBatch || selectedBatch === 'all');
  }, [students, selectedBatch]);

  // Local state for editing marks matrix: key = `${assessmentId}_${studentId}`
  const [matrixMarks, setMatrixMarks] = useState<Record<string, number>>({});

  React.useEffect(() => {
    const map: Record<string, number> = {};
    assessmentMarks.forEach((m) => {
      map[`${m.assessmentId}_${m.studentId}`] = m.marksObtained;
    });
    setMatrixMarks(map);
  }, [assessmentMarks]);

  const handleMarkChange = (asmId: string, stuId: string, val: string, max: number) => {
    const num = Math.min(max, Math.max(0, parseFloat(val) || 0));
    setMatrixMarks((prev) => ({
      ...prev,
      [`${asmId}_${stuId}`]: num,
    }));
  };

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentForm.title) return;

    addAssessment({
      courseId: selectedCourse,
      batchId: selectedBatch,
      title: assessmentForm.title,
      category: assessmentForm.category,
      maxMarks: Number(assessmentForm.maxMarks) || 100,
    });

    setIsAddModalOpen(false);
    setAssessmentForm({
      title: '',
      category: 'Project',
      maxMarks: 100,
    });
  };

  const handleSaveAllMarks = () => {
    currentAssessments.forEach((asm) => {
      const marksForAsm = batchStudents.map((stu) => ({
        studentId: stu.id,
        marksObtained: matrixMarks[`${asm.id}_${stu.id}`] ?? 0,
      }));
      saveAssessmentMarks(asm.id, marksForAsm);
    });

    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3500);
  };

  const handleExportCSV = () => {
    const exportData = batchStudents.map((stu) => {
      const row: Record<string, any> = {
        UT_Number: stu.utNumber,
        Student_Name: stu.fullName,
        Course: stu.courseName,
      };

      currentAssessments.forEach((asm) => {
        row[`${asm.title}_Max_${asm.maxMarks}`] = matrixMarks[`${asm.id}_${stu.id}`] ?? 0;
      });

      return row;
    });

    exportToCSV('TIC360_Academic_Assessment_Marks', exportData);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Academic & Project Assessments
            </h1>
            <Badge variant="purple">{currentAssessments.length} Assessment Columns</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create custom assessment columns, assignments, presentations, capstone projects, and evaluate student marks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Marks CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Assessment Column
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handleSaveAllMarks}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save All Marks
          </Button>
        </div>
      </div>

      {/* Course & Batch Selector */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              options={courses.map((c) => ({ value: c.id, label: c.name }))}
            />

            <Select
              label="Select Batch"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              options={batches.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Success Notice */}
      {isSavedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>All student assessment marks successfully saved and persisted!</span>
        </div>
      )}

      {/* Matrix Table */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Assessment Mark Matrix</CardTitle>
              <CardDescription>
                Live grading grid for {courses.find((c) => c.id === selectedCourse)?.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4 sm:px-6 min-w-[200px]">Student</th>
                {currentAssessments.map((asm) => (
                  <th key={asm.id} className="py-3 px-4 min-w-[150px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-xs font-bold truncate max-w-[120px]">{asm.title}</p>
                        <span className="text-[10px] text-slate-400">Max: {asm.maxMarks}</span>
                      </div>
                      {currentRole === 'Admin' && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete column ${asm.title}?`)) deleteAssessment(asm.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 ml-1"
                          title="Delete Column"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-4 text-right">Average %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {batchStudents.length === 0 ? (
                <tr>
                  <td colSpan={currentAssessments.length + 2} className="py-12 text-center text-slate-400">
                    No students in this batch.
                  </td>
                </tr>
              ) : (
                batchStudents.map((stu) => {
                  let totalObtained = 0;
                  let totalPossible = 0;

                  currentAssessments.forEach((asm) => {
                    const mark = matrixMarks[`${asm.id}_${stu.id}`] ?? 0;
                    totalObtained += mark;
                    totalPossible += asm.maxMarks;
                  });

                  const avgPct = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

                  return (
                    <tr key={stu.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 sm:px-6">
                        <p className="font-bold text-slate-100">{stu.fullName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{stu.utNumber}</p>
                      </td>

                      {currentAssessments.map((asm) => {
                        const val = matrixMarks[`${asm.id}_${stu.id}`] ?? 0;
                        return (
                          <td key={asm.id} className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={asm.maxMarks}
                                value={val}
                                onChange={(e) =>
                                  handleMarkChange(asm.id, stu.id, e.target.value, asm.maxMarks)
                                }
                                className="w-16 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
                              />
                              <span className="text-[10px] text-slate-500">/ {asm.maxMarks}</span>
                            </div>
                          </td>
                        );
                      })}

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded ${
                            avgPct >= 80
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : avgPct >= 60
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {avgPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE ASSESSMENT COLUMN MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Custom Assessment Column"
        subtitle="Create custom project, presentation, assignment or practical module"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAssessment} className="space-y-4">
          <Input
            label="Assessment Title *"
            required
            placeholder="e.g. Project 02: Full Stack Auth & Storage"
            value={assessmentForm.title}
            onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={assessmentForm.category}
              onChange={(e) =>
                setAssessmentForm({
                  ...assessmentForm,
                  category: e.target.value as AssessmentCategory,
                })
              }
              options={[
                { value: 'Assignment', label: 'Assignment' },
                { value: 'Project', label: 'Project' },
                { value: 'Presentation', label: 'Presentation' },
                { value: 'Practical', label: 'Practical Exam' },
                { value: 'Final Project', label: 'Final Project' },
                { value: 'Custom', label: 'Custom Assessment' },
              ]}
            />

            <Input
              label="Maximum Marks *"
              type="number"
              required
              min={1}
              max={1000}
              value={assessmentForm.maxMarks}
              onChange={(e) =>
                setAssessmentForm({ ...assessmentForm, maxMarks: Number(e.target.value) })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Column
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
