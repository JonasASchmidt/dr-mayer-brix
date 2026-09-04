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
  return `<div class="banner__inner container"><div class="banner__text">${paragraphs}${link}</div><button type="button" class="banner__dismiss" aria-label="Hinweis schließen">×</button></div>`;
}

export function isBannerDismissed() {
  return sessionStorage.getItem('bannerDismissed') === '1';
}

export function dismissBanner() {
  sessionStorage.setItem('bannerDismissed', '1');
}

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
