'use client';

import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Sliders,
  BookOpen,
  Users,
  Shield,
  Plus,
  CheckCircle2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    orgProfile,
    updateOrgProfile,
    courses,
    addCourse,
    batches,
    addBatch,
    auditLogs,
    resetToDefaults,
    currentRole,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'rules' | 'courses' | 'org' | 'audit'>('rules');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Settings form state
  const [rulesForm, setRulesForm] = useState({
    attendanceGoodThreshold: settings.attendanceGoodThreshold,
    attendanceLowThreshold: settings.attendanceLowThreshold,
    blossomMonthlyMax: settings.blossomMonthlyMax,
    paymentEligibilityAttendanceThreshold: settings.paymentEligibilityAttendanceThreshold,
  });

  // Org form state
  const [orgForm, setOrgForm] = useState(orgProfile);

  // Add Course modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    code: 'TIC-NEW',
    name: '',
    description: '',
    durationMonths: 6,
    isActive: true,
  });

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      attendanceGoodThreshold: Number(rulesForm.attendanceGoodThreshold),
      attendanceLowThreshold: Number(rulesForm.attendanceLowThreshold),
      blossomMonthlyMax: Number(rulesForm.blossomMonthlyMax),
      paymentEligibilityAttendanceThreshold: Number(rulesForm.paymentEligibilityAttendanceThreshold),
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgProfile(orgForm);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.name) return;

    addCourse({
      code: courseForm.code,
      name: courseForm.name,
      description: courseForm.description,
      durationMonths: Number(courseForm.durationMonths) || 6,
      isActive: true,
    });

    setIsCourseModalOpen(false);
    setCourseForm({
      code: `TIC-CRS-${Math.floor(10 + Math.random() * 90)}`,
      name: '',
      description: '',
      durationMonths: 6,
      isActive: true,
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Administration & Business Rule Settings
            </h1>
            <Badge variant={currentRole === 'Admin' ? 'emerald' : 'amber'}>Role: {currentRole}</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure Blossom Trust support maximums, attendance eligibility thresholds, course catalog, and audit trail
          </p>
        </div>
      </div>

      {currentRole !== 'Admin' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Role Notice:</strong> You are accessing Settings as <strong>{currentRole}</strong>. Modifications to core thresholds, stipend rates, and courses require <strong>Admin</strong> privileges. Switch roles in the top bar to test administrative modifications.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 font-bold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'rules'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Business Rules & Thresholds
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 font-bold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'courses'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Course Catalog ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('org')}
          className={`pb-3 font-bold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'org'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Organization Profile
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 font-bold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'audit'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Save Success Alert */}
      {isSavedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Configuration saved successfully!</span>
        </div>
      )}

      {/* TAB 1: BUSINESS RULES & THRESHOLDS */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Attendance & Blossom Payment Rules</CardTitle>
              <CardDescription>
                Governs automatic stipend calculation, threshold flags, and monthly eligibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveRules} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Good Attendance Threshold (%) *"
                    type="number"
                    min={1}
                    max={100}
                    value={rulesForm.attendanceGoodThreshold}
                    onChange={(e) =>
                      setRulesForm({ ...rulesForm, attendanceGoodThreshold: Number(e.target.value) })
                    }
                    helperText="Default: 80%. Status marked as Good Standing."
                  />
                  <Input
                    label="Low Attendance Threshold (%) *"
                    type="number"
                    min={1}
                    max={100}
                    value={rulesForm.attendanceLowThreshold}
                    onChange={(e) =>
                      setRulesForm({ ...rulesForm, attendanceLowThreshold: Number(e.target.value) })
                    }
                    helperText="Default: 60%. Below this is marked as Critical."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Blossom Monthly Stipend Maximum (LKR) *"
                    type="number"
                    value={rulesForm.blossomMonthlyMax}
                    onChange={(e) =>
                      setRulesForm({ ...rulesForm, blossomMonthlyMax: Number(e.target.value) })
                    }
                    helperText="Default: LKR 15,000 per eligible student."
                  />
                  <Input
                    label="Payment Eligibility Attendance Cutoff (%) *"
                    type="number"
                    min={1}
                    max={100}
                    value={rulesForm.paymentEligibilityAttendanceThreshold}
                    onChange={(e) =>
                      setRulesForm({
                        ...rulesForm,
                        paymentEligibilityAttendanceThreshold: Number(e.target.value),
                      })
                    }
                    helperText="CRITICAL RULE: Below this threshold = LKR 0 payment."
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <Button type="submit" variant="primary">
                    Save Business Rules
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* System Reset / Danger Zone */}
          <Card className="border-rose-500/30">
            <CardHeader>
              <CardTitle className="text-rose-400">Database Tools</CardTitle>
              <CardDescription>System restore actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-400">
                Restore the default Unicom TIC Training Centre student dataset, monthly attendance records, and Blossom payment registers.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm('Reset database to factory default records?')) resetToDefaults();
                }}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="w-full"
              >
                Reset to Seed Dataset
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: COURSE CATALOG */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">
              Students can be enrolled in exactly ONE course from this configurable catalog
            </p>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsCourseModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add New Course
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((crs) => (
              <Card key={crs.id} className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {crs.code}
                  </span>
                  <Badge variant={crs.isActive ? 'active' : 'neutral'}>
                    {crs.isActive ? 'Active' : 'Archived'}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-white">{crs.name}</h3>
                <p className="text-xs text-slate-400">{crs.description}</p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  Duration: <span className="text-slate-200 font-bold">{crs.durationMonths} Months</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ORG PROFILE */}
      {activeTab === 'org' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Unicom TIC Organization Profile</CardTitle>
            <CardDescription>Reflects across reports and official export headers</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveOrg} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Center Name"
                  value={orgForm.orgName}
                  onChange={(e) => setOrgForm({ ...orgForm, orgName: e.target.value })}
                />
                <Input
                  label="Trust Name"
                  value={orgForm.trustName}
                  onChange={(e) => setOrgForm({ ...orgForm, trustName: e.target.value })}
                />
              </div>

              <Input
                label="Tagline"
                value={orgForm.tagline}
                onChange={(e) => setOrgForm({ ...orgForm, tagline: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Contact Email"
                  value={orgForm.email}
                  onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                />
                <Input
                  label="Hotline Phone"
                  value={orgForm.phone}
                  onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                />
              </div>

              <Input
                label="Physical Address"
                value={orgForm.address}
                onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
              />

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <Button type="submit" variant="primary">
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>System Audit Trail</CardTitle>
            <CardDescription>Immutable record of student mutations, attendance submissions, and disbursements</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity / ID</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="p-3 font-mono text-slate-400">{log.timestamp}</td>
                    <td className="p-3 font-semibold text-slate-200">{log.userName}</td>
                    <td className="p-3">
                      <Badge variant="blue">{log.userRole}</Badge>
                    </td>
                    <td className="p-3 font-bold text-white">{log.action}</td>
                    <td className="p-3 text-cyan-400 font-mono">{log.recordId || log.entity}</td>
                    <td className="p-3 text-slate-400 max-w-sm truncate">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE COURSE MODAL */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title="Add Course to Catalog"
        subtitle="Make a new vocational course available for student enrollment"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Course Code *"
              required
              value={courseForm.code}
              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
            />
            <Input
              label="Duration (Months) *"
              type="number"
              value={courseForm.durationMonths}
              onChange={(e) =>
                setCourseForm({ ...courseForm, durationMonths: Number(e.target.value) })
              }
            />
          </div>

          <Input
            label="Course Name *"
            required
            placeholder="e.g. Mobile App Developer (Flutter)"
            value={courseForm.name}
            onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Description</label>
            <textarea
              rows={3}
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className="w-full rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsCourseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Course
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
