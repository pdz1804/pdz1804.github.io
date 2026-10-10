/* =============================================================================
   Sync identity and URLs from data.js into the files that cannot read it.
   =============================================================================
       node tools/sync-meta.js            check: exit 1 if anything has drifted
       node tools/sync-meta.js --write    rewrite the drifted files

   Search engines and link previews read static markup, not JavaScript, so the
   canonical URL, Open Graph tags, JSON-LD, sitemap, robots, web manifest and the
   404 title have to be real text in real files. This keeps them equal to
   data.js (profile.* and site.*) so changing the owner or the domain is one
   edit plus one command.

   It does NOT touch the hand-written descriptions: the meta description, the
   Open Graph description and the noscript note are copy, not identity.
============================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const WRITE = process.argv.includes('--write');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', 'js', 'data.js'), 'utf8'), sandbox);
const D = sandbox.window.PORTFOLIO;
const p = D.profile;
const origin = D.site.url.replace(/\/?$/, '/');
const image = origin + D.site.ogImage.replace(/^\//, '');

/* Values go into HTML attributes, JSON strings or XML text, and each context
   needs its own escaping, otherwise a name containing a quote or an ampersand
   would corrupt manifest.json or the JSON-LD block. */
const esc = {
  html: (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  json: (v) => JSON.stringify(String(v)).slice(1, -1),
  // JSON-LD sits inside a <script>: also keep "</script>" from ever appearing.
  jsonld: (v) => JSON.stringify(String(v)).slice(1, -1).replace(/</g, '\\u003c'),
};

/* [file, description, regex, build(match) -> replacement]. Each regex must match once.
   Patterns capture the text before and after the value as groups 1 and 2. */
const around = (kind, value) => (m) => m[1] + esc[kind](value) + (m[2] || '');
const quoted = (kind, value) => () => '"' + esc[kind](value) + '"';

const RULES = [
  ['index.html', 'canonical URL', /(<link rel="canonical" href=")[^"]*(")/, around('html', origin)],
  ['index.html', 'og:url', /(<meta property="og:url"\s+content=")[^"]*(")/, around('html', origin)],
  ['index.html', 'og:image', /(<meta property="og:image"\s+content=")[^"]*(")/, around('html', image)],
  ['index.html', 'twitter:image', /(<meta name="twitter:image"\s+content=")[^"]*(")/, around('html', image)],
  ['index.html', 'JSON-LD name', /("name": ")[^"]*(",\s*\n\s*"alternateName")/, around('jsonld', p.fullName)],
  ['index.html', 'JSON-LD alternateName', /("alternateName": ")[^"]*(")/, around('jsonld', p.displayName)],
  ['index.html', 'JSON-LD jobTitle', /("jobTitle": ")[^"]*(")/, around('jsonld', p.title)],
  ['index.html', 'JSON-LD employer', /("worksFor": \{ "@type": "Organization", "name": ")[^"]*(")/, around('jsonld', p.company)],
  ['index.html', 'JSON-LD url', /("url": ")[^"]*(",\s*\n\s*"image")/, around('jsonld', origin)],
  ['index.html', 'JSON-LD image', /("image": ")[^"]*(",\s*\n\s*"email")/, around('jsonld', image)],
  ['index.html', 'JSON-LD email', /("email": ")[^"]*(")/, around('jsonld', p.email)],
  ['index.html', 'JSON-LD GitHub', /"https:\/\/github\.com\/[^"]*"/, quoted('jsonld', p.github)],
  ['index.html', 'JSON-LD LinkedIn', /"https:\/\/www\.linkedin\.com\/[^"]*"/, quoted('jsonld', p.linkedin)],

  ['projects.html', 'canonical URL', /(<link rel="canonical" href=")[^"]*(")/, around('html', origin + 'projects.html')],
  ['projects.html', 'og:url', /(<meta property="og:url"\s+content=")[^"]*(")/, around('html', origin + 'projects.html')],
  ['projects.html', 'og:image', /(<meta property="og:image"\s+content=")[^"]*(")/, around('html', image)],
  ['projects.html', 'twitter:image', /(<meta name="twitter:image"\s+content=")[^"]*(")/, around('html', image)],

  ['sitemap.xml', 'landing page', /(<loc>)[^<]*(<\/loc>(?:(?!<loc>)[\s\S])*?<priority>1\.0)/, around('html', origin)],
  ['sitemap.xml', 'projects page', /(<loc>)[^<]*projects\.html(<\/loc>)/, around('html', origin + 'projects.html')],
  ['robots.txt', 'sitemap line', /(Sitemap: ).*/, (m) => m[1] + origin + 'sitemap.xml'],

  ['manifest.json', 'name', /("name": ")[^"]*(")/, around('json', `${p.displayName} — ${p.title}`)],
  ['manifest.json', 'short_name', /("short_name": ")[^"]*(")/, around('json', p.displayName)],

  ['404.html', 'title', /(<title>)[^<]*(<\/title>)/, around('html', `Page not found — ${p.displayName}`)],
];

let drift = 0;
const files = {};
for (const [file, label, re, build] of RULES) {
  if (!(file in files)) files[file] = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const text = files[file];
  const m = text.match(re);
  if (!m) { console.error(`FAIL  ${file}: pattern for "${label}" not found (the file changed shape; update tools/sync-meta.js)`); process.exit(2); }
  const next = text.replace(re, (...m) => build(m));
  if (next !== text) {
    drift++;
    console.log(`${WRITE ? 'fix ' : 'DRIFT'}  ${file}: ${label}`);
    files[file] = next;
  }
}

if (WRITE) {
  Object.keys(files).forEach((f) => fs.writeFileSync(path.join(ROOT, f), files[f]));
  console.log(drift ? `Rewrote ${drift} value(s).` : 'Already in sync.');
  process.exit(0);
}

console.log(drift ? `\n${drift} value(s) differ from data.js. Run: node tools/sync-meta.js --write` : 'Meta files match data.js.');
process.exit(drift ? 1 : 0);
