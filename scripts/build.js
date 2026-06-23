// Copies web source files into www/ for Capacitor to pick up.
// Run: npm run build
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'www');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);

// Top-level files
['index.html', 'manifest.json', 'sw.js'].forEach(f => {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, f));
});

// Directories
['css', 'js', 'assets'].forEach(dir => {
  const src = path.join(ROOT, dir);
  if (fs.existsSync(src)) copyDir(src, path.join(OUT, dir));
});

console.log('Build → www/');
