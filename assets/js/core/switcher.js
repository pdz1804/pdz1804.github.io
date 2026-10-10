/* =============================================================================
   SWITCHER — the on-page design picker.
   =============================================================================
   A small dropdown that lives in the top navigation of whichever design is on
   screen: a button showing the current design's name, opening a list with one
   radio per installed design.

   Where it sits: every design's nav provides an empty <span data-design-slot>;
   the picker moves itself into the current slot after each mount. A design with
   no slot gets a fixed button in the top-right corner instead, so the picker can
   never disappear.

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

  var root = document.createElement('span');
  root.className = 'pds-root';
  root.setAttribute('data-testid', 'design-switcher');

  var trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'pds-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'pds-panel');
  trigger.setAttribute('aria-label', 'Choose design');

  var triggerName = document.createElement('span');
  triggerName.className = 'pds-name';
  var chevron = document.createElement('span');
  chevron.className = 'pds-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '▾';
  trigger.appendChild(triggerName);
  trigger.appendChild(chevron);

  var panel = document.createElement('div');
  panel.className = 'pds-panel';
  panel.id = 'pds-panel';
  panel.hidden = true;

  var heading = document.createElement('div');
  heading.className = 'pds-heading';
  heading.id = 'pds-heading';
  heading.textContent = 'Design';

  var group = document.createElement('div');
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-labelledby', 'pds-heading');

  var live = document.createElement('div');
  live.className = 'pds-live';
  live.setAttribute('aria-live', 'polite');

  var buttons = designs.map(function (m) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pds-opt';
    b.setAttribute('role', 'radio');
    b.setAttribute('data-design-id', m.id);
    var title = document.createElement('span');
    title.className = 'pds-opt-name';
    title.textContent = m.name;
    b.appendChild(title);
    if (m.description) {
      var d = document.createElement('span');
      d.className = 'pds-opt-desc';
      d.textContent = m.description;
      b.appendChild(d);
    }
    group.appendChild(b);
    return b;
  });

  panel.appendChild(heading);
  panel.appendChild(group);
  root.appendChild(trigger);
  root.appendChild(panel);
  root.appendChild(live);

  /* Move into the current design's nav slot, or float in the corner. */
  function place() {
    var slot = document.querySelector('[data-design-slot]');
    var hadFocus = root.contains(document.activeElement);
    if (slot) {
      if (root.parentNode !== slot) slot.appendChild(root);
      root.classList.remove('pds-floating');
    } else if (root.parentNode !== document.body) {
      document.body.appendChild(root);
      root.classList.add('pds-floating');
    }
    if (hadFocus && !root.contains(document.activeElement)) trigger.focus();
  }

  function setOpen(open) {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      var current = buttons.filter(function (b) { return b.getAttribute('aria-checked') === 'true'; })[0] || buttons[0];
      current.focus();
    }
  }

  function sync() {
    var cur = P.current() || B.design;
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-design-id') === cur;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    triggerName.textContent = (R.get(cur) || {}).name || cur;
  }

  function choose(id) {
    var name = (R.get(id) || {}).name || id;
    P.switchDesign(id, { persist: true, source: 'picker' }).then(function () {
      place();
      sync();
      setOpen(false);
      live.textContent = 'Switched to the ' + name + ' design';
      trigger.focus();
    });
  }

  trigger.addEventListener('click', function () { setOpen(panel.hidden); });

  group.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.pds-opt');
    if (b) choose(b.getAttribute('data-design-id'));
  });

  /* Arrow keys move between options, as a radio group should; Escape closes. */
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) {
      e.stopPropagation();
      setOpen(false);
      trigger.focus();
      return;
    }
    var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (panel.hidden || !(e.key in keys)) return;
    e.preventDefault();
    var i = buttons.indexOf(document.activeElement);
    if (i < 0) i = 0;
    buttons[(i + keys[e.key] + buttons.length) % buttons.length].focus();
  });

  /* A click anywhere else closes the list. */
  document.addEventListener('click', function (e) {
    if (!panel.hidden && !root.contains(e.target)) setOpen(false);
  });

  /* Designs re-render #app, which removes the old slot: follow it. */
  window.addEventListener('portfolio:mounted', function () { place(); sync(); });

  place();
  sync();
})(window, document);
