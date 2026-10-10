/* =============================================================================
   SWITCHER — the on-page design picker.
   =============================================================================
   A small pill fixed to the bottom of the screen, one radio per installed
   design. It lives outside #app, so it survives every switch and keeps focus.

   Shown when there are at least two designs and either
     ?switcher=1 is in the URL, or
     data.js site.switcher.enabled is true and ?switcher=0 is not set.

   It is not part of any design: a design never styles or removes it.
============================================================================= */

(function (window, document) {
  'use strict';

  var R = window.PortfolioDesigns;
  var P = window.Portfolio;
  var B = window.PortfolioBoot;
  if (!R || !P || !B) return;

  var params = new URLSearchParams(window.location.search);
  var site = (window.PORTFOLIO && window.PORTFOLIO.site) || {};
  var flag = params.get('switcher');
  var enabled = flag === '1' || (flag !== '0' && !!(site.switcher && site.switcher.enabled));

  var designs = R.list();
  if (!enabled || designs.length < 2) return;

  var root = document.createElement('div');
  root.className = 'pds-root';
  root.setAttribute('data-testid', 'design-switcher');

  var label = document.createElement('span');
  label.className = 'pds-label';
  label.id = 'pds-label';
  label.textContent = 'Design';

  var group = document.createElement('div');
  group.className = 'pds-group';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-labelledby', 'pds-label');

  var live = document.createElement('div');
  live.className = 'pds-live';
  live.setAttribute('aria-live', 'polite');

  var buttons = designs.map(function (m) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pds-opt';
    b.setAttribute('role', 'radio');
    b.setAttribute('data-design-id', m.id);
    if (m.description) b.title = m.description;
    b.textContent = m.name;
    group.appendChild(b);
    return b;
  });

  root.appendChild(label);
  root.appendChild(group);
  root.appendChild(live);
  document.body.appendChild(root);

  function sync() {
    var cur = P.current() || B.design;
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-design-id') === cur;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
  }

  function choose(id, button) {
    var name = (R.get(id) || {}).name || id;
    P.switchDesign(id, { persist: true, source: 'picker' }).then(function () {
      sync();
      live.textContent = 'Switched to the ' + name + ' design';
      if (button) button.focus();
    });
  }

  group.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.pds-opt');
    if (b) choose(b.getAttribute('data-design-id'), b);
  });

  /* Arrow keys move between options, as a radio group should. */
  group.addEventListener('keydown', function (e) {
    var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    var i = buttons.indexOf(document.activeElement);
    if (i < 0) i = 0;
    var next = buttons[(i + keys[e.key] + buttons.length) % buttons.length];
    choose(next.getAttribute('data-design-id'), next);
  });

  window.addEventListener('portfolio:designchange', sync);
  sync();
})(window, document);
