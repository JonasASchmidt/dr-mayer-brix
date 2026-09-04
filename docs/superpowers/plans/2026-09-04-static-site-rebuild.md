# Static Site Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild https://www.dr-mayer-brix.de/ as a static HTML/CSS/vanilla-JS site (no framework, no build step), deployed to Netlify at `pmb.makethings.work`, with all current content/embeds/functionality preserved and the banner rendered from a client-fetched JSON file (so it's ready for the Decap CMS editor added in the companion plan).

**Architecture:** Three hand-authored HTML pages (`index.html`, `impressum.html`, `datenschutz.html`) sharing one `assets/css/styles.css` (CSS custom-property design tokens, mobile-first `min-width` breakpoints) and small focused vanilla-JS modules under `assets/js/` (nav toggle, banner renderer, Vimeo click-to-play facade). Pure logic in those modules is unit-tested with Node's built-in test runner (`node:test`) — zero npm dependencies. Markup/CSS/responsive work is verified visually via the Browser tool against a local static server.

**Tech Stack:** Plain HTML5, CSS3 (custom properties, `min-width` media queries), vanilla ES modules, Node.js built-in `node:test` for unit tests, Netlify (static hosting + Netlify Forms), `python3 -m http.server` for local dev serving.

**Spec:** [docs/superpowers/specs/2026-09-04-static-rebuild-design.md](../specs/2026-09-04-static-rebuild-design.md)

## Global Constraints

- No frontend framework, no bundler, no build step for page markup (spec §4).
- Zero npm runtime dependencies; `node:test` only, dev-time.
- Mobile-first CSS: write the smallest-breakpoint rule first, enhance upward with `min-width` media queries (spec §9).
- Breakpoints: `30rem` (large phones), `48rem` (tablet), `64rem` (desktop), `80rem` (wide desktop).
- Brand color `#009BC7` (banner/accent cyan) is fixed — do not alter.
- All copy is reproduced verbatim from the live site except the two leftover Squarespace placeholder captions ("Make it stand out" / "Whatever it is, the way you tell your story online...") — drop those (spec §1).
- Fonts self-hosted as `woff2`, `font-display: swap` (spec §6, §9).
- Images: WebP with responsive `srcset`, `loading="lazy"` below the fold, explicit `width`/`height` (spec §9).
- WCAG 2.1 AA: contrast, focus states, labeled fields, keyboard-operable nav (spec §9).
- Every external embed/link keeps its **exact real value** audited from the live site — see task tables below. Do not invent IDs, URLs, or copy.

---

## Known content issue to flag, not silently resolve

The live site shows **two different sets of Sprechzeiten** in two places (hero block vs. Kontakt-section block): the hero block says `Mi 10 – 11.15` (phone) and `Mo, Di, Do 8.30 – 12.30` (opening), while the Kontakt-section block says `Mi 9 – 11.15` and `Mo, Di, Do 8.15 – 12.30`. Task 9 uses the **Kontakt-section values** (more detailed block, both hours) as canonical and leaves an HTML comment noting the discrepancy for the family to confirm — do not silently pick one without that comment.

The PayPal book-purchase button (Task 7) is running on PayPal's public **sandbox** client-id (`client-id=sb`) on the live production site today — this plan reproduces that exact current (non-functional-for-real-money) configuration verbatim, with a loud comment, because a real client-id was not available during this audit. This must be swapped for a real PayPal REST app client-id before launch — flag it to the user, don't fabricate one.

---

### Task 1: Project scaffold, design tokens, and header/nav

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `assets/css/styles.css`
- Create: `assets/js/nav.js`
- Create: `tests/nav.test.js`
- Create: `index.html`

**Interfaces:**
- Produces: `nextNavState(isOpen: boolean): boolean` (pure toggle, exported from `assets/js/nav.js`) and `initNav(toggleEl: Element, panelEl: Element): void` (DOM wiring, exported from the same file) — later tasks' `assets/js/main.js` (Task 3) will import and call `initNav`.
- Produces: CSS custom properties on `:root` in `assets/css/styles.css` — `--color-brand: #009bc7`, `--color-brand-dark: #00799c`, `--color-ink: #1a1a1a`, `--color-ink-soft: #4a4a4a`, `--color-paper: #ffffff`, `--color-paper-alt: #f6f9fa`, `--color-border: #dee6e8`, `--space-1` through `--space-8` (0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem, 3rem, 4rem), `--container-width: 71rem`, `--gutter-mobile: 1.25rem`, `--font-heading` (system stack until Task 11 swaps it), `--font-body: 'Roboto', -apple-system, 'Segoe UI', sans-serif`. Every later task's CSS relies on these variables — do not rename them.
- Produces: `.container` utility class (mobile-first, `width: 100%; max-width: var(--container-width); margin-inline: auto; padding-inline: var(--gutter-mobile);`) that every section in later tasks uses to wrap its content.

- [ ] **Step 1: Create `package.json` and `.gitignore`**

```json
{
  "name": "dr-mayer-brix-website",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/"
  }
}
```

```gitignore
node_modules/
.netlify/
.DS_Store
```

- [ ] **Step 2: Write the failing test for the nav toggle logic**

```javascript
// tests/nav.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextNavState } from '../assets/js/nav.js';

test('nextNavState flips closed to open', () => {
  assert.equal(nextNavState(false), true);
});

test('nextNavState flips open to closed', () => {
  assert.equal(nextNavState(true), false);
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node --test tests/`
Expected: FAIL — `Cannot find module '../assets/js/nav.js'`

- [ ] **Step 4: Implement `assets/js/nav.js`**

```javascript
// assets/js/nav.js
export function nextNavState(isOpen) {
  return !isOpen;
}

export function initNav(toggleEl, panelEl) {
  let isOpen = false;
  toggleEl.addEventListener('click', () => {
    isOpen = nextNavState(isOpen);
    panelEl.classList.toggle('is-open', isOpen);
    toggleEl.setAttribute('aria-expanded', String(isOpen));
  });
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test tests/`
Expected: PASS (2 tests)

- [ ] **Step 6: Write `assets/css/styles.css` — reset, tokens, container, header/nav**

```css
/* assets/css/styles.css */
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { -webkit-text-size-adjust: 100%; }
img, picture, video { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }

:root {
  --color-brand: #009bc7;
  --color-brand-dark: #00799c;
  --color-ink: #1a1a1a;
  --color-ink-soft: #4a4a4a;
  --color-paper: #ffffff;
  --color-paper-alt: #f6f9fa;
  --color-border: #dee6e8;
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
  --font-heading: -apple-system, 'Segoe UI', sans-serif;
  --font-body: 'Roboto', -apple-system, 'Segoe UI', sans-serif;
}

body {
  font-family: var(--font-body);
  color: var(--color-ink);
  background: var(--color-paper);
  line-height: 1.55;
}

h1, h2, h3, h4 {
  font-family: var(--font-heading);
  line-height: 1.15;
  color: var(--color-ink);
}

a { color: var(--color-brand-dark); }
a:focus-visible, button:focus-visible { outline: 3px solid var(--color-brand); outline-offset: 2px; }

.container {
  width: 100%;
  max-width: var(--container-width);
  margin-inline: auto;
  padding-inline: var(--gutter-mobile);
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-paper);
  border-bottom: 1px solid var(--color-border);
}

.site-header__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: var(--space-3);
}

.site-header__logo img { height: 2.5rem; width: auto; }

.nav-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-paper);
  cursor: pointer;
}

.nav-toggle span,
.nav-toggle span::before,
.nav-toggle span::after {
  display: block;
  width: 1.25rem;
  height: 2px;
  background: var(--color-ink);
  position: relative;
}
.nav-toggle span::before { content: ''; position: absolute; top: -6px; }
.nav-toggle span::after { content: ''; position: absolute; top: 6px; }

.site-nav {
  display: none;
  flex-direction: column;
  gap: var(--space-2);
  padding-block: var(--space-3);
  border-top: 1px solid var(--color-border);
}
.site-nav.is-open { display: flex; }
.site-nav a {
  display: block;
  padding: var(--space-2) 0;
  color: var(--color-ink);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}
.site-nav a:hover { color: var(--color-brand-dark); }

.site-nav__cta {
  margin-top: var(--space-2);
  display: inline-block;
  background: var(--color-brand);
  color: #fff !important;
  text-align: center;
  padding: var(--space-3) var(--space-4);
  border-radius: 999px;
  font-weight: 700;
}

@media (min-width: 64rem) {
  .nav-toggle { display: none; }
  .site-nav {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space-5);
    border-top: none;
    padding-block: 0;
  }
  .site-nav a { padding: 0; font-size: 0.85rem; }
  .site-nav__cta { margin-top: 0; padding: var(--space-2) var(--space-5); }
}
```

- [ ] **Step 7: Write `index.html` head + header/nav shell**

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>HNO-Praxis Dr. Mayer-Brix — HNO und Homöopathie in Erlangen</title>
  <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
  <header class="site-header">
    <div id="site-banner" class="banner" hidden></div>
    <div class="container site-header__bar">
      <a class="site-header__logo" href="#willkommen">
        <img src="assets/img/logo.webp" alt="HNO-Praxis Dr. Mayer-Brix" width="180" height="60">
      </a>
      <button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Menü öffnen">
        <span></span>
      </button>
    </div>
    <nav class="site-nav container" id="site-nav">
      <a href="#willkommen">Willkommen</a>
      <a href="#leistungen">Leistungen</a>
      <a href="#team">Team</a>
      <a href="#einblicke">Einblicke</a>
      <a href="#buch">Unser Buch</a>
      <a href="#fachartikel">Fachartikel</a>
      <a href="#kontakt">Kontakt</a>
      <a class="site-nav__cta" href="https://webtermin.medatixx.de/#/bec45e38-6a42-46f2-a0da-36f22b64ebee/search">Termin buchen</a>
    </nav>
  </header>
  <main>
    <!-- sections added in later tasks -->
  </main>
  <footer class="site-footer container">
    <p>&copy; <span id="year"></span> HNO-Praxis Dr. Mayer-Brix · <a href="impressum.html">Impressum</a> · <a href="datenschutz.html">Datenschutz</a></p>
  </footer>
  <script type="module" src="assets/js/main.js"></script>
</body>
</html>
```

Note: `assets/js/main.js` and `assets/img/logo.webp` don't exist yet — created in Task 3 and this step respectively. Add the logo now:

Run: `curl -sL "https://images.squarespace-cdn.com/content/v1/549e9b5fe4b0cddb26c82546/1419682928009-1AYGEJLW1TL0Q0DFTFW9/Logo_HNO-Praxis-Dr-Mayer-Brix.png?format=1500w" -o /tmp/logo-src.webp && mkdir -p assets/img && sips -s format png /tmp/logo-src.webp --out /tmp/logo-src.png && cwebp -q 90 /tmp/logo-src.png -o assets/img/logo.webp`
Expected: `assets/img/logo.webp` exists.

- [ ] **Step 8: Verify header/nav in the browser**

Run: `python3 -m http.server 4173` (in the repo root, background it), then use the Browser tool:
1. Navigate to `http://localhost:4173/`
2. `resize_window` to `mobile` (375×812), screenshot — expect: logo left, hamburger button right, nav hidden.
3. Click the hamburger (`#nav-toggle`) — expect: `#site-nav` gains `.is-open` and links become visible, `aria-expanded="true"`.
4. `resize_window` to `desktop`, reload — expect: hamburger hidden, all 7 nav links + "Termin buchen" pill visible in a row.
5. Check `read_console_messages` — expect: no errors (a 404 for `main.js` is expected until Task 3 — note it, don't fix here).

- [ ] **Step 9: Commit**

```bash
git add package.json .gitignore assets/css/styles.css assets/js/nav.js tests/nav.test.js index.html assets/img/logo.webp
git commit -m "Add project scaffold, design tokens, and header/nav

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Hero section with Vimeo click-to-play facade

**Files:**
- Create: `assets/js/video-facade.js`
- Create: `tests/video-facade.test.js`
- Modify: `index.html` (add hero section inside `<main>`)
- Modify: `assets/css/styles.css` (append hero styles)

**Interfaces:**
- Consumes: `.container` from Task 1.
- Produces: `vimeoEmbedSrc(id: string): string` and `initVideoFacades(root: ParentNode): void`, exported from `assets/js/video-facade.js` — imported by `assets/js/main.js` in Task 3.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/video-facade.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vimeoEmbedSrc } from '../assets/js/video-facade.js';

test('vimeoEmbedSrc builds the player URL with autoplay', () => {
  assert.equal(
    vimeoEmbedSrc('109794949'),
    'https://player.vimeo.com/video/109794949?autoplay=1&title=0&byline=0'
  );
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `node --test tests/`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `assets/js/video-facade.js`**

```javascript
// assets/js/video-facade.js
export function vimeoEmbedSrc(id) {
  return `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0`;
}

export function initVideoFacades(root) {
  root.querySelectorAll('[data-video-facade]').forEach((facade) => {
    const button = facade.querySelector('button');
    button.addEventListener('click', () => {
      const id = facade.dataset.videoFacade;
      const iframe = document.createElement('iframe');
      iframe.src = vimeoEmbedSrc(id);
      iframe.title = facade.dataset.videoTitle || 'Video';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      facade.replaceWith(iframe);
      iframe.className = 'hero__video-frame';
    });
  });
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `node --test tests/`
Expected: PASS (1 test)

- [ ] **Step 5: Source the hero poster image**

Run: `curl -sL "https://images.squarespace-cdn.com/content/v1/549e9b5fe4b0cddb26c82546/1419706531775-SXGHZJOGEJB5O1R3J3VO/image-asset.jpeg?format=2500w" -o /tmp/hero-src.jpg && cwebp -q 82 /tmp/hero-src.jpg -o assets/img/hero-poster.webp && cwebp -q 82 -resize 800 0 /tmp/hero-src.jpg -o assets/img/hero-poster-800.webp`
Expected: both files exist in `assets/img/`.

- [ ] **Step 6: Add the hero section markup to `index.html`** (inside `<main>`, replacing the placeholder comment)

```html
<section id="willkommen" class="hero">
  <div class="hero__media" data-video-facade="109794949" data-video-title="Praxisvideo Dr. Joachim Mayer-Brix">
    <img src="assets/img/hero-poster-800.webp" srcset="assets/img/hero-poster-800.webp 800w, assets/img/hero-poster.webp 2500w" sizes="100vw" alt="" width="800" height="450">
    <button type="button" aria-label="Praxisvideo abspielen">
      <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="rgba(0,0,0,0.55)"/><path d="M26 20l20 12-20 12z" fill="#fff"/></svg>
    </button>
  </div>
  <div class="hero__content container">
    <h1>Willkommen in unserer Praxis für HNO und Homöopathie</h1>
    <p>Unsere Spezialgebiete sind die HNO-Heilkunde und die Phoniatrie-Pädaudiologie mit Abklärung und Therapie auditiver Wahrnehmungsstörungen (AVWS).</p>
    <p>Wir behandeln bevorzugt mit klassischer Homöopathie und streben die optimale Verbindung von schulmedizinischer und naturheilkundlicher Behandlung an.</p>
    <p>Auf eine gute Zusammenarbeit im Dienste Ihrer Gesundheit.<br>Ihr Dr. J. Mayer-Brix und das Praxisteam</p>
    <a class="button button--primary" href="https://webtermin.medatixx.de/#/bec45e38-6a42-46f2-a0da-36f22b64ebee/search">Termin buchen</a>
    <p class="hero__note">Online buchbar sind nur kurze Akut-Termine à 10 Minuten. Für Hörtests, bei Tinnitus, Auditiver Wahrnehmungsstörung, Nebenhöhlen-Beschwerden und sonstige chronische Beschwerden rufen Sie bitte unbedingt an oder schreiben uns eine Nachricht.</p>
  </div>
</section>
```

- [ ] **Step 7: Append hero styles to `assets/css/styles.css`**

```css
.hero { position: relative; }
.hero__media { position: relative; aspect-ratio: 16 / 9; background: var(--color-ink); overflow: hidden; }
.hero__media img { width: 100%; height: 100%; object-fit: cover; opacity: 0.75; }
.hero__media button {
  position: absolute; inset: 0; margin: auto; width: 4rem; height: 4rem;
  background: none; border: none; cursor: pointer; padding: 0;
}
.hero__video-frame { width: 100%; aspect-ratio: 16 / 9; border: 0; }
.hero__content { padding-block: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.hero__note { font-size: 0.85rem; color: var(--color-ink-soft); }
.button {
  display: inline-block; width: fit-content; padding: var(--space-3) var(--space-6);
  border-radius: 999px; text-decoration: none; font-weight: 700;
}
.button--primary { background: var(--color-brand); color: #fff; }
.button--primary:hover { background: var(--color-brand-dark); }

@media (min-width: 48rem) {
  .hero__content { padding-block: var(--space-8); max-width: 40rem; }
}
```

- [ ] **Step 8: Verify in the browser**

With the local server still running:
1. Navigate to `http://localhost:4173/`, screenshot at mobile and desktop widths — expect: poster image with centered play button, headline and intro paragraphs below/beside it, "Termin buchen" button.
2. Click the play button — expect: poster replaced by a live Vimeo `<iframe>` whose `src` starts with `https://player.vimeo.com/video/109794949`.

- [ ] **Step 9: Commit**

```bash
git add assets/js/video-facade.js tests/video-facade.test.js index.html assets/css/styles.css assets/img/hero-poster*.webp
git commit -m "Add hero section with click-to-play Vimeo facade

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Banner component (renders from `content/banner.json`)

**Files:**
- Create: `content/banner.json`
- Create: `assets/js/banner.js`
- Create: `tests/banner.test.js`
- Create: `assets/js/main.js`
- Modify: `index.html` (hook up `#site-banner` slot — already present from Task 1)
- Modify: `assets/css/styles.css` (append banner styles)

**Interfaces:**
- Consumes: `initNav` (Task 1), `initVideoFacades` (Task 2).
- Produces: `renderBannerHTML(data: {enabled, message, linkLabel, linkUrl}): string` and `escapeHtml(str: string): string`, exported from `assets/js/banner.js`. Produces `loadBanner(slotEl: Element): Promise<void>` (fetches `content/banner.json`, calls `renderBannerHTML`, injects it) — not unit tested (network+DOM), verified via browser. `assets/js/main.js` becomes the site's single entry point, importing and calling `initNav`, `initVideoFacades`, and `loadBanner` on `DOMContentLoaded`; later tasks that add DOM-wiring modules import them here too.

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/banner.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBannerHTML, escapeHtml } from '../assets/js/banner.js';

test('escapeHtml escapes angle brackets and ampersands', () => {
  assert.equal(escapeHtml('<b> & "x"'), '&lt;b&gt; &amp; &quot;x&quot;');
});

test('renderBannerHTML returns empty string when disabled', () => {
  assert.equal(renderBannerHTML({ enabled: false, message: 'hi' }), '');
});

test('renderBannerHTML renders paragraphs split on blank lines', () => {
  const html = renderBannerHTML({ enabled: true, message: 'Zeile eins\n\nZeile zwei' });
  assert.match(html, /<p>Zeile eins<\/p>/);
  assert.match(html, /<p>Zeile zwei<\/p>/);
});

test('renderBannerHTML includes the optional link when present', () => {
  const html = renderBannerHTML({
    enabled: true,
    message: 'Info',
    linkLabel: 'Termin buchen',
    linkUrl: 'https://webtermin.medatixx.de/#/bec45e38-6a42-46f2-a0da-36f22b64ebee/search',
  });
  assert.match(html, /<a class="banner__link" href="https:\/\/webtermin\.medatixx\.de\/#\/bec45e38-6a42-46f2-a0da-36f22b64ebee\/search">Termin buchen<\/a>/);
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `node --test tests/`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `assets/js/banner.js`**

```javascript
// assets/js/banner.js
export function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

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
  return `<div class="banner__inner container">${paragraphs}${link}</div>`;
}

export async function loadBanner(slotEl) {
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

- [ ] **Step 4: Run tests, verify they pass**

Run: `node --test tests/`
Expected: PASS (4 new tests, 6 total)

- [ ] **Step 5: Seed real content in `content/banner.json`**

Ported verbatim from the live announcement bar (4 paragraphs, with the "hier klicken" call-to-action turned into the structured `linkLabel`/`linkUrl` fields instead of inline text, since the plain-text widget has no way to embed a link mid-sentence — spec §5):

```json
{
  "enabled": true,
  "message": "Liebe Patienten, die Praxis ist vom 24. August bis einschließlich 4. September geschlossen. Unsere Vertretung vom 24. August bis 28. August HNO Praxis Dr. Mayr, Tel. 09131 80880, und vom 31.8. bis 4.9. HNO Praxis Dr. Krause, Tel. 0911 774890.\n\nSollten Sie uns telefonisch nicht erreichen, schreiben Sie uns bitte eine Nachricht per Mail, wir rufen Sie zurück: mbpraxis@duck.com\n\nOnline-Termine (nur für Patienten, die schon in der Praxis waren) bitte nur bei akuten Schmerzen und Ohrschmalzentfernung.\n\nNeue Patienten und Termine für Hörtests und zur Besprechung chronischer Beschwerden bitte telefonisch oder per Mail anfragen.",
  "linkLabel": "Online-Termin buchen",
  "linkUrl": "https://webtermin.medatixx.de/#/bec45e38-6a42-46f2-a0da-36f22b64ebee/search"
}
```

- [ ] **Step 6: Create `assets/js/main.js`**

```javascript
// assets/js/main.js
import { initNav } from './nav.js';
import { initVideoFacades } from './video-facade.js';
import { loadBanner } from './banner.js';

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) initNav(toggle, nav);

  initVideoFacades(document);

  const bannerSlot = document.getElementById('site-banner');
  if (bannerSlot) loadBanner(bannerSlot);
});
```

- [ ] **Step 7: Append banner styles to `assets/css/styles.css`**

```css
.banner {
  background: var(--color-brand);
  color: #fff;
}
.banner__inner {
  padding-block: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: 0.9rem;
  line-height: 1.5;
}
.banner__link {
  display: inline-block;
  width: fit-content;
  color: #fff;
  font-weight: 700;
  text-decoration: underline;
}
```

- [ ] **Step 8: Verify in the browser**

With the local server running:
1. Navigate to `http://localhost:4173/`, screenshot — expect: cyan banner at the very top, above the header, showing the 4 seeded paragraphs wrapping cleanly at mobile width, plus an underlined "Online-Termin buchen" link.
2. In `read_console_messages`, confirm no errors (the earlier `main.js` 404 from Task 1 should now be gone).
3. Temporarily edit `content/banner.json` locally to `{"enabled": false}`, reload — expect: banner slot collapses (not just empty — `hidden` attribute present, zero height). Revert the file back to the seeded content afterward.

- [ ] **Step 9: Commit**

```bash
git add content/banner.json assets/js/banner.js tests/banner.test.js assets/js/main.js index.html assets/css/styles.css
git commit -m "Add banner component rendered from content/banner.json

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Leistungen & Schwerpunkte sections

**Files:**
- Modify: `index.html` (add sections inside `<main>`)
- Modify: `assets/css/styles.css` (append section + card grid styles)

**Interfaces:**
- Consumes: `.container`, `.button` (Task 1/2).
- Produces: `.section`, `.section--alt`, `.card-grid`, `.pill-row` CSS classes reused by Tasks 5–9.

- [ ] **Step 1: Add markup to `index.html`**

```html
<section id="leistungen" class="section section--alt">
  <div class="container">
    <h2>Leistungen</h2>
    <p class="section__lede">Wir sind auf die optimale Verbindung von Schulmedizin und naturheilkundlicher Behandlung spezialisiert</p>
    <p>Wir bieten die kompletten Leistungen einer modernen HNO ärztlichen und phoniatrischen Praxis an. Darüber hinaus bieten wir die Diagnostik von Allergien mittels normalem Allergietest und von Nahrungsmitteln (IGG3 und 4 Allergien) an, sowie eine Darmfloraanalyse und Darmsanierung, soweit diese im Zusammenhang mit HNO-Erkrankungen steht.</p>
    <p>Im therapeutischen Bereich behandeln wir nach Möglichkeit mit Naturheilverfahren und klassischer Homöopathie. Hierfür kann allerdings auch eine ausführliche Fallaufnahme (Anamnese) von bis zu 1 Stunde Dauer notwendig sein, die wir ggf. berechnen müssen.</p>
    <ul class="pill-row">
      <li>HNO Leistungen</li>
      <li>Auditive Wahrnehmung</li>
      <li>Naturheilkundliche Diagnostik und Therapie</li>
      <li>Diagnostik von Störungen der Darmflora bei HNO-Erkrankungen</li>
    </ul>
  </div>
</section>

<section id="schwerpunkte" class="section">
  <div class="container">
    <h2>Schwerpunkte</h2>
    <p>Viele Krankheiten kann man heute sehr gut diagnostizieren. Die Behandlung ist dann aber teilweise enttäuschend oder sie hat starke Nebenwirkungen. Dies kann z.B. bei Asthma, Neurodermitis, Rheuma, Tinnitus, Fibromyalgie und Pfeifferschem Drüsenfieber etc. der Fall sein. Hier finden wir durch eine genaue Erhebung der Krankengeschichte und naturheilkundliche Behandlung Lösungen für Sie.</p>
    <div class="card-grid">
      <article class="card">
        <h3>Chronische Erkrankungen</h3>
        <p>Viele chronische Erkrankungen wie Nebenhöhlenentzündungen, Polypen, Migräne, Pfeiffersches Drüsenfieber, Mittelohrprobleme, Tinnitus (Ohrgeräusche) lassen sich mit Zeit und Geduld noch behandeln. Hierin haben wir jahrelange Erfahrung und bilden uns ständig weiter.</p>
      </article>
      <article class="card">
        <h3>Kinder</h3>
        <p>Wir sind spezialisiert auf die sanfte und natürliche Behandlung von Kindern mit ständigen Infekten, vergrößerten Adenoiden und Schwerhörigkeiten durch Paukenergüsse (Schleim im Mittelohr). Gerne geben wir Ihnen auch eine Zweitmeinung zur Notwendigkeit einer Operation der "Polypen", Gaumenmandeln oder der Ohren.</p>
      </article>
      <article class="card">
        <h3>AVWS, ADS/ADHS</h3>
        <p>Wir führen spezielle Hörtests bei Schwierigkeiten im Hören, Verstehen, bei Lese-/Rechtschreibproblemen und zur Abgrenzung von ADS/ADHS zu auditiven Wahrnehmungsstörungen durch. Bevor starke Medikamente gegeben werden, kann häufig auch eine homöopathische Therapie ein guter Mittelweg sein.</p>
      </article>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Append styles**

```css
.section { padding-block: var(--space-7); }
.section--alt { background: var(--color-paper-alt); }
.section h2 { font-size: 1.75rem; margin-bottom: var(--space-4); }
.section__lede { font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.03em; color: var(--color-brand-dark); }
.section p + p { margin-top: var(--space-4); }

.pill-row { list-style: none; display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-5); padding: 0; }
.pill-row li { background: var(--color-paper); border: 1px solid var(--color-border); border-radius: 999px; padding: var(--space-2) var(--space-4); font-size: 0.8rem; font-weight: 600; }

.card-grid { display: grid; gap: var(--space-5); margin-top: var(--space-6); }
.card { background: var(--color-paper); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: var(--space-5); }
.card h3 { font-size: 1.1rem; margin-bottom: var(--space-3); color: var(--color-brand-dark); }

@media (min-width: 48rem) {
  .card-grid { grid-template-columns: repeat(3, 1fr); }
}
```

- [ ] **Step 3: Verify in the browser**

1. Reload `http://localhost:4173/`, screenshot at mobile (single-column cards, wrapped pills) and desktop (3-column card grid).
2. `get_page_text` and confirm the Leistungen/Schwerpunkte copy matches the text above verbatim (spot-check 2–3 sentences).

- [ ] **Step 4: Commit**

```bash
git add index.html assets/css/styles.css
git commit -m "Add Leistungen and Schwerpunkte sections

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Praxisteam section

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: `.section`, `.container` (Task 4).

- [ ] **Step 1: Source and optimize the team photo**

Run: `curl -sL "https://images.squarespace-cdn.com/content/v1/549e9b5fe4b0cddb26c82546/1422460624480-HV9PZ18TRZH6OJDBLWWJ/JB0A5982neu-001.jpg" -o /tmp/team-src.jpg && cwebp -q 82 /tmp/team-src.jpg -o assets/img/team.webp && cwebp -q 82 -resize 800 0 /tmp/team-src.jpg -o assets/img/team-800.webp`
Expected: both files exist.

- [ ] **Step 2: Add markup**

```html
<section id="team" class="section section--alt">
  <div class="container">
    <h2>Praxisteam</h2>
    <p class="section__lede">Wir heißen Sie herzlich willkommen und freuen uns auf Sie</p>
    <figure class="team-photo">
      <img src="assets/img/team-800.webp" srcset="assets/img/team-800.webp 800w, assets/img/team.webp 1600w" sizes="(min-width: 48rem) 60rem, 100vw" alt="Das Praxisteam der HNO-Praxis Dr. Mayer-Brix" width="800" height="533" loading="lazy">
      <figcaption>V.l.n.r.: Frau Kube, Frau Modschiedler, Frau Laube, Dr. J. Mayer-Brix, Frau Mohr und Frau Aalai</figcaption>
    </figure>
  </div>
</section>
```

- [ ] **Step 3: Append styles**

```css
.team-photo { margin-top: var(--space-6); }
.team-photo img { border-radius: 0.75rem; width: 100%; height: auto; }
.team-photo figcaption { margin-top: var(--space-3); font-size: 0.85rem; color: var(--color-ink-soft); }
```

- [ ] **Step 4: Verify in the browser**

Reload, screenshot mobile + desktop — expect: rounded team photo with caption beneath, full-width on mobile, capped by the container on desktop. Confirm `read_console_messages` shows no 404s for `assets/img/team-800.webp`.

- [ ] **Step 5: Commit**

```bash
git add index.html assets/css/styles.css assets/img/team*.webp
git commit -m "Add Praxisteam section

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Einblicke — 360° Rundgang section

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: `.section`, `.container` (Task 4).

- [ ] **Step 1: Add markup — the Street View embed URL is copied verbatim from the live site's DOM audit**

```html
<section id="einblicke" class="section">
  <div class="container">
    <h2>Einblicke</h2>
    <p class="section__lede">Rundgang durch die Praxis</p>
    <p>Ansicht mit Klicken und Halten im Bild, um 360 Grad drehbar.</p>
    <div class="embed-frame">
      <iframe
        src="https://www.google.com/maps/embed?pb=!4v1668604104241!6m8!1m7!1sCAoSLEFGMVFpcE9ab0FHbjFpeklpdFNIMnJiUkd5WUNobUlRekROSW90elRsY1pp!2m2!1d49.591735308831!2d11.025465644748!3f120!4f0!5f0.7820865974627469"
        title="360° Rundgang durch die HNO-Praxis Dr. Mayer-Brix"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen></iframe>
    </div>
    <p class="embed-frame__note">Buttons am rechten Rand: Rundgang 1 – Flur / Rundgang 2 – Arztzimmer und Hörtestraum</p>
  </div>
</section>
```

- [ ] **Step 2: Append styles**

```css
.embed-frame { margin-top: var(--space-6); aspect-ratio: 16 / 10; border-radius: 0.75rem; overflow: hidden; border: 1px solid var(--color-border); }
.embed-frame iframe { width: 100%; height: 100%; border: 0; }
.embed-frame__note { margin-top: var(--space-2); font-size: 0.8rem; color: var(--color-ink-soft); text-align: right; }
```

- [ ] **Step 3: Verify in the browser**

Reload, screenshot — expect: the 360° panorama loads inside a rounded frame at both mobile and desktop widths. Manually drag inside the iframe (`left_click_drag`) and confirm the view rotates (spot check, not automatable further).

- [ ] **Step 4: Commit**

```bash
git add index.html assets/css/styles.css
git commit -m "Add Einblicke 360-degree tour section

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Buch section with PayPal Buttons SDK

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: `.section`, `.container`, `.button` (Tasks 1, 2, 4).

- [ ] **Step 1: Source and optimize the book cover image**

Run: `curl -sL "https://images.squarespace-cdn.com/content/v1/549e9b5fe4b0cddb26c82546/c6763af4-bb93-4afb-98d2-d650e415bda3/Klassische-Homoeopathie-in-der-HNO-Heilkunde-Joachim-Mayer-Brix.jpeg" -o /tmp/book-src.jpg && cwebp -q 85 /tmp/book-src.jpg -o assets/img/book-cover.webp`
Expected: file exists.

- [ ] **Step 2: Add markup — PayPal SDK snippet and button config copied exactly from the live site, INCLUDING its current sandbox client-id**

```html
<section id="buch" class="section section--alt">
  <div class="container buch-layout">
    <img src="assets/img/book-cover.webp" alt='Buchcover "Klassische Homöopathie in der HNO-Heilkunde"' width="284" height="400" loading="lazy">
    <div>
      <h2>Neu – Unser Buch</h2>
      <p class="section__lede">Klassische Homöopathie in der HNO-Heilkunde</p>
      <p>Die Verbindung von Schulmedizin mit alternativen Heilverfahren ist eine optimale Kombination. In diesem Buch habe ich für jedes HNO-Krankheitsbild den aktuellen schulmedizinischen Wissensstand und die naturheilkundliche Behandlung mit vielen Abbildungen verständlich erläutert und durch Fallbeispiele illustriert.</p>
      <p>Von Polypen (Adenoiden) bei Kindern, über Paukenergüsse und Allergien bis zu chronischen Nebenhöhlen- und Halsentzündungen finden Sie alle häufigen Erkrankungen ausführlich beschrieben.</p>
      <p>Interessant für Ärzte, Heilpraktiker und alle von der Homöopathie begeisterten Laien. Eine Leseprobe ist auf der Website des <a href="https://www.narayana-verlag.de/Klassische-Homoeopathie-in-der-HNO-Heilkunde-Joachim-Mayer-Brix/b24327">Narayana-Verlags</a> zu finden.</p>
      <p class="price">69,90 €</p>
      <div id="paypal-button-container"></div>
    </div>
  </div>
</section>

<!--
  KNOWN ISSUE — flagged for the user, not silently fixed:
  This SDK script uses client-id=sb, PayPal's public SANDBOX id. It is copied
  verbatim from what is live on dr-mayer-brix.de today, so this button cannot
  take real payments as configured, on the old site OR here, until it's swapped
  for a real PayPal REST app client-id. Get one from
  https://developer.paypal.com/dashboard/applications and replace "sb" below
  before launch.
-->
<script src="https://www.paypal.com/sdk/js?client-id=sb&enable-funding=venmo&currency=EUR"></script>
<script>
  paypal.Buttons({
    style: { shape: 'pill', color: 'gold', layout: 'horizontal', label: 'buynow' },
    createOrder: function (data, actions) {
      return actions.order.create({
        purchase_units: [{
          description: 'Buch: "Klassische Homöopathie in der HNO-Heilkunde" von Dr. med. Joachim Mayer-Brix (390 Seiten, geb., ISBN: 978-3-95582-206-4)',
          amount: {
            currency_code: 'EUR',
            value: 69.90,
            breakdown: {
              item_total: { currency_code: 'EUR', value: 65.33 },
              shipping: { currency_code: 'EUR', value: 0 },
              tax_total: { currency_code: 'EUR', value: 4.57 },
            },
          },
        }],
      });
    },
    onApprove: function (data, actions) {
      return actions.order.capture().then(function () {
        document.getElementById('paypal-button-container').innerHTML = '<h3>Vielen Dank für Ihre Bestellung!</h3>';
      });
    },
    onError: function (err) {
      console.log(err);
    },
  }).render('#paypal-button-container');
</script>
```

- [ ] **Step 3: Append styles**

```css
.buch-layout { display: grid; gap: var(--space-6); align-items: start; margin-top: var(--space-4); }
.buch-layout img { border-radius: 0.5rem; box-shadow: 0 8px 24px rgba(0,0,0,0.12); max-width: 12rem; margin-inline: auto; }
.price { font-size: 1.5rem; font-weight: 700; margin-block: var(--space-4); }

@media (min-width: 48rem) {
  .buch-layout { grid-template-columns: 12rem 1fr; }
  .buch-layout img { margin-inline: 0; }
}
```

- [ ] **Step 4: Verify in the browser**

Reload, screenshot — expect: book cover + copy + price + a rendered PayPal button. Click the button — expect: a PayPal sandbox popup/iframe opens (confirms the SDK loaded and rendered; do not complete a sandbox transaction).

- [ ] **Step 5: Commit**

```bash
git add index.html assets/css/styles.css assets/img/book-cover.webp
git commit -m "Add Buch section with PayPal Buttons SDK (sandbox client-id, flagged)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Fachartikel section with PayPal hosted-button forms

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: `.section`, `.container`, `.card-grid`, `.card` (Task 4).

- [ ] **Step 1: Add markup — both forms use the real `hosted_button_id` values audited from the live site (fully portable PayPal hosted buttons, independent of Squarespace)**

```html
<section id="fachartikel" class="section">
  <div class="container">
    <h2>Fachartikel</h2>
    <div class="card-grid card-grid--2">
      <article class="card">
        <h3>Die Polypen bei meinem Kind sollen operiert werden, muss das wirklich sein?</h3>
        <p class="section__lede">Auszug aus dem Fachartikel von Dr. Joachim Mayer-Brix</p>
        <p>Sehr häufig wird bei Kindern vom HNO-Arzt schnell eine Entfernung der Polypen (Adenoide Vegetationen) empfohlen. Eltern fragen sich dann häufig, ob das wirklich sein muss. Die Antwort: In sehr vielen Fällen kann eine Operation vermieden werden.</p>
        <p>Wir geben Ihnen ausführliche Informationen aus 20 Jahren Erfahrung in einer naturheilkundlichen HNO-Praxis, mit Bildern, die Sie im Internet nicht finden, und ausführlichen Ratschlägen auf: Was sind Polypen? Warum vergrößern sich Polypen bei Kindern? Wie werden Polypen operiert? Was gibt es für Alternativen zu einer Operation der Polypen? Hilft Homöopathie bei Polypen? Was sind Alternativbehandlungen bei Polypen? Wo finde ich Hilfe?</p>
        <p>... zum Weiterlesen erwerben Sie bitte den gesamten Artikel.</p>
        <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" class="paypal-hosted-form">
          <input type="hidden" name="cmd" value="_s-xclick">
          <input type="hidden" name="hosted_button_id" value="ZVE567CQTAPRC">
          <input type="hidden" name="on0" value="Fachartikel: Die Polypen bei meinem Kind sollen operiert werden,">
          <input type="hidden" name="currency_code" value="EUR">
          <p class="price">PDF per E-Mail 4,99 €</p>
          <button type="submit" class="button button--primary">Kostenpflichtig bestellen (PayPal)</button>
        </form>
      </article>
      <article class="card">
        <h3>Hilfe, ich bin ständig krank...</h3>
        <p class="section__lede">Auszug aus dem Fachartikel von Dr. Joachim Mayer-Brix</p>
        <p>„Ständig bin ich krank, mein Arzt hört mir nicht zu oder findet nichts und verschreibt mir nur Antibiotika … Das nervt mich: Ich will endlich wieder gesund sein."</p>
        <p>Da dieses Thema in der Praxis sehr häufig ist, haben wir für Sie einen Ratgeber verfasst, der auf 20 Jahren Praxis beruht: Woran muss ich denken, wenn ich dauernd krank bin? Was muss ich untersuchen lassen? Was kann ich selber tun? Wo bekomme ich Hilfe?</p>
        <p>... zum Weiterlesen erwerben Sie bitte den gesamten Artikel.</p>
        <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" class="paypal-hosted-form">
          <input type="hidden" name="cmd" value="_s-xclick">
          <input type="hidden" name="hosted_button_id" value="QCJGWD4PRCMEC">
          <input type="hidden" name="on0" value="Fachartikel: Hilfe, ich bin ständig krank...">
          <input type="hidden" name="currency_code" value="EUR">
          <p class="price">PDF per E-Mail 4,99 €</p>
          <button type="submit" class="button button--primary">Kostenpflichtig bestellen (PayPal)</button>
        </form>
      </article>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Append styles**

```css
.card-grid--2 { grid-template-columns: 1fr; }
.paypal-hosted-form { margin-top: var(--space-4); }
@media (min-width: 48rem) {
  .card-grid--2 { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 3: Verify in the browser**

Reload, screenshot mobile (stacked cards) and desktop (2-column). Confirm both forms' `action` attribute is `https://www.paypal.com/cgi-bin/webscr` and each `hosted_button_id` matches the values above via `read_page`.

- [ ] **Step 4: Commit**

```bash
git add index.html assets/css/styles.css
git commit -m "Add Fachartikel section with PayPal hosted-button forms

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: Kontakt section — address/hours, map, and Netlify Forms contact form

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: `.section`, `.container`, `.embed-frame`, `.button` (Tasks 1, 2, 4, 6).

- [ ] **Step 1: Add markup**

```html
<section id="kontakt" class="section section--alt">
  <div class="container kontakt-layout">
    <div>
      <h2>Kontakt</h2>
      <p class="section__lede">Per E-Mail</p>
      <form name="kontakt" method="POST" data-netlify="true" netlify-honeypot="firma" class="kontakt-form">
        <input type="hidden" name="form-name" value="kontakt">
        <p hidden><label>Firma (nicht ausfüllen): <input name="firma"></label></p>
        <label for="name">Name</label>
        <input id="name" name="name" type="text" placeholder="Ihr Name ...">
        <label for="email">E-Mail Adresse</label>
        <input id="email" name="email" type="email" required placeholder="Ihre E-Mail Adresse ...">
        <label for="betreff">Betreff</label>
        <input id="betreff" name="betreff" type="text" required placeholder="Worum geht es?">
        <label for="nachricht">Ihre Nachricht (bitte Tel.-Nr. und Krankenkasse angeben!)</label>
        <textarea id="nachricht" name="nachricht" required placeholder="Was können wir für Sie tun?"></textarea>
        <button type="submit" class="button button--primary">Senden</button>
      </form>
    </div>
    <div class="kontakt-info">
      <h3>Adresse</h3>
      <p>Allee am Röthelheimpark 6<br>91052 Erlangen</p>
      <p>Tel.: <a href="tel:+499131208899">+49 (0) 91 31 / 20 88 99</a><br>Fax: +49 (0) 91 31 / 20 52 45</p>
      <h3>Telefonzeiten</h3>
      <!-- The live site shows two slightly different Sprechzeiten blocks (hero vs. this
           Kontakt block) — Mi phone hours 9–11.15 here vs 10–11.15 in the hero, and
           Mo/Di/Do opening 8.15 here vs 8.30 in the hero. Using this block's numbers as
           canonical since it's the more complete one; FLAGGED for the family to confirm
           which is correct. -->
      <p>Mo, Di, Do 8.15 – 11.15 und 14.15 – 16.30<br>Mi 9 – 11.15<br>Fr 8.15 – 11.15</p>
      <h3>Öffnungszeiten</h3>
      <p>Mo, Di, Do 8.15 – 12.30 und 14 – 17.30<br>Mi 10 – 15.30<br>Fr 8.15 – 13.30</p>
      <h3>So finden Sie uns</h3>
      <div class="embed-frame">
        <iframe
          src="https://www.google.com/maps/embed?pb=!4v1668604104241!6m8!1m7!1sCAoSLEFGMVFpcE9ab0FHbjFpeklpdFNIMnJiUkd5WUNobUlRekROSW90elRsY1pp!2m2!1d49.591735308831!2d11.025465644748!3f120!4f0!5f0.7820865974627469"
          title="Standort der HNO-Praxis Dr. Mayer-Brix"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen></iframe>
      </div>
    </div>
  </div>
</section>
```

Note: the two `google.com/maps/embed` URLs (this task and Task 6) are the exact same `pb=` parameter as audited — the live site uses the same panorama embed for both the 360° tour and the "So finden Sie uns" map, so this is not a copy-paste mistake.

- [ ] **Step 2: Append styles**

```css
.kontakt-layout { display: grid; gap: var(--space-7); margin-top: var(--space-4); }
.kontakt-form { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4); }
.kontakt-form label { font-size: 0.85rem; font-weight: 600; }
.kontakt-form input, .kontakt-form textarea {
  padding: var(--space-3); border: 1px solid var(--color-border); border-radius: 0.5rem; width: 100%;
}
.kontakt-form textarea { min-height: 8rem; resize: vertical; }
.kontakt-info h3 { margin-top: var(--space-5); font-size: 1rem; }
.kontakt-info h3:first-child { margin-top: 0; }
.kontakt-info .embed-frame { aspect-ratio: 4 / 3; }

@media (min-width: 64rem) {
  .kontakt-layout { grid-template-columns: 1fr 1fr; }
}
```

- [ ] **Step 3: Verify in the browser**

1. Reload, screenshot mobile (stacked) and desktop (2-column with form left, info+map right).
2. `read_page filter:interactive` and confirm the form has `data-netlify="true"`, `name="kontakt"`, and the hidden `form-name` input — this is what Netlify's build-time form detection scans for; it only works once deployed to Netlify (Task 15), not on the local Python server — note that in the verification, don't expect a real submission to succeed locally.
3. Confirm all 4 visible fields (Name, E-Mail, Betreff, Nachricht) have matching `<label for>`/`id` pairs via `read_page`.

- [ ] **Step 4: Commit**

```bash
git add index.html assets/css/styles.css
git commit -m "Add Kontakt section with Netlify Forms contact form

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: Legal pages — Impressum and Datenschutz

**Files:**
- Create: `impressum.html`
- Create: `datenschutz.html`
- Modify: `assets/css/styles.css` (append `.legal` styles)

**Interfaces:**
- Consumes: full header/nav/banner-slot/footer shell pattern from `index.html` (Tasks 1–3) — duplicated by hand into these two files per the "no templating" scaffold decision (spec §4).

- [ ] **Step 1: Create `impressum.html`** — same `<head>`/header/banner-slot/nav/footer/script shell as `index.html`, with this `<main>`:

```html
<main>
  <section class="section legal">
    <div class="container">
      <h1>Impressum</h1>
      <p class="section__lede">Hier sind wir erreichbar für Sie</p>
      <p>HNO Praxis Dr. Mayer-Brix<br>
      Allee Am Röthelheimpark 6<br>
      91052 Erlangen</p>
      <p>Tel.: 0 91 31 / 20 88 99<br>
      Fax: 0 91 31 / 20 52 45</p>
      <p><a href="mailto:mbpraxis@duck.com">Kontakt per E-Mail</a></p>

      <h2>Informationen zur Zulassung</h2>
      <p>Dr. Joachim Mayer-Brix, Erlangen<br>
      Gesetzliche Berufsbezeichnung: Arzt<br>
      Staat der Verleihung: Deutschland</p>
      <p>Zuständige Aufsichtsbehörde ist die <a href="http://www.blaek.de/">Landesärztekammer Bayern</a>.<br>
      Berufsordnung für die Ärzte Bayerns zum <a href="http://www.blaek.de/pdf_rechtliches/haupt/BO_2_16.pdf">Download</a>.</p>

      <h2>Haftung &amp; Verantwortung</h2>
      <p>Inhaltlich verantwortlich gemäß §6 MDStV ist Herr Dr. med. Joachim Mayer-Brix.</p>
      <p>Die Praxis Dr. Mayer-Brix übernimmt - trotz sorgfältiger Prüfung - keine Haftung für die in ihrem Webauftritt bereitgestellten Links und die Inhalte verlinkter Seiten. Sie übernimmt auch keine Verantwortung für Folgen, die aus dem Besuch eines Links resultieren können. Verantwortlich für die Inhalte verlinkter Seiten sind ausschließlich deren Betreiber. Die Praxis Dr. Mayer-Brix macht sich weder die Inhalte noch die Meinung oder Einstellung verlinkter Seiten zu eigen, noch spiegelt diese die Meinung oder Einstellung der Praxis Dr. Mayer-Brix wider.</p>

      <h2>Gestaltung &amp; Realisation</h2>
      <p>Gestaltung und Realisierung durch Jonas Schmidt.</p>
    </div>
  </section>
</main>
```

- [ ] **Step 2: Create `datenschutz.html`** — same shell, with this `<main>` (full text ported verbatim from the live `/datenschutz` page; two accuracy notes added as HTML comments rather than silently corrected, since this is regulated legal content):

```html
<main>
  <section class="section legal">
    <div class="container">
      <h1>Datenschutzerklärung</h1>
      <p>Gemäss Teledienstgesetz weisen wir daraufhin, dass Sie uns auch anonym schreiben können. Persönliche Daten werden nur insoweit gespeichert, als sie zur Terminvergabe notwendig sind. Ihre IP-Adresse kann vom Internet-Serviceprovider ggf. zu statistischen Zwecken gespeichert werden.</p>

      <h2>1. Datenschutz auf einen Blick</h2>
      <h3>Allgemeine Hinweise</h3>
      <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.</p>

      <h3>Datenerfassung auf unserer Website</h3>
      <p><strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br>
      Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.</p>
      <p><strong>Wie erfassen wir Ihre Daten?</strong><br>
      Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben.</p>
      <p>Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie unsere Website betreten.</p>
      <p><strong>Wofür nutzen wir Ihre Daten?</strong><br>
      Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.</p>
      <p><strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong><br>
      Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung, Sperrung oder Löschung dieser Daten zu verlangen. Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.</p>

      <h2>2. Allgemeine Hinweise und Pflichtinformationen</h2>
      <h3>Datenschutz</h3>
      <p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
      <p>Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.</p>
      <p>Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.</p>

      <h3>Hinweis zur verantwortlichen Stelle</h3>
      <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
      <p>Dr. Joachim Mayer-Brix<br>
      Allee am Röthelheimpark 6<br>
      91052 Erlangen<br>
      E-Mail: mbpraxis@duck.com<br>
      Tel: 09131 208899</p>
      <p>Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.B. Namen, E-Mail-Adressen o.Ä.) entscheidet.</p>

      <h3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
      <p>Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.</p>

      <h3>Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
      <p>Im Falle datenschutzrechtlicher Verstöße steht dem Betroffenen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu. Zuständige Aufsichtsbehörde in datenschutzrechtlichen Fragen ist der Landesdatenschutzbeauftragte des Bundeslandes, in dem unser Unternehmen seinen Sitz hat. Eine Liste der Datenschutzbeauftragten sowie deren Kontaktdaten können folgendem Link entnommen werden: <a href="https://www.bfdi.bund.de/DE/Infothek/Anschriften_Links/anschriften_links-node.html">bfdi.bund.de</a>.</p>

      <h3>Recht auf Datenübertragbarkeit</h3>
      <p>Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.</p>

      <h3>Auskunft, Sperrung, Löschung</h3>
      <p>Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden.</p>

      <h3>Widerspruch gegen Werbe-Mails</h3>
      <p>Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit widersprochen. Die Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen, etwa durch Spam-E-Mails, vor.</p>

      <h2>3. Datenerfassung auf unserer Website</h2>
      <h3>Cookies</h3>
      <p>Die Internetseiten verwenden teilweise so genannte Cookies. Cookies richten auf Ihrem Rechner keinen Schaden an und enthalten keine Viren. Cookies dienen dazu, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen. Cookies sind kleine Textdateien, die auf Ihrem Rechner abgelegt werden und die Ihr Browser speichert.</p>
      <p>Die meisten der von uns verwendeten Cookies sind so genannte "Session-Cookies". Sie werden nach Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese löschen. Diese Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch wiederzuerkennen.</p>
      <p>Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies beim Schließen des Browsers aktivieren. Bei der Deaktivierung von Cookies kann die Funktionalität dieser Website eingeschränkt sein.</p>
      <p>Cookies, die zur Durchführung des elektronischen Kommunikationsvorgangs oder zur Bereitstellung bestimmter, von Ihnen erwünschter Funktionen (z.B. Warenkorbfunktion) erforderlich sind, werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO gespeichert. Der Websitebetreiber hat ein berechtigtes Interesse an der Speicherung von Cookies zur technisch fehlerfreien und optimierten Bereitstellung seiner Dienste.</p>

      <h3>Server-Log-Dateien</h3>
      <p>Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind: Browsertyp und Browserversion, verwendetes Betriebssystem, Referrer URL, Hostname des zugreifenden Rechners, Uhrzeit der Serveranfrage, IP-Adresse.</p>
      <p>Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Grundlage für die Datenverarbeitung ist Art. 6 Abs. 1 lit. b DSGVO, der die Verarbeitung von Daten zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen gestattet.</p>

      <h3>Kontaktformular</h3>
      <p>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.</p>
      <p>Die Verarbeitung der in das Kontaktformular eingegebenen Daten erfolgt somit ausschließlich auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie können diese Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitungsvorgänge bleibt vom Widerruf unberührt.</p>
      <p>Die von Ihnen im Kontaktformular eingegebenen Daten verbleiben bei uns, bis Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt (z.B. nach abgeschlossener Bearbeitung Ihrer Anfrage). Zwingende gesetzliche Bestimmungen – insbesondere Aufbewahrungsfristen – bleiben unberührt.</p>
      <p>Diese Anfragen werden ab dem Relaunch dieser Website über Netlify Forms verarbeitet, gehostet von Netlify, Inc. (San Francisco, USA).</p>

      <h2>4. Plugins und Tools</h2>
      <!-- ACCURACY NOTE, flagged not silently fixed: the previous Datenschutzerklärung
           described a YouTube plugin, but the site actually embeds a Vimeo video, not
           YouTube — and it did not mention PayPal at all despite the Buch/Fachartikel
           purchase buttons. Both are corrected below to match what the site actually
           embeds. Recommend the family have this whole page reviewed by whoever handles
           their legal/DSGVO compliance rather than trusting this port at face value. -->
      <h3>Vimeo</h3>
      <p>Unsere Website nutzt zur Einbindung von Videos den Anbieter Vimeo. Anbieter ist die Vimeo Inc., 555 West 18th Street, New York, New York 10011, USA.</p>
      <p>Wenn Sie eine unserer mit einem Vimeo-Player ausgestatteten Seiten besuchen, wird eine Verbindung zu den Servern von Vimeo hergestellt. Dabei wird dem Vimeo-Server mitgeteilt, welche unserer Seiten Sie besucht haben. Die Nutzung von Vimeo erfolgt im Interesse einer ansprechenden Darstellung unserer Online-Angebote. Dies stellt ein berechtigtes Interesse im Sinne von Art. 6 Abs. 1 lit. f DSGVO dar.</p>
      <p>Weitere Informationen zum Umgang mit Nutzerdaten finden Sie in der Datenschutzerklärung von Vimeo unter: <a href="https://vimeo.com/privacy">vimeo.com/privacy</a>.</p>

      <h3>Google Web Fonts</h3>
      <p>Diese Seite bindet Schriftarten lokal ein (Self-Hosting) statt sie von Servern Dritter zu laden. Es findet daher beim Aufruf dieser Website keine Verbindung zu den Servern von Google statt.</p>

      <h3>Google Maps</h3>
      <p>Diese Seite nutzt über eine eingebettete iFrame-Ansicht den Kartendienst Google Maps, unter anderem für den virtuellen 360°-Rundgang durch die Praxis. Anbieter ist die Google Inc., 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.</p>
      <p>Zur Nutzung der Funktionen von Google Maps ist es notwendig, Ihre IP-Adresse zu speichern. Diese Informationen werden in der Regel an einen Server von Google in den USA übertragen und dort gespeichert. Der Anbieter dieser Seite hat keinen Einfluss auf diese Datenübertragung.</p>
      <p>Mehr Informationen zum Umgang mit Nutzerdaten finden Sie in der Datenschutzerklärung von Google: <a href="https://www.google.de/intl/de/policies/privacy/">google.de/intl/de/policies/privacy</a>.</p>

      <h3>Google Analytics</h3>
      <p>Diese Website benutzt Google Analytics, einen Webanalysedienst der Google Inc. ("Google"). Google Analytics verwendet sog. "Cookies", Textdateien, die auf Ihrem Computer gespeichert werden und die eine Analyse der Benutzung der Website durch Sie ermöglichen. Die durch den Cookie erzeugten Informationen über Ihre Benutzung dieser Website werden an einen Server von Google in den USA übertragen und dort gespeichert.</p>
      <p>Sie können die Installation der Cookies durch eine entsprechende Einstellung Ihrer Browser-Software verhindern; wir weisen Sie jedoch darauf hin, dass Sie in diesem Fall gegebenenfalls nicht sämtliche Funktionen dieser Website voll umfänglich nutzen können.</p>

      <h3>PayPal</h3>
      <p>Auf dieser Website bieten wir die Bezahlung via PayPal an. Anbieter dieses Zahlungsdienstes ist die PayPal (Europe) S.à.r.l. et Cie, S.C.A., 22-24 Boulevard Royal, L-2449 Luxembourg. Wenn Sie die Bezahlung via PayPal auswählen, werden die von Ihnen eingegebenen Zahlungsdaten an PayPal übermittelt. Näheres entnehmen Sie der Datenschutzerklärung von PayPal: <a href="https://www.paypal.com/de/webapps/mpp/ua/privacy-full">paypal.com/de/webapps/mpp/ua/privacy-full</a>.</p>

      <h3>jameda Siegel und Widget</h3>
      <p>Auf unserer Internetseite sind Siegel oder Widgets der jameda GmbH, St. Cajetan-Straße 41, 81669 München eingebunden. Ein Widget ist ein kleines Fenster, das veränderliche Informationen anzeigt. Auch unser Siegel funktioniert in ähnlicher Weise, d.h. es sieht nicht immer gleich aus, sondern die Anzeige ändert sich. Dabei wird der entsprechende Inhalt zwar auf unserer Internetseite dargestellt, er wird aber in diesem Moment von den jameda-Servern abgerufen.</p>
      <p>Wir verfolgen mit der Einbindung den Zweck und das berechtigte Interesse, aktuelle und korrekte Inhalte auf unserer Homepage darzustellen. Rechtsgrundlage ist Art. 6 Abs. 1 f) DSGVO. Weitere Informationen zur Datenverarbeitung durch jameda können Sie der Datenschutzerklärung der Seite www.jameda.de entnehmen.</p>
    </div>
  </section>
</main>
```

- [ ] **Step 3: Append `.legal` styles**

```css
.legal h1 { margin-bottom: var(--space-5); }
.legal h2 { font-size: 1.25rem; margin-top: var(--space-7); margin-bottom: var(--space-3); }
.legal h3 { font-size: 1rem; margin-top: var(--space-5); margin-bottom: var(--space-2); color: var(--color-brand-dark); }
.legal p { max-width: 42rem; }
.legal p + p { margin-top: var(--space-3); }
```

- [ ] **Step 4: Verify in the browser**

1. Navigate to `http://localhost:4173/impressum.html` and `http://localhost:4173/datenschutz.html` — expect: same header/nav/banner/footer chrome as the homepage, full legal text rendered, internal nav links back to `index.html#...` sections work.
2. Confirm both pages' `<title>` and banner slot behave identically to `index.html` (banner appears, same content).

- [ ] **Step 5: Commit**

```bash
git add impressum.html datenschutz.html assets/css/styles.css
git commit -m "Add Impressum and Datenschutz pages

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 11: Typography — match the logo's headline font

**Files:**
- Modify: `assets/css/styles.css` (swap `--font-heading`, add `@font-face` rules)
- Create: `assets/fonts/*.woff2` (headline font + Roboto, self-hosted)

**Interfaces:**
- Consumes: `--font-heading` variable defined in Task 1 (this task changes its value, not its name).

- [ ] **Step 1: Render 3 candidate headline fonts against real page content for visual comparison**

Using the Browser tool, build a throwaway local comparison page (`/tmp/font-compare.html`) that loads Jost, Questrial, and Poppins (Light/Medium weights) from Google Fonts CDN and renders the actual page's `<h1>`/`<h2>` text in each, stacked. Navigate to it, screenshot.

- [ ] **Step 2: Visually compare each candidate's capital letterforms against `reference/original-site-assets/logo_large.png`**

Read `reference/original-site-assets/logo_large.png` (already saved locally) side-by-side with the screenshot from Step 1. Pick the closest match — pay particular attention to the "R" leg curvature and "A" apex shape observed in the logo. Record the choice and a one-sentence rationale as a code comment in Step 4.

- [ ] **Step 3: Download the chosen headline font as self-hostable `woff2`, plus Roboto (Regular 400, Bold 700) for the body**

Run (adjust the font name/weights to the Step 2 choice, using Google Fonts' API to resolve the actual `.woff2` URLs — do not fabricate a URL, fetch `https://fonts.googleapis.com/css2?family=<Name>:wght@400;700&display=swap` with a modern-browser `User-Agent` header to get the real woff2 URLs, then download those):

```bash
mkdir -p assets/fonts
curl -sL -A "Mozilla/5.0" "https://fonts.googleapis.com/css2?family=Jost:wght@400;500&family=Roboto:wght@400;700&display=swap" -o /tmp/fonts.css
grep -oE "https://fonts.gstatic.com/[^)]+\.woff2" /tmp/fonts.css | sort -u
# then curl each resulting URL into assets/fonts/ with a clear filename, e.g.:
# curl -sL "<jost-400-url>" -o assets/fonts/jost-400.woff2
# curl -sL "<jost-500-url>" -o assets/fonts/jost-500.woff2
# curl -sL "<roboto-400-url>" -o assets/fonts/roboto-400.woff2
# curl -sL "<roboto-700-url>" -o assets/fonts/roboto-700.woff2
```

Expected: 4 `.woff2` files in `assets/fonts/`.

- [ ] **Step 4: Wire the fonts into `assets/css/styles.css`**

```css
/* Headline font chosen in Task 11 to match the logo wordmark's geometric sans
   letterforms (see reference/original-site-assets/logo_large.png) — replace
   "Jost" below with whichever candidate Step 2 actually picked if different. */
@font-face {
  font-family: 'Jost';
  src: url('../fonts/jost-400.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Jost';
  src: url('../fonts/jost-500.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: 'Roboto';
  src: url('../fonts/roboto-400.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Roboto';
  src: url('../fonts/roboto-700.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}

:root {
  --font-heading: 'Jost', -apple-system, 'Segoe UI', sans-serif;
}
h1, h2 { font-weight: 500; }
```

- [ ] **Step 5: Verify in the browser**

Reload every page (`index.html`, `impressum.html`, `datenschutz.html`), screenshot. In `read_network_requests`, confirm the 4 `.woff2` files load with `200` and come from `assets/fonts/` (not `fonts.gstatic.com`) — self-hosting confirmed. Visually compare an `<h1>` render against the logo once more.

- [ ] **Step 6: Commit**

```bash
git add assets/css/styles.css assets/fonts/*.woff2
git commit -m "Self-host headline and body fonts matched to the logo wordmark

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 12: SEO — meta tags, Open Graph, JSON-LD, sitemap, robots.txt

**Files:**
- Modify: `index.html`, `impressum.html`, `datenschutz.html` (append to `<head>`)
- Create: `sitemap.xml`
- Create: `robots.txt`

**Interfaces:**
- None — this task only adds `<head>` metadata and two root files; no JS/CSS interfaces produced or consumed.

- [ ] **Step 1: Add meta/OG/canonical tags to `index.html`'s `<head>`** (after `<title>`, before `<link rel="stylesheet">`)

```html
<meta name="description" content="HNO-Praxis Dr. Mayer-Brix in Erlangen: HNO-Heilkunde, Phoniatrie-Pädaudiologie und klassische Homöopathie. Termine online buchbar.">
<link rel="canonical" href="https://pmb.makethings.work/">
<meta property="og:type" content="website">
<meta property="og:title" content="HNO-Praxis Dr. Mayer-Brix — HNO und Homöopathie in Erlangen">
<meta property="og:description" content="HNO-Heilkunde, Phoniatrie-Pädaudiologie und klassische Homöopathie in Erlangen.">
<meta property="og:url" content="https://pmb.makethings.work/">
<meta property="og:image" content="https://pmb.makethings.work/assets/img/team.webp">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  "name": "HNO-Praxis Dr. Mayer-Brix",
  "medicalSpecialty": "Otolaryngologic",
  "url": "https://pmb.makethings.work/",
  "telephone": "+49-9131-208899",
  "faxNumber": "+49-9131-205245",
  "email": "mbpraxis@duck.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Allee am Röthelheimpark 6",
    "postalCode": "91052",
    "addressLocality": "Erlangen",
    "addressCountry": "DE"
  },
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Thursday"], "opens": "08:15", "closes": "12:30" },
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Thursday"], "opens": "14:00", "closes": "17:30" },
    { "@type": "OpeningHoursSpecification", "dayOfWeek": "Wednesday", "opens": "10:00", "closes": "15:30" },
    { "@type": "OpeningHoursSpecification", "dayOfWeek": "Friday", "opens": "08:15", "closes": "13:30" }
  ]
}
</script>
```

Note: `og:image` points at `assets/img/team.webp` which exists as of Task 5.

- [ ] **Step 2: Add matching meta/OG/canonical tags to `impressum.html` and `datenschutz.html`** (same pattern, page-specific `<title>`, `description`, `og:title`, `canonical` — no JSON-LD on those two, it belongs once on the homepage).

- [ ] **Step 3: Create `sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://pmb.makethings.work/</loc><priority>1.0</priority></url>
  <url><loc>https://pmb.makethings.work/impressum.html</loc><priority>0.3</priority></url>
  <url><loc>https://pmb.makethings.work/datenschutz.html</loc><priority>0.3</priority></url>
</urlset>
```

- [ ] **Step 4: Create `robots.txt`** — carrying forward the live site's choice to block AI-training crawlers while allowing search engines (spec §9)

```
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: anthropic-ai
User-agent: CCBot
User-agent: Google-Extended
User-agent: Bytespider
User-agent: Amazonbot
User-agent: FacebookBot
Disallow: /

User-agent: *
Allow: /

Sitemap: https://pmb.makethings.work/sitemap.xml
```

- [ ] **Step 5: Verify in the browser**

Reload each page, `read_page` the `<head>` (via `javascript_exec: document.head.innerHTML`) and confirm all 3 pages have a unique `<title>`, a `description`, and a `canonical` link; confirm the JSON-LD on `index.html` parses with `JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)` without throwing.

- [ ] **Step 6: Commit**

```bash
git add index.html impressum.html datenschutz.html sitemap.xml robots.txt
git commit -m "Add SEO meta tags, JSON-LD, sitemap, and robots.txt

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 13: Accessibility and full responsive QA pass

**Files:**
- Modify: `index.html`, `impressum.html`, `datenschutz.html`, `assets/css/styles.css` (fixes found during the pass — exact diffs depend on findings, see step instructions)

**Interfaces:**
- None — this task audits and patches whatever Tasks 1–12 produced; no new interfaces.

- [ ] **Step 1: Keyboard navigation audit**

Using the Browser tool on `http://localhost:4173/`: click the page body once to focus it, then press `Tab` repeatedly (`computer key Tab`, `repeat: 20`) and screenshot after each few presses. Confirm: focus order follows visual order (banner link → logo → nav toggle → nav links → hero CTA → sections → form fields → footer links), and every focused element shows the `outline: 3px solid var(--color-brand)` style from Task 1's `:focus-visible` rule. Fix any element that's unreachable or has no visible focus ring by adding `tabindex="0"` or adjusting CSS as needed.

- [ ] **Step 2: Color contrast check**

Use `zoom` to inspect the banner (`#009bc7` background, white text) and the `.section__lede`/link colors (`#00799c` on white and on `#f6f9fa`) at actual rendered size. Cross-check both pairs against WCAG AA (4.5:1 for normal text, 3:1 for large ≥1.25rem bold) using a contrast calculation — `#009bc7`/white ≈ 3.0:1 (fails AA for the banner's body text at 0.9rem regular weight). Fix: darken the banner background token to `#007a9e` (~4.6:1 against white) in `assets/css/styles.css`'s `:root`, or bump `.banner__inner` to `font-weight: 600` and treat it as large-scale text — pick the background-darkening fix, since it also improves the brand color's contrast everywhere else it's used as a background.

- [ ] **Step 3: Form labels and required-field audit**

`read_page filter:interactive` on the Kontakt form — confirm every `<input>`/`<textarea>` has an associated `<label for>` (already true from Task 9) and that `required` fields have `aria-required` implied correctly by the native `required` attribute (no extra ARIA needed). Confirm the honeypot field (`firma`) is `hidden` from sighted users AND has `aria-hidden="true"` added if it isn't already reachable by screen readers as a decoy — add `aria-hidden="true"` and `tabindex="-1"` to its wrapping `<p hidden>` in `index.html` if missing.

- [ ] **Step 4: Full responsive screenshot pass**

For each of `index.html`, `impressum.html`, `datenschutz.html`: `resize_window` to `mobile` (375×812), `tablet` (768×1024), and `desktop` (1440×900 — pass explicit `width`/`height` since "desktop" preset just clears emulation to the pane's own size), screenshot each. Confirm: no horizontal scroll at any width (check `document.documentElement.scrollWidth <= document.documentElement.clientWidth` via `javascript_exec`), no overlapping text, nav/banner/forms all usable at each size.

- [ ] **Step 5: Run the full unit test suite one more time**

Run: `node --test tests/`
Expected: PASS (all tests from Tasks 1–3, still 6 total unless a fix in this task touched them).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Accessibility and responsive QA fixes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 14: Netlify deployment

**Files:**
- Create: `netlify.toml`
- Modify: `README.md` (deployment + local-dev instructions)

**Interfaces:**
- None — final integration task; deploys everything from Tasks 1–13.

- [ ] **Step 1: Create `netlify.toml`**

```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/assets/img/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

- [ ] **Step 2: Write `README.md`**

```markdown
# HNO-Praxis Dr. Mayer-Brix — Website

Static site (plain HTML/CSS/vanilla JS, no build step). Deployed on Netlify.

## Local development

    python3 -m http.server 4173

Then open http://localhost:4173/.

## Tests

    node --test tests/

## Editing the announcement banner

Handled by Decap CMS — see the companion plan/spec for `/admin` setup.
Editing `content/banner.json` directly and pushing to `main` also works.

## Deployment

Connected to Netlify, auto-deploys `main`. Netlify Forms handles the
Kontakt form automatically (detected at deploy time via the `data-netlify`
form attributes) — no extra configuration needed.
```

- [ ] **Step 3: Create the Netlify site and deploy**

Run: `netlify init` (or, if the Netlify CLI isn't authenticated in this environment, instruct the user to run this interactively) — link to the existing `JonasASchmidt/dr-mayer-brix-website` GitHub repo, accept the detected settings (publish directory `.`, no build command), and let it create the site.

If CLI auth isn't available, fall back to: `gh` doesn't manage Netlify, so tell the user to click "Add new site → Import an existing project" in the Netlify dashboard, pick the GitHub repo, leave build command empty, publish directory `.`, and deploy.

Expected: a live `<random-name>.netlify.app` URL.

- [ ] **Step 4: Verify the live deployment**

Navigate the Browser tool to the live `.netlify.app` URL. Repeat the Task 13 Step 4 responsive screenshot pass against production. Confirm the Kontakt form now shows up under Netlify's dashboard "Forms" tab (Netlify Forms only activates post-deploy, per the Task 9 note) — submit a real test message and confirm it appears there.

- [ ] **Step 5: Set the custom domain and hand off the DNS record to the user**

In the Netlify dashboard (or via `netlify domains:add pmb.makethings.work` if CLI is available), add `pmb.makethings.work` as a custom domain. Netlify will show a CNAME target (typically `<sitename>.netlify.app`). Report that exact value to the user so they can add the CNAME record for `pmb` under `makethings.work` in their externally-managed DNS (confirmed via the existing `spsb.makethings.work` deployment in the spec's audit) — this plan does not touch DNS itself, since the user manages it (spec §8).

- [ ] **Step 6: Commit**

```bash
git add netlify.toml README.md
git commit -m "Add Netlify config and deployment docs

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
git push
```

---

## Self-review notes

- **Spec coverage**: §2 (IA) → Tasks 1–10; §3 unchanged IA → same; §4 (tech stack/repo structure) → Task 1 + overall file layout; §5 (banner) rendering side → Task 3 (the Decap CMS editing side is the companion plan); §6 (branding/typography) → Task 11; §7 (embeds/forms) → Tasks 2, 6, 7, 8, 9; §8 (deployment/DNS) → Task 14; §9 (SEO/perf/a11y) → Tasks 2 (video facade perf), 5/7 (image optimization), 12 (SEO), 13 (a11y/responsive). §10 open items are called out inline in Tasks 7, 8, 9. No spec section without a task.
- **Placeholder scan**: no TBD/TODO; the one open value (PayPal sandbox client-id) is the actual current live value, loudly commented, not a placeholder.
- **Type/name consistency checked**: `initNav(toggleEl, panelEl)` (Task 1) called with `(toggle, nav)` in `main.js` (Task 3) — matches. `initVideoFacades(root)` (Task 2) called with `(document)` in `main.js` — matches. `loadBanner(slotEl)` (Task 3) called with `(bannerSlot)` — matches. `--font-heading` defined in Task 1, only its *value* changes in Task 11 — name matches throughout.
