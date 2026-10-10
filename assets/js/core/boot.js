/* =============================================================================
   BOOT — runs in <head>, before first paint.
   =============================================================================
   Decides which design to show and which theme to use, and records the choice
   on <html> so CSS can react before any design code has loaded:

     data-theme="dark|light"      resolved theme
     data-design="<id>"           resolved design
     data-design-loading          set until the design has mounted (hides #app)

   Design: ?design=<id>  ->  saved choice (nqp-design)  ->  site.defaultDesign.
   A ?design= link is a one-off: it is NOT saved, so opening somebody's shared
   link never changes what you see next time. Only the picker saves.

   Theme: saved choice (nqp-theme)  ->  prefers-color-scheme  ->  dark.

   Needs data.js and designs/registry.js to have run. ES5 on purpose.
============================================================================= */

(function (window, document) {
  'use strict';

  var root = document.documentElement;
  var D = window.PORTFOLIO;
  var R = window.PortfolioDesigns;

  var THEME_KEY = 'nqp-theme';
  var DESIGN_KEY = 'nqp-design';

  function read(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  /* ── Theme service (shared by every design) ───────────────────────────── */

  var themeListeners = [];

  function resolveTheme() {
    var saved = read(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }

  var theme = {
    get: function () { return root.getAttribute('data-theme') || 'dark'; },
    set: function (next) {
      root.setAttribute('data-theme', next);
      write(THEME_KEY, next);
      themeListeners.slice().forEach(function (fn) { fn(next); });
    },
    toggle: function () { theme.set(theme.get() === 'dark' ? 'light' : 'dark'); },
    /* Returns an unsubscribe function. */
    onChange: function (fn) {
      themeListeners.push(fn);
      return function () {
        var i = themeListeners.indexOf(fn);
        if (i >= 0) themeListeners.splice(i, 1);
      };
    },
  };

  root.setAttribute('data-theme', resolveTheme());

  /* ── Design choice ────────────────────────────────────────────────────── */

  var params = new URLSearchParams(window.location.search);
  var visible = R.list().map(function (m) { return m.id; });
  var site = (D && D.site) || {};
  var fallback = visible.indexOf(site.defaultDesign) >= 0 ? site.defaultDesign : visible[0];

  function valid(id) { return !!id && visible.indexOf(id) >= 0; }

  var queried = params.get('design');
  var saved = read(DESIGN_KEY);
  if (saved && !valid(saved)) saved = null;           // a design that was removed

  var chosen = valid(queried) ? queried : (saved || fallback);

  root.setAttribute('data-design', chosen);
  root.setAttribute('data-design-loading', '');

  /* Hide #app while a design loads, but only because JS is running: without JS
     this attribute is never set, so the static skeleton stays visible. */
  var style = document.createElement('style');
  style.textContent = 'html[data-design-loading] #app{visibility:hidden}';
  document.head.appendChild(style);

  /* The static <link data-design-css="classic"> is in the HTML so no-JS visitors
     get a styled page. Any other design drops it here, before first paint. */
  if (chosen !== 'classic') {
    var staticCss = document.querySelectorAll('link[data-design-css="classic"]');
    for (var i = 0; i < staticCss.length; i++) staticCss[i].parentNode.removeChild(staticCss[i]);
  }

  window.PortfolioBoot = {
    design: chosen,
    fallback: fallback,
    queried: queried,
    theme: theme,
    keys: { theme: THEME_KEY, design: DESIGN_KEY },
    read: read,
    write: write,
  };
  window.PortfolioTheme = theme;

})(window, document);
