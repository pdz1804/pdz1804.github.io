/* =============================================================================
   VIEW-MODEL — everything a design needs that is *derived* from data.js.
   =============================================================================
   Pure: PortfolioVM.build(data, levels, now) reads its arguments and nothing
   else (no DOM, no window), so it runs under plain Node (tools/test-view-model.js).

   Only derivations that more than one design needs live here — totals, tenure,
   the current role, sort orders. Anything specific to one look (ranked tags,
   nav counts, card state) stays inside that design's folder, so adding a design
   never forces a change to this file.
============================================================================= */

(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PortfolioVM = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  function parseMonth(s) {
    if (!s) return null;
    var p = s.split('-');
    return { y: +p[0], m: +p[1] };
  }

  function monthsBetween(from, to) {
    return (to.y - from.y) * 12 + (to.m - from.m);
  }

  /* `now` is injectable so tests do not depend on the clock. */
  function monthOf(now) {
    return { y: now.getFullYear(), m: now.getMonth() + 1 };
  }

  /* "1 yr 3 mos" — inclusive of the current month. */
  function humanDuration(months) {
    months = Math.max(months, 1);
    var y = Math.floor(months / 12), m = months % 12, out = [];
    if (y) out.push(y + ' yr' + (y > 1 ? 's' : ''));
    if (m) out.push(m + ' mo' + (m > 1 ? 's' : ''));
    return out.join(' ') || '1 mo';
  }

  /* Total span across a company's roles, counting an open role up to today. */
  function companyTenure(company, now) {
    var starts = [], ends = [], open = false;
    company.roles.forEach(function (r) {
      var s = parseMonth(r.start);
      if (s) starts.push(s);
      if (r.end === null) open = true;
      else { var e = parseMonth(r.end); if (e) ends.push(e); }
    });
    if (!starts.length) return '';
    var first = starts.reduce(function (a, b) { return monthsBetween(b, a) > 0 ? b : a; });
    var last = open ? monthOf(now)
                    : ends.reduce(function (a, b) { return monthsBetween(a, b) > 0 ? b : a; }, first);
    return humanDuration(monthsBetween(first, last) + 1);
  }

  function yearsSince(ym, now) {
    var start = parseMonth(ym);
    if (!start) return 0;
    return Math.floor(monthsBetween(start, monthOf(now)) / 12);
  }

  /* Newest first, so appending a promotion with push() lands at the top. */
  function byStartDesc(a, b) {
    return (b.start || '').localeCompare(a.start || '');
  }

  function build(D, levels, now) {
    now = now || new Date();
    levels = levels || {};

    var allRoles = D.experience.reduce(function (acc, co) { return acc.concat(co.roles); }, []);
    /* The open role, wherever it sits in the array — not simply the first. */
    var currentRole = allRoles.filter(function (r) { return r.end === null; })
                              .sort(byStartDesc)[0] || allRoles[0] || null;

    var totals = {
      years:    yearsSince(D.profile.careerStart, now),
      projects: D.projects.professional.length + D.projects.academic.length,
      certs:    D.certifications.length,
    };

    /* Stable sort: equal sortKey keeps the order written in data.js. */
    var honors = D.honors.map(function (h, i) { return { h: h, i: i }; })
      .sort(function (a, b) { return (b.h.sortKey - a.h.sortKey) || (a.i - b.i); })
      .map(function (x) { return x.h; });

    var certs = D.certifications.slice()
      .sort(function (a, b) { return b.sortKey - a.sortKey; })
      .map(function (c) {
        var iss = (D.certIssuers && D.certIssuers[c.issuer]) || { label: c.issuer, badge: '?', cls: '' };
        return { cert: c, issuer: iss };
      });

    var experience = D.experience.map(function (co) {
      return {
        company: co,
        tenure: companyTenure(co, now),
        roles: co.roles.slice().sort(byStartDesc),
      };
    });

    function skillView(s) {
      return {
        skill: s,
        width: levels[s.level] || levels.intermediate,
        label: s.level.charAt(0).toUpperCase() + s.level.slice(1),
        meta: s.level.charAt(0).toUpperCase() + s.level.slice(1) + (s.years ? ' · ' + s.years + ' yr' : ''),
      };
    }

    return {
      totals: totals,
      currentRole: currentRole,
      experience: experience,
      honors: honors,
      certs: certs,
      skills: D.skills.map(function (g) {
        return { group: g, items: g.items.map(skillView) };
      }),
    };
  }

  return {
    build: build,
    parseMonth: parseMonth,
    monthsBetween: monthsBetween,
    humanDuration: humanDuration,
    companyTenure: companyTenure,
    yearsSince: yearsSince,
  };
});
