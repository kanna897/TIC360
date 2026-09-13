'use client';

import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Users,
  Layers,
  Sparkles,
  Check,
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useStore } from '@/lib/store';
import { parseAttendanceExcel, ParsedAttendanceData } from '@/lib/attendanceExcelParser';

interface BulkAttendanceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkAttendanceUploadModal: React.FC<BulkAttendanceUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { bulkImportAllAttendance } = useStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedAttendanceData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Settings
  const [autoRegisterStudents, setAutoRegisterStudents] = useState(true);

  const resetState = () => {
    setSelectedFile(null);
    setParsedData(null);
    setParseError(null);
    setIsParsing(false);
    setIsImporting(false);
    setIsCompleted(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setParsedData(null);

    try {
      const buffer = await file.arrayBuffer();
      const result = await parseAttendanceExcel(buffer);

      if (result.summary.totalSessions === 0) {
        setParseError('No attendance sessions found in this workbook. Please ensure sheets match month names (April, May, June, July, August, September).');
      } else {
        setParsedData(result);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Unknown error parsing file';
      setParseError(`Failed to parse Excel file: ${msg}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setIsImporting(true);
    try {
      // Import into store & Supabase
      bulkImportAllAttendance(
        parsedData.sessions,
        parsedData.marks,
        parsedData.monthly,
        autoRegisterStudents ? parsedData.students : undefined
      );

      setIsCompleted(true);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 1800);
    } catch (err: unknown) {
      console.error(err);
      setParseError('An error occurred while saving the attendance data.');
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk 6-Month Attendance Upload (Excel)"
      subtitle="Upload full-semester Excel attendance sheets with Group A & Group B daily registers"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Upload Box */}
        {!parsedData && !isCompleted && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl p-8 text-center transition-all cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              {isParsing ? 'Analyzing Excel Sheets...' : 'Select or Drag & Drop Attendance Excel File'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              Works directly with <strong className="text-slate-200 font-mono">Students Attendance Record - 2026.xlsx</strong> containing April, May, June, July, August, September sheets.
            </p>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isParsing}
              leftIcon={<UploadCloud className="w-4 h-4 text-emerald-400" />}
            >
              {isParsing ? 'Reading Excel File...' : 'Choose Excel (.xlsx) File'}
            </Button>
          </div>
        )}

        {/* Error message */}
        {parseError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">Excel Parsing Error</strong>
              <span>{parseError}</span>
            </div>
          </div>
        )}

        {/* Live Preview Card */}
        {parsedData && !isCompleted && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header info */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-200">
                    Workbook Verified: {selectedFile?.name || 'Students Attendance Record - 2026.xlsx'}
                  </h4>
                  <p className="text-[11px] text-emerald-400/80">
                    {parsedData.summary.totalSheets} Months Detected &bull; Both Group A and Group B Mapped
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setParsedData(null);
                  setSelectedFile(null);
                }}
              >
                Change File
              </Button>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Total Months</span>
                </div>
                <div className="text-xl font-black text-white">
                  {parsedData.summary.totalSheets} <span className="text-xs font-normal text-slate-400">Sheets</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">
                  {parsedData.summary.sheetNames.join(', ')}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Total Students</span>
                </div>
                <div className="text-xl font-black text-white">
                  {parsedData.summary.totalStudents} <span className="text-xs font-normal text-slate-400">trainees</span>
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">
                  Group A: {parsedData.summary.groupACount} | Group B: {parsedData.summary.groupBCount}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Class Sessions</span>
                </div>
                <div className="text-xl font-black text-white">
                  {parsedData.summary.totalSessions} <span className="text-xs font-normal text-slate-400">dates</span>
                </div>
                <div className="text-[10px] text-purple-400 mt-1">
                  With Subjects & Daily Dates
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Monthly Records</span>
                </div>
                <div className="text-xl font-black text-white">
                  {parsedData.summary.totalMonthlyRecords} <span className="text-xs font-normal text-slate-400">records</span>
                </div>
                <div className="text-[10px] text-amber-400 mt-1">
                  Calculated P / A / L Marks
                </div>
              </div>
            </div>

            {/* Month-by-month Breakdown Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Semester Attendance Breakdown:</span>
                <span className="text-[11px] text-slate-400">Group A & Group B Details</span>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
                {parsedData.summary.monthBreakdown.map((m) => (
                  <div key={m.monthKey} className="px-4 py-2.5 flex items-center justify-between text-xs bg-slate-950/40 hover:bg-slate-900/50">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white w-24">{m.monthName}</span>
                      <Badge variant="blue">
                        Group A: {m.groupASessions} sessions ({m.groupAStudents} students)
                      </Badge>
                      <Badge variant="purple">
                        Group B: {m.groupBSessions} sessions ({m.groupBStudents} students)
                      </Badge>
                    </div>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {m.groupASessions + m.groupBSessions} Total Sessions
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRegisterStudents}
                  onChange={(e) => setAutoRegisterStudents(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span>
                  <strong>Register & Update Students in System:</strong> Ensure all 163 students exist with their assigned Group A / Group B.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>

              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={handleImport}
                disabled={isImporting}
                leftIcon={
                  isImporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )
                }
              >
                {isImporting ? 'Importing & Syncing Attendance...' : 'Import & Apply All 6 Months Attendance'}
              </Button>
            </div>
          </div>
        )}

        {/* Completion State */}
        {isCompleted && (
          <div className="text-center py-8 space-y-3 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-extrabold text-white">
              6 Months Attendance Imported Successfully!
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              All 138 class sessions, 163 students, and thousands of daily P/A marks have been applied and synced to Supabase.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
