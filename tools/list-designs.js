/* =============================================================================
   List the installed design ids, read straight from designs/registry.js.
   =============================================================================
       node tools/list-designs.js            ["classic","dossier"]
       node tools/list-designs.js --lines    one id per line (for shell loops)

   CI uses this to build its test matrix, so a design added to the registry is
   tested without anyone editing the workflow.
============================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function listDesigns() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'designs', 'registry.js'), 'utf8'), sandbox);
  const reg = sandbox.window.PortfolioDesigns;
  return reg.ids().map((id) => Object.assign({ id }, reg.get(id)));
}

module.exports = { listDesigns };

if (require.main === module) {
  const ids = listDesigns().map((d) => d.id);
  console.log(process.argv.includes('--lines') ? ids.join('\n') : JSON.stringify(ids));
}
