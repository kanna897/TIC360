'use client';

import React, { useState } from 'react';
import {
  UserX,
  Plus,
  Download,
  Search,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { DropoutReason, RejoinPossibility } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { exportToCSV, exportToExcel, formatMonthName, formatDate } from '@/lib/utils';

export default function DropoutsPage() {
  const { students, dropouts, recordDropout, currentRole } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    dropoutMonth: new Date().toISOString().slice(0, 7), // '2026-08'
    reason: 'Financial Problem' as DropoutReason,
    rejoinPossibility: 'Medium' as RejoinPossibility,
    remarks: '',
  });

  const activeOrAllStudents = students.filter((s) => s.currentStatus !== 'Dropout');

  const filteredDropouts = dropouts.filter((d) => {
    const matchesSearch =
      d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.utNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesReason = reasonFilter === 'all' || d.reason === reasonFilter;
    return matchesSearch && matchesReason;
  });

  const handleRecordDropoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) {
      alert('Please select a student');
      return;
    }

    recordDropout({
      studentId: formData.studentId,
      dropoutMonth: formData.dropoutMonth,
      reason: formData.reason,
      rejoinPossibility: formData.rejoinPossibility,
      remarks: formData.remarks,
    });

    setIsModalOpen(false);
    setFormData({
      studentId: '',
      dropoutMonth: new Date().toISOString().slice(0, 7),
      reason: 'Financial Problem',
      rejoinPossibility: 'Medium',
      remarks: '',
    });
  };

  const handleExportCSV = () => {
    const exportData = filteredDropouts.map((d) => ({
      UT_Number: d.utNumber,
      Student_Name: d.studentName,
      Course: d.courseName,
      Dropout_Month: d.dropoutMonth,
      Reason: d.reason,
      Rejoin_Possibility: d.rejoinPossibility,
      Remarks: d.remarks || '',
      Recorded_At: d.recordedAt,
    }));

    exportToCSV('TIC360_Dropout_Register', exportData);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Dropout Management Register
            </h1>
            <Badge variant="rose">{dropouts.length} Dropouts Recorded</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track student departures, exact categorized reasons, and automatic suspension of future Blossom payments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Dropouts CSV
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Student Dropout
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dropout by student name or UT number..."
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="w-full sm:w-56">
              <Select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Dropout Reasons' },
                  { value: 'Financial Problem', label: 'Financial Problem' },
                  { value: 'Employment', label: 'Employment' },
                  { value: 'Higher Studies', label: 'Higher Studies' },
                  { value: 'Family Problem', label: 'Family Problem' },
                  { value: 'Health/Personal', label: 'Health/Personal' },
                  { value: 'Migration', label: 'Migration' },
                  { value: 'Lack of Interest', label: 'Lack of Interest' },
                  { value: 'Unknown', label: 'Unknown' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dropouts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4 sm:px-6">Student</th>
                <th className="py-3 px-4">Course & Batch</th>
                <th className="py-3 px-4">Dropout Month</th>
                <th className="py-3 px-4">Categorized Reason</th>
                <th className="py-3 px-4">Rejoin Possibility</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredDropouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No dropout records found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredDropouts.map((drp) => (
                  <tr key={drp.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <p className="font-bold text-slate-100">{drp.studentName}</p>
                      <p className="text-[11px] font-mono text-slate-400">{drp.utNumber}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {drp.courseName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                      {formatMonthName(drp.dropoutMonth)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold text-xs inline-block">
                        {drp.reason}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          drp.rejoinPossibility === 'High'
                            ? 'active'
                            : drp.rejoinPossibility === 'Medium'
                            ? 'amber'
                            : 'neutral'
                        }
                      >
                        {drp.rejoinPossibility}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs max-w-xs truncate">
                      {drp.remarks || 'None'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RECORD DROPOUT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Student Dropout"
        subtitle="Stops all future Blossom support payments and logs reason"
        maxWidth="lg"
      >
        <form onSubmit={handleRecordDropoutSubmit} className="space-y-4">
          <Select
            label="Select Active Student *"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            options={[
              { value: '', label: '-- Choose a Student --' },
              ...activeOrAllStudents.map((s) => ({
                value: s.id,
                label: `${s.fullName} (${s.utNumber}) - ${s.courseName}`,
              })),
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Dropout Month *"
              type="month"
              value={formData.dropoutMonth}
              onChange={(e) => setFormData({ ...formData, dropoutMonth: e.target.value })}
            />

            {/* EXACT 8 REQUIRED REASONS */}
            <Select
              label="Dropout Reason *"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value as DropoutReason })
              }
              options={[
                { value: 'Financial Problem', label: 'Financial Problem' },
                { value: 'Employment', label: 'Employment' },
                { value: 'Higher Studies', label: 'Higher Studies' },
                { value: 'Family Problem', label: 'Family Problem' },
                { value: 'Health/Personal', label: 'Health/Personal' },
                { value: 'Migration', label: 'Migration' },
                { value: 'Lack of Interest', label: 'Lack of Interest' },
                { value: 'Unknown', label: 'Unknown' },
              ]}
            />
          </div>

          <Select
            label="Rejoin Possibility"
            value={formData.rejoinPossibility}
            onChange={(e) =>
              setFormData({ ...formData, rejoinPossibility: e.target.value as RejoinPossibility })
            }
            options={[
              { value: 'High', label: 'High (Expected to return next batch)' },
              { value: 'Medium', label: 'Medium (Possible re-enrollment)' },
              { value: 'Low', label: 'Low (Unlikely)' },
              { value: 'No', label: 'No (Permanent departure)' },
              { value: 'Unknown', label: 'Unknown' },
            ]}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Remarks & Staff Notes
            </label>
            <textarea
              rows={3}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Relocated to Colombo for family business..."
              className="w-full rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>
              Recording a dropout will immediately change student status to <strong>Dropout</strong> and automatically forfeit all future Blossom Trust monthly disbursements starting from the selected month.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Confirm Dropout Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
