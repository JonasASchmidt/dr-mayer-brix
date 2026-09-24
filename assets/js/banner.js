import { EMAIL_PATTERN, emailLinkHtml, parseEmail } from './email-obfuscate.js';

export function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// The banner's whole "CMS" is one plain-text file (content/banner.txt):
// empty (or whitespace-only) = banner off, anything else = banner on with
// that text. No JSON, no enabled flag to flip — editing the file's content
// IS the on/off switch, so a non-technical editor can't get the syntax
// wrong. Every line is its own paragraph, each with a small gap before the
// next — blank lines are just skipped, not required to separate lines.
//
// Wrap any part of the text in **double asterisks** to highlight/bold it
// (matches Figma's "Bold" runs) — everything else renders at the default
// Medium weight (matches Figma's "Medium" runs). E.g.:
//   **Unsere Praxis bleibt vom 31.8. bis 4.9. geschlossen.**
//   Vertretung: Praxis Dr. Mayr, Tel. 09131 / 888080
const BOLD_RE = /\*\*(.+?)\*\*/g;

// Links. Three ways to get one, all rendered white (hover: ink) by
// .banner__text a in styles.css:
//
// 1. Just write an email address or a phone number — both are detected
//    and linked automatically:
//      Sie erreichen uns unter 09131/208899 oder mbpraxis@duck.com.
//
// 2. [label](target) for a link with its own text. The target can be a
//    web address (https://..., or a bare "dr-mayer-brix.de"), an email
//    address (with or without "mailto:") or a phone number (with or
//    without "tel:"):
//      Mehr auf [unserer Website](https://dr-mayer-brix.de/).
//      [Schreiben Sie uns](mbpraxis@duck.com) · [Rufen Sie an](09131/208899)
//    Any other target (an unknown scheme like "javascript:") renders the
//    label as plain text rather than a link.
//
// 3. [label](online-rezeption) renders the exact same Online-Rezeption
//    trigger button used in the hero — a <button>, not a link, since it
//    opens the 321med widget via JS rather than navigating anywhere
//    (main.js re-runs initOnlineRezeptionButtons() on the banner once this
//    is injected, so it's wired up the same way).
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
const EMAIL_RE = new RegExp(EMAIL_PATTERN, 'g');
// A German/international phone number: starts with "+<country code>"
// (optionally followed by "(0)") or a leading "0", then at least 6 more
// digits, optionally separated by spaces, "/" or "-" — so "09131/208899",
// "09131 208899", "+49 9131 208899" and "+49 (0) 91 31 / 20 88 99" all
// match, while dates (31.8.2026), times (08:00), years and 5-digit postal
// codes don't. Captures the preceding character separately instead of a
// lookbehind, which older Safari versions can't parse (a syntax error there
// would take down all of main.js, not just the banner).
const PHONE_RE = /(^|[^\w+@./-])((?:\+\d{1,3} ?(?:\(0\) ?)?|0)\d(?:[ /-]{0,3}\d){5,})(?![\w@/-])/g;
const PHONE_TARGET_RE = /^(?:tel:)?\s*\+?[\d\s()/.-]{5,}$/i;
// "dr-mayer-brix.de", "www.dr-mayer-brix.de/impressum.html", ...
const BARE_DOMAIN_RE = /^[\w-]+(?:\.[\w-]+)+(?:[/?#]\S*)?$/;

// Normalizes to an international tel: URI, assuming Germany for numbers
// written with a leading 0 — same form as the site's own tel: links.
function telHref(raw) {
  const s = raw.trim().replace(/^tel:/i, '').replace(/\(0\)/g, '').trim();
  const digits = s.replace(/\D/g, '');
  if (s.startsWith('+')) return `tel:+${digits}`;
  if (digits.startsWith('00')) return `tel:+${digits.slice(2)}`;
  if (digits.startsWith('0')) return `tel:+49${digits.slice(1)}`;
  return `tel:${digits}`;
}

// label and target arrive already HTML-escaped (see renderLine).
function renderLink(label, target) {
  const t = target.trim();
  if (t.toLowerCase() === 'online-rezeption') {
    return `<button type="button" class="hero__rezeption-link js-open-321med">${label}</button>`;
  }
  const email = parseEmail(t.replace(/^mailto:/i, ''));
  if (email) {
    // A label that's just the address itself gets the same obfuscated
    // treatment as an auto-detected address (initEmailLinks fills it in).
    const isAddress = label.trim().toLowerCase() === `${email.user}@${email.domain}`.toLowerCase();
    return emailLinkHtml(email.user, email.domain, isAddress ? undefined : label);
  }
  if (PHONE_TARGET_RE.test(t) && t.replace(/\D/g, '').length >= 5) {
    return `<a href="${telHref(t)}">${label}</a>`;
  }
  if (/^https?:\/\//i.test(t) || t.startsWith('/') || t.startsWith('#')) {
    return `<a href="${t}">${label}</a>`;
  }
  if (BARE_DOMAIN_RE.test(t)) {
    return `<a href="https://${t}">${label}</a>`;
  }
  return label;
}

// One banner line → HTML. Escapes first so the author's text can't inject
// markup, then turns [links](...), email addresses and phone numbers into
// links. Each finished link is parked behind a placeholder right away, so
// no later step can reach into markup an earlier step produced — the
// previous renderer ran email obfuscation over already-built links, which
// rewrote the address inside [x@y.de](mailto:x@y.de)'s own href and label
// into a second <a>, leaving broken markup and stray code on screen.
// **Bold** comes last so it can wrap links too.
function renderLine(line) {
  const parked = [];
  const park = (html) => `\u0000${parked.push(html) - 1}\u0000`;
  const html = escapeHtml(line)
    .replace(LINK_RE, (m, label, target) => park(renderLink(label, target)))
    .replace(EMAIL_RE, (m, user, domain) => park(emailLinkHtml(user, domain)))
    .replace(PHONE_RE, (m, before, number) => before + park(`<a href="${telHref(number)}">${number}</a>`))
    .replace(BOLD_RE, '<strong>$1</strong>');
  return html.replace(/\u0000(\d+)\u0000/g, (m, i) => parked[Number(i)]);
}

// A line whose first non-whitespace character is "#" is a comment — never
// shown on the site, so you can leave notes for the next editor ("remove
// after 4.9."), or keep old/draft wording around without deleting it, or
// switch the banner off (blank the real lines below the comment) while
// still seeing what it used to say. Blanked in place rather than removed
// outright so a comment sitting between two paragraphs doesn't
// accidentally merge them into one. A line that needs a literal leading
// "#" (a hashtag, "# 1." as a list marker, ...) isn't supported — indent
// it with a space first if that ever comes up.
const COMMENT_LINE_RE = /^[ \t]*#/;

function stripComments(raw) {
  return raw
    .split('\n')
    .map((line) => (COMMENT_LINE_RE.test(line) ? '' : line))
    .join('\n');
}

export function renderBannerHTML(text) {
  const trimmed = stripComments(text || '').trim();
  if (!trimmed) return '';
  // Every line is its own paragraph — not just blank-line-separated
  // blocks. Figma's own "paragraph spacing" (12px, verified live via
  // getRangeParagraphSpacing) applies at every line break in the source
  // text node, including the single \n between this banner's two lines,
  // not only at blank-line gaps. Rendering those as one <p> with an
  // internal <br> (the previous approach) meant .banner__text's flex gap
  // never applied there at all — a <br> doesn't create a second flex
  // item for `gap` to act between. One <p> per line makes every line
  // break a real paragraph boundary, so the gap actually applies
  // everywhere Figma shows spacing. A blank line just becomes an empty
  // line here and disappears via the filter below, same as before.
  const paragraphs = trimmed
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${renderLine(p)}</p>`)
    .join('');
  // No .container here: the banner is now a floating card positioned and
  // sized by .banner itself (per Figma), not a full-width bar that needs
  // an inner content-width-capped wrapper.
  // Figma's dismiss control is the same lucide "x" icon as the nav's own
  // close button (identical 24×24 geometry, verified against close.svg's
  // path), just recolored white for the teal background instead of grey —
  // a real <img>, not a "×" text glyph standing in for it.
  return `<div class="banner__inner"><div class="banner__text">${paragraphs}</div><button type="button" class="banner__dismiss" aria-label="Hinweis schließen"><img src="assets/img/icons/close-white.svg" width="24" height="24" alt=""></button></div>`;
}

// Dismissing the banner only hides it for the current page view — nothing
// is persisted (no sessionStorage/localStorage/cookie). A reload or a fresh
// visit always shows it again as long as content/banner.txt has content;
// there is deliberately no "don't show this again" memory.
export async function loadBanner(slotEl) {
  try {
    const res = await fetch('content/banner.txt', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`banner.txt ${res.status}`);
    const text = await res.text();
    const html = renderBannerHTML(text);
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
