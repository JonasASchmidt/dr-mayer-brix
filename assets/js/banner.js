import { obfuscateEmailsInHtml } from './email-obfuscate.js';

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
    .map((p) => {
      // Escape first so **markers** and any HTML-special characters in the
      // author's text can't collide, then apply bold, then obfuscate any
      // email address the same way as everywhere else on the site — order
      // matters here (each step assumes plain text from the step before
      // it hasn't turned into markup it needs to avoid re-processing).
      const escaped = escapeHtml(p);
      const bolded = escaped.replace(BOLD_RE, '<strong>$1</strong>');
      return `<p>${obfuscateEmailsInHtml(bolded)}</p>`;
    })
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
