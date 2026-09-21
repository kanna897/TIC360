import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useStore } from '@/lib/store';
import { UploadCloud, AlertTriangle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkSectionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  rowNum: number;
  utNumber: string;
  name: string;
  section: string;
  studentId?: string;
  batchId?: string;
  isValid: boolean;
  isReplacement?: boolean;
  replacementMessage?: string;
  error?: string;
}

export const BulkSectionUploadModal: React.FC<BulkSectionUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { students, batches, updateStudent } = useStore();

  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('All');
  
  const activeBatch = batches.find((b) => b.id === selectedBatchId);
  const availableSections = activeBatch?.availableSections || [];

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setActiveTab('All');
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setSelectedBatchId('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      parseExcel(f, selectedBatchId, effectiveFrom);
    }
  };

  const parseExcel = (fileToParse: File, batchId: string, dateStr: string) => {
    if (!batchId) {
      alert("Please select a batch first.");
      setFile(null);
      return;
    }

    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    if (!batch.isSplitEnabled) {
       alert(`Batch ${batch.name} does not have Section Split enabled.`);
       setFile(null);
       return;
    }

    const splitDate = batch.splitDate || '';
    if (splitDate && dateStr < splitDate) {
       alert(`Effective date cannot be earlier than the batch split date (${splitDate}).`);
       setFile(null);
       return;
    }

    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        let headers: string[] = [];
        const rows: ParsedRow[] = [];
        
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          // Find headers
          if (headers.length === 0) {
             const rowText = row.map(c => String(c || '').toUpperCase().trim()).join(' ');
             if (rowText.includes('UT NO') || rowText.includes('UT NUMBER') || rowText.includes('NAME') || rowText.includes('SECTION')) {
               headers = row.map(cell => String(cell || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
               continue;
             }
             continue; // still searching for headers
          }

          // Parse row using headers
          const normalizedRow: Record<string, any> = {};
          for (let j = 0; j < headers.length; j++) {
            if (headers[j]) {
              normalizedRow[headers[j]] = row[j];
            }
          }

          const utNumberRaw = normalizedRow['utno'] || normalizedRow['utnumber'] || normalizedRow['ut'];
          const nameRaw = normalizedRow['name'] || normalizedRow['studentname'] || normalizedRow['fullname'] || '';
          const sectionRaw = normalizedRow['section'] || normalizedRow['track'] || normalizedRow['sectionname'] || '';

          // Skip completely empty parsed rows
          if (!utNumberRaw && !nameRaw && !sectionRaw) continue;

          const rowData: ParsedRow = {
            rowNum: i + 1,
            utNumber: String(utNumberRaw || '').trim(),
            name: String(nameRaw || '').trim(),
            section: String(sectionRaw || '').trim(),
            isValid: false,
          };

          // Validation
          if (!rowData.utNumber) {
            rowData.error = "Missing UT Number";
          } else if (!rowData.section) {
            rowData.error = "Missing Section";
          } else {
            const student = students.find(s => s.utNumber.toLowerCase() === rowData.utNumber.toLowerCase());
            if (!student) {
              rowData.error = "Unknown UT Number";
            } else if (student.batchId !== batchId) {
              rowData.error = `Student is in wrong batch (${student.batchName})`;
            } else {
              rowData.studentId = student.id;
              
              // Validate Section
              const validSections = batch.availableSections || [];
              const matchedSection = validSections.find(vs => vs.toLowerCase() === rowData.section.toLowerCase());
              
              if (!matchedSection) {
                 if (rowData.section.toLowerCase().includes('group a') || rowData.section.toLowerCase().includes('group b')) {
                   rowData.error = "Cannot assign to Group A/B via section bulk upload";
                 } else {
                   rowData.error = "Invalid Section";
                 }
              } else {
                 rowData.section = matchedSection; // Normalize case
                 
                 // Check if ANY allocation already exists on this date
                 const allocOnDate = student.sectionAllocations?.find(
                   a => a.effectiveFrom === dateStr
                 );
                 if (allocOnDate) {
                   if (allocOnDate.section === matchedSection) {
                     rowData.error = "Exact allocation already exists (Duplicate)";
                   } else {
                     rowData.isValid = true;
                     rowData.isReplacement = true;
                     rowData.replacementMessage = `Will replace existing allocation (${allocOnDate.section}) on this date.`;
                   }
                 } else {
                   // Valid!
                   rowData.isValid = true;
                 }
              }
            }
          }

          rows.push(rowData);
        }
        
        setParsedRows(rows);
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file");
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(fileToParse);
  };

  // Re-run parsing if date or batch changes after file is selected
  React.useEffect(() => {
    if (file && selectedBatchId && effectiveFrom) {
       parseExcel(file, selectedBatchId, effectiveFrom);
    }
  }, [selectedBatchId, effectiveFrom]);

  const validRows = parsedRows.filter(r => r.isValid);
  const errorRows = parsedRows.filter(r => !r.isValid);
  
  const tabs = ['All', ...(activeBatch?.availableSections || []), 'Errors'];

  const filteredRows = useMemo(() => {
    if (activeTab === 'All') return parsedRows;
    if (activeTab === 'Errors') return errorRows;
    return parsedRows.filter(r => r.section === activeTab && r.isValid);
  }, [parsedRows, activeTab, errorRows]);

  const handleSave = () => {
     if (validRows.length === 0) return;

     let updatedCount = 0;

     validRows.forEach(row => {
        const student = students.find(s => s.id === row.studentId);
        if (student) {
           const existingAllocs = student.sectionAllocations || [];
           
           // Double check no duplicate exists
           const exactDup = existingAllocs.some(a => a.section === row.section && a.effectiveFrom === effectiveFrom);
           if (!exactDup) {
              // Filter out the old allocation on this date if replacing
              const filteredAllocs = existingAllocs.filter(a => a.effectiveFrom !== effectiveFrom);
              
              const newAllocs = [
                ...filteredAllocs,
                { section: row.section, effectiveFrom }
              ].sort((a, b) => new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime());

              updateStudent(student.id, {
                 sectionAllocations: newAllocs
              });
              updatedCount++;
           }
        }
     });

     alert(`Successfully saved ${updatedCount} section allocations.`);
     handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Section Assign (Excel)"
      subtitle="Assign students to post-split sections in bulk."
      maxWidth="4xl"
    >
      <div className="space-y-6">
        
        {/* Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <Select
             label="Target Batch *"
             value={selectedBatchId}
             onChange={(e) => setSelectedBatchId(e.target.value)}
             options={[
               { value: '', label: 'Select Batch' },
               ...batches.map(b => ({ value: b.id, label: b.name }))
             ]}
          />
          <Input
             label="Effective From *"
             type="date"
             value={effectiveFrom}
             onChange={(e) => setEffectiveFrom(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300">Excel File (UT NO, NAME, SECTION) *</label>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              disabled={!selectedBatchId || !effectiveFrom}
              className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-all cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>

        {/* Warning if batch doesn't have split enabled */}
        {activeBatch && !activeBatch.isSplitEnabled && (
           <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 shrink-0" />
             <p>This batch does not have the Course Split feature enabled. Please enable it in Settings first.</p>
           </div>
        )}

        {/* Preview Area */}
        {parsedRows.length > 0 && (
           <div className="space-y-4">
              <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
                 {tabs.map(tab => {
                   let count = 0;
                   if (tab === 'All') count = parsedRows.length;
                   else if (tab === 'Errors') count = errorRows.length;
                   else count = parsedRows.filter(r => r.section === tab && r.isValid).length;

                   return (
                     <button
                       key={tab}
                       onClick={() => setActiveTab(tab)}
                       className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${
                         activeTab === tab
                           ? tab === 'Errors' ? 'bg-red-500/20 text-red-400 border-b-2 border-red-500' : 'bg-blue-500/20 text-blue-400 border-b-2 border-blue-500'
                           : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                       }`}
                     >
                       {tab} ({count})
                     </button>
                   );
                 })}
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                 <div className="overflow-y-auto max-h-[400px]">
                    <table className="w-full text-left border-collapse text-xs">
                       <thead className="sticky top-0 bg-slate-900 shadow-md">
                          <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                             <th className="p-3">Row</th>
                             <th className="p-3">UT Number</th>
                             <th className="p-3">Name</th>
                             <th className="p-3">Parsed Section</th>
                             <th className="p-3">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800/50">
                          {filteredRows.length === 0 ? (
                             <tr>
                               <td colSpan={5} className="p-8 text-center text-slate-500">
                                 No records in this category.
                               </td>
                             </tr>
                          ) : (
                             filteredRows.map((row, idx) => (
                               <tr key={idx} className="hover:bg-slate-900/50 transition-colors text-slate-300">
                                 <td className="p-3 text-slate-500">{row.rowNum}</td>
                                 <td className="p-3 font-mono text-slate-400">{row.utNumber}</td>
                                 <td className="p-3">{row.name}</td>
                                 <td className="p-3 font-medium text-slate-200">{row.section}</td>
                                 <td className="p-3">
                                    {row.isValid ? (
                                      <span className="flex flex-col gap-0.5">
                                        <span className="flex items-center gap-1.5 text-emerald-400">
                                          <CheckCircle2 className="w-4 h-4" /> Valid
                                        </span>
                                        {row.isReplacement && (
                                          <span className="text-[10px] text-amber-400 italic">
                                            {row.replacementMessage}
                                          </span>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1.5 text-red-400 font-medium">
                                        <AlertTriangle className="w-4 h-4" /> {row.error}
                                      </span>
                                    )}
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

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
           <Button variant="outline" onClick={handleClose}>
             Cancel
           </Button>
           <Button
             variant="primary"
             onClick={handleSave}
             disabled={validRows.length === 0 || !activeBatch?.isSplitEnabled}
           >
             Confirm & Save Allocations ({validRows.length})
           </Button>
        </div>
      </div>
    </Modal>
  );
};
