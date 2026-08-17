# Handoff

State of this repo as of **17 August 2026**, deployed commit `4656a77`.

Live at <https://pdz1804.github.io/> — a GitHub Pages *user* site, so this repo
**is** that URL. There is no separate deployment.

## Where things stand

The site was rebuilt from a Create React App leftover into a hand-written static
site that renders itself from one content file. Content is synced with the CV in
`D:\Personal\CV` as of 17 Aug 2026. Everything mechanically checkable has been
verified against the live host.

```
af813bd  chore: remove Create React App build output
6c779ac  refactor: rebuild site as data-driven static pages
9d872b4  fix: correct certification ordering and role-append handling
4656a77  fix: meet the 44px touch-target minimum on mobile controls   ← live
```

Verification at the time of handoff, all against the live site:

| Suite | Result |
|---|---|
| `tools/verify-browser.js` | 67/67 |
| `tools/verify-devices.js` | 90/90 |
| `tools/verify-sw-eviction.js` | 10/10 |
| `tools/validate-data.js` | passes |

## The one rule

**Edit `assets/js/data.js`. Nothing else.** Counts, card numbering, animation
delays, company tenure and the "Show all N certifications" button all derive from
it. If you find yourself editing HTML to add a project, something has gone wrong.

Run `node tools/validate-data.js` afterwards — it takes no dependencies and
catches the mistakes an edit realistically introduces.

## Invariants that are easy to break

These are written down because each one has already caused a bug here.

- **`sortKey` is an integer `YYYYMM`, never a decimal.** This originally shipped
  as `year: 2025.12`, which sorts *below* `2025.5` — December 2025 was buried at
  position 33 of 37. The validator now rejects malformed keys.
- **`end: null` marks the current role**, and exactly one role should have it.
  Roles render newest-first by `start`, so `push()` is safe. The hero card shows
  whichever role is open, wherever it sits in the array.
- **Skill bar widths come from `level`**, mapped in `SKILL_LEVELS` at the bottom
  of `data.js`. Never hand-tune a percentage.
- **Every colour is a token.** The light theme is produced solely by redefining
  tokens in the `[data-theme="light"]` block — there are no
  `[data-theme=…] .component` overrides, and adding one would break the pattern.
- **`service-worker.js` is a tombstone. Do not delete it.** Browsers that visited
  before 14 Jun 2026 still have the old Workbox worker installed and answer
  navigations from its cache; deleting the file strands them on the old site
  permanently. It can go once that traffic has aged out — say mid-2027.

## Decisions already made

Revisit these only with a reason; each was a deliberate call.

- **Contact address is Gmail, not `phunq15@fpt.com`.** A public job-seeking site
  should not route enquiries to the current employer's inbox. One line in
  `data.js` if that changes.
- **The published CV is a phone-free rebuild.** `assets/cv/…_CV.pdf` is built
  from `CV_2page` with the `(+84) …` header fragment removed, because a
  crawlable page should not carry a mobile number. Regeneration steps are in the
  README. The source in `D:\Personal\CV` is untouched and still has the phone.
- **The landing page shows featured *professional* projects**, not academic
  coursework. With seven professional projects, leading on coursework undersold
  the work. Controlled by `featured: true`.
- **`twitter:card` is `summary`** (small square, uses the portrait). A wide
  1200×630 card was never made — if you want a large banner preview, that is the
  outstanding task.
- **Playwright is not a dependency.** The site has zero. Install it with
  `npm install --no-save playwright` only when running the browser suites.

## Content source of truth

`D:\Personal\CV\CV_full\CV_full.tex` and `CV_2page\CV_2page.tex`, last synced
17 Aug 2026. `CV_README.md` in that folder carries content rules that apply here
too — notably: the June 2026 platform is referred to **only** as the *Agentic ERP
Platform*, never its internal name; education reads *graduated*, never
"expected"; no proposal or presales content.

Note the two CVs differ slightly. `CV_full` lists two personal projects,
`CV_2page` lists three (it keeps *Detect AI-generated Text*). The site follows
the 2-page version.

## Gotchas discovered the hard way

Worth reading before debugging something that looks broken.

- **`IntersectionObserver` and `requestAnimationFrame` do not run in a
  backgrounded tab.** Scroll reveals, the stat counters and the active-nav
  highlight will all look broken when driven headlessly without a screenshot
  forcing a paint. Twice this looked like a real bug and was not.
- **`scroll-behavior: smooth` animates programmatic `scrollTo`,** so a test loop
  requesting y=4000 may still be at 3127 when the next call fires. The suites
  neutralise it during scroll sweeps. Wheel scrolling is unaffected.
- **`canvas` is a replaced element** — `position: absolute; inset: 0` resolves to
  its intrinsic 300×150 rather than stretching. It needs explicit
  `width/height: 100%`.
- **`background-clip: text` cannot paint behind `inline-block` children.** The
  gradient surname must stay a single element; wrapping its letters in animated
  spans renders it invisible.

## What is actually left

- **Tap feel and outdoor legibility on a real phone.** Six device profiles pass
  at 44px minimum, but that is geometry, not ergonomics.
- **Optionally a 1200×630 social card**, if a large link preview matters.
- **Eventually remove the service-worker tombstone** (see above).

## Verifying after a change

```sh
node tools/validate-data.js                                     # always; no deps

npm install --no-save playwright                                # only for the rest
python -m http.server 8099                                      # separate terminal
node tools/verify-browser.js                                    # 67 checks
TARGET=http://127.0.0.1:8099 node tools/verify-devices.js       # 90 checks
```

`tools/verify-sw-eviction.js` needs both trees prepared first; see the header
comment in that file.
