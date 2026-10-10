/* =============================================================================
   RENDER — turns PORTFOLIO (data.js) into DOM.
   =============================================================================
   No content lives here, only presentation. Every section renders into a mount
   point marked with a data-render attribute inside the design's root; a section
   whose mount point is absent is skipped. Every count, filter chip, nav counter
   and "Show all N" label is derived from the data, so adding an entry to data.js
   is the only step needed. Shared figures come from ctx.vm; Dossier-only ones
   from DossierDerive (derive.js).

   TRUST MODEL: data.js is the owner's own static content and intentionally holds
   inline HTML (<strong>, &amp;, &gt;) in text fields, so text fields are written
   as HTML. URLs and other attribute values go through attr(), and badge class
   names are reduced to class tokens. Never feed this file untrusted input.
============================================================================= */

(function (window, document) {
  'use strict';

  /* Set by start(); one Dossier is mounted at a time. */
  var D, VM, ROOT, LIFE, DERIVE = window.DossierDerive;
  var onUpdate = function () {};

  /* ── Icons ────────────────────────────────────────────────────────────── */
  var S = 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    agents:      '<svg viewBox="0 0 22 22" ' + S + '><circle cx="11" cy="4" r="2.2"/><circle cx="4.5" cy="17" r="2.2"/><circle cx="17.5" cy="17" r="2.2"/><path d="M11 6.2L4.5 14.8M11 6.2L17.5 14.8M4.5 14.8h13" stroke-opacity=".55"/></svg>',
    rag:         '<svg viewBox="0 0 22 22" ' + S + '><rect x="3" y="7" width="11" height="12" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/><circle cx="8.5" cy="13" r="2.2"/><path d="M10.2 14.7l2.3 2.3"/></svg>',
    integration: '<svg viewBox="0 0 22 22" ' + S + '><path d="M9 13l4-4"/><path d="M12.5 6.5l1.8-1.8a3.3 3.3 0 0 1 4.7 4.7L17.2 11"/><path d="M9.5 15.5l-1.8 1.8a3.3 3.3 0 0 1-4.7-4.7L4.8 11"/></svg>',
    cloud:       '<svg viewBox="0 0 22 22" ' + S + '><path d="M6 16a4.5 4.5 0 0 1 0-9 5.5 5.5 0 0 1 10.8-.6A3.8 3.8 0 0 1 18.5 16H6z"/><path d="M11 12.5V9M9.2 10.8L11 9l1.8 1.8"/></svg>',
    ml:          '<svg viewBox="0 0 22 22" ' + S + '><path d="M5.5 7L2 11l3.5 4M16.5 7L20 11l-3.5 4"/><path d="M13 4.5l-4 13" stroke-opacity=".55"/></svg>',
    eval:        '<svg viewBox="0 0 22 22" ' + S + '><path d="M11 2.5l7 3v5c0 4-3 7.3-7 8.5-4-1.2-7-4.5-7-8.5v-5l7-3z"/><path d="M8.2 10.8l2 2 3.6-3.8"/></svg>',
    code:        '<svg viewBox="0 0 18 18" ' + S + '><path d="M6.2 5L2.5 9l3.7 4M11.8 5l3.7 4-3.7 4"/></svg>',
    hex:         '<svg viewBox="0 0 18 18" ' + S + '><path d="M9 1.5l6.8 3.75v7.5L9 16.5 2.2 12.75v-7.5z"/><circle cx="9" cy="9" r="2.4"/></svg>',
    brain:       '<svg viewBox="0 0 18 18" ' + S + '><circle cx="5" cy="5.5" r="2"/><circle cx="13" cy="5.5" r="2"/><circle cx="9" cy="12.5" r="2"/><path d="M6.6 6.7l1.6 4M11.4 6.7l-1.6 4M7 5.5h4" stroke-opacity=".55"/></svg>',
    db:          '<svg viewBox="0 0 18 18" ' + S + '><ellipse cx="9" cy="4.5" rx="6" ry="2.5"/><path d="M3 4.5v9c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-9"/><path d="M3 9c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" stroke-opacity=".55"/></svg>',
    tools:       '<svg viewBox="0 0 18 18" ' + S + '><path d="M11.5 2.8a3.8 3.8 0 0 0-1.2 6.1L3.4 15.8l1.4 1.4L11.7 10a3.8 3.8 0 0 0 4.6-5.3l-2.2 2.2-1.9-.5-.5-1.9z"/></svg>',
    chart:       '<svg viewBox="0 0 18 18" ' + S + '><path d="M2.5 15.5h13"/><path d="M5 15.5V9M9 15.5V4M13 15.5v-4.5"/></svg>',
    github:      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>',
    linkedin:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    mail:        '<svg viewBox="0 0 24 24" ' + S + '><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
    file:        '<svg viewBox="0 0 24 24" ' + S + '><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/></svg>',
    arrow:       '<svg viewBox="0 0 24 24" ' + S + '><path d="M7 17L17 7M8 7h9v9"/></svg>',
  };
  var FALLBACK_ICON = '<svg viewBox="0 0 22 22" ' + S + '><circle cx="11" cy="11" r="3"/></svg>';
  function icon(name) {
    if (ICONS[name]) return ICONS[name];
    if (window.console) console.warn('Unknown icon "' + name + '" in data.js, using the fallback');
    return FALLBACK_ICON;
  }

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  function mount(key) { return ROOT.querySelector('[data-render="' + key + '"]'); }
  function attr(t) {
    return String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function delay(i, step) { return 'style="--d:' + (i * (step || 0.06)).toFixed(2) + 's"'; }
  function tagList(tags) {
    return '<ul class="tags">' + tags.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
  }

  /* ── Derived figures: every counter on the page comes from here ──────── */
  var totals = {};
  function computeTotals() {
    var c = DERIVE.counts(D, VM);
    totals = {
      years: VM.totals.years, roles: c.roles, skills: c.skills,
      honors: c.honors, projects: c.projects, certs: c.certs,
    };
  }

  /* ── Top navigation: the same parts as Classic's bar ─────────────────── */
  // Logo, section links, CV button, the design picker's slot, theme button and a
  // burger for small screens. Section counts live in the section headers.
  function renderNav() {
    var el = mount('nav'); if (!el) return;
    var p = D.profile;
    var links = D.nav.map(function (n) {
      return '<a href="' + attr(n.href) + '" data-nav>' + n.label + '</a>';
    }).join('');
    var cv = p.resume.enabled
      ? '<a class="btn solid nav-cta" href="' + attr(p.resume.path) + '" download>' + icon('file') + p.resume.label + '</a>' : '';

    el.innerHTML =
      '<a class="nav-logo" href="#hero">' +
        '<span class="avatar"><span class="avatar-fb" aria-hidden="true">' + p.heroName.first.charAt(0) + p.heroName.last.charAt(0) + '</span>' +
          '<img src="' + attr(D.about.photo) + '" alt="' + attr(p.fullName) + '" width="36" height="36"></span>' +
        '<span>' + p.displayName + '<span class="dot">.</span></span>' +
      '</a>' +
      '<nav class="nav-links" aria-label="Sections">' + links + '</nav>' +
      '<div class="nav-right">' + cv +
        '<span class="nav-switch" data-design-slot></span>' +
        '<button class="theme" id="theme" type="button" aria-label="Toggle light and dark theme">' +
          '<svg viewBox="0 0 24 24" ' + S + '><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>' +
        '</button>' +
        '<button class="burger" id="burger" type="button" aria-label="Open menu" aria-controls="mob-menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '</div>';

    var mob = mount('nav-mobile');
    if (mob) {
      mob.innerHTML = D.nav.map(function (n) {
        return '<a href="' + attr(n.href) + '" data-close-menu>' + n.label + '</a>';
      }).join('') + (p.resume.enabled ? '<a href="' + attr(p.resume.path) + '" download data-close-menu>' + p.resume.label + '</a>' : '');
    }
  }

  /* ── Hero ─────────────────────────────────────────────────────────────── */
  function renderHero() {
    var p = D.profile;
    var a = mount('hero-availability'); if (a) a.textContent = p.availability;
    var n = mount('hero-name');
    if (n) n.innerHTML = p.heroName.first + ' <span>' + p.heroName.last + '</span>';
    var t = mount('hero-tagline'); if (t) t.textContent = p.tagline;

    var cta = mount('hero-cta');
    if (cta) {
      cta.innerHTML =
        '<a href="#contact" class="btn solid">Get in touch ' + icon('arrow') + '</a>' +
        (p.resume.enabled ? '<a href="' + attr(p.resume.path) + '" download class="btn ghost">' + icon('file') + p.resume.label + '</a>' : '') +
        '<a href="#experience" class="btn ghost">View experience</a>';
    }

    var stats = mount('hero-stats');
    if (stats) {
      var defs = [
        { v: totals.years + '+', l: 'Years of experience' },
        { v: p.gpa,              l: 'GPA / 4.0' },
        { v: totals.projects,    l: 'Projects' },
        { v: totals.honors,      l: 'Honors' },
        { v: totals.certs,       l: 'Certifications' },
      ];
      stats.innerHTML = defs.map(function (s) {
        return '<div class="stat" role="listitem"><b>' + s.v + '</b><span>' + s.l + '</span></div>';
      }).join('');
    }

    var card = mount('hero-card');
    if (card) {
      var cur = VM.currentRole ? { r: VM.currentRole, co: VM.currentCompany } : null;
      if (!cur) { card.innerHTML = ''; } else {
      var rows = [['Company', cur.co.company], ['Since', DERIVE.since(cur.r)], ['Location', cur.co.location.split(' · ')[0]],
                  ['Languages', p.languages.map(function (l) {
                    return (l.code ? '<span class="lang-code" aria-hidden="true">' + l.code + '</span> ' : '') + l.name + ' (' + l.level + ')';
                  }).join(' · ')]];
      card.innerHTML =
        '<div class="now-head"><i class="pulse" aria-hidden="true"></i><span>Now</span></div>' +
        '<h2 class="now-title">' + cur.r.title + '</h2>' +
        '<dl>' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
      }
    }

    var tk = mount('hero-floaters');
    if (tk) {
      var items = D.floaters.map(function (f) { return '<span>' + f + '</span>'; }).join('');
      tk.innerHTML = items + items; // duplicated so the CSS loop is seamless
    }
  }

  /* ── About ────────────────────────────────────────────────────────────── */
  function renderAbout() {
    var text = mount('about-text');
    if (text) text.innerHTML = D.about.paragraphs.map(function (x) { return '<p>' + x + '</p>'; }).join('');
    var cards = mount('about-cards');
    if (cards) {
      cards.innerHTML = D.about.specialties.map(function (s, i) {
        return '<div class="ac" ' + delay(i, 0.05) + '><span class="ac-ico">' + icon(s.icon) + '</span>' +
               '<h3>' + s.title + '</h3><p>' + s.desc + '</p></div>';
      }).join('');
    }
  }

  /* ── Evidence images (carousel for 3+, thumbnails otherwise) ─────────── */
  function evidenceLinks(list) {
    if (!list || !list.length) return '';
    if (list.length >= 3) return evidenceCarousel(list);
    return '<div class="evidence-row">' + list.map(function (ev) {
      return '<a class="evidence" href="' + attr(ev.src) + '" target="_blank" rel="noopener">' +
             '<img src="' + attr(ev.src) + '" alt="' + attr(ev.alt) + '" loading="lazy">' +
             '<span class="evidence-cap">' + ev.caption + '</span></a>';
    }).join('') + '</div>';
  }

  function evidenceCarousel(list) {
    var slides = list.map(function (ev, i) {
      return '<a class="ec-slide" href="' + attr(ev.src) + '" target="_blank" rel="noopener" data-caption="' + attr(ev.caption) + '"' + (i ? ' hidden' : '') + '>' +
             '<img src="' + attr(ev.src) + '" alt="' + attr(ev.alt) + '" loading="lazy"></a>';
    }).join('');
    var dots = list.map(function (ev, i) {
      return '<button type="button" class="ec-dot" data-i="' + i + '" aria-label="Show image ' + (i + 1) + ' of ' + list.length + '"' + (i ? '' : ' aria-current="true"') + '></button>';
    }).join('');
    return '<div class="ec" tabindex="0" role="group" aria-roledescription="carousel" aria-label="Photos, use the arrow keys to browse">' +
             '<div class="ec-stage">' + slides +
               '<button type="button" class="ec-btn ec-prev" aria-label="Previous image">&#8249;</button>' +
               '<button type="button" class="ec-btn ec-next" aria-label="Next image">&#8250;</button></div>' +
             '<div class="ec-foot"><span class="ec-cap" aria-live="polite">' + list[0].caption + '</span><span class="ec-count">1 / ' + list.length + '</span></div>' +
             // Dots only for short sets: beyond 10 they would need several 44px rows, and the counter, arrows, keys and swipe already cover navigation.
             (list.length <= 10 ? '<div class="ec-dots">' + dots + '</div>' : '') + '</div>';
  }

  function ecShow(ec, to) {
    var slides = ec.querySelectorAll('.ec-slide'), dots = ec.querySelectorAll('.ec-dot'), n = slides.length;
    var i = ((to % n) + n) % n;
    for (var k = 0; k < n; k++) {
      slides[k].hidden = k !== i;
      if (!dots[k]) continue; // long sets render without dots
      if (k === i) dots[k].setAttribute('aria-current', 'true'); else dots[k].removeAttribute('aria-current');
    }
    ec.querySelector('.ec-cap').textContent = slides[i].getAttribute('data-caption');
    ec.querySelector('.ec-count').textContent = (i + 1) + ' / ' + n;
    ec.setAttribute('data-i', i);
  }

  function bindCarousels() {
    function cur(ec) { return parseInt(ec.getAttribute('data-i') || '0', 10); }
    LIFE.on(ROOT, 'click', function (e) {
      var ec = e.target.closest && e.target.closest('.ec'); if (!ec) return;
      var dot = e.target.closest('.ec-dot');
      if (e.target.closest('.ec-prev')) ecShow(ec, cur(ec) - 1);
      else if (e.target.closest('.ec-next')) ecShow(ec, cur(ec) + 1);
      else if (dot) ecShow(ec, parseInt(dot.getAttribute('data-i'), 10));
    });
    LIFE.on(ROOT, 'keydown', function (e) {
      var ec = e.target.closest && e.target.closest('.ec');
      if (!ec || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      e.preventDefault(); ecShow(ec, cur(ec) + (e.key === 'ArrowRight' ? 1 : -1));
    });
    var sx = null;
    LIFE.on(ROOT, 'touchstart', function (e) { sx = e.target.closest && e.target.closest('.ec-stage') ? e.touches[0].clientX : null; }, { passive: true });
    LIFE.on(ROOT, 'touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, ec = e.target.closest && e.target.closest('.ec'); sx = null;
      if (ec && Math.abs(dx) > 40) ecShow(ec, cur(ec) + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ── Experience ───────────────────────────────────────────────────────── */
  function renderExperience() {
    var el = mount('experience'); if (!el) return;
    el.innerHTML = VM.experience.map(function (entry, ci) {
      var co = entry.company;
      // One logo is enough: a missing light or dark variant falls back to the other one.
      var logoD = co.logoDark || co.logoLight, logoL = co.logoLight || co.logoDark;
      var logo = logoD
        ? '<img src="' + attr(logoD) + '" alt="' + attr(co.company) + '" class="logo logo-on-dark">' +
          '<img src="' + attr(logoL) + '" alt="' + attr(co.company) + '" class="logo logo-on-light">'
        : '<span class="logo-badge">' + (co.logoText || co.company.slice(0, 3).toUpperCase()) + '</span>';
      var ordered = entry.roles;
      var roles = ordered.map(function (role, ri) {
        var awards = (role.awards || []).map(function (a) { return '<p class="award">' + a + '</p>'; }).join('');
        return '<article class="role" ' + delay(ci * 2 + ri, 0.05) + '>' +
                 '<div class="role-when"><span class="role-period">' + role.period + '</span>' +
                   '<span class="role-type">' + role.type + '</span>' +
                   (role.end === null ? '<span class="now-badge">Current</span>' : '') + '</div>' +
                 '<div class="role-body"><h3>' + role.title + '</h3>' +
                   (role.supervisor ? '<p class="sup">' + role.supervisor + '</p>' : '') +
                   '<ul class="buls">' + role.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>' +
                   awards + evidenceLinks(role.evidence) + '</div></article>';
      }).join('');
      return '<div class="company"><header class="co-head"><span class="co-logo">' + logo + '</span>' +
               '<div><h3>' + co.company + '</h3><p>' + entry.tenure + ' · ' + co.location + '</p></div></header>' + roles + '</div>';
    }).join('');
  }

  /* ── Skills ───────────────────────────────────────────────────────────── */
  function renderSkills() {
    var el = mount('skills'); if (!el) return;
    el.innerHTML = VM.skills.map(function (sg, gi) {
      var g = sg.group;
      var items = sg.items.map(function (v) {
        return '<li><div class="sk-row"><span class="sk-name">' + v.skill.name + '</span>' +
               '<span class="sk-meta">' + v.meta + '</span></div>' +
               '<div class="sk-bar"><i data-w="' + v.width + '"></i></div></li>';
      }).join('');
      return '<div class="sg" ' + delay(gi, 0.05) + '><h3><span class="sg-ico">' + icon(g.icon) + '</span>' + g.name +
             '<em>' + g.items.length + '</em></h3><ul>' + items + '</ul></div>';
    }).join('');
  }

  /* ── Education ────────────────────────────────────────────────────────── */
  function renderEducation() {
    var el = mount('education'); if (!el) return;
    el.innerHTML = D.education.map(function (e, i) {
      var gpa = e.gpa ? '<div class="gpa"><b>' + e.gpa.value + '<small> ' + e.gpa.scale + '</small></b><span>' + e.gpa.label + '</span></div>' : '';
      return '<article class="edu" ' + delay(i, 0.1) + '>' +
               '<div class="edu-main"><span class="edu-period">' + e.period + '</span>' +
               '<h3>' + e.institution + '</h3><p class="edu-deg">' + e.degree + '</p>' +
               (e.status ? '<p class="edu-status">' + e.status + '</p>' : '') +
               '<ul class="buls">' + e.details.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul>' +
               '<p class="edu-loc">' + e.location + '</p>' +
               (e.docs || []).map(function (d) {
                 return '<a class="doc" href="' + attr(d.href) + '" target="_blank" rel="noopener">' + icon('file') + d.label + '</a>';
               }).join('') + '</div>' + gpa + '</article>';
    }).join('');
  }

  /* ── Honors ───────────────────────────────────────────────────────────── */
  function renderHonors() {
    var el = mount('honors'); if (!el) return;
    var sorted = VM.honors;
    el.innerHTML = sorted.map(function (h, i) {
      return '<article class="honor" ' + delay(i, 0.08) + '>' +
               '<div class="honor-head"><span class="honor-date">' + h.date + '</span><span class="honor-issuer">' + h.issuer + '</span></div>' +
               '<h3>' + h.title + '</h3><p class="honor-desc">' + h.description + '</p>' + evidenceLinks(h.evidence) + '</article>';
    }).join('');
  }

  /* ── Projects: one normalised list, filters derived from it ─────────── */
  var projState;

  var allProjects = function () { return DERIVE.allProjects(D); };
  var rankedTags = DERIVE.rankedTags;

  function chip(label, count, data, on) {
    return '<button type="button" class="chip' + (on ? ' on' : '') + '" ' + data + ' aria-pressed="' + (on ? 'true' : 'false') + '">' +
           label + (count != null ? '<em>' + count + '</em>' : '') + '</button>';
  }

  function projectCard(x, i) {
    var p = x.p, isPro = x.kind === 'professional';
    var meta = isPro
      ? [p.org, p.team, p.role].filter(Boolean).map(function (m) { return '<span>' + m + '</span>'; }).join('')
      : '<span>' + p.meta + '</span>';
    var body = isPro
      ? (p.supervisor ? '<p class="sup">' + p.supervisor + '</p>' : '') +
        '<ul class="buls">' + p.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>' +
        (p.award ? '<p class="award">' + p.award + '</p>' : '')
      : '<p class="proj-desc">' + p.desc + '</p>';
    return '<article class="proj ' + x.kind + (x.featured ? ' featured' : '') + '" ' + delay(i, 0.04) + '>' +
             '<div class="proj-top"><span class="badge">' + (isPro ? p.badge : 'Personal') + '</span>' +
               (x.featured ? '<span class="star">Featured</span>' : '') + '<span class="proj-period">' + p.period + '</span></div>' +
             '<h3>' + p.title + '</h3><div class="proj-meta">' + meta + '</div>' + body +
             '<div class="proj-foot">' + tagList(p.tags) +
               (p.link ? '<a class="repo" href="' + attr(p.link) + '" target="_blank" rel="noopener">' + icon('github') + 'Repository</a>' : '') +
             '</div></article>';
  }

  function renderProjects() {
    var el = mount('projects'); if (!el) return;
    var list = allProjects();
    var TAG_LIMIT = 10;
    var ranked = rankedTags(list);
    // A selection that no longer exists in the data is dropped, never kept as a hidden filter.
    if (projState.tag && !ranked.some(function (t) { return t.name === projState.tag; })) projState.tag = null;
    var tagChips = projState.moreTags ? ranked : ranked.slice(0, TAG_LIMIT);
    if (projState.tag && tagChips.every(function (t) { return t.name !== projState.tag; })) {
      tagChips = tagChips.concat(ranked.filter(function (t) { return t.name === projState.tag; }));
    }
    var shown = list.filter(function (x) {
      if (projState.kind === 'featured' && !x.featured) return false;
      if (projState.kind === 'professional' && x.kind !== 'professional') return false;
      if (projState.kind === 'academic' && x.kind !== 'academic') return false;
      if (projState.tag && x.tags.indexOf(projState.tag) === -1) return false;
      return true;
    });
    el.innerHTML = shown.map(projectCard).join('') ||
      '<p class="empty">No projects match this filter.</p>';

    var fl = mount('project-filters');
    if (fl) {
      var kinds = [
        { k: 'all', l: 'All', n: list.length },
        { k: 'featured', l: 'Featured', n: list.filter(function (x) { return x.featured; }).length },
        { k: 'professional', l: 'Professional', n: list.filter(function (x) { return x.kind === 'professional'; }).length },
        { k: 'academic', l: 'Personal & academic', n: list.filter(function (x) { return x.kind === 'academic'; }).length },
      ];
      fl.innerHTML =
        '<div class="chip-group" role="group" aria-label="Project type">' +
          kinds.map(function (k) { return chip(k.l, k.n, 'data-kind="' + k.k + '"', projState.kind === k.k); }).join('') + '</div>' +
        '<div class="chip-group" role="group" aria-label="Technology">' +
          tagChips.map(function (t) { return chip(t.name, t.n, 'data-tag="' + attr(t.name) + '"', projState.tag === t.name); }).join('') +
          (ranked.length > TAG_LIMIT ? '<button type="button" class="chip more" data-more-tags aria-expanded="' + projState.moreTags + '">' +
            (projState.moreTags ? 'Fewer tags' : 'More tags (' + (ranked.length - TAG_LIMIT) + ')') + '</button>' : '') + '</div>';
    }
    var note = mount('project-note');
    if (note) note.textContent = 'Showing ' + shown.length + ' of ' + list.length + ' projects' + (projState.tag ? ' using ' + projState.tag : '') + '.';
  }

  /* ── Certifications ───────────────────────────────────────────────────── */
  var certState;

  function renderCertifications() {
    var el = mount('certifications'); if (!el) return;
    var sorted = VM.certs;
    if (certState.issuer && !sorted.some(function (x) { return x.cert.issuer === certState.issuer; })) certState.issuer = null;
    var filtered = certState.issuer ? sorted.filter(function (x) { return x.cert.issuer === certState.issuer; }) : sorted;
    var limit = (certState.issuer || certState.all) ? filtered.length : D.certsVisible;

    el.innerHTML = filtered.slice(0, limit).map(function (x, i) {
      var c = x.cert, iss = x.issuer;
      var cls = String(iss.cls || '').replace(/[^\w -]/g, ''); // class tokens only, never markup
      return '<div class="cert" ' + delay(i % 12, 0.025) + '><span class="cert-ico ' + cls + '">' + iss.badge + '</span>' +
             '<div><small>' + iss.label + '</small><b>' + c.name + '</b><span>' + c.date + '</span></div></div>';
    }).join('');

    var fl = mount('cert-filters');
    if (fl) {
      var counts = {};
      sorted.forEach(function (x) { counts[x.cert.issuer] = (counts[x.cert.issuer] || 0) + 1; });
      fl.innerHTML = '<div class="chip-group">' + chip('All', sorted.length, 'data-issuer=""', !certState.issuer) +
        Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).map(function (k) {
          var iss = D.certIssuers[k] || { label: k };
          return chip(iss.label, counts[k], 'data-issuer="' + attr(k) + '"', certState.issuer === k);
        }).join('') + '</div>';
    }

    var btn = ROOT.querySelector('#certs-more');
    if (btn) {
      var hide = !!certState.issuer || filtered.length <= D.certsVisible;
      btn.parentNode.style.display = hide ? 'none' : '';
      btn.textContent = certState.all ? 'Show fewer' : 'Show all ' + filtered.length + ' certifications';
      btn.setAttribute('aria-expanded', certState.all ? 'true' : 'false');
    }
  }

  /* ── Contact & footer ─────────────────────────────────────────────────── */
  function renderContact() {
    var chips = mount('contact-chips');
    if (chips) chips.innerHTML = '<span>' + D.profile.location + '</span><span>' + D.profile.company + '</span><span class="live">Open to opportunities</span>';
    var cards = mount('contact-cards'); if (!cards) return;
    var p = D.profile;
    var entries = [
      { href: 'mailto:' + p.email, ico: 'mail', label: 'Email', value: p.email },
      { href: p.github, ico: 'github', label: 'GitHub', value: p.github.replace('https://', ''), ext: true },
      { href: p.linkedin, ico: 'linkedin', label: 'LinkedIn', value: p.linkedin.replace('https://www.', '').replace(/\/$/, ''), ext: true },
    ];
    if (p.resume.enabled) entries.push({ href: p.resume.path, ico: 'file', label: 'Résumé', value: p.resume.label + ' (PDF)', dl: true });
    cards.innerHTML = entries.map(function (e) {
      return '<a class="ccard" href="' + attr(e.href) + '"' + (e.ext ? ' target="_blank" rel="noopener"' : '') + (e.dl ? ' download' : '') + '>' +
             '<span class="ccard-ico">' + icon(e.ico) + '</span><span><small>' + e.label + '</small><b>' + e.value + '</b></span></a>';
    }).join('');
  }

  function renderFooter() {
    var f = mount('footer'); if (!f) return;
    f.innerHTML = '<span>Designed &amp; built by ' + D.profile.fullName + ' · ' + D.profile.title + ' · ' + new Date().getFullYear() + '</span>' +
                  '<span>' + ((D.site && D.site.credit) || D.profile.displayName) + '</span>';
  }

  function renderCounts() {
    var map = { experience: totals.roles, skills: totals.skills, honors: totals.honors, projects: totals.projects, certifications: totals.certs };
    Array.prototype.forEach.call(ROOT.querySelectorAll('[data-count]'), function (n) {
      var v = map[n.getAttribute('data-count')];
      if (v != null) n.textContent = v + (v === 1 ? ' entry' : ' entries');
    });
  }

  /* ── Filter + toggle events (delegated, bound once) ──────────────────── */
  function bindFilters() {
    LIFE.on(ROOT, 'click', function (e) {
      var c = e.target.closest && e.target.closest('.chip');
      if (c) {
        if (c.hasAttribute('data-more-tags')) { projState.moreTags = !projState.moreTags; renderProjects(); }
        else if (c.hasAttribute('data-kind')) { projState.kind = c.getAttribute('data-kind'); renderProjects(); }
        else if (c.hasAttribute('data-tag')) {
          var t = c.getAttribute('data-tag'); projState.tag = projState.tag === t ? null : t; renderProjects();
        } else if (c.hasAttribute('data-issuer')) {
          certState.issuer = c.getAttribute('data-issuer') || null; renderCertifications();
        }
        onUpdate();
        return;
      }
      if (e.target.id === 'certs-more') { certState.all = !certState.all; renderCertifications(); onUpdate(); }
    });
  }

  /* ── Entry point ──────────────────────────────────────────────────────── */
  function renderAll() {
    computeTotals();
    renderNav(); renderHero(); renderAbout(); renderExperience(); renderSkills();
    renderEducation(); renderHonors(); renderProjects(); renderCertifications();
    renderContact(); renderFooter(); renderCounts();
    onUpdate();
  }

  /* root already holds the shell markup; update() is called after every render. */
  function start(ctx, root, update) {
    D = ctx.data;
    VM = ctx.vm;
    ROOT = root;
    LIFE = ctx.life;
    onUpdate = update || function () {};
    projState = { kind: 'all', tag: null, moreTags: false };
    certState = { issuer: null, all: false };
    renderAll();
    bindCarousels();
    bindFilters();
  }

  window.DossierRender = { start: start };

})(window, document);
