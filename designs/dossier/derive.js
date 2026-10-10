/* =============================================================================
   DOSSIER — derivations only this design needs.
   =============================================================================
   Shared figures (totals, tenure, current role, sort orders) come from ctx.vm.
   What lives here is specific to Dossier's layout: the rail's section counts,
   the single project list its filters work on, ranked technology tags, and the
   "Since Nov 2025" label on the hero card.

   Pure functions of the data, so the render code stays free of arithmetic.
============================================================================= */

(function (window) {
  'use strict';

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* "Nov 2025" from the role's own start date, so the hero card never mixes two companies. */
  function since(role) {
    var s = window.PortfolioVM.parseMonth(role.start);
    return s ? MONTHS[s.m - 1] + ' ' + s.y : '';
  }

  /* Counts shown beside the rail links and in section headers. */
  function counts(D, vm) {
    return {
      roles: D.experience.reduce(function (n, c) { return n + c.roles.length; }, 0),
      skills: D.skills.reduce(function (n, g) { return n + g.items.length; }, 0),
      honors: D.honors.length,
      projects: vm.totals.projects,
      certs: vm.totals.certs,
    };
  }

  /* Professional and academic projects as one list of the same shape. */
  function allProjects(D) {
    var pro = D.projects.professional.map(function (p) {
      return { kind: 'professional', p: p, tags: p.tags, featured: !!p.featured };
    });
    var acad = D.projects.academic.map(function (p) {
      return { kind: 'academic', p: p, tags: p.tags, featured: false };
    });
    return pro.concat(acad);
  }

  /* Most-used tags first. A tag used once is still reachable through "More tags". */
  function rankedTags(list) {
    var seen = {};
    list.forEach(function (x) { x.tags.forEach(function (t) { seen[t] = (seen[t] || 0) + 1; }); });
    return Object.keys(seen)
      .sort(function (a, b) { return seen[b] - seen[a] || a.localeCompare(b); })
      .map(function (t) { return { name: t, n: seen[t] }; });
  }

  window.DossierDerive = {
    since: since,
    counts: counts,
    allProjects: allProjects,
    rankedTags: rankedTags,
  };

})(window);
