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
// wrong. Blank lines split the text into paragraphs.
//
// Wrap any part of the text in **double asterisks** to highlight/bold it
// (matches Figma's "Bold" runs) — everything else renders at the default
// Medium weight (matches Figma's "Medium" runs). E.g.:
//   **Unsere Praxis bleibt vom 31.8. bis 4.9. geschlossen.**
//   Vertretung: Praxis Dr. Mayr, Tel. 09131 / 888080
const BOLD_RE = /\*\*(.+?)\*\*/g;

export function renderBannerHTML(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';
  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      // Escape first so **markers** and any HTML-special characters in the
      // author's text can't collide, then apply bold, then line breaks,
      // then obfuscate any email address the same way as everywhere else
      // on the site — order matters here (each step assumes plain text
      // from the step before it hasn't turned into markup it needs to
      // avoid re-processing).
      const escaped = escapeHtml(p);
      const bolded = escaped.replace(BOLD_RE, '<strong>$1</strong>');
      const withBreaks = bolded.replaceAll('\n', '<br>');
      return `<p>${obfuscateEmailsInHtml(withBreaks)}</p>`;
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
