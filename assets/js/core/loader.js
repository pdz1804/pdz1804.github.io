/* =============================================================================
   LOADER — mounts a design into #app and switches between designs live.
   =============================================================================
   Public API (window.Portfolio):

     mount(id)             first mount, called once at the end of <body>
     switchDesign(id, o)   swap designs without a reload; o.persist saves the
                           choice, o.source labels it for tests ("picker", ...)
     rerender()            unmount + mount the current design again (used by the
                           injection tests after they edit window.PORTFOLIO)
     current()             id of the mounted design, or null
     data, levels, theme   shared inputs every design receives through ctx

   A design is a folder under designs/ that registers
       PortfolioDesigns.implement(id, { mount(root, ctx), unmount?() })
   and is described by a manifest in designs/registry.js (css[], js[], pages[]).

   Safety net: the server-rendered skeleton inside #app is a complete, styled
   Classic page. If a design fails to load (or takes more than LOAD_TIMEOUT_MS)
   the skeleton is put back, Classic mounts, and a banner says what happened,
   so a broken design can never leave the visitor with a blank page.

   Assets load through <script>/<link> elements chained with promises, never
   ES modules or fetch(), so the site keeps working when opened from file://.
============================================================================= */

(function (window, document) {
  'use strict';

  var R = window.PortfolioDesigns;
  var B = window.PortfolioBoot;
  var VM = window.PortfolioVM;
  var LOAD_TIMEOUT_MS = 5000;

  var app = document.getElementById('app');
  var page = (app && app.getAttribute('data-page')) || 'home';
  var root = document.documentElement;

  var state = {
    id: null,           // design currently mounted
    life: null,         // its lifecycle helper
    token: 0,           // bumped per switch so a stale async result is ignored
    skeleton: null,     // pristine Classic markup, captured before anything clears #app
  };

  /* ── Lifecycle helper handed to every design ──────────────────────────── */
  /* Everything a design starts (listeners, timers, rAF loops, observers) goes
     through here so one dispose() undoes it all and a switch leaves nothing
     running behind. */
  function createLife() {
    var undo = [];
    var dead = false;

    function add(fn) { if (dead) { fn(); } else { undo.push(fn); } }

    var life = {
      on: function (target, type, fn, opts) {
        if (dead) return;
        target.addEventListener(type, fn, opts);
        undo.push(function () { target.removeEventListener(type, fn, opts); });
      },
      timeout: function (fn, ms) {
        if (dead) return 0;
        var id = window.setTimeout(function () { if (!dead) fn(); }, ms);
        undo.push(function () { window.clearTimeout(id); });
        return id;
      },
      interval: function (fn, ms) {
        if (dead) return 0;
        var id = window.setInterval(function () { if (!dead) fn(); }, ms);
        undo.push(function () { window.clearInterval(id); });
        return id;
      },
      raf: function (fn) {
        if (dead) return 0;
        var id = window.requestAnimationFrame(function (t) { if (!dead) fn(t); });
        undo.push(function () { window.cancelAnimationFrame(id); });
        return id;
      },
      /* A never-ending frame loop. Return false from fn to stop it. */
      loop: function (fn) {
        var id = 0;
        function tick(t) {
          if (dead) return;
          if (fn(t) === false) return;
          id = window.requestAnimationFrame(tick);
        }
        if (dead) return;
        id = window.requestAnimationFrame(tick);
        undo.push(function () { window.cancelAnimationFrame(id); });
      },
      /* Register any observer; it is disconnected on dispose. */
      observe: function (observer) {
        undo.push(function () { observer.disconnect(); });
        return observer;
      },
      cleanup: add,
      dispose: function () {
        if (dead) return;
        dead = true;
        var fns = undo.splice(0).reverse();
        fns.forEach(function (fn) { try { fn(); } catch (e) { /* keep unwinding */ } });
      },
    };
    return life;
  }

  /* ── Asset loading ────────────────────────────────────────────────────── */

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.setAttribute('data-design-js', '');
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* A design's stylesheet is fetched while the old design is still on screen, so
     it is added with media="not all" (downloaded, not applied) and switched on
     by activateStyles() the moment the old design is gone. Without this the new
     CSS would restyle the old page for a moment. */
  function loadStyle(id, href) {
    return new Promise(function (resolve, reject) {
      var existing = document.head.querySelector('link[data-design-css="' + id + '"][href="' + href + '"]');
      if (existing) { resolve(existing); return; }
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      l.media = 'not all';
      l.setAttribute('data-design-css', id);
      l.onload = function () { resolve(l); };
      l.onerror = function () { reject(new Error('Could not load ' + href)); };
      document.head.appendChild(l);
    });
  }

  function activateStyles(id) {
    var links = document.head.querySelectorAll('link[data-design-css="' + id + '"]');
    for (var i = 0; i < links.length; i++) links[i].removeAttribute('media');
  }

  /* Web fonts are an enhancement: they are requested but never awaited, so an
     offline visitor still gets the design (in its fallback fonts). */
  function requestFonts(id, urls) {
    (urls || []).forEach(function (href) {
      if (document.head.querySelector('link[data-design-css="' + id + '"][href="' + href + '"]')) return;
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      l.setAttribute('data-design-css', id);
      document.head.appendChild(l);
    });
  }

  var scriptsLoaded = {};

  function loadAssets(manifest) {
    requestFonts(manifest.id, manifest.fonts);
    var styles = (manifest.css || []).map(function (href) { return loadStyle(manifest.id, href); });
    var chain = Promise.all(styles);
    if (!scriptsLoaded[manifest.id] && !R.impl(manifest.id)) {
      chain = chain.then(function () {
        return (manifest.js || []).reduce(function (p, src) {
          return p.then(function () { return loadScript(src); });
        }, Promise.resolve());
      }).then(function () { scriptsLoaded[manifest.id] = true; });
    }
    return chain;
  }

  function removeStyles(id) {
    var links = document.head.querySelectorAll('link[data-design-css="' + id + '"]');
    for (var i = 0; i < links.length; i++) links[i].parentNode.removeChild(links[i]);
  }

  /* ── Position and focus ───────────────────────────────────────────────── */

  /* Shared section ids are the contract that lets a switch keep your place. */
  var SECTION_IDS = ['hero', 'about', 'experience', 'skills', 'education', 'honors',
                     'projects', 'certifications', 'contact'];

  function currentSectionId() {
    var best = null;
    for (var i = 0; i < SECTION_IDS.length; i++) {
      var el = document.getElementById(SECTION_IDS[i]);
      if (!el) continue;
      var r = el.getBoundingClientRect();
      if (r.bottom > 120) { best = SECTION_IDS[i]; break; }
    }
    return best;
  }

  function restorePosition(sectionId) {
    if (!sectionId) { window.scrollTo(0, 0); return; }
    var el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  /* ── Banner ───────────────────────────────────────────────────────────── */

  function showBanner(message) {
    var old = document.querySelector('.pds-banner');
    if (old) old.parentNode.removeChild(old);
    var b = document.createElement('div');
    b.className = 'pds-banner';
    b.setAttribute('role', 'status');
    b.textContent = message;
    var close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Dismiss';
    close.addEventListener('click', function () { if (b.parentNode) b.parentNode.removeChild(b); });
    b.appendChild(close);
    document.body.appendChild(b);
  }

  /* ── Mounting ─────────────────────────────────────────────────────────── */

  function buildContext(life) {
    var data = window.PORTFOLIO;
    var levels = window.SKILL_LEVELS;
    return {
      data: data,
      levels: levels,
      vm: VM.build(data, levels, new Date()),
      theme: B.theme,
      life: life,
      page: page,
      app: app,
      /* Run fn once the window has loaded (now, if it already has). */
      ready: function (fn) {
        if (document.readyState === 'complete') life.timeout(fn, 0);
        else life.on(window, 'load', fn, { once: true });
      },
    };
  }

  /* `next` is the design about to mount: when it is the same design (a rerender)
     its stylesheet stays, otherwise the page would flash unstyled. */
  function unmountCurrent(next) {
    if (!state.id) return;
    var impl = R.impl(state.id);
    try { if (impl && impl.unmount) impl.unmount(); } catch (e) { /* keep going */ }
    if (state.life) state.life.dispose();
    if (state.id !== next) removeStyles(state.id);
    state.id = null;
    state.life = null;
  }

  /* Put the design's markup in #app and run it. */
  function runDesign(id) {
    var impl = R.impl(id);
    if (!impl || typeof impl.mount !== 'function') throw new Error('Design "' + id + '" did not register');

    if (id === 'classic') {
      if (state.skeleton !== null && app.getAttribute('data-mounted')) app.innerHTML = state.skeleton;
    } else {
      app.innerHTML = '';
    }
    app.setAttribute('data-mounted', id);
    activateStyles(id);

    var life = createLife();
    state.life = life;
    state.id = id;
    impl.mount(app, buildContext(life));
  }

  function settle(id) {
    root.setAttribute('data-design', id);
    root.removeAttribute('data-design-loading');
    root.setAttribute('data-design-ready', id);
  }

  /* Falls back to Classic, whatever went wrong. */
  function fallbackToClassic(reason, requested) {
    // eslint-disable-next-line no-console
    console.warn('[portfolio] ' + reason);
    unmountCurrent();
    var manifest = R.get('classic');
    return loadAssets(manifest).then(function () {
      runDesign('classic');
      settle('classic');
      var label = (R.get(requested) || {}).name || requested;
      showBanner('The "' + label + '" design could not be loaded, so you are seeing Classic.');
    }).catch(function (err) {
      // Even Classic failed: reveal the static skeleton, which is a full page.
      // eslint-disable-next-line no-console
      console.error('[portfolio] ' + err.message);
      if (state.skeleton !== null) app.innerHTML = state.skeleton;
      app.removeAttribute('data-mounted');
      root.removeAttribute('data-design-loading');
      root.setAttribute('data-design', 'classic');
    });
  }

  /* Pages a design cannot render send the visitor somewhere that can. */
  function redirectFor(manifest) {
    if (!manifest.pages || manifest.pages.indexOf(page) >= 0) return false;
    var target = manifest.redirect && manifest.redirect[page];
    if (!target) return false;
    var join = target.indexOf('?') >= 0 ? '&' : '?';
    var hash = '';
    var h = target.indexOf('#');
    if (h >= 0) { hash = target.slice(h); target = target.slice(0, h); }
    window.location.replace(target + join + 'design=' + encodeURIComponent(manifest.id) + hash);
    return true;
  }

  /* Core of every mount and switch. Resolves once the design is on screen. */
  function show(id, opts) {
    opts = opts || {};
    var token = ++state.token;
    var manifest = R.get(id);
    if (!manifest) return fallbackToClassic('Unknown design "' + id + '"', id);
    if (redirectFor(manifest)) return Promise.resolve();

    var section = opts.keepPosition ? currentSectionId() : null;
    var timedOut = false;

    var timer = window.setTimeout(function () {
      timedOut = true;
      if (token === state.token) fallbackToClassic('Design "' + id + '" timed out', id);
    }, LOAD_TIMEOUT_MS);

    return loadAssets(manifest).then(function () {
      if (timedOut || token !== state.token) return;
      window.clearTimeout(timer);
      var previous = state.id;
      unmountCurrent(id);
      try {
        runDesign(id);
      } catch (err) {
        return fallbackToClassic(err.message, id);
      }
      settle(id);
      if (opts.keepPosition) restorePosition(section);
      if (previous !== id) {
        window.dispatchEvent(new CustomEvent('portfolio:designchange', { detail: { id: id, previous: previous } }));
      }
    }).catch(function (err) {
      window.clearTimeout(timer);
      if (timedOut || token !== state.token) return;
      return fallbackToClassic(err.message, id);
    });
  }

  /* ── Public API ───────────────────────────────────────────────────────── */

  function setQuery(id) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('design', id);
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) { /* file:// in some browsers */ }
  }

  window.Portfolio = {
    data: window.PORTFOLIO,
    levels: window.SKILL_LEVELS,
    theme: B.theme,
    page: page,

    current: function () { return state.id; },

    mount: function (id) {
      state.skeleton = app.getAttribute('data-static-design') === 'classic' ? app.innerHTML : null;
      /* The skeleton is already in the DOM, so classic's first mount reuses it. */
      if (id === 'classic' && state.skeleton !== null) app.setAttribute('data-mounted', 'classic-static');
      return show(id).then(function () {
        if (app.getAttribute('data-mounted') === 'classic-static') app.setAttribute('data-mounted', 'classic');
      });
    },

    switchDesign: function (id, opts) {
      opts = opts || {};
      if (!R.get(id)) return Promise.resolve();
      if (id === state.id && !opts.force) return Promise.resolve();
      return show(id, { keepPosition: true }).then(function () {
        if (state.id !== id) return;
        setQuery(id);
        if (opts.persist) B.write(B.keys.design, id);
      });
    },

    rerender: function () {
      var id = state.id || B.design;
      /* Rebuilding classic starts from the pristine skeleton again. */
      return show(id, { keepPosition: true });
    },
  };

  /* ── Start ────────────────────────────────────────────────────────────── */

  if (app) window.Portfolio.mount(B.design);
  else root.removeAttribute('data-design-loading');

})(window, document);
