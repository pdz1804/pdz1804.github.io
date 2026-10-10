/* =============================================================================
   DOSSIER UI — behaviour only: theme button, scroll-spy, reveal, skill bars,
   typed role, progress bar. Content never lives here.

   DossierUI.create(ctx) returns { refresh }. render.js calls refresh() after
   every (re)render so freshly added entries get the same treatment. Everything
   that starts something goes through ctx.life, so unmounting stops it all.
============================================================================= */

(function (window, document) {
  'use strict';

  var REVEAL = '.role,.sg,.ac,.proj,.honor,.edu,.cert,.stat,.ccard,.company';

  function create(ctx, root) {
    var life = ctx.life;
    var html = document.documentElement;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* The reveal animation is only defined for pages that have JS (.js class). */
    html.classList.add('js');
    life.cleanup(function () { html.classList.remove('js'); });

    /* Theme: the button belongs to the rail; storage and <html data-theme> belong
       to the shared theme service, so both designs agree on the saved choice. */
    life.on(root, 'click', function (e) {
      if (e.target.closest && e.target.closest('#theme')) ctx.theme.toggle();
    });

    /* A missing image hides itself; the container keeps its caption and shape. */
    life.on(root, 'error', function (e) {
      if (e.target && e.target.tagName === 'IMG') e.target.classList.add('img-missing');
    }, true);

    /* ── Reveal + skill bars ─────────────────────────────────────────────── */
    function fillBars(el) {
      Array.prototype.forEach.call(el.querySelectorAll('.sk-bar i'), function (b) {
        b.style.width = b.getAttribute('data-w') + '%';
      });
    }

    var io = ('IntersectionObserver' in window)
      ? life.observe(new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            en.target.classList.add('in');
            fillBars(en.target);
            io.unobserve(en.target);
          });
        }, { rootMargin: '0px 0px -6% 0px' }))
      : null;

    var safetyTimer = 0;

    function refresh() {
      // A re-render replaces the DOM, so drop every old observation and watch only what is live and still hidden.
      if (io) io.disconnect();
      window.clearTimeout(safetyTimer);
      Array.prototype.forEach.call(root.querySelectorAll(REVEAL), function (el) {
        if (el.classList.contains('in')) return;
        if (!io || reduce) { el.classList.add('in'); fillBars(el); }
        else { el.classList.add('rv'); io.observe(el); }
      });
      // Safety net: nothing may stay hidden if an observer callback never fires.
      safetyTimer = life.timeout(function () {
        Array.prototype.forEach.call(root.querySelectorAll('.rv:not(.in)'), function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight * 1.2) { el.classList.add('in'); fillBars(el); }
        });
      }, 1200);
      spy();
    }

    /* ── Scroll-spy: highlight the rail link of the section in view ──────── */
    var spyIO = null;
    function spy() {
      if (spyIO) spyIO.disconnect();
      var links = Array.prototype.slice.call(root.querySelectorAll('[data-nav]'));
      if (!('IntersectionObserver' in window) || !links.length) return;
      spyIO = life.observe(new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) {
            if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-35% 0px -55% 0px' }));
      links.forEach(function (a) {
        var t = root.querySelector(a.getAttribute('href'));
        if (t) spyIO.observe(t);
      });
    }

    /* ── Progress bar + back-to-top ──────────────────────────────────────── */
    var bar = root.querySelector('#progress'), top = root.querySelector('#to-top');
    function onScroll() {
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(h.scrollTop / max, 1) : 0) + ')';
      if (top) top.classList.toggle('show', h.scrollTop > 700);
    }
    life.on(window, 'scroll', onScroll, { passive: true });
    onScroll();
    if (top) life.on(top, 'click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

    /* ── Typed role: cycles profile.typedRoles; static text with reduced motion ── */
    (function typed() {
      var el = root.querySelector('#typed'), roles = ctx.data.profile.typedRoles;
      if (!el || !roles || !roles.length) return;
      el.textContent = roles[0];
      if (reduce || roles.length < 2) return;
      var r = 0, c = roles[0].length, del = true;
      (function tick() {
        if (del) { c--; if (c <= 0) { del = false; r = (r + 1) % roles.length; } }
        else { c++; if (c >= roles[r].length) { del = true; life.timeout(tick, 1800); return; } }
        el.textContent = roles[r].slice(0, Math.max(c, 0)) || ' ';
        life.timeout(tick, del ? 38 : 70);
      })();
    })();

    return { refresh: refresh };
  }

  window.DossierUI = { create: create };

})(window, document);
