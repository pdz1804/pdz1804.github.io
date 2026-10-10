/* =============================================================================
   View-model unit test — plain Node, no dependencies, no browser.
   =============================================================================
       node tools/test-view-model.js

   Runs the real data.js through PortfolioVM with a fixed clock, then feeds it
   small hand-made inputs for the edge cases a design would otherwise hit first.
============================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const VM = require('../assets/js/core/view-model.js');

/* data.js assigns to window; give it a stand-in and read the result back. */
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'data.js'), 'utf8'), sandbox);
const D = sandbox.window.PORTFOLIO;
const LEVELS = sandbox.window.SKILL_LEVELS;

let failed = 0;
function check(name, ok, detail) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`);
}

const NOW = new Date(2026, 9, 10);           // 10 Oct 2026
const view = VM.build(D, LEVELS, NOW);

check('totals.projects counts both lists', view.totals.projects === D.projects.professional.length + D.projects.academic.length);
check('totals.certs counts all certifications', view.totals.certs === D.certifications.length);
check('totals.years is whole years since careerStart', view.totals.years === VM.yearsSince(D.profile.careerStart, NOW), String(view.totals.years));
check('currentRole is an open role', view.currentRole && view.currentRole.end === null, view.currentRole && view.currentRole.title);
check('honors sorted newest first', view.honors.every((h, i, a) => i === 0 || a[i - 1].sortKey >= h.sortKey));
check('certs sorted newest first', view.certs.every((c, i, a) => i === 0 || a[i - 1].cert.sortKey >= c.cert.sortKey));
check('every cert has an issuer badge', view.certs.every((c) => c.issuer && c.issuer.badge));
check('roles newest first inside each company', view.experience.every((e) =>
  e.roles.every((r, i, a) => i === 0 || (a[i - 1].start || '') >= (r.start || ''))));
check('skill widths come from levels', view.skills.every((g) => g.items.every((i) => typeof i.width === 'number')));

/* Edge cases ---------------------------------------------------------------- */
check('humanDuration: 1 month', VM.humanDuration(1) === '1 mo');
check('humanDuration: 13 months', VM.humanDuration(13) === '1 yr 1 mo');
check('humanDuration: 24 months', VM.humanDuration(24) === '2 yrs');
check('humanDuration never below 1 month', VM.humanDuration(0) === '1 mo');

const tenure = VM.companyTenure({ roles: [{ start: '2024-01', end: '2024-03' }] }, NOW);
check('closed company tenure is inclusive', tenure === '3 mos', tenure);
const open = VM.companyTenure({ roles: [{ start: '2026-08', end: null }] }, NOW);
check('open company counts to the clock', open === '3 mos', open);
check('company with no dated roles has empty tenure', VM.companyTenure({ roles: [{}] }, NOW) === '');

const unknownIssuer = VM.build(
  Object.assign({}, D, { certifications: [{ issuer: 'nobody', name: 'X', date: '2026', sortKey: 202601 }] }),
  LEVELS, NOW);
check('unknown issuer falls back to its own name', unknownIssuer.certs[0].issuer.label === 'nobody' && unknownIssuer.certs[0].issuer.badge === '?');

const noOpen = VM.build(
  Object.assign({}, D, { experience: [{ company: 'A', roles: [{ title: 'Old', start: '2020-01', end: '2021-01' }] }] }),
  LEVELS, NOW);
check('no open role falls back to the first role', noOpen.currentRole.title === 'Old');

console.log(failed ? `\n${failed} failed.` : '\nAll view-model checks passed.');
process.exit(failed ? 1 : 0);
