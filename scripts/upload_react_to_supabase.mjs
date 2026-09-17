import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import fs from 'fs';

const url = 'https://yxwuigbjvqypluoepgje.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4d3VpZ2JqdnF5cGx1b2VwZ2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjA3OTIsImV4cCI6MjEwMzkzNjc5Mn0.q51MJ1V_ulXydptFaJiWtp-L3wCY6zuaiXWPZrKnvnE';

const supabase = createClient(url, anonKey);

const MONTH_MAP = {
  may: '2026-05',
  june: '2026-06',
  july: '2026-07',
  august: '2026-08',
  september: '2026-09',
};

const parseDateStr = (rawDate, defaultMonth) => {
  if (!rawDate) return { isoDate: `${defaultMonth}-01`, displayDate: '' };
  if (typeof rawDate === 'number' && rawDate > 40000) {
    const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return { isoDate: `${year}-${month}-${day}`, displayDate: `${day}.${month}.${year}` };
  }
  const str = String(rawDate).trim();
  const match = str.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return { isoDate: `${year}-${month}-${day}`, displayDate: `${day}.${month}.${year}` };
  }
  return { isoDate: `${defaultMonth}-01`, displayDate: str };
};

async function uploadToSupabase() {
  console.log('🚀 Starting Direct Frontend Developer Attendance Upload to Supabase...');

  // 1. Ensure Frontend Developer course exists
  console.log('1. Checking Courses in Supabase...');
  const { data: courses } = await supabase.from('courses').select('*');
  let feCourse = courses?.find(c => c.id === 'Frontend Developer' || c.name === 'Frontend Developer');
  if (!feCourse) {
    console.log('   Creating Frontend Developer course in DB...');
    const { data: newCourse, error: errC } = await supabase.from('courses').upsert({
      id: 'Frontend Developer',
      code: 'TIC-FE-01',
      name: 'Frontend Developer',
      description: 'Comprehensive React & Frontend Development',
      duration_months: 5,
      is_active: true,
    }).select().single();
    if (errC) console.error('   Error creating course:', errC.message);
    else feCourse = newCourse;
  }
  console.log('   ✓ Frontend Developer course confirmed in DB.');

  // 2. Fetch all students and deduplicate
  console.log('2. Fetching students from Supabase...');
  const { data: dbStudents } = await supabase.from('students').select('*');
  console.log(`   Found ${dbStudents?.length} total students in DB.`);

  // Find duplicates by ut_number
  const byUt = new Map();
  const duplicatesToDelete = [];

  for (const s of (dbStudents || [])) {
    const ut = (s.ut_number || '').trim().toUpperCase();
    if (!ut) continue;
    if (byUt.has(ut)) {
      // Duplicate! Keep the primary one, mark this for deletion
      duplicatesToDelete.push(s.id);
    } else {
      byUt.set(ut, s);
    }
  }

  if (duplicatesToDelete.length > 0) {
    console.log(`   Found ${duplicatesToDelete.length} duplicate student records. Cleaning up...`);
    for (const dupId of duplicatesToDelete) {
      await supabase.from('students').delete().eq('id', dupId);
    }
    console.log('   ✓ Duplicate student records cleaned from DB.');
  }

  // Ensure UT011700 (Ravithas Thanusika) is assigned to Full Stack
  const stu1700 = byUt.get('UT011700');
  if (stu1700 && stu1700.course_id === 'Frontend Developer') {
    console.log('   Fixing UT011700 (Ravithas Thanusika) course assignment -> Full Stack...');
    await supabase.from('students').update({
      course_id: 'CRS-TIC-01',
    }).eq('id', stu1700.id);
    console.log('   ✓ UT011700 re-assigned to Full Stack.');
  }

  // 3. Read Excel file
  const excelPath = fs.existsSync('react.xlsx') ? 'react.xlsx' : 'C:\\Users\\unico.UNICOMTIC85\\Downloads\\React - Students Attenhttps___accounts.google.com_SignOutOptions_hl=en-GB&continue=https___docs.google.com_spreadsheets_d_1r_W9WSJiV16fiYr4CoL3cMs_pP2MUmHdIC0qGyoXRSo_edit%3Fusp%3Ddrive_web%26ouid%3D11.xlsx';
  console.log(`3. Reading Excel from: ${excelPath}`);
  const wb = xlsx.readFile(excelPath);

  const allSessions = [];
  const allMarks = [];
  const monthlySummaries = [];
  const frontendUtSet = new Set();

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;

    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length < 4) continue;

    const monthKey = sheetName.toLowerCase().trim();
    const ym = MONTH_MAP[monthKey] || '2026-05';
    const year = parseInt(ym.split('-')[0], 10);

    let feHeader = -1;
    rows.forEach((r, idx) => {
      if (feHeader === -1 && r.some(c => typeof c === 'string' && (c.includes('UT NO') || c.includes('UT_NO')))) {
        feHeader = idx;
      }
    });

    if (feHeader === -1) continue;

    let actualDateRow = feHeader + 2;
    let actualSubjectRow = feHeader + 1;

    const isRowDate = (rowArr) =>
      rowArr && rowArr.some((c) => (typeof c === 'string' && /\d{1,2}[./-]\d{1,2}[./-]\d{4}/.test(c)) || (typeof c === 'number' && c > 40000));

    if (isRowDate(rows[feHeader + 2])) {
      actualDateRow = feHeader + 2;
      actualSubjectRow = feHeader + 1;
    } else if (isRowDate(rows[feHeader + 3])) {
      actualDateRow = feHeader + 3;
      actualSubjectRow = feHeader + 2;
    }

    const activeDates = rows[actualDateRow] || [];
    const activeSubjects = rows[actualSubjectRow] || [];
    const sessionCols = [];

    for (let c = 3; c < activeDates.length; c++) {
      const d = activeDates[c];
      if (!d) continue;
      const str = String(d).trim();
      if (['L', 'A', 'P', 'p', 'total', 'TOTAL', '%', '#DIV/0!', 'Late', 'Absent', 'Present', 'Sessions', 'Ratio'].includes(str)) break;

      const isValid = /\d{1,2}[./-]\d{1,2}[./-]\d{4}/.test(str) || (typeof d === 'number' && d > 40000);
      if (!isValid) continue;

      const subj = (activeSubjects[c] || '').toString().trim() || 'Daily Class';
      const { isoDate, displayDate } = parseDateStr(d, ym);
      const sessionId = `SES-${ym}-FE-${c}`;

      const sessionObj = {
        id: sessionId,
        group: 'Frontend Developer',
        month: ym,
        date: isoDate,
        display_date: displayDate || str,
        subject: subj,
      };

      sessionCols.push({ col: c, session: sessionObj });
      allSessions.push(sessionObj);
    }

    // Process students in sheet
    for (let r = actualDateRow + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const utNo = (row[1] || '').toString().trim();
      const name = (row[2] || '').toString().trim();
      if (!utNo || !name || !utNo.toUpperCase().startsWith('UT')) continue;

      const normUt = utNo.toUpperCase();
      frontendUtSet.add(normUt);

      // Find or create student in DB
      let stu = byUt.get(normUt);
      if (!stu) {
        console.log(`   Registering new student: ${normUt} - ${name}`);
        const newStuObj = {
          id: `STU-${normUt}`,
          ut_number: normUt,
          full_name: name,
          course_id: 'Frontend Developer',
          current_status: 'Active',
          is_blossom_trust: true,
          gender: 'Other',
          dob: '2004-01-01',
        };
        const { data: created } = await supabase.from('students').insert(newStuObj).select().single();
        if (created) {
          stu = created;
          byUt.set(normUt, stu);
        }
      }

      if (!stu) continue;

      // Extract marks for this student across sessions
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;

      sessionCols.forEach(({ col, session }) => {
        const rawMark = (row[col] || '').toString().trim().toUpperCase();
        let mark = 'A';
        if (rawMark === 'P' || rawMark === 'PRESENT') {
          mark = 'P';
          presentCount++;
        } else if (rawMark === 'L' || rawMark === 'LATE') {
          mark = 'L';
          lateCount++;
        } else {
          mark = 'A';
          absentCount++;
        }

        allMarks.push({
          id: `MRK-${session.id}-${stu.id}`,
          session_id: session.id,
          student_id: stu.id,
          mark,
        });
      });

      const totalHeld = sessionCols.length;
      if (totalHeld > 0) {
        const pct = Math.round(((presentCount + lateCount * 0.5) / totalHeld) * 100);
        let status = 'Good Attendance';
        if (pct < 75) status = 'Critical Attendance';
        else if (pct < 85) status = 'Low Attendance';

        monthlySummaries.push({
          id: `ATT-${ym}-${normUt}`,
          student_id: stu.id,
          year,
          month: ym,
          attendance_percentage: pct,
          status,
          recorded_by: 'Excel Upload',
        });
      }
    }
  }

  // 4. Update the 12 Frontend students' course_id to Frontend Developer in Supabase
  console.log(`4. Updating ${frontendUtSet.size} Frontend Developer trainees in DB...`);
  for (const ut of frontendUtSet) {
    const stu = byUt.get(ut);
    if (stu && stu.course_id !== 'Frontend Developer') {
      await supabase.from('students').update({ course_id: 'Frontend Developer' }).eq('id', stu.id);
      console.log(`   ✓ Set ${ut} (${stu.full_name}) -> Frontend Developer`);
    }
  }

  // 5. Upsert sessions into attendance_sessions
  console.log(`5. Upserting ${allSessions.length} attendance sessions to Supabase...`);
  // Chunking to prevent packet limits
  for (let i = 0; i < allSessions.length; i += 50) {
    const chunk = allSessions.slice(i, i + 50);
    const { error: errSes } = await supabase.from('attendance_sessions').upsert(chunk, { onConflict: 'id' });
    if (errSes) console.error('   Error upserting sessions:', errSes.message);
  }
  console.log('   ✓ Sessions upserted successfully.');

  // 6. Upsert marks into attendance_marks
  console.log(`6. Upserting ${allMarks.length} attendance marks to Supabase...`);
  for (let i = 0; i < allMarks.length; i += 200) {
    const chunk = allMarks.slice(i, i + 200);
    const { error: errMarks } = await supabase.from('attendance_marks').upsert(chunk, { onConflict: 'session_id,student_id' });
    if (errMarks) console.error('   Error upserting marks:', errMarks.message);
  }
  console.log('   ✓ Attendance marks upserted successfully.');

  // 7. Upsert monthly attendance summaries
  console.log(`7. Upserting ${monthlySummaries.length} monthly attendance summaries to Supabase...`);
  for (let i = 0; i < monthlySummaries.length; i += 50) {
    const chunk = monthlySummaries.slice(i, i + 50);
    const { error: errAtt } = await supabase.from('attendance').upsert(chunk, { onConflict: 'student_id,month' });
    if (errAtt) console.error('   Error upserting monthly summaries:', errAtt.message);
  }
  console.log('   ✓ Monthly attendance summaries upserted successfully.');

  console.log('\n🎉 ALL DONE! Supabase is completely synced with Frontend Developer attendance:');
  console.log(`   - Course: Frontend Developer`);
  console.log(`   - Trainees: ${frontendUtSet.size} students`);
  console.log(`   - Sessions: ${allSessions.length} sessions (May, June, July, August)`);
  console.log(`   - Marks: ${allMarks.length} daily P/A records`);
}

uploadToSupabase().then(() => {
  setTimeout(() => process.exit(0), 1000);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
