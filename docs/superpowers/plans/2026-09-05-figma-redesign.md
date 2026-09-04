# Figma Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the entire live static site to match the Figma design at `https://www.figma.com/design/WJDWWp53hYvOktF7dxvuMT/HNO-Praxis-Dr.-Mayer-Brix?node-id=13-43` exactly — new color palette, new typography (a licensed display font + Inter for body), restructured section layouts, a real accordion, a redesigned overlay-card banner, and a new third-party booking widget — while keeping every existing functional module (Vimeo facade, banner fetch/render, 360° embed, PayPal integrations) working, minus the contact form and the old medatixx booking link, both explicitly dropped per the user.

**Architecture:** Same plain HTML/CSS/vanilla-JS site, same file structure. This plan changes `assets/css/styles.css`'s design tokens wholesale, restructures markup section-by-section in all 3 HTML files to match the Figma layout, adds two new JS behaviors (banner dismiss, accordion toggle), and adds a third-party widget script pair. No new build tooling.

**Tech Stack:** Unchanged — plain HTML5/CSS3/vanilla JS, `node:test`, Netlify.

**Design source:** Figma file `WJDWWp53hYvOktF7dxvuMT`, node `13:43` — fetched in full via `get_design_context` this session (exact colors/fonts/spacing/copy captured in every task below). This plan supersedes the "faithful modernization" visual decisions in `docs/superpowers/specs/2026-09-04-static-rebuild-design.md` for anything this plan's tasks explicitly change; that spec's non-visual decisions (Decap CMS banner architecture, Netlify Forms — now removed per this plan, embed-portability facts) still stand.

## Global Constraints

- No frontend framework, no bundler, no build step for page markup.
- New design tokens (replace Task-1-era values in `assets/css/styles.css`'s `:root`):
  - `--color-brand: #00a2b5` (PMB Brand Mint — replaces the old `#009bc7`)
  - `--color-ink: #231f20` (PMB Brand Charcoal)
  - `--color-grey: #bdbcbc` (PMB Brand Grey)
  - `--color-bg-light: #f5f5f5` (slight-grey-bg, section alternation)
  - `--color-bg-dark: #4f4d49` (grey-bg, dark sections)
  - `--color-paper: #ffffff`
  - Keep `--space-*`, `--container-width`, `--gutter-mobile` names from Task 1; adjust values only where a task below says so.
- New fonts: `--font-heading: 'Goudy Sans', -apple-system, sans-serif` self-hosted from the licensed `resources/ITC Goudy Sans Std/ITC Goudy Sans Std Medium.otf` (already converted to `assets/fonts/goudy-sans-medium.woff2` — one weight only, the design uses Medium everywhere); `--font-body: 'Inter', -apple-system, sans-serif` self-hosted from `assets/fonts/inter-variable.woff2` (already downloaded — a variable font covering weights 500/600/700 via 3 separate `@font-face` rules sharing one `src`, which is the correct modern pattern for a variable font, not a workaround).
- Type scale (exact, from Figma): h2 = 32px/1.2 Goudy Medium; h3 = 24px/1.5 Goudy Medium; h4 = 20px/1.3 Goudy Medium; body = 16px/1.5 Inter 500; highlight/uppercase-label = 16px/1.5 Inter 600; body-sm = 14px/1.5 Inter 500. Convert px to rem at a 16px root (32px→2rem, 24px→1.5rem, 20px→1.25rem).
- Content column max-width 720px, centered; section horizontal padding 80px desktop / proportionally less on mobile (use the existing `--gutter-mobile` pattern — 80px is a desktop-only value, do not apply it below the existing 64rem breakpoint).
- Mobile-first CSS, `min-width` media queries only, breakpoints from the existing set {30rem, 48rem, 64rem, 80rem}.
- **Dropped per explicit user decision:** the Kontakt contact form (`.kontakt-form`, its Netlify Forms wiring) — remove entirely, do not carry it into the new design.
- **Dropped per explicit user decision:** the medatixx booking link and any "Termin buchen" button/pill anywhere in the site (header nav CTA, hero CTA). Replaced by the 321med floating widget (Task 8), which is global and needs no link target.
- **Real content, not placeholder:** every text string in the Figma design context is real copy (verified against the design's own extracted text) — reproduce it verbatim. The one exception is the announcement-bar's example text in the Figma mockup ("...geschlossen bleiben vom 31.8. bis 4.9.2026...") — this is a stale mockup example; keep the site's actual current `content/banner.json` message content unchanged, only restyle the banner's container/position/dismiss behavior.
- The four Leistungen accordion items get real expand/collapse behavior even though every panel is currently empty (father will add panel content later, per his explicit instruction) — build the toggle mechanism now with an empty-but-present content slot per item.

---

### Task 1: Design tokens, fonts, header/nav restyle

**Files:**
- Modify: `assets/css/styles.css` (replace `:root` tokens, add new `@font-face` rules, rewrite header/nav rules)
- Modify: `index.html`, `impressum.html`, `datenschutz.html` (header/nav markup — remove the "Termin buchen" CTA link entirely from `.site-nav`)
- Delete: `assets/fonts/jost-400.woff2`, `assets/fonts/jost-500.woff2`, `assets/fonts/roboto-400.woff2`, `assets/fonts/roboto-700.woff2` (superseded — nothing will reference them after this task)

**Interfaces:**
- Produces: updated `--color-brand`, `--color-ink`, `--color-grey`, `--color-bg-light`, `--color-bg-dark`, `--color-paper`, `--font-heading`, `--font-body` tokens — every later task's CSS uses these names (unchanged names, new values/fonts).

- [ ] **Step 1: Replace `:root` tokens and add new `@font-face` rules in `assets/css/styles.css`**

Replace the existing `:root` block and the Task-11 `@font-face`/`--font-heading` block with:

```css
@font-face {
  font-family: 'Goudy Sans';
  src: url('../fonts/goudy-sans-medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter-variable.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter-variable.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter-variable.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  --color-brand: #00a2b5;
  --color-ink: #231f20;
  --color-grey: #bdbcbc;
  --color-bg-light: #f5f5f5;
  --color-bg-dark: #4f4d49;
  --color-paper: #ffffff;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4rem;
  --container-width: 71rem;
  --gutter-mobile: 1.25rem;
  --gutter-desktop: 5rem;
  --font-heading: 'Goudy Sans', -apple-system, 'Segoe UI', sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', sans-serif;
}

body {
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--color-ink);
  background: var(--color-paper);
  line-height: 1.5;
  font-size: 16px;
}

h1, h2, h3, h4 {
  font-family: var(--font-heading);
  font-weight: 500;
  line-height: 1.2;
  color: var(--color-ink);
}
h2 { font-size: 2rem; }
h3 { font-size: 1.5rem; line-height: 1.5; }
h4 { font-size: 1.25rem; line-height: 1.3; }

a { color: var(--color-ink); }
a:focus-visible, button:focus-visible { outline: 3px solid var(--color-brand); outline-offset: 2px; }

.container {
  width: 100%;
  max-width: var(--container-width);
  margin-inline: auto;
  padding-inline: var(--gutter-mobile);
}

.uppercase-label {
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-brand);
  font-size: 1rem;
}

@media (min-width: 64rem) {
  .container { padding-inline: var(--gutter-desktop); }
}
```

Note: `.button`, `.button--primary` and other component classes from earlier tasks stay in the file for now — later tasks in this plan rewrite or remove the ones the new design no longer uses. Don't delete component rules speculatively in this step; only touch `:root`, body/heading base styles, `.container`, and add `.uppercase-label`.

- [ ] **Step 2: Delete the superseded font files**

```bash
rm assets/fonts/jost-400.woff2 assets/fonts/jost-500.woff2 assets/fonts/roboto-400.woff2 assets/fonts/roboto-700.woff2
```

- [ ] **Step 3: Rewrite header/nav CSS**

Replace the Task-1 `.site-header`, `.site-header__bar`, `.nav-toggle`, `.site-nav`, `.site-nav__cta` rules with (drop `.site-nav__cta` entirely — no CTA in the new nav):

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-paper);
}

.site-header__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: var(--space-5);
}

.site-header__logo img { height: 3rem; width: auto; }

.nav-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid var(--color-grey);
  border-radius: 0.5rem;
  background: var(--color-paper);
  cursor: pointer;
}
.nav-toggle span, .nav-toggle span::before, .nav-toggle span::after {
  display: block; width: 1.25rem; height: 2px; background: var(--color-ink); position: relative;
}
.nav-toggle span::before { content: ''; position: absolute; top: -6px; }
.nav-toggle span::after { content: ''; position: absolute; top: 6px; }

.site-nav {
  display: none;
  flex-direction: column;
  gap: var(--space-2);
  padding-block: var(--space-3);
  border-top: 1px solid var(--color-grey);
}
.site-nav.is-open { display: flex; }
.site-nav a {
  display: block;
  padding: var(--space-2) 0;
  color: var(--color-ink);
  text-decoration: none;
  font-family: var(--font-heading);
  font-size: 1rem;
}
.site-nav a:hover, .site-nav a.is-current { color: var(--color-brand); }

@media (min-width: 64rem) {
  .nav-toggle { display: none; }
  .site-nav {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space-6);
    border-top: none;
    padding-block: 0;
  }
  .site-nav a { padding: 0; font-size: 1.125rem; }
}
```

- [ ] **Step 4: Remove the "Termin buchen" CTA from the header markup on all 3 pages**

In `index.html`, `impressum.html`, `datenschutz.html`, delete this line from inside `<nav class="site-nav container" id="site-nav">`:

```html
<a class="site-nav__cta" href="https://webtermin.medatixx.de/#/bec45e38-6a42-46f2-a0da-36f22b64ebee/search">Termin buchen</a>
```

Leave the 7 plain nav links (`Willkommen`, `Leistungen`, `Team`, `Einblicke`, `Unser Buch`, `Fachartikel`, `Kontakt`) as they are. On `index.html` only, add `class="is-current"` to the `Willkommen` link (matches the design's mint-colored active state; the other two pages have no equivalent "current" link since they're not one of the 7 sections).

- [ ] **Step 5: Verify in the browser**

Serve locally (`python3 -m http.server 4173`), screenshot mobile and desktop on all 3 pages. Expect: new logo size, no CTA pill anywhere in the nav, "Willkommen" shown in mint on the homepage nav, hamburger menu still opens/closes/closes-on-link-click (Task 13's fix) using the new colors. Confirm `read_network_requests` shows `goudy-sans-medium.woff2` and `inter-variable.woff2` loading with 200, and no 404s for the deleted Jost/Roboto files (grep the HTML/CSS first to confirm nothing still references them).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Redesign: new color palette, self-hosted Goudy Sans + Inter, restyled header/nav without CTA

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Banner redesign — overlay card with working dismiss

**Files:**
- Modify: `assets/css/styles.css` (rewrite `.banner` rules)
- Modify: `assets/js/banner.js` (add dismiss behavior)
- Modify: `tests/banner.test.js` (test the new dismiss-state helper)
- Modify: `index.html`, `impressum.html`, `datenschutz.html` (banner slot markup — add a dismiss button)
- Modify: `content/banner.json` (drop the stale medatixx `linkUrl`)

**Interfaces:**
- Consumes: `renderBannerHTML`, `loadBanner` (existing, from Task 3 of the static-site-rebuild plan).
- Produces: `isBannerDismissed(): boolean` and `dismissBanner(): void`, exported from `assets/js/banner.js`, using `sessionStorage` key `"bannerDismissed"` — used by `loadBanner` (modified) and by the dismiss button's click handler (wired in `main.js`, unchanged import surface).

- [ ] **Step 1: Update `content/banner.json`** — the medatixx link is dead per the user; drop it, keep the real message:

```json
{
  "enabled": true,
  "message": "Liebe Patienten, die Praxis ist vom 24. August bis einschließlich 4. September geschlossen. Unsere Vertretung vom 24. August bis 28. August HNO Praxis Dr. Mayr, Tel. 09131 80880, und vom 31.8. bis 4.9. HNO Praxis Dr. Krause, Tel. 0911 774890.\n\nSollten Sie uns telefonisch nicht erreichen, schreiben Sie uns bitte eine Nachricht per Mail, wir rufen Sie zurück: mbpraxis@duck.com\n\nOnline-Termine (nur für Patienten, die schon in der Praxis waren) bitte nur bei akuten Schmerzen und Ohrschmalzentfernung.\n\nNeue Patienten und Termine für Hörtests und zur Besprechung chronischer Beschwerden bitte telefonisch oder per Mail anfragen.",
  "linkLabel": "",
  "linkUrl": ""
}
```

- [ ] **Step 2: Write the failing test**

```javascript
// append to tests/banner.test.js
import { isBannerDismissed, dismissBanner } from '../assets/js/banner.js';

test('dismissBanner sets sessionStorage and isBannerDismissed reads it back', () => {
  // node:test runs in Node, not a browser — sessionStorage isn't global.
  // Stub a minimal sessionStorage before calling either function.
  const store = {};
  global.sessionStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
  };
  assert.equal(isBannerDismissed(), false);
  dismissBanner();
  assert.equal(isBannerDismissed(), true);
  delete global.sessionStorage;
});
```

- [ ] **Step 3: Run test, verify it fails**

Run: `node --test tests/*.js`
Expected: FAIL — `isBannerDismissed`/`dismissBanner` not exported.

- [ ] **Step 4: Implement in `assets/js/banner.js`** (add alongside the existing exports, don't remove `escapeHtml`/`renderBannerHTML`)

```javascript
export function isBannerDismissed() {
  return sessionStorage.getItem('bannerDismissed') === '1';
}

export function dismissBanner() {
  sessionStorage.setItem('bannerDismissed', '1');
}
```

Modify `loadBanner` to check dismissal before rendering:

```javascript
export async function loadBanner(slotEl) {
  if (isBannerDismissed()) {
    slotEl.hidden = true;
    return;
  }
  try {
    const res = await fetch('content/banner.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`banner.json ${res.status}`);
    const data = await res.json();
    const html = renderBannerHTML(data);
    if (html) {
      slotEl.innerHTML = html;
      slotEl.hidden = false;
    } else {
      slotEl.hidden = true;
    }
  } catch {
    slotEl.hidden = true;
  }
}
```

Update `renderBannerHTML` to include a dismiss button in its returned markup (add right after the opening `<div class="banner__inner container">`):

```javascript
export function renderBannerHTML(data) {
  if (!data || !data.enabled || !data.message) return '';
  const paragraphs = data.message
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replaceAll('\n', '<br>')}</p>`)
    .join('');
  const link = data.linkUrl && data.linkLabel
    ? `<a class="banner__link" href="${escapeHtml(data.linkUrl)}">${escapeHtml(data.linkLabel)}</a>`
    : '';
  return `<div class="banner__inner container"><div class="banner__text">${paragraphs}${link}</div><button type="button" class="banner__dismiss" aria-label="Hinweis schließen">×</button></div>`;
}
```

Wire the dismiss button's click in `assets/js/main.js` — add after the existing `loadBanner(bannerSlot)` call:

```javascript
if (bannerSlot) {
  loadBanner(bannerSlot).then(() => {
    const dismissBtn = bannerSlot.querySelector('.banner__dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        dismissBanner();
        bannerSlot.hidden = true;
      });
    }
  });
}
```

(This replaces the existing bare `if (bannerSlot) loadBanner(bannerSlot);` line in `main.js`.)

- [ ] **Step 5: Run tests, verify they pass**

Run: `node --test tests/*.js`
Expected: PASS (includes the existing 4 `renderBannerHTML`-family tests, still correct since the dismiss button is additive markup the existing regex-based assertions don't inspect).

- [ ] **Step 6: Rewrite `.banner` CSS** — overlay card instead of a full-width bar:

```css
.banner {
  position: absolute;
  top: 6.625rem;
  right: var(--gutter-mobile);
  left: var(--gutter-mobile);
  z-index: 15;
  background: var(--color-brand);
  border-radius: 0.5rem;
  color: #fff;
}
.banner__inner {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  padding: var(--space-5);
  max-width: none;
}
.banner__text { flex: 1 1 0; display: flex; flex-direction: column; gap: var(--space-2); font-size: 1rem; font-weight: 700; }
.banner__text p:not(:first-child) { font-weight: 500; }
.banner__link { color: #fff; font-weight: 600; text-decoration: underline; width: fit-content; }
.banner__dismiss {
  background: none; border: none; color: #fff; font-size: 1.5rem; line-height: 1; cursor: pointer; padding: 0 var(--space-2);
}

@media (min-width: 64rem) {
  .banner { left: auto; width: 45rem; max-width: calc(100% - 2 * var(--gutter-desktop)); right: var(--gutter-desktop); top: 6.625rem; }
}
```

Note: `top: 6.625rem` (≈106px) matches the Figma value; since the header height changed in Task 1, verify this still visually overlaps the intended spot (top of the hero image) rather than the header itself — adjust the value if the live header renders taller/shorter than expected, but keep it `position: absolute` (not `fixed`/`sticky`) so it scrolls away with the page.

- [ ] **Step 7: Add the dismiss-capable slot markup** — no markup change needed beyond what Task 1/3 already have (`<div id="site-banner" class="banner" hidden></div>`, already a sibling before `<header>` per the static-site-rebuild plan's Task 13 fix) — the button is injected by `renderBannerHTML` at runtime, not written into the HTML files directly. Skip this step if the slot div already matches; just confirm it does on all 3 pages.

- [ ] **Step 8: Verify in the browser**

Reload, screenshot — expect: mint rounded card overlapping the top-right of the hero image, with the real banner text, an "×" dismiss button. Click the "×" — expect: banner disappears immediately. Reload the page — expect: banner stays hidden (sessionStorage persisted). Open a new tab/private window — expect: banner shows again (session-scoped, not permanent).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Redesign banner as a dismissible overlay card

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Hero restructure — two-column welcome + contact info

**Files:**
- Modify: `index.html` (rewrite the `#willkommen` hero section's content area)
- Modify: `assets/css/styles.css` (rewrite `.hero__content` and related rules)

**Interfaces:**
- Consumes: `.hero__media`/video-facade markup from the static-site-rebuild plan's Task 2 (unchanged — the video facade itself isn't touched by this redesign).

- [ ] **Step 1: Replace the hero's content markup** (keep `.hero__media` with the video facade exactly as-is; replace everything in `.hero__content`)

```html
<div class="hero__content container">
  <div class="hero__welcome">
    <h1>Willkommen in unserer Praxis für HNO und Homöopathie</h1>
    <p>Unsere Spezialgebiete sind die HNO-Heilkunde und die Phoniatrie-Pädaudiologie mit Abklärung und Therapie auditiver Wahr­neh­mungs­stö­rung­en (AVWS).</p>
    <p>Wir behandeln bevorzugt mit klassischer Homöopathie und streben die optimale Verbindung von schulmedizinischer und naturheilkundlicher Behandlung an.</p>
    <p>Auf eine gute Zusammenarbeit im Dienste Ihrer Gesundheit.</p>
    <p class="hero__signature">Ihr Dr. J. Mayer-Brix<br>und das Praxisteam</p>
  </div>
  <div class="hero__contact">
    <h3>Kontakt</h3>
    <a class="hero__address" href="https://goo.gl/maps/VMeG75iZF5uAmwec9" target="_blank" rel="noopener">Allee am Röthelheimpark 6<br>91052 Erlangen</a>
    <p class="hero__phone">Tel. <a href="tel:+499131208899">+49 (0) 91 31 / 20 88 99</a><br>Fax +49 (0) 91 31 / 20 52 45</p>
    <p class="uppercase-label">Sie erreichen uns am besten über die Online-Rezeption.</p>
    <h4>Telefonzeiten</h4>
    <p>Mo, Di, Do<br>8.15 – 11.15 und 14.15 – 16.30</p>
    <p>Mi 10 – 11.15<br>Fr 8.15 – 11.15</p>
    <h4>Öffnungszeiten</h4>
    <p>Mo, Di, Do<br>8.30 – 12.30 und 14 – 17.30</p>
    <p>Mi 10 – 15.30<br>Fr 8.30 – 13.30</p>
  </div>
</div>
```

Note: "Sie erreichen uns am besten über die Online-Rezeption." stays plain text (not a link) — the 321med widget added in Task 8 is a global floating button, not something this phrase links to.

- [ ] **Step 2: Rewrite hero CSS** (replace `.hero__content` and remove the old `.hero__note`/`.button--primary`-in-hero usage — the hero no longer has a CTA button)

```css
.hero { position: relative; }
.hero__content {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-block: var(--space-7);
}
.hero__welcome p, .hero__contact p { margin-top: var(--space-3); }
.hero__signature { font-weight: 600; }
.hero__contact h3 { margin-bottom: var(--space-3); }
.hero__contact h4 { margin-top: var(--space-4); margin-bottom: var(--space-2); }
.hero__address { display: block; font-weight: 600; text-decoration: underline; }

@media (min-width: 64rem) {
  .hero__content { flex-direction: row; gap: var(--space-8); padding-block: var(--space-8); }
  .hero__welcome { flex: 1 1 0; max-width: 24rem; }
  .hero__contact { flex: 0 0 16rem; }
}
```

- [ ] **Step 3: Verify in the browser**

Screenshot mobile (stacked) and desktop (side-by-side, welcome text left ~380px-equivalent, contact info right ~260px-equivalent per the design). Confirm the phone number is a working `tel:` link and the address a working Google Maps link opening in a new tab.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Restructure hero into two-column welcome + contact info per redesign

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Leistungen accordion + Schwerpunkte asymmetric layout

**Files:**
- Create: `assets/js/accordion.js`
- Create: `tests/accordion.test.js`
- Modify: `assets/js/main.js` (wire up accordion init)
- Modify: `index.html` (rewrite `#leistungen` and `#schwerpunkte` markup)
- Modify: `assets/css/styles.css` (rewrite `.pill-row`/`.card-grid` rules for these two sections — leave `.card-grid`/`.card` alone if Fachartikel in Task 6 still needs them separately; see that task)

**Interfaces:**
- Produces: `nextAccordionState(isOpen: boolean): boolean` (pure, mirrors `nextNavState`'s pattern) and `initAccordions(root: ParentNode): void`, exported from `assets/js/accordion.js` — imported and called from `main.js` alongside the other `init*` calls.

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/accordion.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextAccordionState } from '../assets/js/accordion.js';

test('nextAccordionState flips closed to open', () => {
  assert.equal(nextAccordionState(false), true);
});
test('nextAccordionState flips open to closed', () => {
  assert.equal(nextAccordionState(true), false);
});
```

- [ ] **Step 2: Run, verify fail**

Run: `node --test tests/*.js` — expect FAIL, module not found.

- [ ] **Step 3: Implement `assets/js/accordion.js`**

```javascript
export function nextAccordionState(isOpen) {
  return !isOpen;
}

export function initAccordions(root) {
  root.querySelectorAll('[data-accordion-item]').forEach((item) => {
    const trigger = item.querySelector('[data-accordion-trigger]');
    const panel = item.querySelector('[data-accordion-panel]');
    let isOpen = false;
    trigger.addEventListener('click', () => {
      isOpen = nextAccordionState(isOpen);
      item.classList.toggle('is-open', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
      panel.hidden = !isOpen;
    });
  });
}
```

- [ ] **Step 4: Run, verify pass**

Run: `node --test tests/*.js` — expect PASS, 2 new tests.

- [ ] **Step 5: Wire into `main.js`** — add the import and an `initAccordions(document);` call alongside `initNav`/`initVideoFacades`.

- [ ] **Step 6: Rewrite `#leistungen` markup in `index.html`**

```html
<section id="leistungen" class="section">
  <div class="container">
    <h2>Leistungen</h2>
    <p class="uppercase-label">Wir sind auf die optimale Verbindung von Schulmedizin und naturheilkundlicher Behandlung spezialisiert</p>
    <p>Wir bieten die kompletten Leistungen einer modernen HNO ärztlichen und phoniatrischen Praxis an. Darüber hinaus bieten wir die Diagnostik von Allergien mittels normalem Allergietest und von Nahrungsmitteln (IGG3 und 4 Allergien) an, sowie eine Darmfloraanalyse und Darmsanierung, soweit diese im Zusammenhang mit HNO-Erkrankungen steht.</p>
    <p>Im therapeutischen Bereich behandeln wir nach Möglichkeit mit Naturheilverfahren und klassischer Homöopathie. Hierfür kann allerdings auch eine ausführliche Fallaufnahme (Anamnese) von bis zu 1 Stunde Dauer notwendig sein, die wir ggf. berechnen müssen.</p>
    <div class="accordion">
      <div class="accordion__item" data-accordion-item>
        <button type="button" class="accordion__trigger" data-accordion-trigger aria-expanded="false">
          <span>HNO Leistungen</span>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" class="accordion__chevron"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <div class="accordion__panel" data-accordion-panel hidden></div>
      </div>
      <div class="accordion__item" data-accordion-item>
        <button type="button" class="accordion__trigger" data-accordion-trigger aria-expanded="false">
          <span>Auditive Wahrnehmung</span>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" class="accordion__chevron"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <div class="accordion__panel" data-accordion-panel hidden></div>
      </div>
      <div class="accordion__item" data-accordion-item>
        <button type="button" class="accordion__trigger" data-accordion-trigger aria-expanded="false">
          <span>Naturheilkundliche Diagnostik und Therapie</span>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" class="accordion__chevron"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <div class="accordion__panel" data-accordion-panel hidden></div>
      </div>
      <div class="accordion__item accordion__item--last" data-accordion-item>
        <button type="button" class="accordion__trigger" data-accordion-trigger aria-expanded="false">
          <span>Diagnostik von Störungen der Darmflora bei HNO-Erkrankungen</span>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" class="accordion__chevron"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <div class="accordion__panel" data-accordion-panel hidden></div>
      </div>
    </div>
  </div>
</section>
```

(Using a right-pointing chevron here rather than literally copying the Figma asset's `lucide/chevron-left` — a left-pointing chevron reads as "back," not "expand," on a vertically-stacked accordion; a right/down chevron is the standard, accessible affordance for "click to expand." Rotate it 90° via `.is-open .accordion__chevron { transform: rotate(90deg); }` so it points down when open.)

- [ ] **Step 7: Rewrite `#schwerpunkte` markup** (full-width intro, then a 2-column Kinder/AVWS row — not 3 equal columns)

```html
<section id="schwerpunkte" class="section">
  <div class="container">
    <h2>Schwerpunkte</h2>
    <p>Viele Krankheiten kann man heute sehr gut diagnostizieren. Die Behandlung ist dann aber teilweise enttäuschend oder sie hat starke Nebenwirkungen.</p>
    <p>Dies kann z.B. bei Asthma, Neurodermitis, Rheuma, Tinnitus, Fibromyalgie und Pfeifferschem Drüsenfieber etc. der Fall sein. Hier finden wir durch eine genaue Erhebung der Krankengeschichte und naturheilkundliche Behandlung Lösungen für Sie.</p>
    <div class="schwerpunkte__full">
      <h4>Chronische Erkrankungen</h4>
      <p>Viele chronische Erkrankungen wie Nebenhöhlenentzündungen, Polypen, Migräne, Pfeiffersches Drüsenfieber, Mittelohrprobleme, Tinnitus (Ohrgeräusche) lassen sich mit Zeit und Geduld noch behandeln.</p>
      <p>Hierin haben wir jahrelange Erfahrung und bilden uns ständig weiter.</p>
    </div>
    <div class="schwerpunkte__row">
      <div>
        <h4>Kinder</h4>
        <p>Wir sind spezialisiert auf die sanfte und natürliche Behandlung von Kindern mit ständigen Infekten, vergrößerten Adenoiden und Schwerhörigkeiten durch Paukenergüsse (Schleim im Mittelohr).</p>
        <p>Gerne geben wir Ihnen auch eine Zweitmeinung zur Notwendigkeit einer Operation der "Polypen", Gaumenmandeln oder der Ohren.</p>
      </div>
      <div>
        <h4>AVWS, ADS/ADHS</h4>
        <p>Wir führen spezielle Hörtests bei Schwierigkeiten im Hören, Verstehen, bei Lese-/Rechtschreibproblemen und zur Abgrenzung von ADS/ADHS zu auditiven Wahrnehmungsstörungen durch.</p>
        <p>Bevor starke Medikamente gegeben werden, kann häufig auch eine homöopathische Therapie ein guter Mittelweg sein.</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 8: Replace the old `.pill-row`/`.card-grid`-for-Schwerpunkte CSS with:**

```css
.accordion__item { border-bottom: 1px solid var(--color-grey); }
.accordion__trigger {
  width: 100%; display: flex; align-items: center; justify-content: space-between; gap: var(--space-4);
  padding-block: var(--space-5); background: none; border: none; cursor: pointer; text-align: left;
  color: var(--color-brand); font-family: var(--font-body); font-weight: 600; text-transform: uppercase; font-size: 1rem;
}
.accordion__chevron { transition: transform 0.2s ease; flex-shrink: 0; color: var(--color-ink); }
.accordion__item.is-open .accordion__chevron { transform: rotate(90deg); }
.accordion__panel { padding-bottom: var(--space-4); }

.schwerpunkte__full, .schwerpunkte__row > div { margin-top: var(--space-6); }
.schwerpunkte__row { display: grid; gap: var(--space-6); margin-top: var(--space-6); }
.schwerpunkte__row h4, .schwerpunkte__full h4 { color: var(--color-brand); margin-bottom: var(--space-2); }

@media (min-width: 48rem) {
  .schwerpunkte__row { grid-template-columns: 1fr 1fr; }
}
```

Remove the now-unused `.pill-row` rule block (nothing references it after this task) — leave `.card-grid`/`.card`/`.card--2` alone, Task 6 still needs them for Fachartikel.

- [ ] **Step 9: Verify in the browser**

Reload, screenshot. Click each accordion trigger — expect: chevron rotates 90°, `aria-expanded` flips to `"true"`, the (empty) panel becomes un-hidden (visually no content appears yet, which is expected — confirm via `panel.hidden === false` in devtools, not by looking for visible text). Click again — collapses back. Confirm Schwerpunkte shows the Chronische-Erkrankungen blurb full-width, then Kinder/AVWS as a 2-column row at ≥48rem and stacked below 48rem.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Add real accordion to Leistungen; restructure Schwerpunkte layout

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Praxisteam, Einblicke, Buch — restyle to new design

**Files:**
- Modify: `index.html` (`#team`, `#einblicke`, `#buch` sections)
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: existing image assets (`team.webp`/`team-800.webp`, `book-cover.webp`), the 360° iframe embed, and the PayPal Buttons SDK script block from the static-site-rebuild plan — none of these are touched, only their surrounding markup/CSS classes.

- [ ] **Step 1: Update `#team` and `#einblicke` sections' wrapping classes/background** — both keep their existing inner markup (image, caption, 360° iframe) untouched; only change the section-level background and heading treatment to match the new palette:

Change `<section id="team" class="section section--alt">` to `<section id="team" class="section">` (design shows Praxisteam on white, not grey) and `<section id="einblicke" class="section">` to `<section id="einblicke" class="section section--alt">` (design shows Einblicke on the light-grey background) — i.e. swap which of the two carries `section--alt`, matching the Figma alternation (`#f5f5f5` on Leistungen&Schwerpunkte and Einblicke; white on Praxisteam).

Update the heading markup in both to add the uppercase label style already used elsewhere — after each section's `<h2>`, add the existing tagline as a `<p class="uppercase-label">`:
- Team: `<p class="uppercase-label">Wir heißen Sie herzlich willkommen und freuen uns auf Sie.</p>`
- Einblicke: `<p class="uppercase-label">Rundgang durch die Praxis</p>` followed by the existing plain `<p>Ansicht mit Klicken und Halten...</p>` unchanged.

- [ ] **Step 2: Update `.section--alt` and add `.uppercase-label` background token**

```css
.section { padding-block: var(--space-8); }
.section--alt { background: var(--color-bg-light); }
```

(Replace the old `--color-paper-alt`-based rule with `--color-bg-light` — grep the file for any other `--color-paper-alt` reference and update it to `--color-bg-light` too, since that token no longer exists after Task 1's `:root` rewrite.)

- [ ] **Step 3: Rewrite `#buch` markup and CSS — dark section**

Change the section's copy structure to match the design (heading white, tagline in brand color reads oddly on dark — the design shows the tagline in the brand mint even on the dark background, confirm this renders legibly):

```html
<section id="buch" class="section section--dark">
  <div class="container buch-layout">
    <img src="assets/img/book-cover.webp" alt='Buchcover "Klassische Homöopathie in der HNO-Heilkunde"' width="212" height="300" loading="lazy">
    <div>
      <h2>Unser Buch</h2>
      <p class="uppercase-label">Klassische Homöopathie in der HNO-Heilkunde</p>
      <p>Die Verbindung von Schulmedizin mit alternativen Heilverfahren ist eine optimale Kombination.</p>
      <p>In diesem Buch habe ich für jedes HNO-Krankheitsbild den aktuellen schulmedizinischen Wissensstand und die naturheilkundliche Behandlung mit vielen Abbildungen verständlich erläutert und durch Fallbeispiele illustriert.</p>
      <p>Von Polypen (Adenoiden) bei Kindern, über Paukenergüsse und Allergien bis zu chronischen Nebenhöhlen- und Halsentzündungen finden Sie alle häufigen Erkrankungen ausführlich beschrieben.</p>
      <p>Interessant für Ärzte, Heilpraktiker und alle von der Homöopathie begeisterten Laien.</p>
      <p><a href="https://www.narayana-verlag.de/Klassische-Homoeopathie-in-der-HNO-Heilkunde-Joachim-Mayer-Brix/b24327">Eine Leseprobe ist auf der Website des Narayana-Verlags zu finden.</a></p>
      <p class="price">69,90 €</p>
      <div id="paypal-button-container"></div>
    </div>
  </div>
</section>
```

```css
.section--dark { background: var(--color-bg-dark); color: #fff; }
.section--dark h2, .section--dark h3, .section--dark h4 { color: #fff; }
.section--dark a { color: #fff; }
.buch-layout { display: grid; gap: var(--space-6); align-items: start; margin-top: var(--space-4); }
.buch-layout img { border-radius: 0.5rem; max-width: 13rem; margin-inline: auto; }
.buch-layout p { margin-top: var(--space-3); }
@media (min-width: 48rem) {
  .buch-layout { grid-template-columns: 13rem 1fr; }
  .buch-layout img { margin-inline: 0; }
}
```

Keep the PayPal SDK `<script>` block (with its sandbox-client-id comment) exactly where it already is, right after this section — do not touch it in this task.

- [ ] **Step 4: Verify in the browser**

Screenshot — expect: Praxisteam on white, Einblicke on light grey, Unser Buch on dark grey with white text and the PayPal button still rendering. Confirm the 360° iframe and PayPal button both still function (no regressions from the class swaps).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Restyle Praxisteam, Einblicke, and Buch sections to new design

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Fachartikel restyle — flex columns, real lists, mint button blocks

**Files:**
- Modify: `index.html` (`#fachartikel` section)
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: the two PayPal hosted-button `<form>` blocks (exact `hosted_button_id` values) from the static-site-rebuild plan's Task 8 — reuse them verbatim, only restyle their wrapping markup/button appearance.

- [ ] **Step 1: Rewrite `#fachartikel` markup** — real `<ul>` lists for the sub-questions, flex columns instead of a grid, PayPal forms restyled as full-width mint blocks:

```html
<section id="fachartikel" class="section">
  <div class="container fachartikel-layout">
    <article class="fachartikel-item">
      <h2>Die Polypen bei meinem Kind sollen operiert werden, muss das wirklich sein?</h2>
      <p class="uppercase-label" style="font-size: 0.875rem;">Auszug aus dem Fachartikel von Dr. Joachim Mayer-Brix</p>
      <p>Sehr häufig wird bei Kindern vom HNO-Arzt schnell eine Entfernung der Polypen (Adenoide Vegetationen) empfohlen.</p>
      <p>Eltern fragen sich dann häufig, ob das wirklich sein muss. Die Antwort: In sehr vielen Fällen kann eine Operation vermieden werden.</p>
      <p>Wir geben Ihnen ausführliche Informationen aus 20 Jahren Erfahrung in einer naturheilkundlichen HNO-Praxis, mit Bildern, die Sie im Internet nicht finden, und ausführlichen Ratschlägen auf:</p>
      <ul>
        <li>Was sind Polypen?</li>
        <li>Warum vergrößern sich Polypen bei Kindern?</li>
        <li>Wie werden Polypen operiert?</li>
        <li>Was gibt es für Alternativen zu einer Operation der Polypen?</li>
        <li>Hilft Homöopathie bei Polypen?</li>
        <li>Was sind Alternativbehandlungen bei Polypen?</li>
        <li>Wo finde ich Hilfe?</li>
      </ul>
      <p>... zum Weiterlesen erwerben Sie bitte den gesamten Artikel.</p>
      <p class="uppercase-label">PDF per E-Mail 4,99 €</p>
      <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" class="paypal-hosted-form fachartikel-buy">
        <input type="hidden" name="cmd" value="_s-xclick">
        <input type="hidden" name="hosted_button_id" value="ZVE567CQTAPRC">
        <input type="hidden" name="on0" value="Fachartikel: Die Polypen bei meinem Kind sollen operiert werden,">
        <input type="hidden" name="currency_code" value="EUR">
        <button type="submit" class="fachartikel-buy__button">Kostenpflichtig bestellen (PayPal)</button>
      </form>
    </article>
    <article class="fachartikel-item">
      <h2>Hilfe, ich bin ständig krank...</h2>
      <p class="uppercase-label" style="font-size: 0.875rem;">Auszug aus dem Fachartikel von Dr. Joachim Mayer-Brix</p>
      <p>„Ständig bin ich krank, mein Arzt hört mir nicht zu oder findet nichts und verschreibt mir nur Antibiotika … Das nervt mich: Ich will endlich wieder gesund sein."</p>
      <p>Da dieses Thema in der Praxis sehr häufig ist, haben wir für Sie einen Ratgeber verfasst, der auf 20 Jahren Praxis beruht.</p>
      <p>Woran muss ich denken, wenn ich dauernd krank bin?</p>
      <ul>
        <li>Was muss ich untersuchen lassen?</li>
        <li>Was kann ich selber tun?</li>
        <li>Wo bekomme ich Hilfe?</li>
      </ul>
      <p>... zum Weiterlesen erwerben Sie bitte den gesamten Artikel.</p>
      <p class="uppercase-label">PDF per E-Mail 4,99 €</p>
      <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" class="paypal-hosted-form fachartikel-buy">
        <input type="hidden" name="cmd" value="_s-xclick">
        <input type="hidden" name="hosted_button_id" value="QCJGWD4PRCMEC">
        <input type="hidden" name="on0" value="Fachartikel: Hilfe, ich bin ständig krank...">
        <input type="hidden" name="currency_code" value="EUR">
        <button type="submit" class="fachartikel-buy__button">Kostenpflichtig bestellen (PayPal)</button>
      </form>
    </article>
  </div>
</section>
```

(The `hosted_button_id` values above are byte-identical to the ones already verified live in the static-site-rebuild plan — do not alter them.)

- [ ] **Step 2: Rewrite Fachartikel CSS** (remove any now-unused `.card-grid--2`/`.card` reference this section used before — those classes stay defined for potential reuse elsewhere but this section no longer uses them):

```css
.fachartikel-layout { display: flex; flex-direction: column; gap: var(--space-8); margin-top: var(--space-4); }
.fachartikel-item p, .fachartikel-item ul { margin-top: var(--space-3); }
.fachartikel-item ul { padding-left: 1.25rem; }
.fachartikel-item li { margin-top: var(--space-2); font-weight: 600; }
.fachartikel-buy { margin-top: var(--space-5); }
.fachartikel-buy__button {
  width: 100%; background: var(--color-brand); color: #fff; border: none; border-radius: 0.5rem;
  padding: var(--space-5); font-family: var(--font-body); font-weight: 600; font-size: 1rem; text-align: right; cursor: pointer;
}
.fachartikel-buy__button:hover { opacity: 0.9; }

@media (min-width: 64rem) {
  .fachartikel-layout { flex-direction: row; gap: var(--gutter-desktop); align-items: flex-start; }
  .fachartikel-item { flex: 1 1 0; }
}
```

- [ ] **Step 3: Verify in the browser**

Screenshot mobile (stacked) and desktop (side-by-side, unequal heights allowed — don't force them to match). Confirm both forms still submit with the correct `action`/`hosted_button_id` (check via `read_page`, don't actually submit).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Restyle Fachartikel as flex columns with real lists and mint buy buttons

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Kontakt (drop form, add map heading), new Zitat sections, simplified footer

**Files:**
- Modify: `index.html`, `impressum.html`, `datenschutz.html` (Kontakt section + footer — the same shell change goes on all 3 pages)
- Modify: `assets/css/styles.css`
- Modify: `assets/js/main.js` (remove the footer `#year` population — the new footer design has no copyright/year line at all)

**Interfaces:**
- None new — this task removes the `.kontakt-form` markup/CSS entirely (the static-site-rebuild plan's Task 9 contact form) and the `#year` JS logic added in that plan's final-review fix, both per explicit user decision to match the design exactly.

- [ ] **Step 1: Rewrite `#kontakt` in `index.html`** — drop the form, keep address/hours (as a second copy, matching the design's duplication) and the map, add the Zitat sections and new footer right after:

```html
<section id="kontakt" class="section section--alt">
  <div class="container">
    <h2>Kontakt</h2>
    <div class="kontakt-info-row">
      <div>
        <a class="hero__address" href="https://goo.gl/maps/VMeG75iZF5uAmwec9" target="_blank" rel="noopener">Allee am Röthelheimpark 6<br>91052 Erlangen</a>
        <p>Tel. <a href="tel:+499131208899">+49 (0) 91 31 / 20 88 99</a><br>Fax +49 (0) 91 31 / 20 52 45</p>
        <p class="uppercase-label">Sie erreichen uns am besten über die Online-Rezeption.</p>
      </div>
      <div>
        <h3>Telefonzeiten</h3>
        <p>Mo, Di, Do<br>8.15 – 11.15 und 14.15 – 16.30</p>
        <p>Mi 10 – 11.15<br>Fr 8.15 – 11.15</p>
      </div>
      <div>
        <h3>Öffnungszeiten</h3>
        <p>Mo, Di, Do<br>8.30 – 12.30 und 14 – 17.30</p>
        <p>Mi 10 – 15.30<br>Fr 8.30 – 13.30</p>
      </div>
    </div>
    <h3 class="kontakt-map-heading">So finden Sie uns</h3>
    <div class="embed-frame kontakt-map">
      <iframe
        src="https://www.google.com/maps/embed?pb=!4v1668604104241!6m8!1m7!1sCAoSLEFGMVFpcE9ab0FHbjFpeklpdFNIMnJiUkd5WUNobUlRekROSW90elRsY1pp!2m2!1d49.591735308831!2d11.025465644748!3f120!4f0!5f0.7820865974627469"
        title="Standort der HNO-Praxis Dr. Mayer-Brix"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen></iframe>
    </div>
  </div>
</section>

<section id="zitat" class="section section--dark">
  <div class="container zitat">
    <p class="zitat__quote">Das höchste Ideal der Heilung ist schnelle, sanfte und dauerhafte Wiederherstellung der Gesundheit [...] nach deutlich einzusehenden Gründen.</p>
    <p class="zitat__attribution">§2 Organon der Heilkunst, S. Hahnemann</p>
  </div>
</section>
```

Note: the Kontakt Sprechzeiten/Öffnungszeiten values above use the same "canonical" numbers already established (Mi 10–11.15 phone / Mo-Do 8.15 opening) from the static-site-rebuild plan's Task 9 discrepancy note — keep using those, don't reintroduce the other conflicting set.

- [ ] **Step 2: Replace the footer + add it as `#footer` styling** — same markup on all 3 pages, replacing the existing `<footer class="site-footer container">...</footer>`:

```html
<footer class="site-footer">
  <div class="container site-footer__inner">
    <p class="site-footer__links"><a href="index.html#impressum-link">Impressum</a> · <a href="datenschutz.html">Datenschutz</a></p>
    <p class="site-footer__contact">HNO-Praxis Dr. Mayer-Brix, Allee am Röthelheimpark 6, 91052 Erlangen, Germany<br>+49 (0) 91 31 / 20 88 99 &nbsp; <a href="mailto:mbpraxis@duck.com">mbpraxis@duck.com</a></p>
  </div>
</footer>
```

Fix the Impressum link's `href` per page: on `index.html` use `href="impressum.html"`; on `impressum.html`/`datenschutz.html` also use `href="impressum.html"` (relative, same for all three — remove the placeholder `#impressum-link` used above, that was a typo in this brief, use `impressum.html` literally on all 3 pages). On `datenschutz.html`, the Datenschutz link in its own footer should still link to itself (`href="datenschutz.html"`) or could be omitted/marked current — keep it as a working self-link for consistency, no special-casing needed.

- [ ] **Step 3: Remove the `#year` population from `assets/js/main.js`** — delete the block added in the static-site-rebuild plan's final fix wave:

```javascript
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
```

(The new footer design has no `#year` element at all — this code would now be a harmless no-op, but remove it for cleanliness since nothing references `#year` anymore.)

- [ ] **Step 4: Remove the old `.kontakt-form` CSS block** entirely from `assets/css/styles.css` (the `.kontakt-form`, `.kontakt-form label`, `.kontakt-form input`, `.kontakt-form textarea` rules, and `.kontakt-layout`/`.kontakt-info` if nothing else uses them — check first).

- [ ] **Step 5: Add new CSS**

```css
.kontakt-info-row { display: grid; gap: var(--space-6); margin-top: var(--space-6); }
.kontakt-info-row > div > * + * { margin-top: var(--space-3); }
.kontakt-map-heading { margin-top: var(--space-8); margin-bottom: var(--space-6); color: var(--color-brand); }
.kontakt-map { aspect-ratio: 720 / 289; }

.zitat { text-align: left; }
.zitat__quote { font-family: var(--font-heading); font-size: 1.5rem; line-height: 1.3; color: var(--color-grey); }
.zitat__attribution { margin-top: var(--space-3); font-family: var(--font-heading); font-size: 1.125rem; color: var(--color-bg-light); }

.site-footer { background: var(--color-ink); color: var(--color-grey); padding-block: var(--space-7); text-align: center; }
.site-footer a { color: var(--color-bg-light); text-decoration: underline; }
.site-footer__inner > * + * { margin-top: var(--space-5); }
.site-footer__links { font-family: var(--font-heading); font-size: 1.125rem; }
.site-footer__contact { font-size: 0.875rem; }

@media (min-width: 48rem) {
  .kontakt-info-row { grid-template-columns: 2fr 1fr 1fr; }
}
```

- [ ] **Step 6: Apply the same Kontakt/footer/Zitat changes to `impressum.html` and `datenschutz.html`'s footer** (those two pages have no `#kontakt` section — only replace their `<footer>` block, same markup as Step 2, with correct relative link hrefs).

- [ ] **Step 7: Verify in the browser**

Reload all 3 pages. Expect: no contact form anywhere, "So finden Sie uns" heading + working map iframe, a dark Zitat section with the Hahnemann quote, a simplified dark footer with no copyright/year, working mailto and Impressum/Datenschutz links. Confirm `grep -r "kontakt-form\|#year" index.html impressum.html datenschutz.html assets/` returns nothing.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Drop contact form, add Zitat section and simplified footer per redesign

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: 321med Online-Rezeption widget + Datenschutz updates

**Files:**
- Modify: `index.html`, `impressum.html`, `datenschutz.html` (add widget scripts before `</body>`)
- Modify: `datenschutz.html` (remove the Kontaktformular section, since the form no longer exists; add a 321med disclosure section)

**Interfaces:** None — this task only inserts third-party script tags and edits legal-page text.

- [ ] **Step 1: Add the widget scripts to all 3 pages**, immediately before `</body>`:

```html
<!-- 321med Online-Rezeption widget, provided directly by the practice's vendor
     (321 MED GmbH) on 2026-09-04. No SRI hash: this is a vendor-hosted,
     server-rendered widget script expected to update without a version bump,
     same category as the PayPal SDK script elsewhere on this site — pinning
     a hash would break it on the vendor's next legitimate update. -->
<script src="https://321med17.com/cdn/server/11cb0eefca4e16e350aca235e8bea2608a35c85f/321med.js"></script>
<script src="https://321med-cdn.com/321med.js"></script>
```

- [ ] **Step 2: Remove the "Kontaktformular" `<h3>` section from `datenschutz.html`** (the form it describes no longer exists on the site) — delete this block:

```html
<h3>Kontaktformular</h3>
<p>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, ...</p>
<p>Die Verarbeitung der in das Kontaktformular eingegebenen Daten ...</p>
<p>Die von Ihnen im Kontaktformular eingegebenen Daten verbleiben bei uns ...</p>
<p>Diese Anfragen werden ab dem Relaunch dieser Website über Netlify Forms verarbeitet ...</p>
```

- [ ] **Step 3: Add a "321med Online-Rezeption" disclosure section to `datenschutz.html`**, in the "Plugins und Tools" heading group alongside the existing Vimeo/PayPal/Maps sections:

```html
<h3>321med Online-Rezeption</h3>
<p>Für die Terminvereinbarung nutzen wir den Dienst "321med Online-Rezeption" der 321 MED GmbH, Ohmstraße 1a, D-93055 Regensburg. Der Dienst wird als eingebettetes Widget auf unserer Website bereitgestellt und ermöglicht es Ihnen, direkt online Termine zu vereinbaren und Anliegen zu übermitteln.</p>
<p>Bei Nutzung des Widgets werden die von Ihnen eingegebenen Daten (z.B. Name, Kontaktdaten, Terminwunsch) an 321 MED übermittelt und dort zur Bearbeitung Ihres Anliegens verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Erfüllung eines Vertrags bzw. vorvertraglicher Maßnahmen) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer reibungslosen Terminorganisation).</p>
<p>Weitere Informationen zum Umgang mit Ihren Daten durch 321 MED erhalten Sie direkt von 321 MED GmbH.</p>
```

- [ ] **Step 4: Verify in the browser**

Reload all 3 pages, confirm both `<script>` tags load (check `read_network_requests` for `321med17.com`/`321med-cdn.com` — a 200 or at least a non-blocked request; if either script 404s or is blocked by an ad-blocker in the test environment, note that as an environmental limitation, not a code defect, as long as the tags are correctly present in the HTML). Confirm the Kontaktformular section is gone from Datenschutz and the new 321med section reads correctly.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add 321med Online-Rezeption widget; update Datenschutz for dropped form and new widget

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: Full responsive/accessibility QA pass on the redesign

**Files:**
- Modify: `assets/css/styles.css`, and any HTML file, as needed to fix findings (exact diffs depend on what's found — see step instructions)

**Interfaces:** None — this task audits and patches whatever Tasks 1–8 produced.

- [ ] **Step 1: Full responsive screenshot pass**

All 3 pages, at 375×812 (mobile), 768×1024 (tablet), 1440×900 (desktop). Confirm: no horizontal scroll (`document.documentElement.scrollWidth <= document.documentElement.clientWidth`), the banner overlay card doesn't overflow or overlap the header/nav at any width, the accordion is usable and keyboard-operable (Tab reaches each trigger, Enter/Space toggles it — native `<button>` gives you Enter/Space for free, just confirm it), the hero's two columns stack correctly on mobile, Fachartikel's flex columns stack on mobile.

- [ ] **Step 2: Color contrast check on the new palette**

Compute WCAG contrast for every text/background pairing introduced or changed in this plan: `--color-brand` (#00a2b5) text/background against white, `--color-bg-light`, and `--color-bg-dark`; `--color-grey` (#bdbcbc) text on `--color-bg-dark` (used in the Zitat quote — this pairing is a real risk, #bdbcbc on #4f4d49 is a light-grey-on-dark-grey combination, compute it) and on `--color-ink` (footer text). Fix any pairing under 4.5:1 (or 3:1 for large ≥1.5rem/24px text) by choosing a different existing token for that specific text color — do not introduce new ad-hoc colors, and do not alter `--color-brand`'s hex value itself (same fixed-brand-color rule as before). Document the computed ratios for whatever you check in your report.

- [ ] **Step 3: Verify the banner's absolute positioning doesn't break on short-viewport devices**

At 375×812 with the video facade poster loaded (not yet playing), confirm the banner card doesn't visually collide with the header/nav below the fold in an unreadable way — the video is tall (16:9 at full width ≈ 211px height on a 375px-wide screen) and the banner sits at `top: 6.625rem` (≈106px) — check whether it ends up over the header, over the video, or spanning both, and adjust `top` if the overlap reads as broken rather than intentional.

- [ ] **Step 4: Run the full test suite**

Run: `node --test tests/*.js`
Expected: PASS (should be 10+ tests now — the original 8 plus the 2 new accordion tests plus the 1 new banner-dismiss test = 11).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Responsive and accessibility fixes for the redesign

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-review notes

- **Spec coverage**: every section of the Figma design (header/nav, hero, banner, Leistungen/Schwerpunkte, Praxisteam, Einblicke, Buch, Fachartikel, Kontakt, Zitat, footer) has a task. The 321med widget and Datenschutz updates (Task 8) and the dropped contact form (Task 7) match the user's explicit answers. Font licensing (Task 1) uses the real licensed OTF the user pointed to, converted to woff2 already.
- **Placeholder scan**: no TBD/TODO. The accordion panels are intentionally empty per the user's explicit instruction ("I'll add the content for the open states later") — that's a real, disclosed scope boundary, not a placeholder left by omission.
- **Type/name consistency**: `nextAccordionState`/`initAccordions` (Task 4) mirror `nextNavState`/`initNav`'s existing pattern exactly. `isBannerDismissed`/`dismissBanner` (Task 2) are new exports from the existing `banner.js`, consumed by the existing `loadBanner` and by `main.js`'s dismiss-button wiring — names checked consistent between definition and call sites in both tasks' step text.
