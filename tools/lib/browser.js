/* =============================================================================
   Browser selection for the suites.
   =============================================================================
       BROWSER=firefox node tools/verify-design.js      (chromium | firefox | webkit)

   Chromium is the default. Firefox and WebKit run the same checks so an
   engine-specific break (CSS support, event timing, storage) is caught in CI.
============================================================================= */

'use strict';

const playwright = require('playwright');

const NAME = (process.env.BROWSER || 'chromium').toLowerCase();
if (!['chromium', 'firefox', 'webkit'].includes(NAME)) {
  console.error(`BROWSER must be chromium, firefox or webkit (got "${NAME}")`);
  process.exit(2);
}

function launch() { return playwright[NAME].launch(); }

/* Firefox has no mobile emulation flag; touch input still works without it. */
function phoneContext(width, height) {
  const o = { viewport: { width, height }, hasTouch: true };
  if (NAME !== 'firefox') o.isMobile = true;
  return o;
}

module.exports = { launch, phoneContext, NAME };
