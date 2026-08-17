/* =============================================================================
   Service-worker eviction check (flow P1)
   =============================================================================
   Serves the real pre-rewrite build on a port, lets a browser install the real
   Workbox service worker from it, then swaps the same origin over to the new
   build — exactly what a returning visitor experiences after a deploy.

   Prepare the two trees first, then run:

       git worktree add --detach .swtest-old 9b18675
       mkdir .swtest-new && git archive HEAD | tar -x -C .swtest-new
       npm install --no-save playwright
       node tools/verify-sw-eviction.js
       git worktree remove --force .swtest-old && rm -rf .swtest-new

   Delete this script once traffic from pre-rewrite visitors has aged out and
   the tombstone service-worker.js is removed.
============================================================================= */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8210;
const OLD = path.join(__dirname, '..', '.swtest-old');
const NEW = path.join(__dirname, '..', '.swtest-new');
let root = OLD;

const TYPES = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.xml': 'application/xml',
  '.txt': 'text/plain', '.ico': 'image/x-icon', '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/html' });
    return res.end('<h1>404</h1>');
  }
  res.writeHead(200, {
    'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
    'cache-control': 'no-cache',            // mirrors GitHub Pages for the SW
  });
  fs.createReadStream(file).pipe(res);
});

const res = [];
const ck = (n, ok, d) => res.push({ n, ok: !!ok, d: d == null ? '' : String(d) });

(async () => {
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  const BASE = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const p = await ctx.newPage();

  /* ── Phase 1: a visitor arrives on the OLD site ── */
  root = OLD;
  await p.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);

  // The pre-rewrite commit shipped the hand-written June build plus the leftover
  // CRA bundle; identify it by the inlined EXP_DATA and the absence of the new
  // data-render mount points.
  const isOld = await p.evaluate(async () => {
    const html = document.documentElement.innerHTML;
    const cra = await fetch('/static/js/main.9b3fbca6.chunk.js').then(r => r.status).catch(() => 0);
    return { expData: /EXP_DATA/.test(html), mounts: !!document.querySelector('[data-render]'), cra };
  });
  ck('Phase 1: pre-rewrite build served (inlined data, no mount points)',
     isOld.expData && !isOld.mounts, `EXP_DATA=${isOld.expData}, data-render=${isOld.mounts}`);
  ck('Phase 1: leftover CRA bundle still reachable', isOld.cra === 200, 'HTTP ' + isOld.cra);

  const installed = await p.evaluate(async () => {
    const reg = await navigator.serviceWorker.register('/service-worker.js');
    await navigator.serviceWorker.ready;
    // give Workbox time to precache
    await new Promise((r) => setTimeout(r, 3000));
    return {
      scriptURL: reg.active && reg.active.scriptURL,
      caches: await caches.keys(),
      controlled: !!navigator.serviceWorker.controller,
    };
  });
  ck('Phase 1: real Workbox worker installed and active',
     !!installed.scriptURL, installed.scriptURL);
  ck('Phase 1: Workbox precache populated',
     installed.caches.some((c) => /workbox|precache/i.test(c)),
     installed.caches.join(', ') || 'none');

  // Reload so the old worker is actually controlling the page.
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const controlling = await p.evaluate(() => !!navigator.serviceWorker.controller);
  ck('Phase 1: old worker is controlling navigations', controlling);

  const cachedCount = await p.evaluate(async () => {
    let n = 0;
    for (const k of await caches.keys()) n += (await (await caches.open(k)).keys()).length;
    return n;
  });
  ck('Phase 1: old build cached for offline serving', cachedCount > 0, cachedCount + ' cached entries');

  /* ── Phase 2: the deploy happens — same origin, new files ── */
  root = NEW;

  // A returning visitor simply navigates again.
  await p.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(6000);
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(4000);

  const after = await p.evaluate(async () => ({
    regs: (await navigator.serviceWorker.getRegistrations()).length,
    caches: await caches.keys(),
    hasNewMarkup: !!document.querySelector('[data-render="experience"]'),
    hasOldBundle: /masterPortfolio/.test(document.documentElement.innerHTML),
    title: document.title,
    certBtn: (document.getElementById('certs-more-btn') || {}).textContent || '',
  }));

  ck('Phase 2: tombstone unregistered the old worker', after.regs === 0, after.regs + ' registration(s) left');
  ck('Phase 2: every cache dropped', after.caches.length === 0, after.caches.join(', ') || 'none');
  ck('Phase 2: visitor now sees the NEW site', after.hasNewMarkup && !after.hasOldBundle, after.title);
  ck('Phase 2: new content actually rendered', /Show all \d+ certifications/.test(after.certBtn), after.certBtn.trim());

  await browser.close();
  server.close();

  const bad = res.filter((x) => !x.ok);
  res.forEach((x) => console.log(`${x.ok ? 'PASS' : 'FAIL'}  ${x.n}${x.d ? '  [' + x.d + ']' : ''}`));
  console.log(`\n${res.length - bad.length}/${res.length} service-worker eviction checks passed`);
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR:', e); server.close(); process.exit(2); });
