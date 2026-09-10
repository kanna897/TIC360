import { DailyTimeLog, Student } from './types';

// Converts "HH:MM" or "HH:MM:SS" string to total minutes from midnight
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

// Converts total minutes back to "HH:MM"
const minutesToTime = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const parseFingerprintCSV = (
  csvText: string,
  students: Student[],
  sessionDate: string
): DailyTimeLog[] => {
  const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return []; // header + at least 1 data row

  const logs: DailyTimeLog[] = [];

  // Expected CSV structure (Simple example):
  // UT_NO, DATE, IN_TIME, OUT_TIME
  // UT-2026-001, 2026-04-12, 09:10, 16:30

  // We skip the header (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const columns = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (columns.length < 4) continue;

    const utNumber = columns[0];
    const inTime = columns[2];
    const outTime = columns[3];

    // Find matching student
    const student = students.find(
      (s) => s.utNumber.toLowerCase() === utNumber.toLowerCase()
    );
    if (!student) continue;

    // Calculate times
    const inMins = timeToMinutes(inTime);
    const outMins = timeToMinutes(outTime);
    let totalHours = 0;
    
    if (outMins > inMins) {
      totalHours = Number(((outMins - inMins) / 60).toFixed(2));
    }

    // Standard class block is 7 hours.
    const extraHours = totalHours > 7 ? Number((totalHours - 7).toFixed(2)) : 0;

    // Present / Late Logic
    // Limit for 'Present' is 09:15 AM -> 9 * 60 + 15 = 555 minutes
    const PRESENT_LIMIT_MINS = 555;
    
    // If there is no inTime, technically it's absent, but typically CSV wouldn't have a row or it's blank.
    let status: 'P' | 'L' | 'A' = 'A';
    if (inTime && inTime.length > 2) {
      status = inMins <= PRESENT_LIMIT_MINS ? 'P' : 'L';
    }

    logs.push({
      id: `${student.id}_${sessionDate}_${Math.random().toString(36).substring(7)}`,
      studentId: student.id,
      utNumber: student.utNumber,
      studentName: student.fullName,
      date: sessionDate,
      inTime,
      outTime,
      status,
      totalHours,
      extraHours,
    });
  }

  return logs;
};
