/* =============================================================================
   Capture one set of screenshots per installed design, and refresh the README
   gallery from them.
   =============================================================================
       python -m http.server 8099                  # separate terminal
       node tools/capture-designs.js

   For every design in designs/registry.js it writes, to docs/screenshots/designs/:
       <id>-dark-desktop.webp   <id>-light-desktop.webp   <id>-dark-mobile.webp
       <id>-dark-full.webp      (whole landing page, scaled down)
   then rewrites the block between <!-- designs:start --> and <!-- designs:end -->
   in README.md, so a new design appears in the gallery without hand-editing.

   Needs Playwright and ImageMagick (`magick`, for WebP). Motion is reduced so
   every capture is stable.
============================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');
const { listDesigns } = require('./list-designs');
const { pageUrl } = require('./lib/urls');

const BASE = process.env.TARGET || 'http://127.0.0.1:8099';
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'screenshots', 'designs');
const README = path.join(ROOT, 'README.md');

const magick = spawnSync('magick', ['-version'], { encoding: 'utf8' });
if (magick.error) { console.error('ImageMagick (magick) is required to write WebP.'); process.exit(2); }

function toWebp(png, webp, extra) {
  const r = spawnSync('magick', [png, ...(extra || []), '-quality', '82', webp], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('magick failed: ' + r.stderr);
  fs.unlinkSync(png);
}

async function capture(browser, id, theme, vp, name, fullPage) {
  const ctx = await browser.newContext({
    viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: theme,
  });
  await ctx.addInitScript((t) => { try { localStorage.setItem('nqp-theme', t); } catch (e) {} }, theme);
  const page = await ctx.newPage();
  await page.goto(pageUrl(BASE, 'home', { design: id, switcher: false }), { waitUntil: 'load' });
  await page.waitForFunction((d) => document.documentElement.dataset.designReady === d, id, { timeout: 10000 });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(900);

  if (fullPage) {
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);
  }
  const png = path.join(OUT, name + '.png');
  await page.screenshot({ path: png, fullPage: !!fullPage });
  await ctx.close();
  toWebp(png, path.join(OUT, name + '.webp'), fullPage ? ['-resize', '900x'] : null);
}

function gallery(designs) {
  const rel = (n) => `docs/screenshots/designs/${n}.webp`;
  const head = '| Design | Dark | Light | Phone |\n|---|---|---|---|\n';
  const rows = designs.map((d) =>
    `| **${d.name}**<br>${d.description || ''}<br>\`?design=${d.id}\` ` +
    `| <img src="${rel(d.id + '-dark-desktop')}" alt="${d.name} design, dark theme, desktop" width="360"> ` +
    `| <img src="${rel(d.id + '-light-desktop')}" alt="${d.name} design, light theme, desktop" width="360"> ` +
    `| <img src="${rel(d.id + '-dark-mobile')}" alt="${d.name} design, dark theme, phone" width="120"> |`
  ).join('\n');
  return head + rows + '\n';
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const designs = listDesigns();
  const browser = await chromium.launch();
  for (const d of designs) {
    console.log('capturing ' + d.id);
    await capture(browser, d.id, 'dark', { width: 1440, height: 900 }, `${d.id}-dark-desktop`);
    await capture(browser, d.id, 'light', { width: 1440, height: 900 }, `${d.id}-light-desktop`);
    await capture(browser, d.id, 'dark', { width: 390, height: 844 }, `${d.id}-dark-mobile`);
    await capture(browser, d.id, 'dark', { width: 1440, height: 900 }, `${d.id}-dark-full`, true);
  }
  await browser.close();

  if (fs.existsSync(README)) {
    const text = fs.readFileSync(README, 'utf8');
    const re = /(<!-- designs:start -->)[\s\S]*?(<!-- designs:end -->)/;
    if (re.test(text)) {
      fs.writeFileSync(README, text.replace(re, `$1\n${gallery(designs)}$2`));
      console.log('README gallery refreshed.');
    } else {
      console.log('README has no <!-- designs:start --> / <!-- designs:end --> markers; gallery not written.');
    }
  }
})().catch((e) => { console.error(e); process.exit(1); });
