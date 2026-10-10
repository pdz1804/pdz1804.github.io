# Portfolio — working notes

Static site for <https://pdz1804.github.io/>. No framework, no build step, no
dependencies. This repo *is* the live URL (GitHub Pages user site).

**Read `docs/HANDOFF.md` before changing anything** — it carries the current
state, the decisions already made and the traps that have already caused bugs.

## The one rule

All content lives in `assets/js/data.js`. Counts, card numbering, animation
delays, company tenure and the "Show all N certifications" button derive from it.
Adding a project or a certification means editing one array — if you are editing
HTML to add content, stop and re-read the handoff.

Run `node tools/validate-data.js` after any content edit. No dependencies, exits
non-zero on error.

## Designs

The page is drawn by a *design* (`designs/<id>/`), chosen live by the on-page picker; all of them draw the
same `data.js`. Read `docs/DESIGNS.md` before touching `assets/js/core/` or any design. Shared derived
numbers live in `assets/js/core/view-model.js`, never in a design. **Classic must stay pixel-identical**
(`tools/capture-golden.js` / `compare-golden.js`). New design: `node tools/new-design.js <id> "<Name>"`.
After changing `site.url` or the profile identity run `node tools/sync-meta.js --write`.

## Invariants

- Evidence images (`images/evidence/`) should not show a client or product name from
  the list below; the only exception is `best-team-certificate.jpg`, kept by the
  owner's explicit decision (its file name, alt and caption stay clean). Honors and role evidence are declared in `data.js` (`honors[]`,
  `roles[].evidence`).
- **Never name `NuSkin`, `Hillspire`, `Aperium` or `Prysm`** anywhere on the
  site. Use "Agentic ERP Platform", "wellness enterprise client", "Management
  Portal". `tools/verify-browser.js` fails on any of the four.
- `sortKey` on certifications is an integer `YYYYMM`, never a decimal.
- `end: null` marks the current role; exactly one should have it. Roles render
  newest-first, so `push()` is safe.
- Skill bar widths come from `level` via `SKILL_LEVELS`, never a hand-tuned
  percentage.
- Every colour is a token. The light theme redefines tokens only — no
  `[data-theme=…] .component` rules.
- **Do not delete `service-worker.js`.** It is a tombstone that unregisters the
  old Workbox worker still installed in returning visitors' browsers.

## Verifying

CI (`.github/workflows/quality.yml`) runs `validate-data`, `check-published`, `sync-meta`, the view-model
test, a per-design contract matrix and both browser suites on every push to `main` and every PR. Pages deploys from `main` regardless, so CI reports
after the fact; treat a red run as something already live that needs fixing.

```sh
node tools/validate-data.js                                     # always
node tools/check-published.js                                   # always: PDFs, EXIF, forbidden names, refs
npm install --no-save playwright                                # for the rest
node tools/verify-browser.js                                    # 98 checks
TARGET=https://pdz1804.github.io node tools/verify-devices.js   # 90 checks
node tools/verify-design.js                                     # every design: data, a11y, themes, switch leaks
node tools/verify-switching.js                                  # live switching and fallbacks
node tools/test-view-model.js && node tools/sync-meta.js        # derivations; static meta equals data.js
```

Content source of truth is `D:\Personal\CV` — the authoritative file is
`input/profile_context_2026_09_10.md`, with `CV_full` and `CV_2page` derived
from it. Last synced 11 Sep 2026. Its `CV_README.md` content rules apply here too.
