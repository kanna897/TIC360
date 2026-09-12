const xlsx = require('xlsx');
const fs = require('fs');

const extractData = (filename, coursePrefix) => {
  const workbook = xlsx.readFile(filename);
  const data = { sessions: [], marks: {} };
  const months = ['April', 'May', 'June', 'July', 'August', 'September'];
  
  months.forEach((month, monthIdx) => {
    if (!workbook.Sheets[month]) return;
    const sheet = workbook.Sheets[month];
    const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find header row (usually contains S.NO, UT NO, Dates)
    let headerRowIdx = -1;
    for (let i = 0; i < 10; i++) {
      if (raw[i] && raw[i].includes('UT NO')) {
        headerRowIdx = i;
        break;
      }
    }
    
    if (headerRowIdx === -1) return;
    
    // Dates are usually in the row immediately below the subjects, or right on the header row.
    // Based on the CSV we saw:
    // Row 10: S.NO, UT NO, STUDENT'S NAME, April...
    // Row 11: Induction, HTML & LAB...
    // Row 12: 01.04.2026, 03.04.2026...
    // Wait, let's just find the row that has dates.
    let dateRowIdx = -1;
    for(let i = headerRowIdx; i < headerRowIdx + 5; i++) {
      if(raw[i] && raw[i].some(v => typeof v === 'string' && v.match(/\d{2}\.\d{2}\.\d{4}/))) {
        dateRowIdx = i;
        break;
      } else if (raw[i] && raw[i].some(v => typeof v === 'number' && v > 40000)) { // Excel date numbers
        dateRowIdx = i;
        break;
      }
    }
    
    if (dateRowIdx === -1) return;
    
    const dates = raw[dateRowIdx];
    
    // Create sessions for this month based on dates
    const sessionMap = {}; // colIndex -> sessionId
    const monthNumStr = (monthIdx + 4).toString().padStart(2, '0');
    
    dates.forEach((val, colIdx) => {
      if (!val) return;
      let dateStr = '';
      if (typeof val === 'string' && val.match(/\d{2}\.\d{2}\.\d{4}/)) {
        const parts = val.split('.');
        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else if (typeof val === 'number') {
        const d = new Date(Math.round((val - 25569)*86400*1000));
        dateStr = d.toISOString().split('T')[0];
      }
      
      if (dateStr) {
        // Find group based on current row position? Actually we can just create a generic session or try to map group A/B
        // Let's just create generic sessions per course, the app allows generic sessions if group=""
        // Wait, for Full Stack there are Group A and Group B. We can check the header above the data chunk.
        
        const sessionId = `sess_${coursePrefix}_${dateStr}_${colIdx}`;
        if (!data.sessions.find(s => s.id === sessionId)) {
           data.sessions.push({
             id: sessionId,
             date: dateStr,
             courseId: coursePrefix === 'FS' ? 'Full Stack Developer' : 'Frontend Developer',
             batchId: 'B01',
             type: 'Class',
             instructor: 'Admin',
             topics: 'Daily Class',
             group: '', // let's leave generic so it matches all students
             status: 'Completed',
             notes: 'Imported from Excel'
           });
           data.marks[sessionId] = {};
        }
        sessionMap[colIdx] = sessionId;
      }
    });
    
    // Parse student rows
    for (let i = dateRowIdx + 1; i < raw.length; i++) {
      const row = raw[i];
      if (!row || !row.length) continue;
      const utNo = row.find(v => typeof v === 'string' && v.startsWith('UT'));
      if (!utNo) continue;
      
      // Found a student row
      // We don't have the student internal ID, we only have utNo. 
      // The store uses internal `student.id`. We will use UT NO for now, and the UI script will map UT NO to internal ID!
      Object.keys(sessionMap).forEach(colIdx => {
        const markVal = row[colIdx];
        if (markVal === 'P' || markVal === 'A' || markVal === 'L' || markVal === 'p' || markVal === 'a' || markVal === 'l') {
           data.marks[sessionMap[colIdx]][utNo] = markVal.toUpperCase();
        }
      });
    }
  });
  
  return data;
};

const fsData = extractData('fullstack.xlsx', 'FS');
const reactData = extractData('react.xlsx', 'React');

const combinedSessions = [...fsData.sessions, ...reactData.sessions];
const combinedMarks = { ...fsData.marks, ...reactData.marks };

fs.writeFileSync('src/lib/attendanceSeed.json', JSON.stringify({ sessions: combinedSessions, marks: combinedMarks }, null, 2));
console.log(`Saved ${combinedSessions.length} sessions to src/lib/attendanceSeed.json`);
