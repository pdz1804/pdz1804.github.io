/* =============================================================================
   Guard test — proves the checks fail when something is actually wrong.
   =============================================================================
       node tools/test-guards.js            fast guards (no browser)
       node tools/test-guards.js --browser  also the browser-backed guards
       node tools/test-guards.js --only <text>

   A green CI means little if the checks cannot go red. Each case copies the
   repo to a temp folder, breaks one thing the way a real edit might, runs the
   check that is supposed to notice, and requires BOTH a non-zero exit and the
   expected message, so a check that fails for the wrong reason does not count.
   A control run on the untouched copy must pass.
============================================================================= */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const WITH_BROWSER = process.argv.includes('--browser');
const ONLY = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const SKIP = new Set(['.git', 'node_modules', 'golden', 'shots', '.swtest-old', '.swtest-new']);

/* find/replace edits ({file, find, replace}) or appends ({file, append}). */
const CASES = [
  { name: 'canonical URL drifts from data.js', run: ['tools/sync-meta.js'], expect: /DRIFT\s+index\.html: canonical/,
    edits: [{ file: 'index.html', find: '<link rel="canonical" href="https://pdz1804.github.io/">', replace: '<link rel="canonical" href="https://example.org/">' }] },
  { name: 'a forbidden client name reaches the served data', run: ['tools/check-published.js'], expect: /forbidden client\/product name/,
    edits: [{ file: 'assets/js/data.js', find: 'Built the runtime', replace: 'Built the NuSkin runtime' }] },
  { name: 'site.defaultDesign names a design that does not exist', run: ['tools/validate-data.js'], expect: /site\.defaultDesign/,
    edits: [{ file: 'assets/js/data.js', find: "defaultDesign: 'classic'", replace: "defaultDesign: 'nope'" }] },
  { name: 'a certification uses an issuer with no badge', run: ['tools/validate-data.js'], expect: /ghost/,
    edits: [{ file: 'assets/js/data.js', find: "{ issuer: 'dlai', name: 'Reasoning with o1'", replace: "{ issuer: 'ghost', name: 'Reasoning with o1'" }] },
  { name: 'view-model sorts certifications oldest first', run: ['tools/test-view-model.js'], expect: /FAIL\s+certs sorted newest first/,
    edits: [{ file: 'assets/js/core/view-model.js', find: '.sort(function (a, b) { return b.sortKey - a.sortKey; })', replace: '.sort(function (a, b) { return a.sortKey - b.sortKey; })' }] },
  { name: 'sitemap points at another host', run: ['tools/check-published.js'], expect: /sitemap\.xml/,
    edits: [{ file: 'sitemap.xml', find: '<loc>https://pdz1804.github.io/projects.html</loc>', replace: '<loc>https://example.org/projects.html</loc>' }] },
  { name: 'site.designs lists a design missing from the registry', run: ['tools/validate-data.js'], expect: /not in designs\/registry\.js/,
    edits: [{ file: 'assets/js/data.js', find: "// designs: ['classic', 'dossier'],", replace: "designs: ['classic', 'ghost']," }] },

  { browser: true, name: 'Dossier stops rendering role bullets', run: ['tools/verify-design.js'], env: { DESIGN: 'dossier' }, expect: /FAIL\s+\[dossier\] home: every experience/,
    edits: [{ file: 'designs/dossier/render.js', find: "role.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('')", replace: "''" }] },
  { browser: true, name: 'Dossier leaks an interval on every mount', run: ['tools/verify-design.js'], env: { DESIGN: 'dossier' }, expect: /FAIL\s+\[dossier\] leak: intervals/,
    edits: [{ file: 'designs/dossier/design.js', find: 'root.innerHTML = SHELL;', replace: 'root.innerHTML = SHELL; window.setInterval(function () {}, 1000);' }] },
  { browser: true, name: 'Dossier CSS gets a hard-coded colour', run: ['tools/verify-design.js'], env: { DESIGN: 'dossier' }, expect: /FAIL\s+\[dossier\] no colour literals/,
    edits: [{ file: 'designs/dossier/main.css', append: '\n.zz{color:#ff00ff}\n' }] },
  { browser: true, name: 'Dossier CSS gets a [data-theme] component rule', run: ['tools/verify-design.js'], env: { DESIGN: 'dossier' }, expect: /FAIL\s+\[dossier\] light theme redefines tokens only/,
    edits: [{ file: 'designs/dossier/main.css', append: '\n[data-theme="light"] .zz{color:var(--ink)}\n' }] },
  { browser: true, name: 'Dossier loses a shared section id', run: ['tools/verify-design.js'], env: { DESIGN: 'dossier' }, expect: /FAIL\s+\[dossier\] shared section ids/,
    edits: [{ file: 'designs/dossier/design.js', find: "section('skills', '03'", replace: "section('skillz', '03'" }] },
  { browser: true, name: 'Dossier text drops below WCAG contrast', run: ['tools/verify-design.js'], env: { DESIGN: 'dossier' }, expect: /FAIL\s+\[dossier\] axe/,
    edits: [{ file: 'designs/dossier/main.css', find: '.ccard small{display:block;', replace: '.ccard small{opacity:.45;display:block;' }] },
  { browser: true, name: 'Classic text colour slips back below WCAG contrast', run: ['tools/verify-design.js'], env: { DESIGN: 'classic' }, expect: /FAIL\s+\[classic\] axe/,
    edits: [{ file: 'assets/css/main.css', find: '--t-low:  #8190a6;', replace: '--t-low:  #64748b;' }] },
  { browser: true, name: 'Classic stops rendering honors', run: ['tools/verify-design.js'], env: { DESIGN: 'classic' }, expect: /FAIL\s+\[classic\] home: every experience/,
    edits: [{ file: 'designs/classic/render.js', find: '    renderHonors();\n', replace: '' }] },
  { browser: true, name: 'a design stops calling its unmount handle', run: ['tools/verify-switching.js'], expect: /FAIL\s+the handle returned by mount\(\)/,
    edits: [{ file: 'assets/js/core/loader.js', find: 'state.handle.unmount();', replace: 'void 0;' }] },
  { browser: true, name: 'a script of the Dossier design 404s', run: ['tools/verify-switching.js'], expect: /TimeoutError|FAIL/,
    edits: [{ file: 'designs/registry.js', find: "'designs/dossier/ui.js',", replace: "'designs/dossier/missing.js'," }] },
];

function copyRepo(dest) {
  (function walk(from, to) {
    fs.mkdirSync(to, { recursive: true });
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue;
      const a = path.join(from, e.name), b = path.join(to, e.name);
      if (e.isDirectory()) walk(a, b); else fs.copyFileSync(a, b);
    }
  })(ROOT, dest);
  // Playwright and axe-core live in the real repo's node_modules; reuse them.
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dest, 'node_modules'), 'junction');
}

function apply(dir, edits) {
  for (const e of edits) {
    const f = path.join(dir, e.file);
    let s = fs.readFileSync(f, 'utf8');
    if (e.append) { s += e.append; } else {
      // Windows checkouts may be CRLF; match the anchor in the file's own line endings.
      const eol = s.includes('\r\n') ? '\r\n' : '\n';
      const find = e.find.replace(/\r?\n/g, eol), repl = e.replace.replace(/\r?\n/g, eol);
      if (!s.includes(find)) throw new Error(`mutation anchor not found in ${e.file}: ${e.find.slice(0, 60)}`);
      s = s.replace(find, () => repl);
    }
    fs.writeFileSync(f, s);
  }
}

/* Windows keeps handles open briefly after a browser exits; never let cleanup fail the run. */
function cleanup(dir) {
  try { fs.unlinkSync(path.join(dir, 'node_modules')); } catch (e) { try { fs.rmdirSync(path.join(dir, 'node_modules')); } catch (e2) { /* junction already gone */ } }
  try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch (e) { /* temp dir, OS reclaims it */ }
}

let nextPort = 8300 + Math.floor(Math.random() * 400);

async function runIn(dir, c) {
  let server = null, env = Object.assign({}, process.env, c.env || {});
  if (c.browser) {
    const port = nextPort++;
    server = spawn(process.execPath, [path.join(dir, 'tools', 'serve.js'), String(port), dir], { stdio: 'ignore' });
    env.TARGET = `http://127.0.0.1:${port}`;
    await new Promise((r) => setTimeout(r, 800));
  }
  const r = spawnSync(process.execPath, c.run, { cwd: dir, env, encoding: 'utf8', timeout: 20 * 60 * 1000 });
  if (server) server.kill();
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

(async () => {
  let failed = 0;
  const log = (ok, msg) => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };

  // Control: untouched copy passes the fast checks, so failures below are caused by the mutation.
  const controlDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-control-'));
  copyRepo(controlDir);
  for (const run of [['tools/validate-data.js'], ['tools/sync-meta.js'], ['tools/check-published.js'], ['tools/test-view-model.js']]) {
    const r = await runIn(controlDir, { run });
    log(r.code === 0, `control: ${run[0]} passes on the untouched copy`);
  }
  cleanup(controlDir);

  for (const c of CASES) {
    if (c.browser && !WITH_BROWSER) continue;
    if (ONLY && !c.name.toLowerCase().includes(ONLY.toLowerCase())) continue;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-'));
    try {
      copyRepo(dir);
      apply(dir, c.edits);
      const r = await runIn(dir, c);
      const caught = r.code !== 0 && c.expect.test(r.out);
      log(caught, `${c.run[0]} catches: ${c.name}` + (caught ? '' : `  [exit ${r.code}; expected ${c.expect}; tail: ${r.out.trim().split('\n').slice(-3).join(' | ').slice(0, 240)}]`));
    } catch (e) {
      log(false, `${c.name}: ${e.message}`);
    } finally {
      cleanup(dir);
    }
  }

  console.log(failed ? `\n${failed} guard(s) did not hold.` : '\nEvery injected fault was caught by the intended check.');
  process.exit(failed ? 1 : 0);
})();
