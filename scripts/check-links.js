/* Link checker for the Delaly Art Lofi static build. Pure Node, no dependencies.
 * Usage: node scripts/check-links.js [distDir]
 * Walks every .html file, resolves href/src attributes, and fails on dead links.
 * Also verifies every artwork image and audio file referenced by data files exists.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DIST = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
let checked = 0;
let failures = [];

function walk(dir, out) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith('.html')) out.push(p);
  }
}

function resolveLink(fromFile, href) {
  if (/^(https?:)?\/\//i.test(href)) return null;
  if (/^(mailto|tel|sms):/i.test(href)) return null;
  if (/^(data|blob|javascript):/i.test(href)) return null;
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return null;
  let target;
  if (clean.startsWith('/')) target = path.join(DIST, clean);
  else target = path.resolve(path.dirname(fromFile), clean);
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, 'index.html');
  }
  return target;
}

const files = [];
walk(DIST, files);

const attrRe = /(?:href|src)="([^"]+)"/g;

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  let m;
  attrRe.lastIndex = 0;
  while ((m = attrRe.exec(html)) !== null) {
    const href = m[1];
    if (!href || href.startsWith('{{')) continue;
    const target = resolveLink(file, href);
    if (!target) continue;
    checked++;
    if (!fs.existsSync(target)) {
      failures.push(path.relative(DIST, file) + ' -> ' + href);
    }
  }
}

// every track file referenced in data/tracks.json must exist in dist/audio
const tracks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data/tracks.json'), 'utf8')).tracks;
tracks.forEach(function (t) {
  Object.keys(t.files).forEach(function (k) {
    const rel = t.files[k].replace(/^\//, '');
    checked++;
    if (!fs.existsSync(path.join(DIST, rel))) {
      failures.push('tracks.json -> ' + t.files[k]);
    }
  });
});

console.log('Checked ' + checked + ' links across ' + files.length + ' pages.');
if (failures.length) {
  console.log('DEAD LINKS (' + failures.length + '):');
  failures.forEach(function (f) { console.log('  ' + f); });
  process.exit(1);
} else {
  console.log('All links alive.');
}
