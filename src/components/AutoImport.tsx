'use client';

import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { useStore } from '@/lib/store';
import { AttendanceSession, AttendanceMark } from '@/lib/types';

export const AutoImport = () => {
  const { students, importGoogleSheetAttendance } = useStore();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    
    // To prevent running multiple times if strict mode is on
    const hasRun = sessionStorage.getItem('auto_import_run');
    if (hasRun) {
      setDone(true);
      return;
    }
    
    const runImport = async () => {
      try {
        const response = await fetch('/temp_attendance.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        
        // Use raw: true to prevent CSV parsing issues (though this is xlsx)
        const workbook = XLSX.read(arrayBuffer, { type: 'array', raw: true });
        
        const newParsedData: Record<string, { sessions: AttendanceSession[], marks: Record<string, Record<string, AttendanceMark>> }> = {};
        
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

          if (headerRowIdx === -1) return;

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

          if (dateRowIdx === -1) return;

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
              const monthStr = dateStr.substring(0, 7);
              
              if (!newParsedData[monthStr]) {
                newParsedData[monthStr] = { sessions: [], marks: {} };
              }
              
              const sessionId = `sess_auto_${dateStr}_${colIdx}`;
              
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
                subject: 'Full Stack Developer' // Defaulting based on the user's usual choice
              });
              
              newParsedData[monthStr].marks[sessionId] = {};
              sessionMap[colIdx] = { sessionId, monthStr };
            }
          });

          for (let i = dateRowIdx + 1; i < raw.length; i++) {
            const row = raw[i];
            if (!row || !row.length) continue;
            
            const utNoCell = row.find((v: any) => typeof v === 'string' && v.startsWith('UT'));
            if (!utNoCell) continue;
            
            const cleanUtNo = utNoCell.trim();
            const student = students.find(s => s.utNumber === cleanUtNo);
            
            if (student) {
              Object.keys(sessionMap).forEach(colIdxStr => {
                const colIdx = parseInt(colIdxStr, 10);
                const markVal = row[colIdx];
                if (markVal && typeof markVal === 'string') {
                  const cleanMark = markVal.trim().toUpperCase();
                  if (cleanMark === 'P' || cleanMark === 'A' || cleanMark === 'L') {
                     const { sessionId, monthStr } = sessionMap[colIdx];
                     newParsedData[monthStr].marks[sessionId][student.id] = cleanMark as AttendanceMark;
                  }
                }
              });
            }
          }
        });

        // Save everything
        Object.entries(newParsedData).forEach(([month, data]) => {
          importGoogleSheetAttendance(month, data.sessions, data.marks);
        });

        sessionStorage.setItem('auto_import_run', 'true');
        setDone(true);
        console.log('AUTO IMPORT SUCCESSFUL!', Object.keys(newParsedData).length, 'months imported.');
      } catch (err) {
        console.error('AUTO IMPORT FAILED:', err);
      }
    };

    runImport();
  }, [students, importGoogleSheetAttendance, done]);

  if (done) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-lg text-sm z-50">
      Importing background attendance from Google Sheet...
    </div>
  );
};
