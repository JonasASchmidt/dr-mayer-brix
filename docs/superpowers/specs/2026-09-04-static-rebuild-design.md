# HNO-Praxis Dr. Mayer-Brix — Static Rebuild Design

Date: 2026-09-04
Status: Approved by user (verbal "let's go" after design review in chat), pending written-spec review.

## 1. Background & goals

The practice site at https://www.dr-mayer-brix.de/ has run on Squarespace for years with
essentially static content. Goals of this project:

- Rebuild it as a plain static site (HTML/CSS/vanilla JS), eliminating Squarespace's hosting
  cost and CMS overhead.
- Improve load speed and SEO versus the current Squarespace build.
- Give the practice owner's son (the developer, "the user") full control of the source in a
  GitHub repo, deployed via Netlify.
- Let the practice owner (father, non-technical) edit **only** the top announcement banner
  himself, on demand, without touching code or asking for help each time.
- Redesign the banner component specifically (current Squarespace template is undersized for
  the amount of text he actually needs) and refresh branding (headline font matched to the
  existing logo mark, paired with a free Google body font).
- Ship fully responsive, mobile-first layout.
- Preserve all existing content, structure, and third-party embeds/integrations.
- Publish to `https://pmb.makethings.work` as the initial live target (see §8 for why this is
  not the final production domain yet).

### Non-goals

- No CMS/editing capability for anything other than the banner. All other content changes go
  through the developer via normal git commits.
- No commerce/booking backend changes. The PayPal buy buttons and the external medatixx
  booking link are carried over as-is, not rebuilt.
- No content rewrite. Copy is preserved verbatim except for two leftover unedited Squarespace
  placeholder image captions ("Make it stand out" / "Whatever it is, the way you tell your
  story online...") which were never real content and will be dropped.
- No redesign of information architecture — same pages, same section order (see §3).
- Cutting the real `dr-mayer-brix.de` domain over from Squarespace to this new site is **out
  of scope** for this build (see §8).

## 2. Source-site audit (as of 2026-09-04)

Confirmed via `sitemap.xml` and live inspection — 3 pages total:

- `/` (`hno-praxis-dr-mayer-brix`) — one-page homepage with anchored sections:
  `willkommen` (hero) → `leistungen-und-schwerpunkte` (services + focus areas) → `team` →
  `einblick-in-unsere-praxis` (360° tour) → `unser-buch` (book) → `fachartikel` (2 paid PDF
  articles) → `e-mail-kontakt` (contact form + address/hours + map).
- `/impressum`
- `/datenschutz`

Third-party embeds/integrations found in the live DOM:

| Element | Current implementation | Rebuild approach |
|---|---|---|
| Hero video | Vimeo, id `109794949`, Squarespace lazy-loads on scroll | Same Vimeo id, click-to-play poster facade (see §6) |
| 360° Rundgang | Plain `<iframe src="https://www.google.com/maps/embed?pb=...">`, no Squarespace-proprietary tech | Copy iframe verbatim |
| Location map | Plain Google Maps embed iframe | Copy iframe verbatim |
| "Termin buchen" | Plain `<a href="https://webtermin.medatixx.de/...">` — **link, not an embed** | Keep as external link/button |
| Book purchase / 2 Fachartikel | PayPal smart buttons (zoid iframes) | Keep PayPal button embed code as-is |
| Contact form | Squarespace-native form + Google reCAPTCHA enterprise, posts to Squarespace backend | Replace backend with Netlify Forms (see §7); keep same fields |
| Analytics | Google Analytics (`gtag.js`, both GA4 + UA property present) | Carry forward GA4 property only; drop legacy UA (Universal Analytics has been sunset by Google since mid-2024 and no longer collects data) |

Brand facts:

- Current theme fonts: Raleway (headings), Roboto (body) — both free Google Fonts, but this is
  the **Squarespace theme's** choice, not necessarily related to the logo's own lettering.
- Banner background: `rgb(0, 155, 199)` ≈ `#009BC7`.
- Logo: static image (`Logo_HNO-Praxis-Dr-Mayer-Brix.png`, served as WebP by Squarespace), thin
  geometric/humanist all-caps sans wordmark ("HNO PRAXIS" / "DR. MAYER-BRIX") with a cyan
  brush-stroke swoosh mark.

## 3. Information architecture — unchanged

Same 3 pages and same homepage section order as §2. No sections added, removed, or reordered.

## 4. Tech stack & repo structure

Plain static HTML/CSS/vanilla JS, no framework, no build step for page markup — matching the
approach already used for the family's other site,
[spsb.makethings.work](https://spsb.makethings.work) (hand-authored HTML per page, one shared
CSS file with custom-property design tokens, rem-based mobile-first breakpoints, minimal JS,
self-hosted fonts). Three real pages is small enough that hand-duplicating the shared
header/nav/footer/banner-slot markup across files is acceptable — no templating pipeline to
maintain.

Proposed repo layout:

```
/
├── index.html
├── impressum.html
├── datenschutz.html
├── admin/                  # Decap CMS
│   ├── index.html
│   └── config.yml
├── content/
│   └── banner.json         # editable via Decap; fetched client-side
├── assets/
│   ├── css/styles.css
│   ├── js/main.js          # nav toggle, banner render, video facade
│   ├── fonts/               # self-hosted woff2
│   └── img/                 # optimized images (webp/avif + fallback)
├── netlify/
│   └── functions/
│       └── oauth.js         # Decap CMS GitHub OAuth flow (see §5)
├── netlify.toml
├── robots.txt
├── sitemap.xml
└── docs/superpowers/specs/  # this file
```

The only non-static piece is the banner content fetch (§5) — everything else is served as-is by
Netlify with no server-side rendering.

## 5. Banner micro-CMS

**Decision (user-approved): Decap CMS**, git-backed, over a bespoke instant-save admin page.
Rationale: no server/database to maintain long-term, full edit history via git, zero ongoing
cost, standard well-documented tooling rather than bespoke auth code. Trade-off accepted: ~1
minute publish delay after saving, and the father needs one GitHub login.

Content schema — `content/banner.json`:

```json
{
  "enabled": true,
  "message": "Liebe Patienten, die Praxis ist vom 24. August bis einschließlich 4. September geschlossen...",
  "linkLabel": "",
  "linkUrl": ""
}
```

- `enabled`: boolean toggle — hide the banner without deleting the text underneath.
- `message`: plain multi-line text (Decap "text" widget = plain `<textarea>`, **not** a
  markdown widget) — no syntax for the father to learn; line breaks are preserved and rendered
  as paragraph breaks.
- `linkLabel` / `linkUrl`: optional — lets the banner carry an optional CTA (e.g. link to the
  booking page) without code changes.

Decap CMS is configured (`admin/config.yml`) with a single collection/file editing exactly this
one JSON file, so the editing UI the father sees is one form: a message box, a toggle, and two
optional link fields — nothing else is exposed.

**Auth**: Netlify's built-in Identity/Git Gateway service (the old standard Decap+Netlify
pairing) is being sunset, so this uses the current recommended pattern instead — a small Netlify
serverless function (`netlify/functions/oauth.js`) implementing the standard GitHub OAuth flow
for Decap's `github` backend, backed by a GitHub OAuth App owned by the user's GitHub account.
This is a well-documented, standard pattern (not custom-built auth), and needs only one GitHub
OAuth App registration + two env vars (`OAUTH_GITHUB_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_SECRET`)
set in Netlify.

**Rendering**: `assets/js/main.js` fetches `content/banner.json` client-side on every page load
and renders it into a fixed banner slot already present in each page's HTML (so there's no
layout shift once it resolves — the slot reserves space). If `enabled` is `false` or the fetch
fails, the slot collapses to zero height.

**Redesigned banner component**: readable font size (current Squarespace template is
undersized), wraps cleanly across multiple lines on mobile instead of the current cramped
single-line squeeze, generous padding/line-height, AA-contrast text on the `#009BC7` background,
optional CTA styled as a small inline link/button.

## 6. Branding & typography

- Logo image itself is unchanged (already a clean vector-style asset).
- Headline font: identify the closest free match to the logo's lettering by rendering
  candidates (e.g. Jost, Questrial, Poppins Light) against the actual logo image side-by-side,
  and present 2–3 options for the user to pick from before final commit — this is a visual
  judgment call, not one to lock in unilaterally.
- Body font: keep Roboto (already free, already in use, highly legible) unless the chosen
  headline pairing reads better next to something else — evaluated alongside the headline
  candidates in the same comparison.
- Both self-hosted as `woff2` (not loaded from Google's CDN) for performance and to avoid an
  extra third-party request, matching the reference site's approach.

## 7. Forms, embeds, and integrations — carried over

- **Hero video**: same Vimeo id (`109794949`), rebuilt as a click-to-play facade (poster image
  + play button) instead of an auto-loading player iframe, deferring the Vimeo player script
  until the user actually presses play — meaningfully better initial load time/LCP than the
  current embed.
- **360° Rundgang & location map**: both are plain Google Maps embed `<iframe>`s already — copied
  verbatim, no rebuild risk.
- **Termin buchen**: kept as an external link/button to `webtermin.medatixx.de` (confirmed not
  actually embedded on the current site, despite appearing so at a glance).
- **PayPal buy buttons** (book excerpt PDF, "Hilfe, ich bin ständig krank" PDF, €4.99 each):
  kept as-is, assuming the practice wants to keep selling these — flagged for the user to
  confirm/correct.
- **Contact form**: rebuilt as a plain HTML form posting to **Netlify Forms** (built into
  Netlify hosting, no extra service, includes spam filtering) instead of the Squarespace form
  backend + reCAPTCHA. Same fields as today (Name, E-Mail, Betreff, Nachricht).
- **Analytics**: GA4 property carried forward; legacy Universal Analytics script dropped (Google
  stopped processing UA data in 2024).

## 8. Deployment, domain, and DNS

- Repo: **private** GitHub repo `JonasASchmidt/dr-mayer-brix-website`.
- Host: **Netlify**, connected to that repo, auto-deploying `main` on every push (including
  Decap CMS's commits to `content/banner.json`).
- Initial live URL: `pmb.makethings.work`, via a CNAME record (the user manages DNS for
  `makethings.work` externally, confirmed via the existing `spsb.makethings.work` deployment) —
  the user adds the CNAME once the Netlify site exists and I have the target hostname to give
  them.
- **`pmb.makethings.work` is a review/staging URL for this project, not the final production
  domain.** Cutting `www.dr-mayer-brix.de` itself over from Squarespace/its current DNS to this
  new Netlify site is an explicit separate step the user takes later, once satisfied with the
  rebuild — out of scope here. This avoids any risk to the live production site (and its
  `mbpraxis@duck.com` contact address, which is independent of the domain and unaffected either
  way) while the rebuild is being reviewed.

## 9. SEO, performance, accessibility

- Semantic HTML5 landmarks, one `<h1>` per page, logical heading order.
- Meta description, Open Graph/Twitter card tags, canonical URL per page.
- `LocalBusiness`/`MedicalOrganization` JSON-LD structured data (address, hours, phone,
  specialties) on the homepage.
- `sitemap.xml` (3 URLs) and `robots.txt` — carrying forward the current site's choice to block
  AI-training crawlers (`GPTBot`, `ClaudeBot`, etc.) while allowing standard search engine bots
  (Googlebot, Bingbot) to index normally.
- Images converted to WebP with responsive `srcset`/`sizes`, lazy-loaded below the fold
  (`loading="lazy"`), explicit `width`/`height` to prevent layout shift.
- Fonts self-hosted with `font-display: swap`.
- WCAG 2.1 AA: color contrast (verified against the `#009BC7` banner and cyan logo accent),
  visible focus states, labeled form fields, keyboard-operable nav (including the mobile menu
  toggle).
- Fully responsive, **mobile-first** CSS (drafted for the smallest breakpoint first, then
  progressively enhanced with `min-width` media queries), matching the rem-based breakpoint
  approach used on the reference site.

## 10. Open items flagged for user confirmation (not blocking, addressed if corrected)

- PayPal buy buttons: assumed **keep** (§7).
- Booking button: assumed **external link, not embedded** (§7) — matches what's actually on the
  live site today, flagged in case the user meant something else.
- Domain cutover timing: assumed **out of scope**, a later manual step (§8).

## 11. Out of scope / future work

- Cutting `dr-mayer-brix.de` over to the new host.
- Any CMS/editing capability beyond the banner.
- Any commerce/booking backend rebuild.
- Broader creative redesign beyond typography/branding refresh and the banner component (user
  chose "faithful modernization" over a bigger creative redesign).
