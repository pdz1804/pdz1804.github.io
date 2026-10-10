/* =============================================================================
   Published-surface checks — what the public site actually ships.
   =============================================================================
   validate-data.js checks the content file; verify-browser.js checks the
   rendered DOM. Neither looks at the bytes GitHub Pages serves, so this does:

     - client / product names that must never appear (every published text file
       and the text layer of every PDF)
     - the PDF allowlist, and no phone number, student ID, birth date or
       document number in any PDF; the transcript must stay image-only
     - evidence photos carry no EXIF / XMP / IPTC (iPhone and Android originals
       embed GPS, device model and timestamps) and stay within size budgets
     - local href/src references in the HTML pages and the web manifest resolve
     - sitemap.xml and robots.txt are sane

   No dependencies. PDF text checks use `pdftotext` (poppler); it is installed in
   CI, and locally the PDF checks are skipped with a warning if it is missing.

       node tools/check-published.js
============================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const IN_CI = !!process.env.CI;
const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

/* Names the CV content rules forbid anywhere on the site. */
const FORBIDDEN = /\b(?:nuskin|hillspire|aperium|prysm)\b/i;

/* PDFs allowed to be published. Anything else under the site fails. */
const ALLOWED_PDFS = new Set([
  'assets/cv/Nguyen_Quang_Phu_CV.pdf',
  'assets/docs/academic-transcript-hcmut.pdf',
]);
/* The transcript is rasterised so redaction boxes cannot be lifted off the text. */
const IMAGE_ONLY_PDFS = new Set(['assets/docs/academic-transcript-hcmut.pdf']);

/* Vietnamese mobile/landline written with +84 or a leading 0, with optional separators. */
const PHONE = /(?:\+84|\(\+84\)|\b0)[\s.\-]?\d{2,3}[\s.\-]?\d{3}[\s.\-]?\d{3,4}\b/;
const PDF_SENSITIVE = /student\s*id|m[ãa]\s*s[ốo]\s*sinh\s*vi[êe]n|date\s*of\s*birth|ng[àa]y\s*sinh|document\s*(?:no|number)|\bBD20\d{8}\b/i;

const EVIDENCE_DIR = 'images/evidence';
const MAX_EVIDENCE_BYTES = 8 * 1024 * 1024;   // whole folder
const MAX_EVIDENCE_FILE_BYTES = 700 * 1024;   // any single image
const MAX_EVIDENCE_EDGE = 2048;               // px, longest side

/* Working folders at the repo root are never served; `assets/docs/` (the transcript) is. */
const SKIP_ROOT_DIRS = new Set(['.git', '.github', 'docs', 'tools']);
const SKIP_FILES = new Set(['README.md', 'CLAUDE.md', '.gitignore', '_config.yml']);
const TEXT_EXT = new Set(['.html', '.js', '.css', '.json', '.xml', '.txt', '.svg', '.webmanifest']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).split(path.sep).join('/');
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || (dir === root && SKIP_ROOT_DIRS.has(entry.name))) return [];
      return walk(full);
    }
    return SKIP_FILES.has(entry.name) ? [] : [rel];
  });
}

const files = walk(root);
const ext = (f) => path.extname(f).toLowerCase();

/* ── 1. Forbidden names and phone numbers in published text files ─────────── */
for (const rel of files.filter((f) => TEXT_EXT.has(ext(f)))) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  if (FORBIDDEN.test(text)) fail(`${rel}: contains a forbidden client/product name`);
  if (PHONE.test(text) && !/^assets\/js\/(?:vendor|lib)\//.test(rel)) {
    const m = text.match(PHONE)[0];
    // A date or version string can look phone-like; only flag when it starts like a phone number.
    if (/^(?:\+84|\(\+84\)|0[1-9])/.test(m)) fail(`${rel}: phone-like number "${m}"`);
  }
}

/* ── 2. PDFs ──────────────────────────────────────────────────────────────── */
const pdfs = files.filter((f) => ext(f) === '.pdf');
for (const rel of pdfs) if (!ALLOWED_PDFS.has(rel)) fail(`${rel}: PDF is not on the allowlist`);
for (const rel of ALLOWED_PDFS) if (!pdfs.includes(rel)) fail(`${rel}: allowlisted PDF is missing`);

function pdfText(rel) {
  const r = spawnSync('pdftotext', [path.join(root, rel), '-'], { encoding: 'utf8' });
  return r.error ? null : r.stdout;
}
function pdfInfo(rel) {
  const r = spawnSync('pdfinfo', [path.join(root, rel)], { encoding: 'utf8' });
  return r.error ? null : r.stdout;
}

const havePoppler = !spawnSync('pdftotext', ['-v'], { encoding: 'utf8' }).error;
if (!havePoppler) {
  (IN_CI ? fail : warn)('pdftotext (poppler-utils) not found — PDF text checks were skipped');
} else {
  for (const rel of pdfs) {
    const text = pdfText(rel) || '';
    const info = pdfInfo(rel) || '';
    if (FORBIDDEN.test(text) || FORBIDDEN.test(info)) fail(`${rel}: forbidden name in text or metadata`);
    if (PHONE.test(text) || PHONE.test(info)) fail(`${rel}: phone-like number in text or metadata`);
    if (PDF_SENSITIVE.test(text) || PDF_SENSITIVE.test(info)) fail(`${rel}: student ID / birth date / document number in text or metadata`);
    if (IMAGE_ONLY_PDFS.has(rel) && text.replace(/\s+/g, '').length > 0) {
      fail(`${rel}: has a text layer — redaction boxes could be lifted off it; rebuild it image-only`);
    }
  }
}

/* ── 3. Evidence images: no metadata, size budgets ────────────────────────── */
function jpegInfo(buf) {
  // Walk the marker segments up to the start of scan; report metadata and dimensions.
  const out = { exif: false, xmp: false, iptc: false, w: 0, h: 0 };
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01 || marker === 0xff) { i += marker === 0xff ? 1 : 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    const seg = buf.slice(i + 4, i + 2 + len);
    if (marker === 0xe1) {
      const head = seg.slice(0, 29).toString('latin1');
      if (head.startsWith('Exif\0\0')) out.exif = true;
      if (head.includes('http://ns.adobe.com/xap/1.0/')) out.xmp = true;
    }
    if (marker === 0xed) out.iptc = true;
    if ((marker >= 0xc0 && marker <= 0xcf) && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      out.h = seg.readUInt16BE(1); out.w = seg.readUInt16BE(3);
    }
    if (marker === 0xda) break;
    i += 2 + len;
  }
  return out;
}

let evidenceBytes = 0;
for (const rel of files.filter((f) => f.startsWith(EVIDENCE_DIR + '/'))) {
  const buf = fs.readFileSync(path.join(root, rel));
  evidenceBytes += buf.length;
  if (buf.length > MAX_EVIDENCE_FILE_BYTES) fail(`${rel}: ${(buf.length / 1024) | 0} KB exceeds the ${MAX_EVIDENCE_FILE_BYTES / 1024} KB per-image budget`);
  if (!['.jpg', '.jpeg'].includes(ext(rel))) continue;
  const info = jpegInfo(buf);
  if (!info) { fail(`${rel}: not a valid JPEG`); continue; }
  if (info.exif || info.xmp || info.iptc) {
    fail(`${rel}: carries embedded metadata (${['exif', 'xmp', 'iptc'].filter((k) => info[k]).join(', ')}) — strip with: magick in.jpg -auto-orient -strip out.jpg`);
  }
  if (Math.max(info.w, info.h) > MAX_EVIDENCE_EDGE) fail(`${rel}: ${info.w}x${info.h} exceeds ${MAX_EVIDENCE_EDGE}px on its longest side`);
}
if (evidenceBytes > MAX_EVIDENCE_BYTES) fail(`${EVIDENCE_DIR}: ${(evidenceBytes / 1048576).toFixed(1)} MB exceeds the ${MAX_EVIDENCE_BYTES / 1048576} MB folder budget`);

/* ── 4. Local references resolve ──────────────────────────────────────────── */
function checkRefs(rel, source, pattern) {
  for (const m of source.matchAll(pattern)) {
    const ref = m[1].split('#')[0].split('?')[0];
    if (!ref || /^(?:[a-z][a-z0-9+.\-]*:|\/\/)/i.test(ref)) continue; // absolute / data: / mailto:
    const base = ref.startsWith('/') ? path.join(root, ref) : path.join(root, path.dirname(rel), ref);
    if (!fs.existsSync(base)) fail(`${rel}: missing local reference ${m[1]}`);
  }
}
for (const html of files.filter((f) => ext(f) === '.html')) {
  checkRefs(html, fs.readFileSync(path.join(root, html), 'utf8'), /\b(?:href|src)="([^"]+)"/g);
}
if (fs.existsSync(path.join(root, 'manifest.json'))) {
  checkRefs('manifest.json', fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'), /"(?:src|start_url|url)"\s*:\s*"([^"]+)"/g);
}

/* The host comes from data.js (site.url), so moving the site is one edit. */
const ORIGIN = (() => {
  const sandbox = { window: {} };
  require('vm').createContext(sandbox);
  require('vm').runInContext(fs.readFileSync(path.join(root, 'assets/js/data.js'), 'utf8'), sandbox);
  return sandbox.window.PORTFOLIO.site.url.replace(/\/?$/, '/');
})();

/* ── 5. sitemap and robots ────────────────────────────────────────────────── */
if (!fs.existsSync(path.join(root, 'sitemap.xml'))) fail('sitemap.xml is missing');
else {
  const sm = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!locs.length) fail('sitemap.xml has no <loc> entries');
  for (const loc of locs) {
    if (!loc.startsWith(ORIGIN)) { fail(`sitemap.xml: ${loc} is not under ${ORIGIN} (site.url in data.js)`); continue; }
    const p = loc.slice(ORIGIN.length);
    if (p && !fs.existsSync(path.join(root, p))) fail(`sitemap.xml: ${loc} has no matching file`);
  }
}
if (!fs.existsSync(path.join(root, 'robots.txt'))) fail('robots.txt is missing');
else if (!/sitemap:/i.test(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8'))) warn('robots.txt does not point to the sitemap');

/* ── Report ───────────────────────────────────────────────────────────────── */
console.log(`Published-surface check: ${files.length} files, ${pdfs.length} PDFs, ` +
            `${(evidenceBytes / 1048576).toFixed(1)} MB of evidence images`);
warnings.forEach((w) => console.log('  warn  ' + w));
if (errors.length) {
  errors.forEach((e) => console.error('  FAIL  ' + e));
  console.error(`\n${errors.length} problem(s).`);
  process.exit(1);
}
console.log('All checks passed.');
