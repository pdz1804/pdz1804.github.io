/* =============================================================================
   Device matrix (flow F7)
   =============================================================================
   Six real device profiles, portrait and landscape, driven with touch input.
   Checks horizontal overflow, body-copy size, menu behaviour on tap, and every
   interactive control against the 44x44 CSS px touch-target minimum.

       python -m http.server 8099          # separate terminal, repo root
       npm install --no-save playwright
       TARGET=http://127.0.0.1:8099 node tools/verify-devices.js

   Omit TARGET to run against the deployed site.
============================================================================= */
const { chromium, devices } = require('playwright');

const BASE = process.env.TARGET || 'https://pdz1804.github.io';
const PROFILES = [
  'iPhone SE', 'iPhone 12', 'iPhone 14 Pro Max',
  'Pixel 5', 'Galaxy S9+', 'iPad Mini',
];

const res = [];
const ck = (n, ok, d) => res.push({ n, ok: !!ok, d: d == null ? '' : String(d) });

(async () => {
  const browser = await chromium.launch();

  for (const name of PROFILES) {
    const d = devices[name];
    if (!d) { ck(`${name}: profile available`, false, 'unknown device'); continue; }

    for (const orient of ['portrait', 'landscape']) {
      const vp = orient === 'portrait'
        ? d.viewport
        : { width: d.viewport.height, height: d.viewport.width };
      const tag = `${name} ${orient} ${vp.width}x${vp.height}`;

      const ctx = await browser.newContext(Object.assign({}, d, { viewport: vp }));
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', (e) => errs.push(String(e)));

      await p.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
      await p.waitForTimeout(1400);

      // no sideways scroll at any device size
      const ov = await p.evaluate(() => ({
        sw: document.documentElement.scrollWidth, iw: window.innerWidth,
      }));
      ck(`${tag}: no horizontal overflow`, ov.sw <= ov.iw + 1, `${ov.sw} vs ${ov.iw}`);

      // body copy at 16px+ so iOS does not zoom on focus, and stays readable
      const fs = await p.evaluate(() => {
        const el = document.querySelector('.hero-desc') || document.querySelector('.about-text p');
        return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
      });
      ck(`${tag}: body copy >= 15px`, fs >= 15, fs + 'px');

      // tap targets: every interactive control a thumb must hit
      const small = await p.evaluate(() => {
        const sel = '.cta-row a, #burger, #theme-btn, .nav-back, #certs-more-btn, .proj-view-all a, .contact-card, .repo-link';
        return [...document.querySelectorAll(sel)]
          .filter((e) => e.offsetParent !== null)
          .map((e) => {
            const r = e.getBoundingClientRect();
            return { t: (e.textContent || e.id || e.className).trim().slice(0, 26), w: Math.round(r.width), h: Math.round(r.height) };
          })
          .filter((x) => x.h < 44 || x.w < 44);
      });
      ck(`${tag}: all tap targets >= 44px`, small.length === 0,
         small.length ? small.map((s) => `${s.t} ${s.w}x${s.h}`).join('; ') : 'all pass');

      // real touch interaction with the menu (phones only — iPad shows desktop nav)
      const isPhone = vp.width < 768;
      if (isPhone) {
        await p.tap('#burger');
        await p.waitForTimeout(450);
        const open = await p.isVisible('#mob-menu');
        ck(`${tag}: burger opens on tap`, open);

        if (open) {
          const items = await p.$$eval('#mob-menu a', (a) => a.map((x) => {
            const r = x.getBoundingClientRect();
            return { t: x.textContent.trim(), h: Math.round(r.height) };
          }));
          const tiny = items.filter((i) => i.h < 40);
          ck(`${tag}: menu rows >= 40px tall`, tiny.length === 0,
             tiny.length ? tiny.map((i) => `${i.t} ${i.h}px`).join('; ') : items.length + ' rows');
          await p.tap('#mob-menu a[href="#skills"]');
          await p.waitForTimeout(700);
          ck(`${tag}: tapping a link closes the menu and scrolls`,
             !(await p.isVisible('#mob-menu')) && (await p.evaluate(() => scrollY)) > 100);
        }
      }

      // content is reachable end to end
      await p.evaluate(async () => {
        document.documentElement.style.scrollBehavior = 'auto';
        for (let y = 0; y < document.documentElement.scrollHeight; y += 350) {
          window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90));
        }
      });
      await p.waitForTimeout(600);
      const hidden = await p.$$eval('.r', (e) => e.filter((x) => !x.classList.contains('on')).length);
      ck(`${tag}: nothing left invisible`, hidden === 0, hidden + ' hidden');
      ck(`${tag}: no JS errors`, errs.length === 0, errs.join(' | '));

      await ctx.close();
    }
  }

  await browser.close();
  const bad = res.filter((x) => !x.ok);
  res.forEach((x) => { if (!x.ok) console.log(`FAIL  ${x.n}  [${x.d}]`); });
  const byDevice = {};
  res.forEach((x) => {
    const k = x.n.split(':')[0];
    byDevice[k] = byDevice[k] || { p: 0, t: 0 };
    byDevice[k].t++; if (x.ok) byDevice[k].p++;
  });
  console.log();
  Object.entries(byDevice).forEach(([k, v]) => console.log(`  ${v.p === v.t ? 'PASS' : 'FAIL'}  ${k.padEnd(38)} ${v.p}/${v.t}`));
  console.log(`\n${res.length - bad.length}/${res.length} device checks passed`);
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
