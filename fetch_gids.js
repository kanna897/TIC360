const https = require('https');

function getGids(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const sheets = [];
        const regex = /\[\"(.*?)\",\"(\d{1,15})\"/g;
        let m;
        while((m = regex.exec(data)) !== null) {
          if(m[1].length < 20) sheets.push({name: m[1], gid: m[2]});
        }
        resolve(sheets);
      });
    });
  });
}

async function run() {
  const fsGids = await getGids('https://docs.google.com/spreadsheets/d/1r_W9WSJiV16fiYr4CoL3cMs_pP2MUmHdIC0qGyoXRSo/edit');
  const reactGids = await getGids('https://docs.google.com/spreadsheets/d/1tF5YopK5yqIUcv9a30AjBG7AQ15j9Sehu-57FjRySWE/edit');
  
  console.log('Full Stack:', fsGids);
  console.log('React:', reactGids);
}

run();
