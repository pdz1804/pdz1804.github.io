/* =============================================================================
   Golden capture — freezes what a page looks like so a refactor can prove it
   changed nothing visible.
   =============================================================================
   Writes, per page x theme x viewport, one full-page PNG and a JSON dump of the
   text of every section. compare-golden.js then diffs two such folders.

   Everything non-deterministic is pinned: reduced motion (no particles, typing
   or counters), a seeded Math.random, fonts awaited, fixed chrome hidden.

       python -m http.server 8099                       # separate terminal
       OUT=tools/golden/before node tools/capture-golden.js
       # ...refactor...
       QUERY='?design=classic' OUT=tools/golden/after node tools/capture-golden.js
       node tools/compare-golden.js tools/golden/before tools/golden/after

   Needs Playwright (npm install --no-save playwright). Not part of CI.
============================================================================= */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.TARGET || 'http://127.0.0.1:8099';
const QUERY = process.env.QUERY || '';
const OUT = path.resolve(process.env.OUT || path.join(__dirname, 'golden', 'run'));

const PAGES = [
  { id: 'home', file: 'index.html' },
  { id: 'projects', file: 'projects.html' },
];
const THEMES = ['dark', 'light'];
const VIEWPORTS = [
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'mobile', width: 390, height: 844 },
];

/* Seeded PRNG so anything that still draws randomly draws the same thing. */
const SEED_SCRIPT = `
  (function () {
    var s = 123456789;
    Math.random = function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();
`;

/* Fixed chrome overlaps full-page captures differently on every run. */
const FREEZE_CSS = `
  #nav, #scroll-top, #progress-bar, #hero-canvas, .pds-root { visibility: hidden !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
  html { scroll-behavior: auto !important; }
`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const written = [];

  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        reducedMotion: 'reduce',
        colorScheme: theme,
        deviceScaleFactor: 1,
      });
      await ctx.addInitScript(SEED_SCRIPT);
      await ctx.addInitScript((t) => { try { localStorage.setItem('nqp-theme', t); } catch (e) {} }, theme);

      for (const pg of PAGES) {
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));

        const url = BASE + '/' + pg.file + QUERY;
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1200);
        await page.addStyleTag({ content: FREEZE_CSS });
        await page.evaluate(() => document.fonts && document.fonts.ready);

        // Reveal-on-scroll content must be shown before a full-page capture.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 40));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(700);

        const stem = `${pg.id}-${theme}-${vp.id}`;
        await page.screenshot({ path: path.join(OUT, stem + '.png'), fullPage: true });

        const sections = await page.evaluate(() => {
          const out = {};
          document.querySelectorAll('section[id], footer').forEach((el, i) => {
            out[el.id || 'footer-' + i] = el.innerText.replace(/\s+/g, ' ').trim();
          });
          return out;
        });
        fs.writeFileSync(path.join(OUT, stem + '.json'), JSON.stringify({ url, errors, sections }, null, 2));
        written.push(stem);
        await page.close();
      }
      await ctx.close();
    }
  }

  await browser.close();
  console.log(`Wrote ${written.length} captures to ${OUT}`);
  written.forEach((w) => console.log('  ' + w));
})().catch((e) => { console.error(e); process.exit(1); });
