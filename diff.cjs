const fs = require('fs');

const appFile = fs.readFileSync('src/App.tsx', 'utf8');
const githubFile = fs.readFileSync('github_app.tsx', 'utf8');

// Strip out spacing differences
const normalize = (str) => {
  return str.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

const appLines = normalize(appFile);
const githubLines = normalize(githubFile);

let diffsCount = 0;
for (let i = 0; i < Math.max(appLines.length, githubLines.length); i++) {
  if (appLines[i] !== githubLines[i]) {
    console.log(`Diff at normalized index ${i}:`);
    console.log(`App.tsx:    ${appLines[i] || 'EOF'}`);
    console.log(`GitHub:     ${githubLines[i] || 'EOF'}`);
    diffsCount++;
    if (diffsCount > 40) break; // limit output
  }
}
