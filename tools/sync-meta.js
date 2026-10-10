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

/* [file, description, regex, replacement]. Each regex must match exactly once. */
const RULES = [
  ['index.html', 'canonical URL', /(<link rel="canonical" href=")[^"]*(")/, `$1${origin}$2`],
  ['index.html', 'og:url', /(<meta property="og:url"\s+content=")[^"]*(")/, `$1${origin}$2`],
  ['index.html', 'og:image', /(<meta property="og:image"\s+content=")[^"]*(")/, `$1${image}$2`],
  ['index.html', 'twitter:image', /(<meta name="twitter:image"\s+content=")[^"]*(")/, `$1${image}$2`],
  ['index.html', 'JSON-LD name', /("name": ")[^"]*(",\s*\n\s*"alternateName")/, `$1${p.fullName}$2`],
  ['index.html', 'JSON-LD alternateName', /("alternateName": ")[^"]*(")/, `$1${p.displayName}$2`],
  ['index.html', 'JSON-LD jobTitle', /("jobTitle": ")[^"]*(")/, `$1${p.title}$2`],
  ['index.html', 'JSON-LD employer', /("worksFor": \{ "@type": "Organization", "name": ")[^"]*(")/, `$1${p.company}$2`],
  ['index.html', 'JSON-LD url', /("url": ")[^"]*(",\s*\n\s*"image")/, `$1${origin}$2`],
  ['index.html', 'JSON-LD image', /("image": ")[^"]*(",\s*\n\s*"email")/, `$1${image}$2`],
  ['index.html', 'JSON-LD email', /("email": ")[^"]*(")/, `$1${p.email}$2`],
  ['index.html', 'JSON-LD GitHub', /"https:\/\/github\.com\/[^"]*"/, `"${p.github}"`],
  ['index.html', 'JSON-LD LinkedIn', /"https:\/\/www\.linkedin\.com\/[^"]*"/, `"${p.linkedin}"`],

  ['projects.html', 'canonical URL', /(<link rel="canonical" href=")[^"]*(")/, `$1${origin}projects.html$2`],
  ['projects.html', 'og:url', /(<meta property="og:url"\s+content=")[^"]*(")/, `$1${origin}projects.html$2`],
  ['projects.html', 'og:image', /(<meta property="og:image"\s+content=")[^"]*(")/, `$1${image}$2`],
  ['projects.html', 'twitter:image', /(<meta name="twitter:image"\s+content=")[^"]*(")/, `$1${image}$2`],

  ['sitemap.xml', 'landing page', /(<loc>)[^<]*(<\/loc>(?:(?!<loc>)[\s\S])*?<priority>1\.0)/, `$1${origin}$2`],
  ['sitemap.xml', 'projects page', /(<loc>)[^<]*projects\.html(<\/loc>)/, `$1${origin}projects.html$2`],
  ['robots.txt', 'sitemap line', /(Sitemap: ).*/, `$1${origin}sitemap.xml`],

  ['manifest.json', 'name', /("name": ")[^"]*(")/, `$1${p.displayName} — ${p.title}$2`],
  ['manifest.json', 'short_name', /("short_name": ")[^"]*(")/, `$1${p.displayName}$2`],

  ['404.html', 'title', /(<title>)[^<]*(<\/title>)/, `$1Page not found — ${p.displayName}$2`],
];

let drift = 0;
const files = {};
for (const [file, label, re, replacement] of RULES) {
  if (!(file in files)) files[file] = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const text = files[file];
  const m = text.match(re);
  if (!m) { console.error(`FAIL  ${file}: pattern for "${label}" not found (the file changed shape; update tools/sync-meta.js)`); process.exit(2); }
  const next = text.replace(re, replacement);
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
