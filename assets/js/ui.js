/* =============================================================================
   UI — behaviour only. Runs after render.js has populated the DOM.
   =============================================================================
   Every module guards on the elements it needs, so the same file drives both
   the landing page and the projects page without branching on which is which.
   Anything decorative is skipped when the visitor prefers reduced motion.
============================================================================= */

(function (window, document) {
  'use strict';

  var reduceMotion = window.matchMedia &&
                     window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── Theme ────────────────────────────────────────────────────────────── */
  // The initial theme is applied by an inline script in <head> to avoid a
  // flash; this only wires the toggle and keeps the icon in step.
  var THEME_KEY = 'nqp-theme';

  function syncThemeButton(theme) {
    var btn = $('#theme-btn');
    if (!btn) return;
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  window.toggleTheme = function () {
    var root = document.documentElement;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ }
    syncThemeButton(next);
  };

  syncThemeButton(document.documentElement.getAttribute('data-theme') || 'dark');

  /* ── Mobile menu ──────────────────────────────────────────────────────── */
  window.toggleMob = function () {
    var m = $('#mob-menu'), b = $('#burger');
    if (!m) return;
    var open = m.classList.toggle('open');
    if (b) b.setAttribute('aria-expanded', String(open));
  };

  window.closeMob = function () {
    var m = $('#mob-menu'), b = $('#burger');
    if (m) m.classList.remove('open');
    if (b) b.setAttribute('aria-expanded', 'false');
  };

  /* ── Certifications show-more ─────────────────────────────────────────── */
  window.toggleCerts = function () {
    var extra = $('#certs-extra'), btn = $('#certs-more-btn');
    if (!extra || !btn) return;
    var open = extra.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open
      ? 'Show fewer certifications ↑'
      : 'Show all ' + (btn.dataset.total || '') + ' certifications →';
  };

  /* ── Scroll reveal + skill bars ───────────────────────────────────────── */
  (function () {
    var targets = $$('.r');
    if (!targets.length) return;

    var revealed = 0;

    function show(el) {
      if (el.classList.contains('on')) return;
      el.classList.add('on');
      revealed++;
      $$('.sk-fill[data-w]', el).forEach(function (bar) {
        bar.style.width = bar.dataset.w + '%';
      });
    }

    function showAll() { targets.forEach(show); }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        show(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });

    targets.forEach(function (el) { io.observe(el); });

    // The reveal is decoration; content must never be left invisible because of
    // it. Observer callbacks are delivered asynchronously and fast scrolling can
    // outrun them, so a throttled sweep of whatever is on screen backs it up.
    // The listener detaches once everything has been shown.
    var pending = targets.length;
    var queued = false;

    // Reveals anything the reader has reached *or scrolled past*, not just what
    // is on screen right now — otherwise an element skipped by a fast scroll
    // stays invisible until it happens to be scrolled back into view.
    function sweepVisible() {
      queued = false;
      targets.forEach(function (el) {
        if (el.classList.contains('on')) return;
        if (el.getBoundingClientRect().top < window.innerHeight) { show(el); pending--; }
      });
      if (pending <= 0) window.removeEventListener('scroll', onScroll);
    }

    function onScroll() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(sweepVisible);
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Covers deep links straight to #contact, and treats a completely silent
    // observer as unavailable rather than leaving a blank page.
    window.addEventListener('load', function () {
      setTimeout(function () {
        sweepVisible();
        if (revealed === 0) showAll();
      }, 600);
    });
  })();

  /* ── Active nav link ──────────────────────────────────────────────────── */
  (function () {
    var links = $$('.nav-links a');
    var secs  = $$('section[id]');
    if (!links.length || !secs.length || !('IntersectionObserver' in window)) return;

    // A percentage threshold never fires for a section taller than the viewport,
    // which strands the highlight. Watching a band just below the navbar marks
    // whichever section is actually being read, at any section height.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-25% 0px -70% 0px', threshold: 0 });

    secs.forEach(function (s) { io.observe(s); });
  })();

  /* ── Scroll chrome: nav shadow, progress bar, back-to-top ─────────────── */
  (function () {
    var nav    = $('#nav');
    var top    = $('#scroll-top');
    var prog   = $('#progress-bar');
    var footer = $('footer');
    var ticking = false;

    function update() {
      var y = window.scrollY;
      if (nav) nav.classList.toggle('scrolled', y > 16);
      if (top) {
        // Retire the button once the footer is on screen — pinned bottom-right,
        // it otherwise covers the footer links at laptop widths.
        var footerInView = footer && footer.getBoundingClientRect().top < window.innerHeight;
        top.classList.toggle('show', y > 500 && !footerInView);
      }
      if (prog) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        prog.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    update();
  })();

  window.scrollToTop = function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  /* ── Stat counters ────────────────────────────────────────────────────── */
  (function () {
    var els = $$('.h-stat-n[data-count]');
    if (!els.length) return;

    function settle(el) {
      var raw = el.dataset.count;
      el.textContent = raw + (el.dataset.suffix || '');
    }

    if (reduceMotion) { els.forEach(settle); return; }

    function run() {
      els.forEach(function (el, i) {
        var target  = parseFloat(el.dataset.count);
        var decimal = el.dataset.decimal === '1';
        var suffix  = el.dataset.suffix || '';
        if (isNaN(target)) { settle(el); return; }

        var t0  = performance.now();
        var dur = 900 + i * 140;

        (function tick(now) {
          var p = Math.min((now - t0) / dur, 1);
          var v = (1 - Math.pow(1 - p, 2.8)) * target;
          el.textContent = (decimal ? v.toFixed(1) : Math.floor(v)) + suffix;
          if (p < 1) requestAnimationFrame(tick);
          else settle(el);
        })(t0);
      });
    }

    window.addEventListener('load', function () { setTimeout(run, 400); });
  })();

  /* ── Typing effect ────────────────────────────────────────────────────── */
  (function () {
    var el = $('#typed');
    if (!el) return;

    var roles = (window.PORTFOLIO && window.PORTFOLIO.profile.typedRoles) || [];
    if (!roles.length) return;

    if (reduceMotion) {
      el.textContent = roles[0];
      var cursor = $('.typed-cursor');
      if (cursor) cursor.style.display = 'none';
      return;
    }

    var ri = 0, ci = 0, deleting = false, paused = false;

    (function tick() {
      if (paused) { paused = false; setTimeout(tick, 1800); return; }
      var cur = roles[ri];
      if (!deleting) {
        el.textContent = cur.slice(0, ++ci);
        if (ci === cur.length) { paused = true; deleting = true; }
        setTimeout(tick, 90);
      } else {
        el.textContent = cur.slice(0, --ci);
        if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; }
        setTimeout(tick, 44);
      }
    })();
  })();

  /* ── Hero name — per-character rise ───────────────────────────────────── */
  (function () {
    var el = $('.hero-name');
    if (!el || !window.PORTFOLIO) return;

    var n = window.PORTFOLIO.profile.heroName;

    if (reduceMotion) {
      el.innerHTML = n.first + '<br><span class="grad">' + n.last + '</span>';
      return;
    }

    function chars(str) {
      return str.split('').map(function (ch, i) {
        return '<span class="c" style="--d:' + (i * 36) + 'ms">' +
               (ch === ' ' ? '&nbsp;' : ch) + '</span>';
      }).join('');
    }

    // The surname carries the gradient, and `background-clip:text` cannot paint
    // behind inline-block children — so it animates as one element, entering
    // just after the first name finishes.
    var after = (n.first.length + 1) * 36;

    el.innerHTML = chars(n.first) +
                   '<br><span class="grad grad-rise" style="--d:' + after + 'ms">' +
                   n.last + '</span>';
  })();

  /* ── Hero particle field ──────────────────────────────────────────────── */
  (function () {
    var cv = $('#hero-canvas');
    var hero = $('#hero');
    if (!cv || !hero || reduceMotion) return;

    var cx = cv.getContext('2d');
    var MAX_D = 120;
    var W = 0, H = 0, pts = [], mouse = { x: null, y: null }, raf = null;

    // Density is per-area rather than a fixed count, so the field stays even
    // instead of turning into a solid mesh on a wide screen.
    function targetCount() {
      return Math.max(24, Math.min(58, Math.round((W * H) / 24000)));
    }

    function resize() {
      W = cv.width  = cv.offsetWidth;
      H = cv.height = cv.offsetHeight;
      if (!pts.length) return;
      var want = targetCount();
      while (pts.length > want) pts.pop();
      while (pts.length < want) pts.push(makePoint());
    }

    function makePoint() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.38,
        r: Math.random() * 1.2 + 0.4,
        a: Math.random() * 0.5 + 0.15,
      };
    }

    function step(p) {
      p.x += p.vx; p.y += p.vy;
      if (mouse.x !== null) {
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 80 && d > 0) { p.x += dx / d * 0.5; p.y += dy / d * 0.5; }
      }
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }

    function frame() {
      cx.clearRect(0, 0, W, H);
      var dark = document.documentElement.getAttribute('data-theme') !== 'light';
      var rgb  = dark ? '56,189,248' : '2,132,199';
      var k    = dark ? 1 : 0.62;

      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d >= MAX_D) continue;
          cx.beginPath();
          cx.moveTo(pts[i].x, pts[i].y);
          cx.lineTo(pts[j].x, pts[j].y);
          cx.strokeStyle = 'rgba(' + rgb + ',' + ((1 - d / MAX_D) * 0.10 * k) + ')';
          cx.lineWidth = 0.5;
          cx.stroke();
        }
      }

      pts.forEach(function (p) {
        step(p);
        cx.beginPath();
        cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        cx.fillStyle = 'rgba(' + rgb + ',' + (p.a * 0.75 * k) + ')';
        cx.fill();
      });

      raf = requestAnimationFrame(frame);
    }

    resize();
    pts = Array.from({ length: targetCount() }, makePoint);
    frame();

    window.addEventListener('resize', resize);
    hero.addEventListener('mousemove', function (e) {
      var r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('mouseleave', function () { mouse.x = mouse.y = null; });

    // Stop drawing while the tab is hidden.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) frame();
    });
  })();

  /* ── Orb parallax ─────────────────────────────────────────────────────── */
  (function () {
    var a = $('.orb-a'), b = $('.orb-b'), hero = $('#hero');
    if (!a || !hero || reduceMotion) return;

    var tx = 0, ty = 0, ox = 0, oy = 0, t = 0;

    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width  - 0.5) * 36;
      ty = ((e.clientY - r.top)  / r.height - 0.5) * 24;
    });
    hero.addEventListener('mouseleave', function () { tx = 0; ty = 0; });

    (function loop() {
      t += 0.008;
      ox += (tx + Math.sin(t) * 22 - ox) * 0.035;
      oy += (ty + Math.cos(t * 0.65) * 18 - oy) * 0.035;
      a.style.transform = 'translate(' + ox.toFixed(1) + 'px,' + oy.toFixed(1) + 'px)';
      if (b) b.style.transform = 'translate(' + (-ox * 0.55).toFixed(1) + 'px,' + (-oy * 0.55).toFixed(1) + 'px)';
      requestAnimationFrame(loop);
    })();
  })();

  /* ── Card tilt ────────────────────────────────────────────────────────── */
  (function () {
    if (reduceMotion) return;
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;

    $$('.pro-card, .acad-card, .ac, .edu-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width  - 0.5;
        var y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transition = 'transform 0.08s';
        card.style.transform =
          'perspective(700px) rotateX(' + (-y * 6) + 'deg) rotateY(' + (x * 6) + 'deg) translateZ(5px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.55s cubic-bezier(0.22,1,0.36,1)';
        card.style.transform = '';
      });
    });
  })();

  /* ── Close the mobile menu on outside click / Escape ──────────────────── */
  document.addEventListener('click', function (e) {
    var m = $('#mob-menu');
    if (!m || !m.classList.contains('open')) return;
    if (m.contains(e.target) || (e.target.closest && e.target.closest('#burger'))) return;
    window.closeMob();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.closeMob();
  });

})(window, document);
