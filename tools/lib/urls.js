/* =============================================================================
   URL builder for the test suites.
   =============================================================================
   Every suite reaches pages through here so that a design is always requested
   explicitly (?design=<id>) instead of depending on whatever the default is.
   ?switcher=0 keeps the picker out of screenshots and overflow checks.
============================================================================= */

'use strict';

const PAGES = { home: 'index.html', projects: 'projects.html' };

function pageUrl(base, page, opts) {
  opts = opts || {};
  const params = new URLSearchParams();
  if (opts.design) params.set('design', opts.design);
  if (opts.switcher != null) params.set('switcher', opts.switcher ? '1' : '0');
  Object.keys(opts.extra || {}).forEach((k) => params.set(k, opts.extra[k]));
  const q = params.toString();
  return base.replace(/\/$/, '') + '/' + (PAGES[page] || page) + (q ? '?' + q : '') + (opts.hash || '');
}

module.exports = { pageUrl, PAGES };
