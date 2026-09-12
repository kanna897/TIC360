const fs = require('fs');
const html = fs.readFileSync('sheet.html', 'utf8');

const regex = /\["([^"]+)",(\d{6,15})\]/g;
let m;
const sheets = [];
while((m = regex.exec(html)) !== null) {
  if (['April', 'May', 'June', 'July', 'August', 'September'].includes(m[1])) {
     sheets.push({name: m[1], gid: m[2]});
  }
}

// deduplicate
const unique = sheets.filter((v,i,a)=>a.findIndex(t=>(t.name === v.name && t.gid===v.gid))===i);
console.log(unique);
