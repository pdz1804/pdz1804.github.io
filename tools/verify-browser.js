/* =============================================================================
   Browser verification suite — drives both pages as a real user.
   =============================================================================
   Playwright is NOT a dependency of this site; install it only when you want to
   run these checks:

       python -m http.server 8099      # in the repo root, separate terminal
       npm install --no-save playwright
       node tools/verify-browser.js

   Covers: derived counts, computed tenure, CV content sync, scroll reveal,
   skill bars, hero canvas sizing, gradient headline, certification toggle,
   theme switching and persistence, deep links, link resolution, the projects
   page, mobile layout and menu, reduced motion, and the footer/back-to-top
   collision. Screenshots land in tools/shots/. Exits non-zero on failure.
============================================================================= */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8099';
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const pass = (n, d) => results.push({ ok: true, n, d: d || '' });
const fail = (n, d) => results.push({ ok: false, n, d: d || '' });
const check = (cond, n, d) => (cond ? pass(n, d) : fail(n, d));

(async () => {
  const browser = await chromium.launch();

  /* ─────────── DESKTOP ─────────── */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const failedReqs = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('requestfailed', (r) => failedReqs.push(r.url() + ' :: ' + (r.failure() || {}).errorText));
  page.on('response', (r) => { if (r.status() >= 400) failedReqs.push(r.url() + ' :: HTTP ' + r.status()); });

  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);

  // --- Derived data ---
  const totals = await page.evaluate(() => window.PORTFOLIO_TOTALS);
  const D = await page.evaluate(() => ({
    certs: PORTFOLIO.certifications.length,
    pro: PORTFOLIO.projects.professional.length,
    acad: PORTFOLIO.projects.academic.length,
    visible: PORTFOLIO.certsVisible,
    skills: PORTFOLIO.skills.reduce((n, g) => n + g.items.length, 0),
    repos: PORTFOLIO.projects.professional.filter(p => p.link).length +
           PORTFOLIO.projects.academic.filter(p => p.link).length,
    tenure: (() => {
      const r = PORTFOLIO.experience[0].roles.map(x => x.start).sort()[0].split('-');
      const n = new Date();
      const m = (n.getFullYear() - +r[0]) * 12 + (n.getMonth() + 1 - +r[1]) + 1;
      const y = Math.floor(m / 12), mm = m % 12, out = [];
      if (y) out.push(y + ' yr' + (y > 1 ? 's' : ''));
      if (mm) out.push(mm + ' mo' + (mm > 1 ? 's' : ''));
      return out.join(' ');
    })(),
  }));
  check(totals.certs === D.certs, 'certification count matches the data', `${totals.certs} rendered / ${D.certs} in data`);
  check(totals.projects === D.pro + D.acad, 'project count matches the data', `${totals.projects} rendered / ${D.pro + D.acad} in data`);
  check(totals.years >= 1, 'years of experience is computed', 'got ' + totals.years);

  const stats = await page.$$eval('.h-stat', (els) => els.map((e) => e.textContent.trim()));
  check(stats.some((s) => s.startsWith(totals.years + '+')), 'hero stat: years animated', stats.join(' | '));
  check(stats.some((s) => s.startsWith(String(D.certs))), 'hero stat: certification count', stats.join(' | '));
  check(stats.some((s) => s.startsWith(String(D.pro + D.acad))), 'hero stat: project count', stats.join(' | '));
  check(stats.some((s) => s.startsWith('3.8')), 'hero stat: 3.8 GPA', stats.join(' | '));

  // --- Tenure is computed, not stale ---
  const tenure = await page.$$eval('.exp-co-meta', (e) => e.map((x) => x.textContent));
  check(tenure[0].startsWith(D.tenure), 'FPT tenure matches the date math', `rendered "${tenure[0].split('·')[0].trim()}", computed "${D.tenure}"`);
  check(!/1 yr 1 mo\b/.test(tenure.join()), 'stale "1 yr 1 mo" is gone');

  // --- CV content sync ---
  const body = await page.evaluate(() => document.body.innerText);
  for (const term of ['Agentic ERP Platform', 'Management Portal', 'AI4ALL',
                      'Graduated — Excellent classification', 'OISP Scholarship',
                      'permission layer', 'Jun – Oct 2025']) {
    check(body.includes(term), 'content present: ' + term);
  }
  // Client / product names that must never appear on the public site.
  check(!/(prysm|nuskin|hillspire|aperium)/i.test(body),
        'no forbidden client or product names',
        (body.match(/(prysm|nuskin|hillspire|aperium)/i) || ['none'])[0]);
  // Any employer address, not one literal — broader, and keeps the address
  // itself out of this public repository.
  check(!/@fpt\.com/i.test(body), 'no work email on the public site');
  check(body.includes('quangphunguyen1804@gmail.com'), 'gmail contact present');

  // --- Reveal actually fires (nothing left invisible) ---
  await page.evaluate(async () => {
    // `scroll-behavior: smooth` animates programmatic scrolls, so each jump
    // would lag the request and the loop could end mid-animation. A wheel
    // scroll is not affected by it; neutralise it so this mimics one.
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 110));
    }
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = prev;
  });
  await page.waitForTimeout(900);
  const unrevealed = await page.$$eval('.r', (els) => els.filter((e) => !e.classList.contains('on')).length);
  check(unrevealed === 0, 'all reveal elements shown after scrolling', unrevealed + ' left hidden');

  const barsFilled = await page.$$eval('.sk-fill', (els) => els.filter((b) => b.style.width && b.style.width !== '0%').length);
  check(barsFilled === D.skills, 'every skill bar filled', `${barsFilled} of ${D.skills}`);

  // --- Hero rendering bugs that were fixed ---
  const hero = await page.evaluate(() => {
    const cv = document.getElementById('hero-canvas');
    const g = document.querySelector('.hero-name .grad');
    return { cw: cv.width, ch: cv.height, ow: cv.offsetWidth,
             gradKids: g.querySelectorAll('.c').length, gradText: g.textContent,
             gradDisplay: getComputedStyle(g).display };
  });
  check(hero.cw === hero.ow && hero.cw > 1000, 'canvas fills hero (not 300x150)', hero.cw + 'x' + hero.ch);
  check(hero.gradKids === 0 && hero.gradText === 'Nguyen', 'surname renders as one gradient unit', hero.gradText);

  // --- Certifications toggle ---
  const beforeToggle = await page.$$eval('.cert-card', (e) => e.filter((c) => c.offsetParent !== null).length);
  await page.click('#certs-more-btn');
  await page.waitForTimeout(400);
  const afterToggle = await page.$$eval('.cert-card', (e) => e.filter((c) => c.offsetParent !== null).length);
  const btnText = await page.textContent('#certs-more-btn');
  check(beforeToggle === D.visible, 'certs collapsed shows certsVisible', `${beforeToggle} of ${D.visible}`);
  check(afterToggle === D.certs, 'certs expanded shows them all', `${afterToggle} of ${D.certs}`);
  check(/fewer/i.test(btnText), 'toggle button label flips', btnText);
  await page.click('#certs-more-btn');
  await page.waitForTimeout(300);
  const reCollapsed = await page.$$eval('.cert-card', (e) => e.filter((c) => c.offsetParent !== null).length);
  check(reCollapsed === D.visible, 'certs collapse again', 'got ' + reCollapsed);

  // --- Theme toggle + persistence ---
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.evaluate(() => localStorage.setItem('nqp-theme', 'dark'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  check((await page.getAttribute('html', 'data-theme')) === 'dark', 'dark theme persists across reload');
  await page.screenshot({ path: path.join(SHOTS, '01-desktop-dark-hero.png') });

  await page.click('#theme-btn');
  await page.waitForTimeout(500);
  check((await page.getAttribute('html', 'data-theme')) === 'light', 'theme button switches to light');
  check((await page.evaluate(() => localStorage.getItem('nqp-theme'))) === 'light', 'theme choice saved');
  await page.screenshot({ path: path.join(SHOTS, '02-desktop-light-hero.png') });

  // Contrast sanity: body text must not match the page background in either theme.
  for (const theme of ['dark', 'light']) {
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await page.waitForTimeout(200);
    const c = await page.evaluate(() => {
      const s = getComputedStyle(document.body);
      const p = document.querySelector('.about-text p');
      return { bg: s.backgroundColor, fg: getComputedStyle(p).color };
    });
    check(c.bg !== c.fg, 'text/background differ in ' + theme + ' theme', JSON.stringify(c));
  }

  // --- Full-page screenshots ---
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, '03-desktop-dark-full.png'), fullPage: true });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, '04-desktop-light-full.png'), fullPage: true });

  // --- Deep link straight to #contact must not land on invisible content ---
  const deep = await ctx.newPage();
  await deep.goto(BASE + '/index.html#contact', { waitUntil: 'networkidle' });
  await deep.waitForTimeout(1400);
  const deepHidden = await deep.evaluate(() => {
    const inView = [...document.querySelectorAll('.r')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0;
    });
    return { inView: inView.length, hidden: inView.filter((e) => !e.classList.contains('on')).length };
  });
  check(deepHidden.hidden === 0, 'deep link to #contact reveals visible content',
        JSON.stringify(deepHidden));
  await deep.screenshot({ path: path.join(SHOTS, '05-deeplink-contact.png') });
  await deep.close();

  // --- Outbound + download links ---
  const links = await page.$$eval('a[href]', (as) => as.map((a) => ({ href: a.getAttribute('href'), abs: a.href })));
  const cvLinks = links.filter((l) => /\.pdf$/i.test(l.href));
  check(cvLinks.length >= 3, 'CV download link present in nav, hero, contact, footer', 'found ' + cvLinks.length);

  const seen = new Set();
  for (const l of links) {
    if (!l.abs.startsWith(BASE)) continue;
    const u = l.abs.split('#')[0];
    if (seen.has(u)) continue;
    seen.add(u);
    const r = await page.request.get(u);
    check(r.status() === 200, 'link resolves: ' + u.replace(BASE, ''), 'HTTP ' + r.status());
  }

  /* ─────────── PROJECTS PAGE ─────────── */
  const proj = await ctx.newPage();
  const projErrors = [];
  proj.on('pageerror', (e) => projErrors.push(String(e)));
  proj.on('console', (m) => { if (m.type() === 'error') projErrors.push(m.text()); });
  await proj.goto(BASE + '/projects.html', { waitUntil: 'networkidle' });
  await proj.waitForTimeout(1200);
  await proj.evaluate(async () => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 110));
    }
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = prev;
  });
  await proj.waitForTimeout(700);

  const proCount = await proj.$$eval('.pro-card', (e) => e.length);
  const acadCount = await proj.$$eval('.acad-card', (e) => e.length);
  const projHidden = await proj.$$eval('.r', (e) => e.filter((x) => !x.classList.contains('on')).length);
  const projRepos = await proj.$$eval('.repo-link', (e) => e.map((a) => a.href));
  check(proCount === D.pro, 'projects page: professional cards match data', `${proCount} of ${D.pro}`);
  check(acadCount === D.acad, 'projects page: academic cards match data', `${acadCount} of ${D.acad}`);
  check(projHidden === 0, 'projects page: nothing left invisible', projHidden + ' hidden');
  check(projRepos.length === D.repos, 'projects page: repository links match data', `${projRepos.length} of ${D.repos}`);
  check(projErrors.length === 0, 'projects page: no JS errors', projErrors.join(' | '));
  await proj.screenshot({ path: path.join(SHOTS, '06-projects-full.png'), fullPage: true });

  const acadNums = await proj.$$eval('.acad-num', (e) => e.map((x) => x.textContent));
  check(JSON.stringify(acadNums) === '["01","02","03"]', 'academic cards auto-numbered', acadNums.join(','));
  await proj.close();

  /* ─────────── MOBILE ─────────── */
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  });
  const m = await mctx.newPage();
  const mErrors = [];
  m.on('pageerror', (e) => mErrors.push(String(e)));
  await m.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await m.waitForTimeout(1200);

  const noHScroll = await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check(noHScroll, 'mobile: no horizontal overflow',
        await m.evaluate(() => document.documentElement.scrollWidth + ' vs ' + innerWidth));

  const burgerVisible = await m.isVisible('#burger');
  const navLinksVisible = await m.isVisible('.nav-links');
  check(burgerVisible, 'mobile: burger shown');
  check(!navLinksVisible, 'mobile: desktop nav hidden');

  await m.click('#burger');
  await m.waitForTimeout(400);
  const menuOpen = await m.isVisible('#mob-menu');
  const menuItems = await m.$$eval('#mob-menu a', (a) => a.map((x) => x.textContent.trim()));
  check(menuOpen, 'mobile: menu opens');
  check(menuItems.includes('All Projects'), 'mobile menu has All Projects', menuItems.join(', '));
  check(menuItems.includes('Download CV'), 'mobile menu has Download CV', menuItems.join(', '));
  await m.screenshot({ path: path.join(SHOTS, '07-mobile-menu.png') });

  await m.keyboard.press('Escape');
  await m.waitForTimeout(300);
  check(!(await m.isVisible('#mob-menu')), 'mobile: Escape closes menu');

  await m.evaluate(async () => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 110));
    }
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = prev;
  });
  await m.waitForTimeout(700);
  const mHidden = await m.$$eval('.r', (e) => e.filter((x) => !x.classList.contains('on')).length);
  check(mHidden === 0, 'mobile: nothing left invisible', mHidden + ' hidden');
  check(mErrors.length === 0, 'mobile: no JS errors', mErrors.join(' | '));
  await m.screenshot({ path: path.join(SHOTS, '08-mobile-full.png'), fullPage: true });
  await m.close();

  /* ─────────── REDUCED MOTION ─────────── */
  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const r = await rctx.newPage();
  await r.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await r.waitForTimeout(900);
  const rHidden = await r.$$eval('.r', (e) => e.filter((x) => !x.classList.contains('on')).length);
  const rStats = await r.$$eval('.h-stat-n', (e) => e.map((x) => x.textContent));
  check(rHidden === 0, 'reduced motion: all content visible immediately', rHidden + ' hidden');
  check(rStats.includes('37'), 'reduced motion: counters settle at final value', rStats.join(','));
  await r.screenshot({ path: path.join(SHOTS, '09-reduced-motion.png') });
  await r.close();

  /* ─────────── FOOTER vs BACK-TO-TOP BUTTON ─────────── */
  for (const w of [1440, 1280, 1100, 900, 768]) {
    const fp = await browser.newPage({ viewport: { width: w, height: 800 } });
    await fp.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
    await fp.waitForTimeout(500);
    await fp.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await fp.waitForTimeout(400);
    const res = await fp.evaluate(() => {
      const last = [...document.querySelectorAll('.footer-links a')].pop();
      const btn = document.getElementById('scroll-top');
      const s = getComputedStyle(btn);
      const r = last.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { reachable: !!hit && (hit === last || last.contains(hit)),
               btnOpacity: s.opacity, btnEvents: s.pointerEvents,
               noOverflow: document.documentElement.scrollWidth <= innerWidth + 1 };
    });
    check(res.reachable, `footer CV link clickable at ${w}px`, JSON.stringify(res));
    check(res.noOverflow, `no horizontal overflow at ${w}px`);
    await fp.close();
  }

  /* ─────────── ERROR TALLY ─────────── */
  check(pageErrors.length === 0, 'no uncaught JS errors', pageErrors.join(' | '));
  check(consoleErrors.length === 0, 'no console errors', consoleErrors.join(' | '));
  check(failedReqs.length === 0, 'no failed requests', failedReqs.join(' | '));

  await browser.close();

  /* ─────────── REPORT ─────────── */
  const failed = results.filter((r) => !r.ok);
  console.log('\n' + '='.repeat(70));
  results.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.n}${r.d ? '  [' + r.d + ']' : ''}`));
  console.log('='.repeat(70));
  console.log(`${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('\nFAILURES:');
    failed.forEach((r) => console.log('  - ' + r.n + (r.d ? ' :: ' + r.d : '')));
  }
  console.log('\nScreenshots: ' + SHOTS);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
