/* =============================================================================
   Scaffold a new design.
   =============================================================================
       node tools/new-design.js <id> "<Display name>"
       node tools/new-design.js aurora "Aurora"

   Creates designs/<id>/{design.js,main.css}, adds one entry to
   designs/registry.js, and stops there. The starter renders every part of the
   data in plain markup, so it already passes the contract suite:

       DESIGN=<id> node tools/verify-design.js

   Then restyle it. Read docs/DESIGNS.md for the contract (ctx, lifecycle,
   shared section ids) before changing the markup.
============================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const [id, name] = process.argv.slice(2);

if (!id || !name || !/^[a-z][a-z0-9-]{1,30}$/.test(id)) {
  console.error('usage: node tools/new-design.js <id> "<Display name>"   (id: lowercase letters, digits, dashes)');
  process.exit(2);
}

const dir = path.join(ROOT, 'designs', id);
const registry = path.join(ROOT, 'designs', 'registry.js');
if (fs.existsSync(dir)) { console.error('designs/' + id + ' already exists.'); process.exit(1); }
const reg = fs.readFileSync(registry, 'utf8');
if (new RegExp("id:\\s*'" + id + "'").test(reg)) { console.error('"' + id + '" is already registered.'); process.exit(1); }

const DESIGN_JS = `/* =============================================================================
   ${name.toUpperCase()} — design entry point.
   =============================================================================
   Contract (see docs/DESIGNS.md):
     mount(root, ctx)   fill \`root\` (the #app element) and start behaviour.
   ctx gives you:
     ctx.data    the PORTFOLIO object from assets/js/data.js
     ctx.vm      derived figures: totals, currentRole, experience[], honors[],
                 certs[], skills[]  (assets/js/core/view-model.js)
     ctx.life    start every listener, timer, frame loop and observer through
                 this (life.on / timeout / interval / raf / loop / observe /
                 cleanup) so switching away undoes them all
     ctx.theme   shared theme service: get(), set(), toggle(), onChange(fn)
     ctx.ready   ctx.ready(fn) runs fn once the window has loaded

   Keep the section ids below: they let a visitor keep their place when
   switching designs. Text fields in data.js are trusted HTML on purpose
   (they carry <strong> and entities); URLs and attributes go through attr().
============================================================================= */

(function (window) {
  'use strict';

  function attr(t) {
    return String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function section(id, title, body) {
    return '<section id="' + id + '" class="sec"><h2>' + title + '</h2>' + body + '</section>';
  }

  function evidence(list) {
    return (list || []).map(function (ev) {
      return '<a href="' + attr(ev.src) + '" target="_blank" rel="noopener"><img src="' + attr(ev.src) +
             '" alt="' + attr(ev.alt) + '" loading="lazy" width="160"></a>';
    }).join('');
  }

  window.PortfolioDesigns.implement('${id}', {
    mount: function (root, ctx) {
      var D = ctx.data, vm = ctx.vm, p = D.profile;

      var experience = vm.experience.map(function (e) {
        return '<article><h3>' + e.company.company + '</h3><p>' + e.tenure + ' · ' + e.company.location + '</p>' +
          e.roles.map(function (r) {
            return '<div><h4>' + r.title + '</h4><p>' + r.period + ' · ' + r.type + '</p><ul>' +
              r.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>' + evidence(r.evidence) + '</div>';
          }).join('') + '</article>';
      }).join('');

      var skills = vm.skills.map(function (g) {
        return '<article><h3>' + g.group.name + '</h3><ul>' +
          g.items.map(function (i) { return '<li>' + i.skill.name + ' — ' + i.meta + '</li>'; }).join('') + '</ul></article>';
      }).join('');

      var education = D.education.map(function (e) {
        return '<article><h3>' + e.institution + '</h3><p>' + e.degree + ' · ' + e.period + '</p><ul>' +
          e.details.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul></article>';
      }).join('');

      var honors = vm.honors.map(function (h) {
        return '<article><h3>' + h.title + '</h3><p>' + h.date + ' · ' + h.issuer + '</p><p>' + h.description + '</p>' + evidence(h.evidence) + '</article>';
      }).join('');

      var pro = D.projects.professional.map(function (x) {
        return '<article><h3>' + x.title + '</h3><p>' + x.period + '</p><ul>' +
          x.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul></article>';
      }).join('');
      var acad = D.projects.academic.map(function (x) {
        return '<article><h3>' + x.title + '</h3><p>' + x.period + '</p><p>' + x.desc + '</p></article>';
      }).join('');

      var shown = vm.certs.slice(0, D.certsVisible);
      var certs = '<p>' + vm.totals.certs + ' certifications</p><ul>' + shown.map(function (c) {
        return '<li>' + c.issuer.label + ' — ' + c.cert.name + ' (' + c.cert.date + ')</li>';
      }).join('') + '</ul>';

      root.innerHTML =
        '<a class="skip" href="#main">Skip to content</a>' +
        '<header class="bar"><strong>' + p.displayName + '</strong>' +
          '<button type="button" id="theme-toggle" aria-label="Toggle light and dark theme">Theme</button></header>' +
        '<main id="main">' +
          '<section id="hero" class="sec"><h1>' + p.fullName + '</h1><p>' + vm.currentRole.title + '</p><p>' + p.tagline + '</p></section>' +
          section('about', 'About', D.about.paragraphs.map(function (x) { return '<p>' + x + '</p>'; }).join('')) +
          section('experience', 'Experience', experience) +
          section('skills', 'Skills', skills) +
          section('education', 'Education', education) +
          section('honors', 'Honors', honors) +
          section('projects', 'Projects', pro + acad) +
          section('certifications', 'Certifications', certs) +
          section('contact', 'Contact',
            '<p><a href="mailto:' + attr(p.email) + '">' + p.email + '</a> · <a href="' + attr(p.github) + '">GitHub</a> · <a href="' + attr(p.linkedin) + '">LinkedIn</a></p>') +
        '</main>';

      ctx.life.on(root, 'click', function (e) {
        if (e.target.closest && e.target.closest('#theme-toggle')) ctx.theme.toggle();
      });
    },
  });

})(window);
`;

const MAIN_CSS = `/* =============================================================================
   ${name.toUpperCase()} — styles.
   Every colour is a token. The light theme redefines tokens only; never write
   [data-theme=...] .component rules (tools/verify-design.js fails on them).
============================================================================= */

:root {
  --bg: #ffffff;
  --ink: #14181f;
  --muted: #55606e;
  --line: #d6dbe2;
  --accent: #2b50d6;
}

:root[data-theme="dark"] {
  --bg: #0e131b;
  --ink: #e8ecf2;
  --muted: #9aa5b4;
  --line: #263041;
  --accent: #8ea6ff;
}

* { box-sizing: border-box; }
html { scroll-padding-top: 64px; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 400 17px/1.6 system-ui, sans-serif; }
a { color: var(--accent); }
img { max-width: 100%; height: auto; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }

.skip { position: absolute; left: -999px; top: 8px; background: var(--ink); color: var(--bg); padding: 10px 14px; }
.skip:focus { left: 16px; }

.bar { position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; align-items: center;
  padding: 8px 16px; background: var(--bg); border-bottom: 1px solid var(--line); }
.bar button { min-height: 44px; padding: 0 16px; border: 1px solid var(--line); border-radius: 8px; background: transparent; color: var(--ink); cursor: pointer; }

main { max-width: 860px; margin: 0 auto; padding: 0 16px 64px; }
.sec { padding-top: 48px; }
.sec h2 { border-bottom: 2px solid var(--ink); padding-bottom: 8px; }
article { border: 1px solid var(--line); border-radius: 10px; padding: 16px; margin: 12px 0; }
`;

const ENTRY = `
  api.add({
    id: '${id}',
    name: '${name.replace(/'/g, "\\'")}',
    description: 'Describe the look in one line',
    pages: ['home'],
    redirect: { projects: 'index.html#projects' },
    css: ['designs/${id}/main.css'],
    js: ['designs/${id}/design.js'],
  });
`;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'design.js'), DESIGN_JS);
fs.writeFileSync(path.join(dir, 'main.css'), MAIN_CSS);

const end = reg.lastIndexOf('})(window);');
fs.writeFileSync(registry, reg.slice(0, end).replace(/\s*$/, '\n') + ENTRY + '\n' + reg.slice(end));

console.log(`Created designs/${id}/ and registered "${name}".`);
console.log('Next:');
console.log(`  DESIGN=${id} node tools/verify-design.js     (should already pass)`);
console.log(`  open index.html?design=${id}                  (or use the on-page picker)`);
console.log('  restyle designs/' + id + '/main.css and the markup in design.js; see docs/DESIGNS.md');
