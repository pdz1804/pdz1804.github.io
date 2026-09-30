/* =============================================================================
   RENDER — turns PORTFOLIO (data.js) into DOM.
   =============================================================================
   No content lives here, only presentation. Every section renders into a mount
   point marked with a data-render attribute in the HTML; a section whose mount
   point is absent is skipped, which is how one file serves both pages.
============================================================================= */

(function (window, document) {
  'use strict';

  var D = window.PORTFOLIO;
  var LEVELS = window.SKILL_LEVELS;

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
  };

  function icon(name) { return ICONS[name] || ''; }

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  function mount(key) { return document.querySelector('[data-render="' + key + '"]'); }

  // Stagger animation delays from position, so new entries time themselves.
  function delay(i, step) { return 'style="transition-delay:' + (i * (step || 0.07)).toFixed(2) + 's"'; }

  function parseMonth(s) {
    if (!s) return null;
    var p = s.split('-');
    return { y: +p[0], m: +p[1] };
  }

  function monthsBetween(from, to) {
    return (to.y - from.y) * 12 + (to.m - from.m);
  }

  function nowMonth() {
    var d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  }

  // "1 yr 3 mos" — inclusive of the current month.
  function humanDuration(months) {
    months = Math.max(months, 1);
    var y = Math.floor(months / 12), m = months % 12, out = [];
    if (y) out.push(y + ' yr' + (y > 1 ? 's' : ''));
    if (m) out.push(m + ' mo' + (m > 1 ? 's' : ''));
    return out.join(' ') || '1 mo';
  }

  // Total span across a company's roles, counting an open role up to today.
  function companyTenure(company) {
    var starts = [], ends = [], open = false;
    company.roles.forEach(function (r) {
      var s = parseMonth(r.start);
      if (s) starts.push(s);
      if (r.end === null) open = true;
      else { var e = parseMonth(r.end); if (e) ends.push(e); }
    });
    if (!starts.length) return '';
    var first = starts.reduce(function (a, b) { return monthsBetween(b, a) > 0 ? b : a; });
    var last  = open ? nowMonth()
                     : ends.reduce(function (a, b) { return monthsBetween(a, b) > 0 ? b : a; }, first);
    return humanDuration(monthsBetween(first, last) + 1);
  }

  function yearsSince(ym) {
    var start = parseMonth(ym);
    if (!start) return 0;
    return Math.floor(monthsBetween(start, nowMonth()) / 12);
  }

  /* ── Derived figures — every counter on the site comes from here ──────── */

  var totals = {
    years:    yearsSince(D.profile.careerStart),
    projects: D.projects.professional.length + D.projects.academic.length,
    certs:    D.certifications.length,
  };

  window.PORTFOLIO_TOTALS = totals;

  /* ── Navigation & chrome ─────────────────────────────────────────────── */

  function renderNav() {
    var links = mount('nav-links');
    if (links) {
      links.innerHTML = D.nav.map(function (n) {
        return '<a href="' + n.href + '">' + n.label + '</a>';
      }).join('');
    }

    var mob = mount('nav-mobile');
    if (mob) {
      mob.innerHTML = D.nav.map(function (n) {
        return '<a href="' + n.href + '" onclick="closeMob()">' + n.label + '</a>';
      }).join('') +
      '<a href="projects.html" onclick="closeMob()">All Projects</a>' +
      (D.profile.resume.enabled
        ? '<a href="' + D.profile.resume.path + '" download onclick="closeMob()">' + D.profile.resume.label + '</a>'
        : '');
    }

    var cta = mount('nav-cta');
    if (cta && D.profile.resume.enabled) {
      cta.innerHTML = '<a class="nav-cta-btn" href="' + D.profile.resume.path + '" download>' +
                      D.profile.resume.label + '</a>';
    }
  }

  function renderFooter() {
    var f = mount('footer');
    if (!f) return;
    var year = new Date().getFullYear();
    // projects.html has no #hero, so the name would be a dead anchor there.
    var home = document.getElementById('hero') ? '#hero' : 'index.html#hero';

    f.innerHTML =
      '<p class="footer-text">Designed &amp; built by <a href="' + home + '">' + D.profile.fullName +
        '</a> · ' + D.profile.title + ' · ' + year + '</p>' +
      '<div class="footer-links">' +
        '<a href="' + D.profile.github + '" target="_blank" rel="noopener">GitHub</a>' +
        '<a href="' + D.profile.linkedin + '" target="_blank" rel="noopener">LinkedIn</a>' +
        '<a href="mailto:' + D.profile.email + '">Email</a>' +
        (D.profile.resume.enabled
          ? '<a href="' + D.profile.resume.path + '" download>CV</a>' : '') +
      '</div>';
  }

  /* ── Hero ─────────────────────────────────────────────────────────────── */

  function renderHero() {
    var badge = mount('hero-availability');
    if (badge) badge.textContent = D.profile.availability;

    var desc = mount('hero-tagline');
    if (desc) desc.textContent = D.profile.tagline;

    var cta = mount('hero-cta');
    if (cta) {
      cta.innerHTML =
        '<a href="#contact" class="btn-primary">Get in touch ↗</a>' +
        (D.profile.resume.enabled
          ? '<a href="' + D.profile.resume.path + '" download class="btn-ghost">↓ ' + D.profile.resume.label + '</a>'
          : '') +
        '<a href="#experience" class="btn-ghost">View experience</a>';
    }

    var stats = mount('hero-stats');
    if (stats) {
      var defs = [
        { value: totals.years,    suffix: '+', label: 'Yrs Experience' },
        { value: D.profile.gpa,   suffix: '',  label: 'GPA / 4.0', decimal: true },
        { value: totals.projects, suffix: '',  label: 'AI Projects' },
        { value: totals.certs,    suffix: '',  label: 'Certifications' },
      ];
      stats.innerHTML = defs.map(function (s) {
        return '<div class="h-stat">' +
                 '<span class="h-stat-n" data-count="' + s.value + '"' +
                   (s.decimal ? ' data-decimal="1"' : '') +
                   ' data-suffix="' + s.suffix + '">0</span>' +
                 '<span class="h-stat-l">' + s.label + '</span>' +
               '</div>';
      }).join('');
    }

    var card = mount('hero-card');
    if (card) {
      // The open role, wherever it sits in the array — not simply the first.
      var all = D.experience.reduce(function (acc, co) { return acc.concat(co.roles); }, []);
      var current = all.filter(function (r) { return r.end === null; })
                       .sort(function (a, b) { return (b.start || '').localeCompare(a.start || ''); })[0]
                    || all[0];
      var rows = [
        ['Company',   D.profile.company],
        ['Focus',     'LLMs · RAG · Agents · MCP'],
        ['Cloud',     'AWS · Azure'],
        ['Since',     D.profile.companySince],
      ];
      card.innerHTML =
        '<div class="hc-head">' +
          '<span class="hc-dot"></span>' +
          '<span class="hc-title">' + current.title + '</span>' +
          '<span class="hc-sub">Active</span>' +
        '</div>' +
        rows.map(function (r) {
          return '<div class="hc-info-row"><span class="hc-info-label">' + r[0] +
                 '</span><span class="hc-info-val">' + r[1] + '</span></div>';
        }).join('');
    }

    var fl = mount('hero-floaters');
    if (fl) {
      // Deterministic scatter — no randomness, so the layout is stable.
      var spots = [
        [6, 16, 11, 0, -2], [70, 11, 9, 1.8, 1.5], [80, 54, 12, 3.2, -1], [5, 74, 10, 0.7, 2],
        [55, 80, 11, 2.4, -1.5], [35, 6, 13, 4.1, 1], [18, 88, 10, 1.1, -2], [62, 32, 12, 0.4, 1.5],
      ];
      fl.innerHTML = D.floaters.map(function (t, i) {
        var s = spots[i % spots.length];
        return '<span class="floater" style="left:' + s[0] + '%;top:' + s[1] + '%;--dur:' + s[2] +
               's;--dl:' + s[3] + 's;--rot:' + s[4] + 'deg">' + t + '</span>';
      }).join('');
    }
  }

  /* ── About ────────────────────────────────────────────────────────────── */

  function renderAbout() {
    var photo = mount('about-photo');
    if (photo) {
      photo.innerHTML =
        '<div class="profile-ring-wrap">' +
          '<img src="' + D.about.photo + '" alt="' + D.profile.fullName + '" class="profile-photo" width="176" height="176">' +
        '</div>' +
        '<div class="lang-col">' +
          D.profile.languages.map(function (l) {
            return '<span class="lang-pill"><span class="flag">' + l.flag + '</span> <strong>' +
                   l.name + '</strong> — ' + l.level + '</span>';
          }).join('') +
        '</div>';
    }

    var text = mount('about-text');
    if (text) {
      text.innerHTML = D.about.paragraphs.map(function (p) { return '<p>' + p + '</p>'; }).join('');
    }

    var cards = mount('about-cards');
    if (cards) {
      cards.innerHTML = D.about.specialties.map(function (s, i) {
        return '<div class="ac r" ' + delay(i, 0.05) + '>' +
                 '<div class="ac-ico">' + icon(s.icon) + '</div>' +
                 '<div class="ac-title">' + s.title + '</div>' +
                 '<div class="ac-desc">' + s.desc + '</div>' +
               '</div>';
      }).join('');
    }
  }

  /* ── Evidence images ──────────────────────────────────────────────────── */

  // Certificate thumbnails shared by the experience and honors sections. Each
  // one opens the full-size file in a new tab.
  function evidenceLinks(list) {
    if (!list || !list.length) return '';
    return '<div class="evidence-row">' + list.map(function (ev) {
      return '<a class="evidence" href="' + ev.src + '" target="_blank" rel="noopener">' +
               '<img src="' + ev.src + '" alt="' + ev.alt + '" loading="lazy">' +
               '<span class="evidence-cap">' + ev.caption + '</span>' +
             '</a>';
    }).join('') + '</div>';
  }

  /* ── Experience ───────────────────────────────────────────────────────── */

  function renderExperience() {
    var el = mount('experience');
    if (!el) return;

    el.innerHTML = D.experience.map(function (co, ci) {
      var logo = co.logoDark
        ? '<img src="' + co.logoDark  + '" alt="' + co.company + '" class="exp-logo exp-logo-dark">' +
          '<img src="' + co.logoLight + '" alt="' + co.company + '" class="exp-logo exp-logo-light">'
        : '<span class="exp-co-badge">' + (co.logoText || co.company.slice(0, 3).toUpperCase()) + '</span>';

      // Newest first, so appending a promotion with push() lands it at the top
    // rather than the bottom — the workflow data.js and the README document.
    var ordered = co.roles.slice().sort(function (a, b) {
      return (b.start || '').localeCompare(a.start || '');
    });

    var roles = ordered.map(function (role, ri) {
        var bullets = role.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('');
        var awards  = (role.awards || []).map(function (a) {
          return '<span class="award-tag">🏆 ' + a + '</span>';
        }).join('');
        var current = role.end === null ? '<span class="exp-role-now">Current</span>' : '';

        return '<div class="exp-role-entry r" ' + delay(ci * 2 + ri, 0.07) + '>' +
                 '<div class="exp-role-left">' +
                   '<div class="exp-role-period">' + role.period + '</div>' +
                   '<div class="exp-role-type">' + role.type + '</div>' +
                   current +
                 '</div>' +
                 '<div class="exp-role-right">' +
                   '<h3 class="exp-role-title">' + role.title + '</h3>' +
                   (role.supervisor ? '<div class="exp-supervisor">' + role.supervisor + '</div>' : '') +
                   '<ul class="exp-buls">' + bullets + '</ul>' +
                   awards +
                   evidenceLinks(role.evidence) +
                 '</div>' +
               '</div>';
      }).join('');

      return '<div class="exp-company-group r">' +
               '<div class="exp-company-hdr">' +
                 '<div class="exp-co-logo-wrap">' + logo + '</div>' +
                 '<div>' +
                   '<div class="exp-co-name">' + co.company + '</div>' +
                   '<div class="exp-co-meta">' + companyTenure(co) + ' · ' + co.location + '</div>' +
                 '</div>' +
               '</div>' + roles +
             '</div>';
    }).join('');
  }

  /* ── Skills ───────────────────────────────────────────────────────────── */

  function renderSkills() {
    var el = mount('skills');
    if (!el) return;

    el.innerHTML = D.skills.map(function (group, gi) {
      var items = group.items.map(function (s) {
        var width = LEVELS[s.level] || LEVELS.intermediate;
        var label = s.level.charAt(0).toUpperCase() + s.level.slice(1);
        var meta  = label + (s.years ? ' · ' + s.years + ' yr' : '');
        return '<div class="sk-item">' +
                 '<div class="sk-row">' +
                   '<span class="sk-name" title="' + s.name + '">' + s.name + '</span>' +
                   '<span class="sk-meta">' + meta + '</span>' +
                 '</div>' +
                 '<div class="sk-bar"><div class="sk-fill" data-w="' + width + '"></div></div>' +
               '</div>';
      }).join('');

      return '<div class="sg r" ' + delay(gi, 0.06) + '>' +
               '<div class="sg-head">' +
                 '<span class="sg-icon">' + icon(group.icon) + '</span>' +
                 '<span class="sg-name">' + group.name + '</span>' +
               '</div>' + items +
             '</div>';
    }).join('');
  }

  /* ── Education ────────────────────────────────────────────────────────── */

  function renderEducation() {
    var el = mount('education');
    if (!el) return;

    el.innerHTML = D.education.map(function (e, i) {
      var gpa = e.gpa
        ? '<div class="edu-gpa">' +
            '<div class="edu-gpa-num">' + e.gpa.value +
              ' <span class="edu-gpa-scale">' + e.gpa.scale + '</span></div>' +
            '<div class="edu-gpa-label">' + e.gpa.label + '</div>' +
          '</div>'
        : '';

      return '<div class="edu-card r" ' + delay(i, 0.12) + '>' +
               '<div class="edu-head">' +
                 '<div class="edu-inst">' + e.institution + '</div>' +
                 '<span class="edu-period">' + e.period + '</span>' +
               '</div>' +
               '<div class="edu-degree">' + e.degree + '</div>' +
               (e.status ? '<span class="edu-status">🎓 ' + e.status + '</span>' : '') +
               e.details.map(function (d) { return '<div class="edu-detail">' + d + '</div>'; }).join('') +
               '<div class="edu-detail edu-detail-loc">' + e.location + '</div>' +
               gpa +
             '</div>';
    }).join('');
  }

  /* ── Honors & awards ──────────────────────────────────────────────────── */

  function renderHonors() {
    var el = mount('honors');
    if (!el) return;

    // Stable sort: equal sortKey keeps the order written in data.js.
    var sorted = D.honors.map(function (h, i) { return { h: h, i: i }; })
      .sort(function (a, b) { return (b.h.sortKey - a.h.sortKey) || (a.i - b.i); })
      .map(function (x) { return x.h; });

    el.innerHTML = sorted.map(function (h, i) {
      return '<article class="honor-card r" ' + delay(i, 0.12) + '>' +
               '<div class="honor-date">' + h.date + '</div>' +
               '<h3 class="honor-title">' + h.title + '</h3>' +
               '<div class="honor-issuer">' + h.issuer + '</div>' +
               '<p class="honor-desc">' + h.description + '</p>' +
               evidenceLinks(h.evidence) +
             '</article>';
    }).join('');
  }

  /* ── Projects ─────────────────────────────────────────────────────────── */

  function professionalCard(p, i) {
    var meta = ['🏢 ' + p.org];
    if (p.team) meta.push('👥 ' + p.team);
    if (p.role) meta.push('💼 ' + p.role);

    return '<article class="pro-card r" ' + delay(i, 0.07) + '>' +
             '<div class="pro-card-top">' +
               '<span class="pro-badge">' + p.badge + '</span>' +
               '<span class="pro-period">' + p.period + '</span>' +
             '</div>' +
             '<h3 class="pro-title">' + p.title + '</h3>' +
             '<div class="pro-meta">' + meta.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</div>' +
             (p.supervisor ? '<div class="pro-supervisor">' + p.supervisor + '</div>' : '') +
             '<ul class="pro-buls">' + p.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>' +
             (p.award ? '<span class="award-tag">🏆 ' + p.award + '</span>' : '') +
             '<div class="pro-foot">' +
               '<div class="tags">' + p.tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</div>' +
               (p.link ? '<a class="repo-link" href="' + p.link + '" target="_blank" rel="noopener">' + repoIcon() + ' View repository</a>' : '') +
             '</div>' +
           '</article>';
  }

  function academicCard(p, i) {
    return '<article class="acad-card r" ' + delay(i, 0.08) + '>' +
             '<div class="acad-num">' + String(i + 1).padStart(2, '0') + '</div>' +
             '<h3 class="acad-title">' + p.title + '</h3>' +
             '<p class="acad-date">' + p.period + ' · ' + p.meta + '</p>' +
             '<p class="acad-desc">' + p.desc + '</p>' +
             '<div class="pro-foot">' +
               '<div class="tags">' + p.tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</div>' +
               (p.link ? '<a class="repo-link" href="' + p.link + '" target="_blank" rel="noopener">' + repoIcon() + ' View repository</a>' : '') +
             '</div>' +
           '</article>';
  }

  function repoIcon() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>';
  }

  // Landing page — featured professional work only.
  function renderFeaturedProjects() {
    var el = mount('projects-featured');
    if (!el) return;
    var featured = D.projects.professional.filter(function (p) { return p.featured; });
    el.innerHTML = featured.map(professionalCard).join('');

    var link = mount('projects-viewall');
    if (link) {
      link.innerHTML = '<a href="projects.html">View all ' + totals.projects + ' projects &nbsp;→</a>';
    }
  }

  // Projects page — the full catalogue.
  function renderAllProjects() {
    var pro = mount('projects-professional');
    if (pro) pro.innerHTML = D.projects.professional.map(professionalCard).join('');

    var acad = mount('projects-academic');
    if (acad) acad.innerHTML = D.projects.academic.map(academicCard).join('');

    var count = mount('projects-count');
    if (count) {
      count.textContent = D.projects.professional.length + ' professional projects and ' +
                          D.projects.academic.length + ' academic projects.';
    }
  }

  /* ── Certifications ───────────────────────────────────────────────────── */

  function renderCertifications() {
    var el = mount('certifications');
    if (!el) return;

    var sorted = D.certifications.slice().sort(function (a, b) { return b.sortKey - a.sortKey; });
    var visible = D.certsVisible;

    function card(c, i, hidden) {
      var iss = D.certIssuers[c.issuer] || { label: c.issuer, badge: '?', cls: '' };
      return '<div class="cert-card' + (hidden ? '' : ' r') + '" ' + (hidden ? '' : delay(i, 0.03)) + '>' +
               '<div class="cert-ico ' + iss.cls + '">' + iss.badge + '</div>' +
               '<div>' +
                 '<div class="cert-issuer">' + iss.label + '</div>' +
                 '<div class="cert-name">' + c.name + '</div>' +
                 '<div class="cert-date">' + c.date + '</div>' +
               '</div>' +
             '</div>';
    }

    el.innerHTML =
      sorted.slice(0, visible).map(function (c, i) { return card(c, i, false); }).join('') +
      '<div id="certs-extra">' +
        sorted.slice(visible).map(function (c, i) { return card(c, i, true); }).join('') +
      '</div>';

    var btn = document.getElementById('certs-more-btn');
    if (btn) {
      if (sorted.length <= visible) {
        btn.parentNode.style.display = 'none';
      } else {
        btn.dataset.total = sorted.length;
        btn.textContent = 'Show all ' + sorted.length + ' certifications →';
      }
    }
  }

  /* ── Contact ──────────────────────────────────────────────────────────── */

  function renderContact() {
    var chips = mount('contact-chips');
    if (chips) {
      chips.innerHTML =
        '<span class="chip">📍 ' + D.profile.location + '</span>' +
        '<span class="chip">🏢 ' + D.profile.company + '</span>' +
        '<span class="chip chip-live">🟢 Open to opportunities</span>';
    }

    var cards = mount('contact-cards');
    if (!cards) return;

    var gh = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>';
    var li = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';

    var entries = [
      { href: 'mailto:' + D.profile.email, icon: '✉️', label: 'Email', value: D.profile.email, ext: false },
      { href: D.profile.github,   icon: gh, label: 'GitHub',   value: 'github.com/pdz1804', ext: true },
      { href: D.profile.linkedin, icon: li, label: 'LinkedIn', value: 'linkedin.com/in/quangphunguyen', ext: true },
    ];

    if (D.profile.resume.enabled) {
      entries.push({ href: D.profile.resume.path, icon: '📄', label: 'Résumé',
                     value: D.profile.resume.label + ' (PDF)', ext: false, download: true });
    }

    cards.innerHTML = entries.map(function (e) {
      return '<a href="' + e.href + '"' +
               (e.ext ? ' target="_blank" rel="noopener noreferrer"' : '') +
               (e.download ? ' download' : '') +
               ' class="contact-card">' +
               '<div class="contact-card-ico">' + e.icon + '</div>' +
               '<div>' +
                 '<div class="contact-card-label">' + e.label + '</div>' +
                 '<div class="contact-card-value">' + e.value + '</div>' +
               '</div>' +
             '</a>';
    }).join('');
  }

  /* ── Boot ─────────────────────────────────────────────────────────────── */

  window.renderPortfolio = function () {
    renderNav();
    renderHero();
    renderAbout();
    renderExperience();
    renderSkills();
    renderEducation();
    renderHonors();
    renderFeaturedProjects();
    renderAllProjects();
    renderCertifications();
    renderContact();
    renderFooter();
  };

  window.renderPortfolio();

})(window, document);
