/* =============================================================================
   Data integrity check for assets/js/data.js
   =============================================================================
   Run after editing content:   node tools/validate-data.js

   Catches the mistakes an edit to data.js can realistically introduce — a
   certification pointing at an issuer that has no badge, a skill level with no
   bar width, a malformed date that would break the tenure figure, a project
   with no tags. Exits non-zero when something is wrong so it can gate a commit.
============================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dataPath = path.join(__dirname, '..', 'assets', 'js', 'data.js');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(dataPath, 'utf8'), sandbox, { filename: dataPath });

const D = sandbox.window.PORTFOLIO;
const LEVELS = sandbox.window.SKILL_LEVELS;

const errors = [];
const warnings = [];

const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/* ── Exports ──────────────────────────────────────────────────────────── */
if (!D) fail('data.js does not export window.PORTFOLIO');
if (!LEVELS) fail('data.js does not export window.SKILL_LEVELS');
if (errors.length) { report(); process.exit(1); }

/* ── Profile ──────────────────────────────────────────────────────────── */
['fullName', 'displayName', 'title', 'email', 'github', 'linkedin', 'careerStart']
  .forEach((k) => { if (!D.profile[k]) fail(`profile.${k} is missing`); });

if (!MONTH.test(D.profile.careerStart)) {
  fail(`profile.careerStart "${D.profile.careerStart}" must be YYYY-MM`);
}
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(D.profile.email)) {
  fail(`profile.email "${D.profile.email}" is not a valid address`);
}
if (D.profile.resume.enabled) {
  const cv = path.join(__dirname, '..', D.profile.resume.path);
  if (!fs.existsSync(cv)) {
    fail(`profile.resume.enabled is true but ${D.profile.resume.path} does not exist`);
  }
}
if (!D.profile.typedRoles || !D.profile.typedRoles.length) {
  fail('profile.typedRoles is empty — the hero role line would stay blank');
}

/* ── Experience ───────────────────────────────────────────────────────── */
let openRoles = 0;

D.experience.forEach((co, ci) => {
  const where = `experience[${ci}] (${co.company || '?'})`;
  if (!co.company) fail(`${where}: company name missing`);
  if (!co.roles || !co.roles.length) fail(`${where}: no roles`);

  (co.roles || []).forEach((r, ri) => {
    const rw = `${where}.roles[${ri}] (${r.title || '?'})`;
    if (!r.title)  fail(`${rw}: title missing`);
    if (!r.period) fail(`${rw}: period label missing`);

    if (!MONTH.test(r.start)) fail(`${rw}: start "${r.start}" must be YYYY-MM`);
    if (r.end === null) openRoles++;
    else if (!MONTH.test(r.end)) fail(`${rw}: end "${r.end}" must be YYYY-MM or null`);

    if (r.end && r.end < r.start) fail(`${rw}: end ${r.end} precedes start ${r.start}`);
    if (!r.bullets || !r.bullets.length) fail(`${rw}: no bullets`);
    if (!Array.isArray(r.awards)) fail(`${rw}: awards must be an array (use [])`);
  });
});

if (openRoles === 0) warn('no role has end:null — nothing renders as "Current"');
if (openRoles > 1)  warn(`${openRoles} roles have end:null — more than one shows as "Current"`);

/* ── Skills ───────────────────────────────────────────────────────────── */
D.skills.forEach((g, gi) => {
  if (!g.name) fail(`skills[${gi}]: group name missing`);
  if (!g.icon) fail(`skills[${gi}] (${g.name}): icon key missing`);
  (g.items || []).forEach((s) => {
    if (!s.name) fail(`skills[${gi}] (${g.name}): an item has no name`);
    if (!(s.level in LEVELS)) {
      fail(`skill "${s.name}": level "${s.level}" is not one of ${Object.keys(LEVELS).join(', ')}`);
    }
  });
});

/* ── Education ────────────────────────────────────────────────────────── */
D.education.forEach((e, i) => {
  ['institution', 'degree', 'period'].forEach((k) => {
    if (!e[k]) fail(`education[${i}]: ${k} missing`);
  });
  if (e.gpa && (!e.gpa.value || !e.gpa.label)) {
    fail(`education[${i}] (${e.institution}): gpa needs both value and label`);
  }
  (e.docs || []).forEach((d, di) => {
    if (!d.href || !d.label) fail(`education[${i}].docs[${di}]: href and label are required`);
    else if (!fs.existsSync(path.join(__dirname, '..', d.href))) fail(`education[${i}].docs[${di}]: ${d.href} does not exist`);
  });
});

/* ── Evidence images (roles and honors) ───────────────────────────────── */
const root = path.join(__dirname, '..');

function checkEvidence(where, list) {
  (list || []).forEach((ev, i) => {
    const w = `${where}.evidence[${i}]`;
    ['src', 'alt', 'caption'].forEach((k) => { if (!ev[k]) fail(`${w}: ${k} missing`); });
    if (ev.src && !fs.existsSync(path.join(root, ev.src))) fail(`${w}: ${ev.src} does not exist`);
  });
}

D.experience.forEach((co, ci) => {
  co.roles.forEach((r, ri) => checkEvidence(`experience[${ci}].roles[${ri}]`, r.evidence));
});

/* ── Honors ───────────────────────────────────────────────────────────── */
if (!Array.isArray(D.honors)) fail('honors must be an array');

(D.honors || []).forEach((h, i) => {
  const w = `honors[${i}] (${h.title || '?'})`;
  ['title', 'issuer', 'date', 'description'].forEach((k) => { if (!h[k]) fail(`${w}: ${k} missing`); });
  if (!Number.isInteger(h.sortKey) || h.sortKey % 100 < 1 || h.sortKey % 100 > 12) {
    fail(`${w}: sortKey must be an integer YYYYMM (got ${h.sortKey})`);
  }
  if (!h.evidence || !h.evidence.length) warn(`${w}: no evidence image`);
  checkEvidence(w, h.evidence);
});

/* ── Projects ─────────────────────────────────────────────────────────── */
const seenTitles = new Set();

D.projects.professional.forEach((p, i) => {
  const w = `projects.professional[${i}] (${p.title || '?'})`;
  ['title', 'badge', 'period', 'org'].forEach((k) => { if (!p[k]) fail(`${w}: ${k} missing`); });
  if (!p.bullets || !p.bullets.length) fail(`${w}: no bullets`);
  if (!p.tags || !p.tags.length) fail(`${w}: no tags`);
  if (p.link && !/^https?:\/\//.test(p.link)) fail(`${w}: link must be absolute`);
  if (seenTitles.has(p.title)) fail(`${w}: duplicate project title`);
  seenTitles.add(p.title);
});

D.projects.academic.forEach((p, i) => {
  const w = `projects.academic[${i}] (${p.title || '?'})`;
  ['title', 'period', 'desc'].forEach((k) => { if (!p[k]) fail(`${w}: ${k} missing`); });
  if (!p.tags || !p.tags.length) fail(`${w}: no tags`);
  if (p.link && !/^https?:\/\//.test(p.link)) fail(`${w}: link must be absolute`);
});

const featured = D.projects.professional.filter((p) => p.featured).length;
if (featured === 0) fail('no project has featured:true — the landing page grid renders empty');
if (featured > 4)  warn(`${featured} featured projects — more than 4 crowds the landing page`);

/* ── Certifications ───────────────────────────────────────────────────── */
const seenCerts = new Set();

D.certifications.forEach((c, i) => {
  const w = `certifications[${i}] (${c.name || '?'})`;
  if (!c.name) fail(`${w}: name missing`);
  if (!c.date) fail(`${w}: date label missing`);
  if (!(c.issuer in D.certIssuers)) {
    fail(`${w}: issuer "${c.issuer}" has no entry in certIssuers`);
  }
  // YYYYMM as an integer. A decimal such as 2025.12 sorts below 2025.5, which
  // silently buries December entries — so the shape is enforced, not just the type.
  if (!Number.isInteger(c.sortKey) || c.sortKey < 190001 || c.sortKey > 999912 ||
      c.sortKey % 100 < 1 || c.sortKey % 100 > 12) {
    fail(`${w}: sortKey must be an integer YYYYMM (got ${c.sortKey})`);
  }
  const key = c.issuer + '|' + c.name;
  if (seenCerts.has(key)) warn(`${w}: duplicate certification`);
  seenCerts.add(key);
});

if (D.certsVisible > D.certifications.length) {
  warn(`certsVisible (${D.certsVisible}) exceeds the ${D.certifications.length} certifications — the toggle hides`);
}

Object.keys(D.certIssuers).forEach((k) => {
  if (!D.certifications.some((c) => c.issuer === k)) warn(`certIssuers.${k} is defined but unused`);
});

/* ── Navigation ───────────────────────────────────────────────────────── */
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
D.nav.forEach((n) => {
  if (n.href.startsWith('#') && !indexHtml.includes(`id="${n.href.slice(1)}"`)) {
    fail(`nav link ${n.href} points at a section id that does not exist in index.html`);
  }
});

/* ── Report ───────────────────────────────────────────────────────────── */
function report() {
  const counts = D ? {
    companies: D.experience.length,
    roles: D.experience.reduce((n, c) => n + c.roles.length, 0),
    skills: D.skills.reduce((n, g) => n + g.items.length, 0),
    honors: (D.honors || []).length,
    projects: D.projects.professional.length + D.projects.academic.length,
    certifications: D.certifications.length,
  } : {};

  console.log('Portfolio data check\n');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
  console.log();

  warnings.forEach((w) => console.log(`  warn   ${w}`));
  errors.forEach((e)   => console.log(`  ERROR  ${e}`));

  if (errors.length) console.log(`\n${errors.length} error(s). Fix before publishing.`);
  else console.log(warnings.length ? `\nNo errors, ${warnings.length} warning(s).` : '\nAll checks passed.');
}

report();
process.exit(errors.length ? 1 : 0);
