# Handoff

State of this repo as of **30 September 2026**. Content synced with the 2026-09-30 CV
(honors, evidence images, role title). The 11 September history below is still accurate
for everything not mentioned in *Evidence images and honors*.

Live at <https://pdz1804.github.io/> — a GitHub Pages *user* site, so this repo
**is** that URL. There is no separate deployment.

## Where things stand

The site was rebuilt from a Create React App leftover into a hand-written static
site that renders itself from one content file. Content is synced with the CV in
`D:\Personal\CV` as of **11 Sep 2026** — see *Content source of truth* below for
what changed in that sync.

```
af813bd  chore: remove Create React App build output
6c779ac  refactor: rebuild site as data-driven static pages
9d872b4  fix: correct certification ordering and role-append handling
4656a77  fix: meet the 44px touch-target minimum on mobile controls
f99719c  docs: add handoff context
f12be25  fix: keep working documents out of the published site
b85ada2  content: sync portfolio with the September 2026 CV            ← live
```

Verification at the time of handoff, all against the live site:

| Suite | Result |
|---|---|
| `tools/verify-browser.js` | 67/67 |
| `tools/verify-devices.js` | 90/90 |
| `tools/verify-sw-eviction.js` | 10/10 |
| `tools/validate-data.js` | passes (2 companies · 3 roles · 48 skills · 10 projects · 37 certs) |

## The one rule

**Edit `assets/js/data.js`. Nothing else.** Counts, card numbering, animation
delays, company tenure and the "Show all N certifications" button all derive from
it. If you find yourself editing HTML to add a project, something has gone wrong.

Run `node tools/validate-data.js` afterwards — it takes no dependencies and
catches the mistakes an edit realistically introduces.

## Invariants that are easy to break

These are written down because each one has already caused a bug or a compliance
slip here.

- **Never name these clients or products anywhere on the site:** `NuSkin`,
  `Hillspire`, `Aperium`, `Prysm`. The CV content rules forbid them; use "Agentic
  ERP Platform", "wellness enterprise client", "Management Portal". The August
  build shipped "Prysm Portal" — the Sep sync renamed it. `verify-browser.js` now
  fails on any of the four.
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

## Evidence images and honors (added 2026-09-30)

The site now shows proof, not just claims. Two content shapes carry it, both driven by
`data.js`:

- `honors[]` renders the **Honors & Awards** section (`#honors`, nav entry "Honors").
  Each honor has `title`, `issuer`, `date`, integer `sortKey` (YYYYMM), `description` and
  an `evidence[]` list.
- `evidence[]` may also sit on a **role** (`experience[].roles[]`), shown under its bullets.
- An evidence entry is `{ src, alt, caption }`; files live in `images/evidence/` and open
  full size in a new tab. `renderHonors()` and `evidenceLinks()` in `render.js` do the work.

**Client and product names stay out of every text field** (title, description, caption, alt,
file name). One deliberate exception: on 2026-09-30 the owner explicitly asked for the FSoft
"Complete project with outstanding quality and progress" certificate
(`images/evidence/best-team-certificate.jpg`), which shows a client name on its face. Its
file name, alt text and caption are clean. Do not add other name-bearing images without
the same explicit say-so.

`validate-data.js` checks that every `evidence.src` exists; `verify-browser.js` checks card
counts and that every evidence image actually loads (76 checks now).

## Decisions already made

Revisit these only with a reason; each was a deliberate call.

- **Contact address is the personal Gmail, not the FPT work address.** A public
  job-seeking site should not route enquiries to the current employer's inbox.
  One line in `data.js` if that changes.
- **The published CV is a phone-free rebuild.** `assets/cv/…_CV.pdf` is built
  from the full CV (`CV_2026_10_03_hr-feedback/CV_full`, 2 pages) with the `(+84) …` header fragment removed, because a
  crawlable page should not carry a mobile number. Regeneration steps are in the
  README. The source in `D:\Personal\CV` is untouched and still has the phone.
- **Evidence with 3+ images renders as a carousel** (`evidenceCarousel` in
  `render.js`, `.ec-*` in `main.css`): looping Back/Next, dots, arrow keys, swipe.
  One or two images stay as plain thumbnails. Photos in `images/evidence/` are
  EXIF-stripped and ≤1600px (iPhone originals carry GPS, and Pages serves the
  bytes as uploaded) — strip any new photo with `magick -auto-orient -strip`.
  The Top 10 honor includes a photo naming a family member in its alt text, by
  the owner's explicit decision (2026-10-09).
- **The HCMUT transcript is published redacted.** `assets/docs/academic-transcript-hcmut.pdf` is an image-only
  rebuild with the student ID, date of birth and document number blacked out (no text layer, so nothing
  sits under the boxes). It is linked from the HCMUT education card via `education[].docs`. The unredacted
  original is on LinkedIn only, by the owner's choice (2026-10-10). Never publish the original here.
- **The landing page shows featured *professional* projects**, not academic
  coursework. Controlled by `featured: true` — currently Agentic ERP Platform,
  Healthcare Chatbot & Management Portal, M3ARAG.
- **`typedRoles` / `tagline` lead on agentic-platform work**, not the old
  "MCP integrations" framing, because that is what the current role actually is
  (see the source-of-truth note below).
- **`twitter:card` is `summary`** (small square, uses the portrait). A wide
  1200×630 card was never made — if you want a large banner preview, that is the
  outstanding task.
- **Playwright is not a dependency.** The site has zero. Install it with
  `npm install --no-save playwright` only when running the browser suites.

## Content source of truth

`D:\Personal\CV` — the authoritative file is now
**`input/profile_context_2026_09_10.md`** (the long-form profile supplied
2026-09-10), with `CV_full/CV_full.tex` and `CV_2page/CV_2page.tex` derived from
it. `Latest_Quang_Phu_Nguyen_CV.md` and older `input/`/`output/` files are stale.

`CV_README.md` in that folder carries content rules that apply here too:
never name the four clients/products above; work bullets newest→oldest; no dates
inside bullet text; education reads *graduated*, never "expected"; no proposal or
presales content; keep project-heading tech lists short.

**What the 2026-09 sync changed on the site** (baseline was the Aug 2026 build):

- **Agentic ERP Platform** — the Aug description ("Odoo / NetSuite connectors,
  MCP integrations, Slack / Jira / Confluence, query pushdown") was a guess and
  was wrong. The real project is an **enterprise AI workspace** where agents act
  inside a company's own systems: agent runtime, default-deny permission layer,
  multi-tenant admin with audit trail, user-authored Skills, Artifacts,
  Automations, plugin system. Team of 15.
- **Healthcare Agentic Chatbot & Management Portal** — role period is now
  **Nov 2025 – May 2026** (ended), was "Nov 2025 – Present". "Prysm Portal"
  renamed to "Management Portal".
- **Blog System** — team of 2, was "team of 4".
- **Detect AI-generated Text** — now links
  `github.com/Frankie2030/PIProject-detect-ai-essay`.
- **Skills** — 7 groups / 36 items → **8 groups / 48 items**; adds Google Cloud,
  Temporal, LangGraph, PEFT/LoRA, Sentence-Transformers, spaCy/NLTK/Gensim,
  ArgoCD, and a new **Observability & Quality** group (OpenTelemetry, Prometheus,
  Sentry, Arize Phoenix, SonarQube, Backstage, W&B). Dropped "vLLM / Cohere
  Rerank" — not in the authoritative profile.
- **Certifications** — unchanged. The 37-entry list already matches the fuller
  LinkedIn-derived list `CV_full` uses; the profile context's cert section is an
  acknowledged subset.
- **Role title** — *superseded 2026-09-30:* the user chose **"AI Engineer" for the whole
  Nov 2025 – Present** role (one entry). LinkedIn still shows the Associate → AI Engineer
  split; the CV and this site intentionally do not.

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
- **A `README.md` overhaul is being drafted separately** — the *GitHub profile*
  README at `github.com/pdz1804/pdz1804`, not this repo's README. Local draft
  first, push only on approval.

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

## Content refresh (2026-10-04)

Synced with the 2026-10-03 HR-feedback CV set (`D:\Personal\CV\CV_2026_10_03_hr-feedback`):
role titles are "AI Engineer" everywhere; the "tens of seconds to a single query" claim was
removed (no measured numbers); healthcare chatbot now states how >90% was measured (golden
dataset by tester + BA + PM) and the 30s -> 15s -> 8s latency in two steps; ERP shows stealth
mode, ~1,000 users / ~100 DAU; the Management Portal is described as solo-built and ~2 weeks
faster customer acceptance; the ICPC Honorable Mention was added to Education. The download is
now the phone-free **full** CV (2 pages, switched from the 1-page build on 2026-10-09). Edit-in-place only: no entry was duplicated.
