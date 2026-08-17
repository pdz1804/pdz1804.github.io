# Phu Nguyen — Portfolio

Personal portfolio for **Nguyen Quang Phu**, AI Engineer at FPT Software AI Center.

**Live:** <https://pdz1804.github.io/>

A hand-built static site — no framework, no build step, no dependencies. Two HTML
pages render themselves from a single content file, so adding a project, a job or
a certification never means touching markup.

## Run it

Open `index.html` in a browser. That's the whole workflow.

For an exact match with GitHub Pages (absolute paths, service-worker behaviour),
serve it over HTTP instead:

```sh
python -m http.server 8080
# → http://localhost:8080
```

## Layout

```
index.html              landing page — semantic shell, no content
projects.html           full project catalogue — semantic shell, no content
assets/
  css/main.css          all styling for both pages
  js/data.js            ← every piece of content lives here
  js/render.js          data → DOM
  js/ui.js              theme, nav, reveal, canvas, counters, tilt
  cv/                   downloadable CV (phone-free build — see below)
images/                 profile photo and company logos
icons/                  favicons and PWA icons
tools/validate-data.js       data integrity check
tools/verify-browser.js      opt-in Playwright verification suite
tools/verify-devices.js      device matrix and touch-target check
tools/verify-sw-eviction.js  service-worker eviction check
docs/screenshots/       development screenshots (not served content)
```

## Editing content

Everything you'd want to update lives in **`assets/js/data.js`**. Nothing else
needs to change — counts, card numbering, animation timing and the "Show all N
certifications" button all derive from the data.

| To add… | Edit | Happens automatically |
|---|---|---|
| A job | the company's `roles[]` in `experience` | tenure recalculates from role dates |
| A company | `experience[]` | new logo group renders |
| A project | `projects.professional[]` or `.academic[]` | project counter, card numbering, "View all N" |
| A certification | `certifications[]` | hero counter, sort order, show-more button |
| A degree | `education[]` | card renders with optional GPA block |
| A skill | the group's `items[]` in `skills` | bar width comes from `level` |

After editing, check the data before publishing:

```sh
node tools/validate-data.js
```

It catches what an edit to `data.js` can realistically break — a certification
pointing at an issuer with no badge, a skill level with no bar width, a malformed
date that would corrupt the tenure figure, a project with no tags, a nav link to
a section that doesn't exist. Exits non-zero on error, so it can gate a commit.

For a full browser pass — both pages, both themes, desktop and mobile, reduced
motion, every link — there's an opt-in Playwright suite. It is not a dependency
of the site; install it only when you want to run it:

```sh
python -m http.server 8099          # separate terminal, repo root
npm install --no-save playwright
node tools/verify-browser.js        # 67 checks, screenshots in tools/shots/
```

Two narrower suites sit alongside it:

```sh
# Six device profiles, portrait and landscape, touch input, 44px tap targets
TARGET=http://127.0.0.1:8099 node tools/verify-devices.js

# Proves a returning visitor's cached service worker is evicted after a deploy
git worktree add --detach .swtest-old 9b18675
mkdir .swtest-new && git archive HEAD | tar -x -C .swtest-new
node tools/verify-sw-eviction.js
git worktree remove --force .swtest-old && rm -rf .swtest-new
```

Conventions worth keeping:

- Machine dates are `'YYYY-MM'`. `end: null` marks a role as current — that's
  what drives the "Current" pill and the running tenure figure.
- `period` is the human label shown on screen; keep it consistent with the
  machine dates.
- Skill bar widths come from `level` (`advanced` / `proficient` / `intermediate` /
  `familiar`), never a hand-tuned percentage. Adjust the mapping once in
  `SKILL_LEVELS` at the bottom of `data.js`.
- A new certification issuer needs one entry in `certIssuers` for its badge and
  colour.
- Certifications order by `sortKey`, an integer `YYYYMM` (e.g. `202606`). Don't
  use a decimal like `2025.12` — it sorts *below* `2025.5`. The validator
  rejects anything that isn't a valid year-month.
- Roles render newest first by `start`, so `push()` on `roles[]` is safe; the
  hero card shows whichever role has `end: null`, wherever it sits in the array.
- `featured: true` on a professional project also surfaces it on the landing page.
- Bullet strings accept inline HTML (`<strong>`, `<em>`) — write `&amp;` for a
  literal ampersand.

## Styling

`assets/css/main.css` is the only stylesheet. Every colour is a token declared in
the `:root` block; the light theme is produced solely by redefining those tokens
in the `[data-theme="light"]` block. Components never hardcode a hex value, so a
new component works in both themes without a theme-specific rule.

## Updating the CV download

`assets/cv/Nguyen_Quang_Phu_CV.pdf` is a **phone-free** build of the 2-page CV —
the source in `D:\Personal\CV\CV_2page` keeps the phone number, which should not
go on a public, crawlable page. To refresh it after a CV change:

```sh
cp -r "D:/Personal/CV/CV_2page" ./cv-build && cd cv-build
# delete the "(+84) …" phone fragment from the header block in CV_2page.tex
pdflatex CV_2page.tex && pdflatex CV_2page.tex
cp CV_2page.pdf ../assets/cv/Nguyen_Quang_Phu_CV.pdf
cd .. && rm -rf cv-build
```

Set `profile.resume.enabled` to `false` in `data.js` to hide the download
button everywhere without removing the file.

## Notes

- `service-worker.js` is a tombstone that unregisters the Workbox worker left
  behind by the previous Create React App build. Removing it would strand
  returning visitors on the old cached site. See the comments in that file.
- The site was previously built on the
  [masterPortfolio](https://github.com/ashutosh1919/masterPortfolio) template by
  [Ashutosh Hathidara](https://github.com/ashutosh1919). None of that code
  remains, but credit where it's due.

## Contact

- **GitHub** — [pdz1804](https://github.com/pdz1804)
- **LinkedIn** — [Quang Phu Nguyen](https://www.linkedin.com/in/quangphunguyen/)
- **Email** — [quangphunguyen1804@gmail.com](mailto:quangphunguyen1804@gmail.com)
