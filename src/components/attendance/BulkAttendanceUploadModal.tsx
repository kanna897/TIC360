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
  Zap,
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
  const { bulkImportAllAttendance, students, programmeHistory } = useStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedAttendanceData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Settings
  const [autoRegisterStudents, setAutoRegisterStudents] = useState(true);

  const resetState = () => {
    setSelectedFileName(null);
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

  const processBuffer = async (buffer: ArrayBuffer, fileName: string) => {
    setSelectedFileName(fileName);
    setIsParsing(true);
    setParseError(null);
    setParsedData(null);

    try {
      const result = await parseAttendanceExcel(buffer, students, programmeHistory);

      if (result.summary.totalSessions === 0) {
        setParseError('No attendance sessions found in this workbook. Please ensure sheets match month names (May, June, July, August, September, April, etc.).');
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const buffer = await file.arrayBuffer();
      processBuffer(buffer, file.name);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      const buffer = await file.arrayBuffer();
      processBuffer(buffer, file.name);
    }
  };

  // Quick load pre-bundled React attendance file
  const handleLoadBundledReactFile = async () => {
    setIsParsing(true);
    setParseError(null);
    try {
      const res = await fetch('/react_attendance.xlsx');
      if (!res.ok) throw new Error('Could not load react_attendance.xlsx');
      const buffer = await res.arrayBuffer();
      await processBuffer(buffer, 'React - Students Attendance - 2026.xlsx');
    } catch (err) {
      console.error(err);
      setParseError('Unable to load bundled React attendance file. Please choose or drag the file manually.');
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setIsImporting(true);
    try {
      bulkImportAllAttendance(
        parsedData.sessions,
        parsedData.marks,
        parsedData.monthly,
        autoRegisterStudents ? parsedData.students : undefined
      );

      setIsCompleted(true);

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

  const isFrontend = parsedData?.summary.detectedFormat.includes('Frontend');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Attendance Upload (Excel)"
      subtitle="Upload semester attendance spreadsheets for Full Stack (Groups A & B) or Frontend Developer (React)"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Upload Box */}
        {!parsedData && !isCompleted && (
          <div className="space-y-3">
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
                Supports <strong className="text-emerald-300 font-mono">React - Students Attendance.xlsx</strong> (May–Sep) and <strong className="text-blue-300 font-mono">Full Stack Group A & B</strong> workbooks.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isParsing}
                  leftIcon={<UploadCloud className="w-4 h-4 text-emerald-400" />}
                >
                  {isParsing ? 'Reading Excel File...' : 'Choose Excel (.xlsx) File'}
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isParsing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadBundledReactFile();
                  }}
                  leftIcon={<Zap className="w-4 h-4 text-amber-300" />}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  ⚡ Quick-Load Frontend (React) File
                </Button>
              </div>
            </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 gap-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-emerald-200">
                      Workbook Verified: {selectedFileName || 'Attendance Record.xlsx'}
                    </h4>
                    <Badge variant={parsedData.summary.detectedFormat === 'Mixed / Custom' ? 'purple' : isFrontend ? 'emerald' : 'blue'}>
                      {parsedData.summary.detectedFormat === 'Mixed / Custom' 
                        ? '🔄 Full Stack & Frontend' 
                        : isFrontend ? '⚛️ Frontend Developer (React)' : '👨‍💻 Full Stack Developer'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-emerald-400/80 mt-0.5">
                    {parsedData.summary.totalSheets} Months Detected &bull; {parsedData.summary.totalStudents} Trainees &bull; {parsedData.summary.totalSessions} Sessions Ready
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setParsedData(null);
                  setSelectedFileName(null);
                }}
              >
                Change File
              </Button>
            </div>

            {/* Mismatch Warnings */}
            {parsedData.summary.warnings?.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-300">Programme Mismatches Detected ({parsedData.summary.warnings.length})</h4>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                  {parsedData.summary.warnings.map((warn, i) => (
                    <p key={i} className="text-[11px] text-amber-200/80">{warn}</p>
                  ))}
                </div>
              </div>
            )}

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
                  {parsedData.summary.detectedFormat === 'Mixed / Custom'
                    ? `GA: ${parsedData.summary.groupACount} | GB: ${parsedData.summary.groupBCount} | FE: ${parsedData.summary.frontendCount}`
                    : isFrontend 
                      ? `${parsedData.summary.frontendCount} Trainees Enrolled` 
                      : `GA: ${parsedData.summary.groupACount} | GB: ${parsedData.summary.groupBCount}`}
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
                  With Daily Subjects & Dates
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
                <span className="text-[11px] text-slate-400">{parsedData.summary.detectedFormat}</span>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
                {parsedData.summary.monthBreakdown.map((m) => (
                  <div key={m.monthKey} className="px-4 py-2.5 flex items-center justify-between text-xs bg-slate-950/40 hover:bg-slate-900/50">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white w-24">{m.monthName}</span>
                      {isFrontend ? (
                        <Badge variant="emerald">
                          {m.frontendSessions} sessions ({m.frontendStudents} trainees)
                        </Badge>
                      ) : (
                        <>
                          <Badge variant="blue">
                            Group A: {m.groupASessions} sessions ({m.groupAStudents} students)
                          </Badge>
                          <Badge variant="purple">
                            Group B: {m.groupBSessions} sessions ({m.groupBStudents} students)
                          </Badge>
                        </>
                      )}
                    </div>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {isFrontend ? m.frontendSessions : m.groupASessions + m.groupBSessions} Total Sessions
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
                  <strong>Register & Update Students in System:</strong> Ensure all {parsedData.summary.totalStudents} students are assigned to <strong>{isFrontend ? 'Frontend Developer' : 'Full Stack Developer'}</strong> without duplicates.
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
                {isImporting ? 'Importing & Syncing Attendance...' : `Import & Apply ${parsedData.summary.totalSessions} Sessions (${parsedData.summary.courseType})`}
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
              Attendance Imported & Synced Successfully!
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              {parsedData ? `${parsedData.summary.totalSessions} sessions and daily P/A marks for ${parsedData.summary.totalStudents} students have been saved.` : 'All attendance sessions and marks have been applied.'}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
