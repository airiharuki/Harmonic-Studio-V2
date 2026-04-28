const https = require('https');
const fs = require('fs');

https.get('https://raw.githubusercontent.com/airiharuki/Harmonic-Studio-V2/refs/heads/main/src/App.tsx', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('./github_app.tsx', data);
    console.log('File downloaded successfully');
  });
}).on('error', (err) => {
  console.error('Error: ', err.message);
});
