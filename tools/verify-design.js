/* =============================================================================
   Design contract suite — the same checks for every installed design.
   =============================================================================
   A design is acceptable when it shows all the data, survives data edits, is
   usable on a phone, stays clean in both themes, and — the part that keeps
   switching safe — leaves nothing behind when it is unmounted.

       python -m http.server 8099                       # separate terminal
       DESIGN=dossier node tools/verify-design.js       # one design
       node tools/verify-design.js                      # every design in the registry
       node tools/verify-design.js --update-baseline    # re-record Classic's CSS baseline

   Env: TARGET (default http://127.0.0.1:8099), DESIGN (id), SHOTS (folder).
   Needs Playwright (npm install --no-save playwright). Exits non-zero on failure.
============================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { launch, phoneContext, NAME: BROWSER_NAME } = require('./lib/browser');
const { listDesigns } = require('./list-designs');
const { pageUrl } = require('./lib/urls');

const BASE = process.env.TARGET || 'http://127.0.0.1:8099';
const ROOT = path.join(__dirname, '..');
const SHOTS = path.resolve(process.env.SHOTS || path.join(__dirname, 'shots'));
const BASELINE_FILE = path.join(__dirname, 'design-baselines.json');
const UPDATE_BASELINE = process.argv.includes('--update-baseline');

const FORBIDDEN = /nuskin|hillspire|aperium|prysm/i;       // client names that must never ship
const VIEWPORTS = [390, 768, 1024, 1440];
const THEMES = ['dark', 'light'];
const CYCLES = 10;

let failed = 0;
let passed = 0;
const lines = [];
function check(design, name, ok, detail) {
  if (ok) passed++; else failed++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  [${design}] ${name}${detail ? '  [' + String(detail).slice(0, 300) + ']' : ''}`);
}

/* ── Static CSS lint ────────────────────────────────────────────────────────── */

function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ''); }

/* Flat list of {sel, body} for every style rule, descending into @media/@supports. */
function parseRules(css) {
  const out = [];
  function walk(text) {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i);
      if (open < 0) break;
      const head = text.slice(i, open).trim();
      let depth = 1, j = open + 1;
      while (j < text.length && depth) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
      const body = text.slice(open + 1, j - 1);
      if (/^@(media|supports|layer)/.test(head)) walk(body);
      else if (!/^@/.test(head)) out.push({ sel: head, body });
      i = j;
    }
  }
  walk(stripComments(css));
  return out;
}

function lintCss(manifest) {
  const problems = { componentTheme: [], literals: 0 };
  (manifest.css || []).filter((c) => !/^https?:/.test(c)).forEach((rel) => {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) { problems.componentTheme.push('missing file ' + rel); return; }
    parseRules(fs.readFileSync(file, 'utf8')).forEach(({ sel, body }) => {
      const parts = sel.split(',').map((s) => s.trim());
      const isTokenBlock = parts.every((s) => /^:root(\[|$|:)/.test(s));
      if (!isTokenBlock && parts.some((s) => /\[data-theme/.test(s))) problems.componentTheme.push(sel);
      if (!isTokenBlock) {
        const m = body.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g);
        if (m) problems.literals += m.length;
      }
    });
  });
  return problems;
}

/* ── In-page instrumentation for the leak test ──────────────────────────────── */

const LEAK_PROBE = `
(function () {
  var L = window.__leak = { listeners: [], timers: new Set(), intervals: new Set(), raf: new Set(), obs: new Set() };
  var longLived = function (t) {
    return t === window || t === document || t === document.documentElement || t === document.body || (t && t.id === 'app');
  };
  var add = EventTarget.prototype.addEventListener, rem = EventTarget.prototype.removeEventListener;
  var capOf = function (o) { return typeof o === 'object' && o ? !!o.capture : !!o; };
  EventTarget.prototype.addEventListener = function (type, fn, opts) {
    if (longLived(this) && fn && !(opts && typeof opts === 'object' && opts.once)) {
      var c = capOf(opts);
      if (!L.listeners.some(function (e) { return e.t === this && e.type === type && e.fn === fn && e.c === c; }, this))
        L.listeners.push({ t: this, type: type, fn: fn, c: c });
    }
    return add.call(this, type, fn, opts);
  };
  EventTarget.prototype.removeEventListener = function (type, fn, opts) {
    var c = capOf(opts);
    L.listeners = L.listeners.filter(function (e) { return !(e.t === this && e.type === type && e.fn === fn && e.c === c); }, this);
    return rem.call(this, type, fn, opts);
  };
  var st = window.setTimeout, ct = window.clearTimeout, si = window.setInterval, ci = window.clearInterval;
  window.setTimeout = function (fn, ms) {
    var args = Array.prototype.slice.call(arguments, 2), id;
    id = st.call(window, function () { L.timers.delete(id); if (typeof fn === 'function') fn.apply(this, args); }, ms);
    L.timers.add(id); return id;
  };
  window.clearTimeout = function (id) { L.timers.delete(id); return ct.call(window, id); };
  window.setInterval = function (fn, ms) { var id = si.apply(window, arguments); L.intervals.add(id); return id; };
  window.clearInterval = function (id) { L.intervals.delete(id); return ci.call(window, id); };
  var ra = window.requestAnimationFrame, ca = window.cancelAnimationFrame;
  window.requestAnimationFrame = function (fn) {
    var id = ra.call(window, function (t) { L.raf.delete(id); fn(t); });
    L.raf.add(id); return id;
  };
  window.cancelAnimationFrame = function (id) { L.raf.delete(id); return ca.call(window, id); };
  ['IntersectionObserver', 'MutationObserver', 'ResizeObserver'].forEach(function (N) {
    var O = window[N]; if (!O) return;
    window[N] = class extends O {
      constructor() { super(...arguments); L.obs.add(this); }
      disconnect() { L.obs.delete(this); return super.disconnect(); }
    };
  });
  window.__snap = function () {
    return { listeners: L.listeners.length, timers: L.timers.size, intervals: L.intervals.size,
             raf: L.raf.size, observers: L.obs.size, nodes: document.querySelectorAll('*').length };
  };
})();`;

/* ── Page helpers (run inside the browser) ──────────────────────────────────── */

async function openPage(ctx, design, page, extra) {
  const p = await ctx.newPage();
  p._errors = [];
  p.on('pageerror', (e) => p._errors.push(String(e)));
  p.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const t = m.text();
    if (/fonts\.g(oogleapis|static)|Failed to load resource|ERR_(FAILED|INTERNET)/.test(t)) return;
    p._errors.push(m.type() + ': ' + t);
  });
  await p.goto(pageUrl(BASE, page, Object.assign({ design, switcher: false }, extra || {})), { waitUntil: 'load' });
  await p.waitForFunction((id) => document.documentElement.dataset.designReady === id, design, { timeout: 20000 });
  await p.waitForTimeout(500);
  return p;
}

const TEXT_OF_DATA = () => {
  const D = window.PORTFOLIO;
  const text = (html) => new DOMParser().parseFromString(String(html), 'text/html').body.textContent.replace(/\s+/g, ' ').trim();
  const app = document.getElementById('app').textContent.replace(/\s+/g, ' ');
  const missing = [];
  const need = (label, s) => { const t = text(s); if (t && !app.includes(t)) missing.push(label + ': ' + t.slice(0, 50)); };

  D.experience.forEach((co) => {
    need('company', co.company);
    co.roles.forEach((r) => { need('role', r.title); r.bullets.forEach((b) => need('bullet', text(b).slice(0, 40))); });
  });
  D.skills.forEach((g) => { need('skill group', g.name); g.items.forEach((s) => need('skill', s.name)); });
  D.education.forEach((e) => {
    need('institution', e.institution); need('degree', e.degree);
    if (e.gpa) need('gpa', e.gpa.value);
    (e.docs || []).forEach((d) => need('education document', d.label));
  });
  D.experience.forEach((co) => co.roles.forEach((r) => (r.awards || []).forEach((a) => need('award', a))));
  D.about.specialties.forEach((x) => need('specialty', x.title));
  D.profile.languages.forEach((l) => need('language', l.name));
  D.nav.forEach((n) => need('nav label', n.label));
  const attrs = Array.from(document.getElementById('app').querySelectorAll('[href],[src]')).map((e) => e.getAttribute('href') || e.getAttribute('src'));
  const hasAttr = (v) => attrs.some((a) => a === v || a.endsWith(v));
  if (!hasAttr(D.about.photo)) missing.push('profile photo ' + D.about.photo);
  if (D.profile.resume.enabled && !hasAttr(D.profile.resume.path)) missing.push('resume link ' + D.profile.resume.path);
  [D.profile.github, D.profile.linkedin, 'mailto:' + D.profile.email].forEach((u) => { if (!hasAttr(u)) missing.push('contact link ' + u); });
  D.honors.forEach((h) => { need('honor', h.title); });
  const sorted = D.certifications.slice().sort((a, b) => b.sortKey - a.sortKey);
  sorted.slice(0, D.certsVisible).forEach((c) => need('cert', c.name));
  // Not \b: textContent runs a heading straight into the next element ("Certifications37 ...").
  const hasAll = new RegExp('(^|[^0-9])' + D.certifications.length + '([^0-9]|$)').test(app);
  if (!hasAll) missing.push('certification total ' + D.certifications.length + ' not shown');
  return missing;
};

const PROJECT_TITLES = () => {
  const D = window.PORTFOLIO;
  const text = (html) => new DOMParser().parseFromString(String(html), 'text/html').body.textContent.replace(/\s+/g, ' ').trim();
  const app = document.getElementById('app').textContent.replace(/\s+/g, ' ');
  const attrs = Array.from(document.getElementById('app').querySelectorAll('[href]')).map((e) => e.getAttribute('href'));
  const lost = [];
  D.projects.professional.concat(D.projects.academic).forEach((p) => {
    if (!app.includes(text(p.title))) lost.push('title: ' + text(p.title));
    (p.tags || []).forEach((t) => { if (!app.includes(text(t))) lost.push(text(p.title) + ' tag: ' + t); });
    if (p.link && !attrs.includes(p.link)) lost.push(text(p.title) + ' link: ' + p.link);
  });
  return lost;
};

/* ── One design ─────────────────────────────────────────────────────────────── */

async function verifyDesign(browser, manifest, others, baselines) {
  const id = manifest.id;
  const pages = manifest.pages;

  /* Fidelity + console clean + a11y, per page, in both themes' default. */
  for (const pg of pages) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await openPage(ctx, id, pg);

    if (pg === 'home') {
      const missing = await p.evaluate(TEXT_OF_DATA);
      check(id, 'home: every experience, skill, education, honor and visible certification is shown', missing.length === 0, missing.join(' | '));
    }

    if (pg === 'projects' || !pages.includes('projects')) {
      const lost = await p.evaluate(PROJECT_TITLES);
      check(id, `${pg}: every project title, tag and repository link is shown`, lost.length === 0, lost.join(' | '));
    }

    check(id, `${pg}: no console errors or page errors`, p._errors.length === 0, p._errors.join(' | '));

    const a11y = await p.evaluate(() => {
      const bad = [];
      if (!document.documentElement.lang) bad.push('html has no lang');
      const app = document.getElementById('app');
      if (app.querySelectorAll('h1').length !== 1) bad.push('expected exactly one h1, found ' + app.querySelectorAll('h1').length);
      if (!app.querySelector('main, [role="main"]')) bad.push('no main landmark');
      app.querySelectorAll('img').forEach((i) => { if (i.getAttribute('alt') === null) bad.push('img without alt: ' + (i.getAttribute('src') || '').slice(-30)); });
      const named = (el) => (el.textContent || '').trim() || el.getAttribute('aria-label') || el.getAttribute('title') ||
        (el.querySelector('img[alt]') && el.querySelector('img[alt]').getAttribute('alt'));
      app.querySelectorAll('a[href], button').forEach((el) => { if (!named(el)) bad.push('unnamed ' + el.tagName.toLowerCase() + ': ' + (el.id || el.className)); });
      const ids = {}; document.querySelectorAll('[id]').forEach((e) => { ids[e.id] = (ids[e.id] || 0) + 1; });
      Object.keys(ids).forEach((k) => { if (ids[k] > 1) bad.push('duplicate id ' + k); });
      if (document.querySelector('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])')) bad.push('positive tabindex');
      return bad;
    });
    check(id, `${pg}: basic accessibility (lang, h1, landmark, alt, names, unique ids)`, a11y.length === 0, a11y.join(' | '));

    const forbidden = await p.evaluate(() => document.getElementById('app').outerHTML);
    check(id, `${pg}: no forbidden client names in the markup`, !FORBIDDEN.test(forbidden));

    if (pg === 'home') {
      const missingIds = await p.evaluate(() =>
        ['hero', 'about', 'experience', 'skills', 'education', 'honors', 'projects', 'certifications', 'contact']
          .filter((s) => !document.getElementById(s)));
      check(id, 'shared section ids exist (they keep your place when switching)', missingIds.length === 0, missingIds.join(','));
    }
    await ctx.close();
  }

  /* Overflow at four widths, both themes. */
  for (const w of VIEWPORTS) {
    for (const theme of THEMES) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
      await ctx.addInitScript((t) => { try { localStorage.setItem('nqp-theme', t); } catch (e) {} }, theme);
      const p = await openPage(ctx, id, pages[0]);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(id, `no horizontal overflow at ${w}px (${theme})`, over <= 1, 'overflow ' + over + 'px');
      if (w === 1440 || w === 390) {
        fs.mkdirSync(SHOTS, { recursive: true });
        await p.screenshot({ path: path.join(SHOTS, `design-${id}-${theme}-${w}.png`), fullPage: false });
      }
      await ctx.close();
    }
  }

  /* Reduced motion: nothing is left invisible waiting for an animation. */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const p = await openPage(ctx, id, pages[0]);
    await p.waitForTimeout(800);
    const hidden = await p.evaluate(() => {
      const skip = '#scroll-top,#to-top,.pds-live,.pds-root,canvas,.ec-slide[hidden]';
      return Array.from(document.getElementById('app').querySelectorAll('*')).filter((el) => {
        if (el.closest(skip) || el.hasAttribute('hidden')) return false;
        const cs = getComputedStyle(el);
        return cs.opacity === '0' && cs.display !== 'none' && cs.visibility !== 'hidden';
      }).map((el) => el.className || el.tagName).slice(0, 5);
    });
    check(id, 'reduced motion: all content visible immediately', hidden.length === 0, hidden.join(','));
    await ctx.close();
  }

  /* axe-core: WCAG 2 A/AA rules (contrast, names, roles, landmarks) in both themes. Only
     serious/critical findings fail, and Classic's pre-existing ones are a recorded baseline
     that may shrink but not grow. Needs `npm install --no-save axe-core`. */
  {
    let axeSource = null;
    // axe measures computed styles and lazy images, which differ by engine; its rules are engine-neutral, so Chromium is the reference.
    if (BROWSER_NAME === 'chromium') { try { axeSource = require('axe-core').source; } catch (e) { /* optional locally, installed in CI */ } }
    if (!axeSource) {
      lines.push(`SKIP  [${id}] axe runs on Chromium with axe-core installed (npm install --no-save axe-core)`);
    } else {
      const found = {};
      for (const theme of THEMES) {
        // Reduced motion: no fade-in is mid-flight when contrast is measured.
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
        await ctx.addInitScript((t) => { try { localStorage.setItem('nqp-theme', t); } catch (e) {} }, theme);
        const p = await openPage(ctx, id, pages[0], { switcher: true });
        await p.waitForTimeout(600);
        await p.addScriptTag({ content: axeSource });
        const res = await p.evaluate(async () => {
          const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, resultTypes: ['violations'] });
          return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
            .map((v) => ({ id: v.id, n: v.nodes.length, sample: v.nodes[0].target.join(' ').slice(0, 80) }));
        });
        res.forEach((v) => { found[v.id] = found[v.id] || { n: 0, sample: theme + ': ' + v.sample }; found[v.id].n += v.n; });
        await ctx.close();
      }
      const known = (baselines[id] && baselines[id].axe) || [];
      const fresh = Object.keys(found).filter((k) => !known.includes(k));
      check(id, 'axe: no new serious or critical WCAG A/AA violations in either theme', fresh.length === 0,
        fresh.map((k) => `${k} x${found[k].n} (${found[k].sample})`).join(' ; '));
      if (UPDATE_BASELINE && Object.keys(found).length) baselines[id] = Object.assign(baselines[id] || {}, { axe: Object.keys(found) });
    }
  }

  /* Data injection: a design must show what is added to data.js, without edits. */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await openPage(ctx, id, 'home');
    const needAcadOnHome = !pages.includes('projects');
    const res = await p.evaluate(async (needAcad) => {
      const D = window.PORTFOLIO;
      const proj = JSON.parse(JSON.stringify(D.projects.professional[0]));
      proj.title = 'ZZ-INJECT-PRO'; proj.featured = true;
      D.projects.professional.push(proj);
      const acad = JSON.parse(JSON.stringify(D.projects.academic[0]));
      acad.title = 'ZZ-INJECT-ACAD';
      D.projects.academic.push(acad);
      D.certifications.push({ issuer: 'zz-new-issuer', name: 'ZZ-INJECT-CERT', date: '2027', sortKey: 999912 });
      const honor = JSON.parse(JSON.stringify(D.honors[0])); honor.title = 'ZZ-INJECT-HONOR'; honor.sortKey = 999999;
      D.honors.push(honor);
      D.skills[0].items.push({ name: 'ZZ-INJECT-SKILL', level: 'advanced', years: 1 });
      D.experience[0].roles.push({
        title: 'ZZ-INJECT-ROLE', period: 'Jan 2099 – Feb 2099', start: '2099-01', end: '2099-02', type: 'Contract',
        bullets: ['ZZ-INJECT-BULLET with <strong>emphasis</strong>'],
      });
      await window.Portfolio.rerender();
      await new Promise((r) => setTimeout(r, 400));
      const app = document.getElementById('app').textContent;
      const want = ['ZZ-INJECT-PRO', 'ZZ-INJECT-CERT', 'ZZ-INJECT-HONOR', 'ZZ-INJECT-SKILL', 'ZZ-INJECT-ROLE', 'ZZ-INJECT-BULLET'];
      if (needAcad) want.push('ZZ-INJECT-ACAD');
      return want.filter((w) => !app.includes(w));
    }, needAcadOnHome);
    check(id, 'injected project, certification (new issuer), honor, skill and role all appear', res.length === 0, 'missing: ' + res.join(','));
    check(id, 'rerender after injection raised no errors', p._errors.length === 0, p._errors.join(' | '));

    if (pages.includes('projects')) {
      const pctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const pp = await openPage(pctx, id, 'projects');
      const r2 = await pp.evaluate(async () => {
        const D = window.PORTFOLIO;
        const a = JSON.parse(JSON.stringify(D.projects.academic[0])); a.title = 'ZZ-INJECT-ACAD';
        D.projects.academic.push(a);
        await window.Portfolio.rerender();
        await new Promise((r) => setTimeout(r, 300));
        return document.getElementById('app').textContent.includes('ZZ-INJECT-ACAD');
      });
      check(id, 'projects page shows an injected academic project', r2);
      await pctx.close();
    }
    await ctx.close();
  }

  /* Edge data: empty lists and missing optional fields must not break a design. */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await openPage(ctx, id, 'home');
    const sizeBefore = await p.evaluate(() => document.getElementById('app').textContent.length);
    await p.evaluate(async () => {
      const D = window.PORTFOLIO;
      D.honors = []; D.certifications = []; D.projects.academic = []; D.profile.typedRoles = [];
      D.skills.forEach((g) => { g.items.forEach((s) => { delete s.years; }); });
      D.experience.forEach((co) => co.roles.forEach((r) => { delete r.evidence; delete r.awards; delete r.supervisor; }));
      await window.Portfolio.rerender();
      await new Promise((r) => setTimeout(r, 400));
    });
    const sizeAfter = await p.evaluate(() => document.getElementById('app').textContent.length);
    check(id, 'empty honors/certifications/academic projects and missing optional fields render without errors',
      p._errors.length === 0 && sizeAfter > 500, `errors=${p._errors.join(' | ')} size ${sizeBefore}->${sizeAfter}`);
    await ctx.close();
  }

  /* CSS invariants. */
  {
    const lint = lintCss(manifest);
    const base = baselines[id] && baselines[id].literals !== undefined ? baselines[id] : null;
    if (base) {
      check(id, `[data-theme] component rules did not grow (baseline ${base.componentTheme})`, lint.componentTheme.length <= base.componentTheme, lint.componentTheme.slice(0, 3).join(' ; '));
      check(id, `colour literals outside token blocks did not grow (baseline ${base.literals})`, lint.literals <= base.literals, `now ${lint.literals}`);
    } else {
      check(id, 'light theme redefines tokens only (no [data-theme] component rules)', lint.componentTheme.length === 0, lint.componentTheme.slice(0, 3).join(' ; '));
      check(id, 'no colour literals outside token blocks (strict for new designs)', lint.literals === 0, `${lint.literals} found`);
    }
    if (UPDATE_BASELINE && id === 'classic') baselines.classic = Object.assign(baselines.classic || {}, { literals: lint.literals, componentTheme: lint.componentTheme.length });
  }

  /* The picker lives in this design's nav and works with a thumb. */
  if (others.length) {
    const ctx = await browser.newContext(phoneContext(390, 844));
    const p = await ctx.newPage();
    await p.goto(pageUrl(BASE, 'home', { design: id, switcher: true }), { waitUntil: 'load' });
    await p.waitForFunction((d) => document.documentElement.dataset.designReady === d, id, { timeout: 20000 });
    const where = await p.evaluate(() => {
      const slot = document.querySelector('[data-design-slot]');
      const t = document.querySelector('.pds-trigger').getBoundingClientRect();
      return { inSlot: !!slot && slot.contains(document.querySelector('.pds-root')), h: Math.round(t.height), onScreen: t.right <= innerWidth && t.left >= 0 && t.top >= 0 && t.bottom <= 100 };
    });
    check(id, 'phone: the picker sits in the nav slot, on screen, at least 44px tall', where.inSlot && where.h >= 44 && where.onScreen, JSON.stringify(where));
    await p.tap('.pds-trigger');
    await p.tap(`.pds-opt[data-design-id="${others[0]}"]`);
    await p.waitForFunction((d) => window.Portfolio.current() === d, others[0], { timeout: 20000 });
    const after = await p.evaluate(() => ({ closed: document.querySelector('.pds-panel').hidden, scroll: document.documentElement.scrollWidth - innerWidth }));
    check(id, 'phone: picking a design switches it, closes the list, no overflow', after.closed && after.scroll <= 1, JSON.stringify(after));
    await ctx.close();
  }

  /* Leak test: A -> B -> A, ten times, must return to the starting footprint. */
  if (others.length) {
    const other = others[0];
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(LEAK_PROBE);
    const p = await openPage(ctx, id, 'home');
    await p.waitForTimeout(1500);
    const before = await p.evaluate(() => window.__snap());
    await p.evaluate(async ({ a, b, n }) => {
      for (let i = 0; i < n; i++) {
        await window.Portfolio.switchDesign(b);
        await window.Portfolio.switchDesign(a);
      }
    }, { a: id, b: other, n: CYCLES });
    // Frames and timers can still be mid-flight a moment after the last switch; a real leak
    // never settles, so wait (up to 8 s) for the footprint to come back before judging it.
    let after = null;
    for (let i = 0; i < 16; i++) {
      await p.waitForTimeout(500);
      after = await p.evaluate(() => window.__snap());
      if (Math.abs(after.raf - before.raf) <= 2 && Math.abs(after.timers - before.timers) <= 2) break;
    }
    const same = (k, tol) => Math.abs(after[k] - before[k]) <= tol;
    const detail = JSON.stringify({ before, after });
    check(id, `leak: document/window listeners unchanged after ${CYCLES} switches`, same('listeners', 0), detail);
    check(id, 'leak: intervals unchanged', same('intervals', 0), detail);
    check(id, 'leak: observers unchanged', same('observers', 0), detail);
    check(id, 'leak: pending timers and frames back to baseline (±2)', same('timers', 2) && same('raf', 2), detail);
    check(id, 'leak: DOM node count back to baseline (±2%)', Math.abs(after.nodes - before.nodes) <= before.nodes * 0.02, detail);
    check(id, 'leak: no errors while switching', p._errors.length === 0, p._errors.join(' | '));
    await ctx.close();
  } else {
    lines.push(`SKIP  [${id}] leak test needs a second design`);
  }
}

(async () => {
  const designs = listDesigns();
  const only = process.env.DESIGN;
  const baselines = fs.existsSync(BASELINE_FILE) ? JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')) : {};
  const browser = await launch();

  for (const m of designs) {
    if (only && m.id !== only) continue;
    const others = designs.filter((d) => d.id !== m.id).map((d) => d.id);
    await verifyDesign(browser, m, others, baselines);
  }
  await browser.close();

  if (UPDATE_BASELINE) {
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(baselines, null, 2) + '\n');
    lines.push('Wrote ' + path.relative(ROOT, BASELINE_FILE));
  }

  console.log(lines.join('\n'));
  console.log('\n' + '='.repeat(70));
  console.log(`${passed}/${passed + failed} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
