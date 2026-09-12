import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { UploadCloud, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { useStore } from '@/lib/store';
import { parseFingerprintCSV } from '@/lib/csvParser';
import { DailyTimeLog } from '@/lib/types';

interface FingerprintUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FingerprintUploadModal: React.FC<FingerprintUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { students, processFingerprintCSV } = useStore();

  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedLogs, setParsedLogs] = useState<DailyTimeLog[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
      setParsedLogs([]);
      setIsSaved(false);
    }
  };

  const handleParse = () => {
    if (!csvFile) return;

    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const logs = parseFingerprintCSV(text, students, sessionDate);
        setParsedLogs(logs);
      }
      setIsParsing(false);
    };
    reader.readAsText(csvFile);
  };

  const handleSave = () => {
    if (parsedLogs.length === 0) return;
    
    // Save to global store
    processFingerprintCSV(parsedLogs, sessionDate);
    setIsSaved(true);
    
    setTimeout(() => {
      onClose();
      // Reset state for next time
      setCsvFile(null);
      setParsedLogs([]);
      setIsSaved(false);
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Fingerprint Attendance"
      subtitle="Upload a CSV file from the biometric machine to auto-calculate daily attendance & dedication hours."
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Upload Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div>
            <Input
              label="Session Date *"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300">
              CSV File (UT_NO, DATE, IN_TIME, OUT_TIME) *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleParse}
            disabled={!csvFile || isParsing}
            variant="secondary"
            leftIcon={<Play className="w-4 h-4" />}
          >
            {isParsing ? 'Parsing...' : 'Analyze CSV'}
          </Button>
        </div>

        {/* Preview Table */}
        {parsedLogs.length > 0 && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Parsed Results ({parsedLogs.length} Records)
              </h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                  {parsedLogs.filter((l) => l.status === 'P').length} Present
                </span>
                <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 font-medium">
                  {parsedLogs.filter((l) => l.status === 'L').length} Late
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {['Group A', 'Group B', 'Unassigned'].map((groupName) => {
                const groupLogs = parsedLogs.filter((log) => {
                  const g = log.group?.toLowerCase() || '';
                  if (groupName === 'Group A') return g === 'group a' || g === 'a';
                  if (groupName === 'Group B') return g === 'group b' || g === 'b';
                  return g !== 'group a' && g !== 'a' && g !== 'group b' && g !== 'b';
                });

                if (groupLogs.length === 0) return null;

                return (
                  <div key={groupName} className="space-y-2">
                    <h4 className="text-sm font-bold text-blue-400 tracking-wider border-b border-slate-800 pb-2">{groupName} ({groupLogs.length} Students)</h4>
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      <div className="overflow-x-auto max-h-[300px]">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="sticky top-0 bg-slate-900 shadow-md">
                            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                              <th className="py-3 px-3">UT No</th>
                              <th className="py-3 px-3">Name</th>
                              <th className="py-3 px-3">In Time</th>
                              <th className="py-3 px-3">Out Time</th>
                              <th className="py-3 px-3 text-center">Status</th>
                              <th className="py-3 px-3 text-center">Extra Hours</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {groupLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-900/50">
                                <td className="py-2.5 px-3 font-mono text-slate-300">
                                  {log.utNumber}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-white">
                                  {log.studentName}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-400">
                                  {log.inTime || '-'}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-400">
                                  {log.outTime || '-'}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {log.status === 'P' && (
                                    <Badge variant="active">Present</Badge>
                                  )}
                                  {log.status === 'L' && (
                                    <Badge variant="amber">Late</Badge>
                                  )}
                                  {log.status === 'A' && (
                                    <Badge variant="rose">Absent</Badge>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-indigo-400">
                                  {log.extraHours > 0 ? `+${log.extraHours} hrs` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Action */}
            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Button
                onClick={handleSave}
                disabled={isSaved}
                variant="primary"
                leftIcon={<UploadCloud className="w-4 h-4" />}
              >
                {isSaved ? 'Saved Successfully!' : 'Confirm & Save Attendance'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
