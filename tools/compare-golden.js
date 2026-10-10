/* =============================================================================
   Golden compare — diffs two folders written by capture-golden.js.
   =============================================================================
       node tools/compare-golden.js <before> <after> [maxPercent=0.1]

   Images: ImageMagick `compare -metric AE -fuzz 2%` must be installed (local
   dev tool, not part of CI). A size mismatch fails outright. Text: the JSON
   section dumps must be identical. Exits non-zero on any difference.
============================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const [before, after, maxArg] = process.argv.slice(2);
if (!before || !after) {
  console.error('usage: node tools/compare-golden.js <before> <after> [maxPercent]');
  process.exit(2);
}
const MAX_PERCENT = parseFloat(maxArg || '0.1');

const magick = spawnSync('magick', ['-version'], { encoding: 'utf8' });
if (magick.error) { console.error('ImageMagick (magick) not found'); process.exit(2); }

const stems = fs.readdirSync(before).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '')).sort();
let failed = 0;

function dims(file) {
  const r = spawnSync('magick', ['identify', '-format', '%w %h', file], { encoding: 'utf8' });
  return r.stdout.trim().split(' ').map(Number);
}

for (const stem of stems) {
  const a = path.join(before, stem + '.png');
  const b = path.join(after, stem + '.png');
  if (!fs.existsSync(b)) { console.log(`FAIL  ${stem}: missing in "after"`); failed++; continue; }

  const [aw, ah] = dims(a);
  const [bw, bh] = dims(b);
  if (aw !== bw || ah !== bh) {
    console.log(`FAIL  ${stem}: size ${aw}x${ah} -> ${bw}x${bh}`);
    failed++;
    continue;
  }

  // compare prints the differing pixel count on stderr and exits 1 when they differ.
  const r = spawnSync('magick', ['compare', '-metric', 'AE', '-fuzz', '2%', a, b, 'null:'], { encoding: 'utf8' });
  const diffPixels = parseFloat((r.stderr || '').trim().split(/\s+/)[0]) || 0;
  const percent = (diffPixels / (aw * ah)) * 100;
  const ok = percent <= MAX_PERCENT;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${stem}: ${percent.toFixed(4)}% differing (${diffPixels} px of ${aw * ah})`);

  const ja = JSON.parse(fs.readFileSync(path.join(before, stem + '.json'), 'utf8'));
  const jb = JSON.parse(fs.readFileSync(path.join(after, stem + '.json'), 'utf8'));
  const keys = new Set([...Object.keys(ja.sections), ...Object.keys(jb.sections)]);
  for (const k of keys) {
    if (ja.sections[k] !== jb.sections[k]) {
      console.log(`FAIL  ${stem}: text of "${k}" changed`);
      failed++;
    }
  }
  if (jb.errors.length) { console.log(`FAIL  ${stem}: page errors: ${jb.errors.join(' | ')}`); failed++; }
}

console.log(failed ? `\n${failed} problem(s).` : '\nAll captures match.');
process.exit(failed ? 1 : 0);
