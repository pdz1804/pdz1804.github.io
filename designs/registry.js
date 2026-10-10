/* =============================================================================
   DESIGN REGISTRY — the one place a design is "installed".
   =============================================================================
   Each entry is the manifest the page needs BEFORE the design's own code has
   loaded: what to call it, which stylesheets and scripts to fetch, which pages
   it can render. The implementation (design.js) registers itself afterwards
   through PortfolioDesigns.implement(id, { mount }).

   Load order in <head> (parser-blocking, so everything is ready before paint):
       data.js  ->  designs/registry.js  ->  assets/js/core/boot.js

   To add a design: run `node tools/new-design.js <id> "<Name>"`, which creates
   the folder and appends the entry below.

   Paths are relative to the HTML page (index.html / projects.html), never
   absolute, so the site also works from file:// and from a project sub-path.
============================================================================= */

(function (window) {
  'use strict';

  var manifests = [];
  var implementations = {};

  var api = {
    /* Register a manifest. Order of calls is the display order in the picker. */
    add: function (manifest) {
      manifests.push(manifest);
      return api;
    },

    /* A design's own code calls this once its scripts have loaded. */
    implement: function (id, impl) {
      implementations[id] = impl;
    },

    ids: function () {
      return manifests.map(function (m) { return m.id; });
    },

    /* Manifests, filtered and ordered by data.js `site.designs` when present. */
    list: function () {
      var site = window.PORTFOLIO && window.PORTFOLIO.site;
      var allow = site && site.designs;
      if (!allow || !allow.length) return manifests.slice();
      return allow
        .map(function (id) { return api.get(id); })
        .filter(Boolean);
    },

    get: function (id) {
      for (var i = 0; i < manifests.length; i++) if (manifests[i].id === id) return manifests[i];
      return null;
    },

    impl: function (id) { return implementations[id] || null; },
  };

  window.PortfolioDesigns = api;

  /* ── Installed designs ─────────────────────────────────────────────────── */

  api.add({
    id: 'classic',
    name: 'Classic',
    description: 'Centred sections, animated hero, particle field',
    pages: ['home', 'projects'],
    // The stylesheet stays at its historical path because 404.html links it directly.
    css: ['assets/css/main.css'],
    js: [
      'designs/classic/render.js',
      'designs/classic/ui.js',
      'designs/classic/design.js',
    ],
  });

  api.add({
    id: 'dossier',
    name: 'Dossier',
    description: 'Profile rail, section index with live counts, filterable lists',
    pages: ['home'],
    // The landing page is the whole design, so its projects page is the #projects section.
    redirect: { projects: 'index.html#projects' },
    // Web fonts are requested but never awaited (see loader.js).
    fonts: ['https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap'],
    css: ['designs/dossier/main.css'],
    js: [
      'designs/dossier/derive.js',
      'designs/dossier/render.js',
      'designs/dossier/ui.js',
      'designs/dossier/design.js',
    ],
  });

})(window);
