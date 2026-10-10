/* =============================================================================
   Switching and fallback suite — what the loader promises, design-independent.
   =============================================================================
       python -m http.server 8099                  # separate terminal
       node tools/verify-switching.js              # TARGET defaults to http://127.0.0.1:8099

   Covers: live switch both ways, scroll and focus kept, theme shared, choice
   persisted only by the picker, ?design= precedence, projects.html redirect,
   a broken design falling back to Classic, a dead loader never leaving the page
   blank, no-JS output, and file:// loading. Uses the first two registry designs.
============================================================================= */

'use strict';

const path = require('path');
const { chromium } = require('playwright');
const { listDesigns } = require('./list-designs');
const { pageUrl } = require('./lib/urls');

const BASE = process.env.TARGET || 'http://127.0.0.1:8099';
const ROOT = path.join(__dirname, '..');
const [A, B] = listDesigns().map((d) => d.id);

const out = [];
let failed = 0;
const t = (n, ok, d) => { if (!ok) failed++; out.push((ok ? 'PASS' : 'FAIL') + '  ' + n + (d ? '  [' + String(d).slice(0, 240) + ']' : '')); };
const url = (page, o) => pageUrl(BASE, page, Object.assign({ extra: { v: String(Date.now() + Math.random()) } }, o));
const ready = (p, id) => p.waitForFunction((d) => document.documentElement.dataset.designReady === d, id, { timeout: 9000 });

(async () => {
  if (!B) { console.log('Needs two designs.'); process.exit(0); }
  const browser = await chromium.launch();

  /* ── Live switch both ways ─────────────────────────────────────────────── */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(String(e)));
    p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|Failed to load resource/.test(m.text())) errs.push(m.text()); });

    await p.goto(url('home', { design: A, switcher: true }));
    await ready(p, A);
    t(`boots ${A}`, await p.evaluate((a) => window.Portfolio.current() === a, A));
    t('picker lists every design', await p.evaluate(() => document.querySelectorAll('.pds-opt').length) >= 2);

    await p.evaluate(() => document.getElementById('experience').scrollIntoView({ behavior: 'instant' }));
    await p.click(`.pds-opt[data-design-id="${B}"]`);
    await p.waitForFunction((d) => window.Portfolio.current() === d, B);
    await p.waitForTimeout(600);
    const s = await p.evaluate((ids) => ({
      aCss: !!document.querySelector(`link[data-design-css="${ids.a}"][href*="css"]`),
      bActive: (() => { const l = document.querySelector(`link[data-design-css="${ids.b}"][href$=".css"]`); return !!l && !l.media; })(),
      q: location.search, saved: localStorage.getItem('nqp-design'), top: Math.round(document.getElementById('experience').getBoundingClientRect().top),
      focus: document.activeElement && document.activeElement.dataset.designId,
    }), { a: A, b: B });
    t(`${A} stylesheet removed, ${B} active`, !s.aCss && s.bActive, JSON.stringify(s));
    t('URL updated and choice saved by the picker', s.q.includes('design=' + B) && s.saved === B);
    t('same section kept after the switch', Math.abs(s.top) < 200, 'top=' + s.top);
    t('focus stays on the picker', s.focus === B);

    await p.click(`.pds-opt[data-design-id="${A}"]`);
    await p.waitForFunction((d) => window.Portfolio.current() === d, A);
    t(`back to ${A} leaves no ${B} stylesheet`, await p.evaluate((b) => !document.querySelector(`link[data-design-css="${b}"]`), B));

    await p.evaluate(() => window.PortfolioTheme.set('light'));
    await p.click(`.pds-opt[data-design-id="${B}"]`);
    await p.waitForFunction((d) => window.Portfolio.current() === d, B);
    t('theme carries across designs', await p.evaluate(() => document.documentElement.dataset.theme === 'light'));

    await p.goto(url('home', { switcher: true }));
    await ready(p, B);
    t('reload keeps the saved design', true);

    await p.evaluate((a) => localStorage.setItem('nqp-design', a), A);
    await p.goto(url('home', { design: B, switcher: true }));
    await ready(p, B);
    t('?design= wins over the saved choice', true);
    t('?design= is not saved', await p.evaluate((a) => localStorage.getItem('nqp-design') === a, A));
    t('no console or page errors while switching', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  /* ── Unknown design id ─────────────────────────────────────────────────── */
  {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto(url('home', { design: 'does-not-exist' }));
    await p.waitForFunction(() => document.documentElement.dataset.designReady);
    t('unknown ?design= falls back to the default design', await p.evaluate(() => document.documentElement.dataset.design === window.PORTFOLIO.site.defaultDesign));
    await ctx.close();
  }

  /* ── projects.html when a design has no such page ──────────────────────── */
  {
    const dossier = listDesigns().find((d) => d.redirect);
    if (dossier) {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(url('projects', { design: dossier.id, switcher: false }));
      await p.waitForTimeout(1800);
      const r = await p.evaluate(() => ({ href: location.href, cur: window.Portfolio.current(), picker: !!document.querySelector('.pds-root') }));
      t('projects.html redirects to the design\'s own page, keeping query and hash',
        /index\.html/.test(r.href) && /#projects$/.test(r.href) && /switcher=0/.test(r.href) && r.cur === dossier.id && !r.picker, JSON.stringify(r));
      await ctx.close();
    }
  }

  /* ── A broken design falls back to Classic with a banner ───────────────── */
  {
    const ctx = await browser.newContext();
    await ctx.route(`**/designs/${B}/*.css`, (r) => r.abort());
    const p = await ctx.newPage();
    await p.goto(url('home', { design: B }));
    await p.waitForFunction(() => document.documentElement.dataset.designReady, null, { timeout: 9000 });
    const f = await p.evaluate(() => ({ cur: window.Portfolio.current(), banner: !!document.querySelector('.pds-banner'), content: !!document.querySelector('#experience') }));
    t(`${B} failing to load falls back to ${A} with a banner`, f.cur === A && f.banner && f.content, JSON.stringify(f));
    await ctx.close();
  }

  /* ── Core script missing: the page must still appear, styled ───────────── */
  {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
    await ctx.route('**/core/loader.js', (r) => r.abort());
    const p = await ctx.newPage();
    await p.goto(url('home', { design: B }));
    await p.waitForTimeout(7600);
    const r = await p.evaluate(() => ({
      loading: document.documentElement.hasAttribute('data-design-loading'),
      css: !!document.querySelector('link[data-design-css="classic"]'),
      hero: document.querySelector('.hero-name').offsetHeight,
      vis: getComputedStyle(document.getElementById('app')).visibility,
    }));
    t('dead loader: static page revealed with its stylesheet', !r.loading && r.css && r.hero > 20 && r.vis === 'visible', JSON.stringify(r));
    await ctx.close();
  }

  /* ── No JavaScript ─────────────────────────────────────────────────────── */
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const p = await ctx.newPage();
    await p.goto(url('home', { design: B }));
    await p.waitForTimeout(500);
    const v = await p.evaluate(() => ({ h: document.querySelector('.hero-name').offsetHeight, vis: getComputedStyle(document.getElementById('app')).visibility }));
    t('no JS: the static page is visible', v.h > 20 && v.vis === 'visible', JSON.stringify(v));
    await ctx.close();
  }

  /* ── file:// ───────────────────────────────────────────────────────────── */
  {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(String(e)));
    await p.goto('file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/') + '?design=' + B);
    await p.waitForFunction(() => document.documentElement.dataset.designReady, null, { timeout: 9000 });
    t(`file:// mounts ${B} with no errors`, await p.evaluate((b) => window.Portfolio.current() === b, B) && errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(out.join('\n'));
  console.log('\n' + (failed ? failed + ' failed.' : 'All switching checks passed.'));
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
