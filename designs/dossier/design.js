/* =============================================================================
   DOSSIER — design entry point.
   =============================================================================
   A fixed profile rail on the left (identity, section index with live counts,
   links) and one reading column on the right. Every list has filters built
   from the data, so the page stays scannable as the data grows.

   The shell below is the only markup this design owns; render.js fills every
   data-render mount from the data. The landing page is the whole design, so
   Dossier lists "home" only and the manifest redirects projects.html to
   index.html#projects.

   Section ids (hero, about, experience, skills, education, honors, projects,
   certifications, contact) are shared with Classic: they are what lets a
   switch keep your place on the page.
============================================================================= */

(function (window) {
  'use strict';

  var SHELL =
    '<a class="skip" href="#main">Skip to content</a>' +
    '<div id="progress" aria-hidden="true"></div>' +
    '<aside class="rail" id="rail" data-render="rail" aria-label="Profile and navigation"></aside>' +
    '<main id="main" class="content">' +

    '<section id="hero" data-testid="hero-section">' +
      '<div class="hero-grid"><div>' +
        '<div class="avail"><i class="pulse" aria-hidden="true"></i><span data-render="hero-availability"></span></div>' +
        '<h1 class="hero-name" data-render="hero-name"></h1>' +
        '<p class="hero-role"><span id="typed"></span><i class="caret" aria-hidden="true"></i></p>' +
        '<p class="hero-desc" data-render="hero-tagline"></p>' +
        '<div class="cta-row" data-render="hero-cta"></div>' +
      '</div><aside class="now" data-render="hero-card" aria-label="Current role"></aside></div>' +
      '<div class="stats" data-render="hero-stats" role="list"></div>' +
      '<div class="ticker" aria-hidden="true"><div class="ticker-track" data-render="hero-floaters"></div></div>' +
    '</section>' +

    section('about', '01', 'About', 'Who I am and what I specialise in.', '',
      '<div class="about-grid"><div class="about-text" data-render="about-text"></div>' +
      '<div class="about-cards" data-render="about-cards"></div></div>') +

    section('experience', '02', 'Experience', 'Production AI systems, from research to live deployment.', 'experience',
      '<div class="exp-list" data-render="experience"></div>') +

    section('skills', '03', 'Skills', 'Bar length comes from the level, never a hand-tuned number.', 'skills',
      '<div class="skills-grid" data-render="skills"></div>') +

    section('education', '04', 'Education', 'Foundations in AI and computer science.', '',
      '<div class="edu-grid" data-render="education"></div>') +

    section('honors', '05', 'Honors', 'Competition and workplace recognition, with the certificates as evidence.', 'honors',
      '<div class="honors-list" data-render="honors"></div>') +

    section('projects', '06', 'Projects', 'Professional, research and personal work. Filters build themselves from the data.', 'projects',
      '<div class="filters" data-render="project-filters" role="toolbar" aria-label="Filter projects"></div>' +
      '<p class="result-note" data-render="project-note" aria-live="polite"></p>' +
      '<div class="proj-grid" data-render="projects"></div>') +

    section('certifications', '07', 'Certifications', 'Continuous learning across AI, cloud and ML platforms.', 'certifications',
      '<div class="filters" data-render="cert-filters" role="toolbar" aria-label="Filter certifications by issuer"></div>' +
      '<div class="certs-grid" data-render="certifications"></div>' +
      '<div class="more-row"><button type="button" id="certs-more" class="btn ghost" aria-expanded="false"></button></div>') +

    '<section id="contact" class="section" data-testid="contact-section"><div class="contact"><div>' +
      '<h2>Let\'s work together.</h2>' +
      '<p>Whether it\'s a new AI project, a research collaboration or a full-time role, I\'d love to connect.</p>' +
      '<div class="chips" data-render="contact-chips"></div></div>' +
      '<div class="contact-cards" data-render="contact-cards"></div></div></section>' +

    '<footer class="foot" data-render="footer"></footer>' +
    '</main>' +
    '<button id="to-top" type="button" aria-label="Back to top">↑</button>';

  function section(id, no, title, blurb, countKey, body) {
    return '<section id="' + id + '" class="section" data-testid="' + id + '-section">' +
      '<header class="sec-head"><span class="sec-no">' + no + '</span><div><h2>' + title + '</h2><p>' + blurb + '</p></div>' +
      (countKey ? '<span class="sec-count" data-count="' + countKey + '"></span>' : '') + '</header>' + body + '</section>';
  }

  window.PortfolioDesigns.implement('dossier', {
    mount: function (root, ctx) {
      root.innerHTML = SHELL;
      var ui = window.DossierUI.create(ctx, root);
      window.DossierRender.start(ctx, root, ui.refresh);

      // The browser suites and older tooling read these.
      window.PORTFOLIO_TOTALS = ctx.vm.totals;
      window.renderPortfolio = function () { return window.Portfolio.rerender(); };
      ctx.life.cleanup(function () {
        delete window.PORTFOLIO_TOTALS;
        delete window.renderPortfolio;
      });
    },
  });

})(window);
