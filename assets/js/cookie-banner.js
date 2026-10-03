// assets/js/cookie-banner.js
//
// Sticky bottom notice about cookies. The site itself sets none; the
// embedded third-party services (Google Maps, Vimeo, 321med Online-Rezeption)
// can. The acknowledgement is remembered in localStorage (one key, no
// cookie) so the bar doesn't come back on every page; if storage is
// unavailable (private mode, blocked) it simply shows again next page.
export const COOKIE_NOTICE_KEY = 'cookie-notice-ack';

export function isAcknowledged(storage) {
  try {
    return storage.getItem(COOKIE_NOTICE_KEY) === '1';
  } catch {
    return false;
  }
}

export function acknowledge(storage) {
  try {
    storage.setItem(COOKIE_NOTICE_KEY, '1');
  } catch {
    // Storage blocked: nothing to remember, the bar just closes for this view.
  }
}

export function renderCookieBannerHTML() {
  return '<div class="cookie-banner__inner">'
    + '<p class="cookie-banner__text">Diese Website selbst setzt keine Cookies. Eingebettete Dienste von Dritten '
    + '(Google Maps, Vimeo, Online-Rezeption) können jedoch Cookies verwenden. '
    + '<a href="datenschutz.html#cookies">Mehr in der Datenschutzerklärung</a></p>'
    + '<button type="button" class="cookie-banner__accept">Verstanden</button>'
    + '</div>';
}

export function initCookieBanner(doc = document, storage = window.localStorage) {
  if (isAcknowledged(storage)) return null;
  const bar = doc.createElement('div');
  bar.className = 'cookie-banner';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Hinweis zu Cookies');
  bar.innerHTML = renderCookieBannerHTML();
  bar.querySelector('.cookie-banner__accept').addEventListener('click', () => {
    acknowledge(storage);
    bar.remove();
  });
  doc.body.appendChild(bar);
  return bar;
}
