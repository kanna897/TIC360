import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
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
  
  const [courseFilter, setCourseFilter] = useState<'All' | 'Full Stack' | 'Frontend'>('All');
  
  const [isParsing, setIsParsing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Grouped by YYYY-MM
  const [parsedDataByMonth, setParsedDataByMonth] = useState<Record<string, { sessions: AttendanceSession[], marks: Record<string, Record<string, AttendanceMark>> }>>({});
  const [matchStats, setMatchStats] = useState({ matchedStudents: 0, missingStudents: 0, totalMarks: 0, totalSessions: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
      setError(null);
      setParsedDataByMonth({});
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
        
        const newParsedData: Record<string, { sessions: AttendanceSession[], marks: Record<string, Record<string, AttendanceMark>> }> = {};
        
        let totalMatched = 0;
        let totalMissing = 0;
        let totalMarks = 0;
        let totalSessions = 0;
        
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const raw = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

          let headerRowIdx = -1;
          for (let i = 0; i < Math.min(20, raw.length); i++) {
            if (raw[i] && raw[i].some((cell: any) => typeof cell === 'string' && cell.includes('UT NO'))) {
              headerRowIdx = i;
              break;
            }
          }

          if (headerRowIdx === -1) return; // Skip sheets without UT NO header

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

          if (dateRowIdx === -1) return; // Skip sheets without dates

          const dates = raw[dateRowIdx];
          const sessionMap: Record<number, { sessionId: string, monthStr: string }> = {}; 

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

            if (dateStr) {
              const monthStr = dateStr.substring(0, 7); // YYYY-MM
              
              if (!newParsedData[monthStr]) {
                newParsedData[monthStr] = { sessions: [], marks: {} };
              }
              
              const coursePrefix = courseFilter === 'Full Stack' ? 'FS' : (courseFilter === 'Frontend' ? 'React' : 'Gen');
              const sessionId = `sess_sheet_${coursePrefix}_${dateStr}_${colIdx}`;
              
              let dispDate = '';
              if (typeof val === 'string' && val.match(/\d{2}\.\d{2}\.\d{4}/)) {
                dispDate = val;
              } else {
                const dParts = dateStr.split('-');
                dispDate = `${dParts[2]}.${dParts[1]}.${dParts[0]}`;
              }

              newParsedData[monthStr].sessions.push({
                id: sessionId,
                batchId: 'B01',
                group: 'all',
                month: monthStr,
                date: dateStr,
                displayDate: dispDate,
                subject: courseFilter === 'Full Stack' ? 'Full Stack Developer' : (courseFilter === 'Frontend' ? 'Frontend Developer' : 'All Courses')
              });
              
              newParsedData[monthStr].marks[sessionId] = {};
              sessionMap[colIdx] = { sessionId, monthStr };
              totalSessions++;
            }
          });

          // Parse Students
          let sheetMatched = 0;
          let sheetMissing = 0;
          for (let i = dateRowIdx + 1; i < raw.length; i++) {
            const row = raw[i];
            if (!row || !row.length) continue;
            
            const utNoCell = row.find((v: any) => typeof v === 'string' && v.startsWith('UT'));
            if (!utNoCell) continue;
            
            const cleanUtNo = utNoCell.trim();
            const student = students.find(s => s.utNumber === cleanUtNo);
            
            if (student) {
              if (sheetMatched === 0) sheetMatched++; // Count matched roughly
              Object.keys(sessionMap).forEach(colIdxStr => {
                const colIdx = parseInt(colIdxStr, 10);
                const markVal = row[colIdx];
                if (markVal && typeof markVal === 'string') {
                  const cleanMark = markVal.trim().toUpperCase();
                  if (cleanMark === 'P' || cleanMark === 'A' || cleanMark === 'L') {
                     const { sessionId, monthStr } = sessionMap[colIdx];
                     newParsedData[monthStr].marks[sessionId][student.id] = cleanMark as AttendanceMark;
                     totalMarks++;
                  }
                }
              });
            } else {
              sheetMissing++;
            }
          }
          totalMatched += Object.keys(sessionMap).length > 0 ? students.length : 0; // rough estimation
        });

        if (Object.keys(newParsedData).length === 0) {
          throw new Error("Could not extract any valid sessions/dates from the entire Excel file.");
        }

        setParsedDataByMonth(newParsedData);
        setMatchStats({ matchedStudents: students.length, missingStudents: 0, totalMarks, totalSessions });

      } catch (err: any) {
        setError(err.message || 'Failed to parse Excel/CSV file.');
      }
      setIsParsing(false);
    };
    reader.readAsBinaryString(csvFile);
  };

  const handleSave = () => {
    if (Object.keys(parsedDataByMonth).length === 0) return;
    
    Object.entries(parsedDataByMonth).forEach(([month, data]) => {
      importGoogleSheetAttendance(month, data.sessions, data.marks);
    });
    
    setIsSaved(true);
    
    setTimeout(() => {
      onClose();
      setCsvFile(null);
      setParsedDataByMonth({});
      setIsSaved(false);
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Google Sheets Attendance (All Months)"
      subtitle="Upload a CSV/Excel file with multiple sheets. All months will be automatically detected and imported."
      maxWidth="4xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
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
            {isParsing ? 'Analyzing File...' : 'Analyze File'}
          </Button>
        </div>

        {Object.keys(parsedDataByMonth).length > 0 && !error && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Parsed Successfully!
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <p className="text-2xl font-bold text-white">{Object.keys(parsedDataByMonth).length}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Months Found</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <p className="text-2xl font-bold text-emerald-400">{matchStats.totalSessions}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Total Sessions</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <p className="text-2xl font-bold text-indigo-400">{matchStats.totalMarks}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Marks Extracted</p>
              </div>
            </div>

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
