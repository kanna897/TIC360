import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UploadCloud, CheckCircle2, Play, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { AttendanceSession, AttendanceMark } from '@/lib/types';
import * as XLSX from 'xlsx';

interface GoogleSheetsUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsUploadModal: React.FC<GoogleSheetsUploadModalProps> = ({ isOpen, onClose }) => {
  const { students, importGoogleSheetAttendance } = useStore();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  const d = new Date();
  const defaultMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const [targetMonth, setTargetMonth] = useState(defaultMonth);
  const [courseFilter, setCourseFilter] = useState<'All' | 'Full Stack' | 'Frontend'>('All');
  
  const [isParsing, setIsParsing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parsedSessions, setParsedSessions] = useState<AttendanceSession[]>([]);
  const [parsedMarks, setParsedMarks] = useState<Record<string, Record<string, AttendanceMark>>>({});
  const [matchStats, setMatchStats] = useState({ matchedStudents: 0, missingStudents: 0, totalMarks: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
      setError(null);
      setParsedSessions([]);
      setParsedMarks({});
    }
  };

  const handleParse = () => {
    if (!csvFile) return;
    setIsParsing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(20, raw.length); i++) {
          if (raw[i] && raw[i].some((cell: any) => typeof cell === 'string' && cell.includes('UT NO'))) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          throw new Error("Could not find a row containing 'UT NO' header.");
        }

        let dateRowIdx = -1;
        for(let i = headerRowIdx; i < Math.min(headerRowIdx + 5, raw.length); i++) {
          if(raw[i] && raw[i].some((v: any) => typeof v === 'string' && v.match(/\d{2}\.\d{2}\.\d{4}/))) {
            dateRowIdx = i;
            break;
          } else if (raw[i] && raw[i].some((v: any) => typeof v === 'number' && v > 40000)) {
            dateRowIdx = i;
            break;
          }
        }

        if (dateRowIdx === -1) {
          throw new Error("Could not find a row containing dates (e.g. 01.04.2026 or Excel dates).");
        }

        const dates = raw[dateRowIdx];
        const newSessions: AttendanceSession[] = [];
        const newMarks: Record<string, Record<string, AttendanceMark>> = {};
        const sessionMap: Record<number, string> = {}; 

        dates.forEach((val: any, colIdx: number) => {
          if (!val) return;
          let dateStr = '';
          if (typeof val === 'string' && val.match(/\d{2}\.\d{2}\.\d{4}/)) {
            const parts = val.split('.');
            dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else if (typeof val === 'number') {
            const dateObj = new Date(Math.round((val - 25569)*86400*1000));
            dateStr = dateObj.toISOString().split('T')[0];
          }

          if (dateStr && dateStr.startsWith(targetMonth)) {
            const coursePrefix = courseFilter === 'Full Stack' ? 'FS' : (courseFilter === 'Frontend' ? 'React' : 'Gen');
            const sessionId = `sess_sheet_${coursePrefix}_${dateStr}_${colIdx}`;
            
            let dispDate = '';
            if (typeof val === 'string' && val.match(/\d{2}\.\d{2}\.\d{4}/)) {
              dispDate = val;
            } else {
              const dParts = dateStr.split('-');
              dispDate = `${dParts[2]}.${dParts[1]}.${dParts[0]}`;
            }

            newSessions.push({
              id: sessionId,
              batchId: 'B01',
              group: 'all',
              month: targetMonth,
              date: dateStr,
              displayDate: dispDate,
              subject: courseFilter === 'Full Stack' ? 'Full Stack Developer' : (courseFilter === 'Frontend' ? 'Frontend Developer' : 'All Courses')
            });
            newMarks[sessionId] = {};
            sessionMap[colIdx] = sessionId;
          }
        });

        if (newSessions.length === 0) {
          throw new Error(`Found dates, but none matched the Target Month (${targetMonth}).`);
        }

        let matched = 0;
        let missing = 0;
        let marksCount = 0;

        for (let i = dateRowIdx + 1; i < raw.length; i++) {
          const row = raw[i];
          if (!row || !row.length) continue;
          
          const utNoCell = row.find((v: any) => typeof v === 'string' && v.startsWith('UT'));
          if (!utNoCell) continue;
          
          const cleanUtNo = utNoCell.trim();
          const student = students.find(s => s.utNumber === cleanUtNo);
          
          if (student) {
            matched++;
            Object.keys(sessionMap).forEach(colIdxStr => {
              const colIdx = parseInt(colIdxStr, 10);
              const markVal = row[colIdx];
              if (markVal && typeof markVal === 'string') {
                const cleanMark = markVal.trim().toUpperCase();
                if (cleanMark === 'P' || cleanMark === 'A' || cleanMark === 'L') {
                   newMarks[sessionMap[colIdx]][student.id] = cleanMark as AttendanceMark;
                   marksCount++;
                }
              }
            });
          } else {
            missing++;
          }
        }

        setParsedSessions(newSessions);
        setParsedMarks(newMarks);
        setMatchStats({ matchedStudents: matched, missingStudents: missing, totalMarks: marksCount });

      } catch (err: any) {
        setError(err.message || 'Failed to parse Excel/CSV file.');
      }
      setIsParsing(false);
    };
    reader.readAsBinaryString(csvFile);
  };

  const handleSave = () => {
    if (parsedSessions.length === 0) return;
    
    importGoogleSheetAttendance(targetMonth, parsedSessions, parsedMarks);
    setIsSaved(true);
    
    setTimeout(() => {
      onClose();
      setCsvFile(null);
      setParsedSessions([]);
      setParsedMarks({});
      setIsSaved(false);
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Google Sheets Attendance"
      subtitle="Upload a CSV/Excel file exported from your Google Sheets template."
      maxWidth="4xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div>
            <Input
              label="Target Month *"
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Course Format
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value as any)}
            >
              <option value="All">All Courses</option>
              <option value="Full Stack">Full Stack Developer</option>
              <option value="Frontend">Frontend Developer</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300">
              CSV / Excel File *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30 transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-200">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleParse}
            disabled={!csvFile || isParsing}
            variant="secondary"
            leftIcon={<Play className="w-4 h-4" />}
          >
            {isParsing ? 'Parsing...' : 'Analyze File'}
          </Button>
        </div>

        {parsedSessions.length > 0 && !error && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Parsed Successfully!
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <p className="text-2xl font-bold text-white">{parsedSessions.length}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Sessions Found</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <p className="text-2xl font-bold text-emerald-400">{matchStats.matchedStudents}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Matched Students</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <p className="text-2xl font-bold text-indigo-400">{matchStats.totalMarks}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Marks Extracted</p>
              </div>
            </div>

            {matchStats.missingStudents > 0 && (
              <p className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg text-center">
                Warning: {matchStats.missingStudents} UT Numbers from the file were not found in your database.
              </p>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Button
                onClick={handleSave}
                disabled={isSaved}
                variant="primary"
                leftIcon={<UploadCloud className="w-4 h-4" />}
              >
                {isSaved ? 'Saved Successfully!' : 'Confirm & Save to Matrix'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
