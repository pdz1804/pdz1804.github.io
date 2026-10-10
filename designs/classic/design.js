/* =============================================================================
   CLASSIC — design entry point.
   =============================================================================
   The original look of the site: centred sections, animated hero, particle
   field. It renders into the static skeleton already present in #app (the same
   markup crawlers and no-JS visitors see), then ClassicUI wires its behaviour.

   Contract (see designs/registry.js): mount(root, ctx) renders and wires,
   unmount() is optional because ctx.life already undoes listeners and timers.
============================================================================= */

(function (window) {
  'use strict';

  window.PortfolioDesigns.implement('classic', {
    mount: function (root, ctx) {
      window.ClassicRender.render(ctx);
      window.ClassicUI.init(ctx);

      // Older tooling and the browser suites read these two.
      window.PORTFOLIO_TOTALS = ctx.vm.totals;
      window.renderPortfolio = function () { return window.Portfolio.rerender(); };
      ctx.life.cleanup(function () {
        delete window.PORTFOLIO_TOTALS;
        delete window.renderPortfolio;
      });
    },
  });

})(window);
