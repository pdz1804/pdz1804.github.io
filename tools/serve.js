/* =============================================================================
   Tiny static file server for the test suites (and for looking at the site).
   =============================================================================
       node tools/serve.js [port] [dir]        default: 8099, the repo root

   Python's http.server answers one request at a time over HTTP/1.0, which makes
   WebKit crawl (half a second per file). This one is concurrent, keeps
   connections alive and sends no-cache headers, like GitHub Pages does for the
   suites' purposes. No dependencies.
============================================================================= */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2] || process.env.PORT || '8099', 10);
const ROOT = path.resolve(process.argv[3] || path.join(__dirname, '..'));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const nf = path.join(ROOT, '404.html');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8', connection: 'keep-alive' });
    return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : '<h1>404</h1>');
  }
  res.writeHead(200, {
    'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });
  fs.createReadStream(file).pipe(res);
});

server.keepAliveTimeout = 30000;
server.listen(PORT, '127.0.0.1', () => console.log(`Serving ${ROOT} at http://127.0.0.1:${PORT}/`));
