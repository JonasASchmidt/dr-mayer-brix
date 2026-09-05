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
export function renderBannerHTML(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';
  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    // Free CMS text; any email address typed into it gets the same
    // spam-proof obfuscation as everywhere else on the site, not just the
    // hard-coded footer/legal-page ones.
    .map((p) => `<p>${obfuscateEmailsInHtml(escapeHtml(p).replaceAll('\n', '<br>'))}</p>`)
    .join('');
  return `<div class="banner__inner container"><div class="banner__text">${paragraphs}</div><button type="button" class="banner__dismiss" aria-label="Hinweis schließen">×</button></div>`;
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
