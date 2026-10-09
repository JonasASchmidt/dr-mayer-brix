// assets/js/cookie-banner.js
//
// Sticky bottom consent bar (see consent.js). The Online-Rezeption is the
// practice's main way to be reached and asks for its own data-processing
// consent inside the widget, so it always loads (rezeption-loader.js); the
// bar only decides about Google Maps ("Alle zulassen" vs. "Nur Notwendige").
// The floating cookie button (bottom left) reopens the bar at any time, e.g.
// to withdraw the Maps consent.
import { getConsent, setConsent, activateEmbeds } from './consent.js';

export function renderCookieBannerHTML() {
  return '<div class="cookie-banner__inner">'
    + '<p class="cookie-banner__text">Diese Website setzt selbst keine Cookies. Die Online-Rezeption (321med), '
    + 'über die Sie uns erreichen, wird immer geladen. Optional sind Karten und der 360°-Rundgang '
    + '(Google Maps). Beim Laden werden Daten an diese Anbieter übertragen und möglicherweise Cookies gesetzt. '
    + '<a href="datenschutz.html#cookies">Mehr in der Datenschutzerklärung</a></p>'
    + '<div class="cookie-banner__actions">'
    + '<button type="button" class="cookie-banner__btn" data-consent="essential">Nur Notwendige</button>'
    + '<button type="button" class="cookie-banner__btn" data-consent="all">Alle zulassen</button>'
    + '</div></div>';
}

// Lucide "cookie" icon (same icon family as the site's other 24px icons).
const COOKIE_ICON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" '
  + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/>'
  + '<path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></svg>';

// Shows the bar until a choice exists; "Alle zulassen" activates the Maps
// embeds. Taking Maps back needs a reload (loaded iframes can't be unloaded).
export function initCookieBanner(doc = document, storage = window.localStorage) {
  const state = { consent: getConsent(storage) };
  let bar = null;

  const fab = doc.createElement('button');
  fab.type = 'button';
  fab.className = 'cookie-fab';
  fab.setAttribute('aria-label', 'Cookie-Einstellungen');
  fab.title = 'Cookie-Einstellungen';
  fab.innerHTML = COOKIE_ICON;
  doc.body.appendChild(fab);

  function choose(level) {
    const before = state.consent;
    setConsent(storage, level);
    state.consent = level;
    if (bar) bar.remove();
    bar = null;
    fab.hidden = false;
    if (level === 'all') activateEmbeds(doc);
    else if (before === 'all') doc.defaultView.location.reload();
  }

  function show() {
    if (bar) return;
    bar = doc.createElement('div');
    bar.className = 'cookie-banner';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Einwilligung zu externen Diensten');
    bar.innerHTML = renderCookieBannerHTML();
    bar.querySelectorAll('[data-consent]').forEach((btn) => {
      btn.addEventListener('click', () => choose(btn.dataset.consent));
    });
    doc.body.appendChild(bar);
    fab.hidden = true;
  }

  // The "Google Maps laden" buttons inside the embed placeholders.
  doc.querySelectorAll('.js-embed-consent').forEach((btn) => btn.addEventListener('click', () => choose('all')));
  fab.addEventListener('click', show);

  if (state.consent === null) show();
  else if (state.consent === 'all') activateEmbeds(doc);
}
