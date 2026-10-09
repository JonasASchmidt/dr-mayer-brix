// assets/js/cookie-banner.js
//
// Sticky bottom consent bar for external services (see consent.js). Single
// "Zustimmen" button on purpose: the Online-Rezeption is the practice's main
// way to be reached, asks for its own data-processing consent inside the
// widget, and must never be blocked by a decline.
import { getConsent, setConsent, loadExternalServices } from './consent.js';
import { openOnlineRezeption } from './online-rezeption.js';

// Survives the reload after first consent so the click that asked for the
// Online-Rezeption still ends up opening it.
const OPEN_AFTER_RELOAD_KEY = 'open-rezeption-after-consent';

export function renderCookieBannerHTML() {
  return '<div class="cookie-banner__inner">'
    + '<p class="cookie-banner__text">Diese Website setzt selbst keine Cookies. Für Karten (Google Maps) und die '
    + 'Online-Rezeption (321med) werden Inhalte externer Anbieter geladen. Dabei werden Daten an diese '
    + 'übertragen und möglicherweise Cookies gesetzt. '
    + '<a href="datenschutz.html#cookies">Mehr in der Datenschutzerklärung</a></p>'
    + '<div class="cookie-banner__actions">'
    + '<button type="button" class="cookie-banner__btn">Zustimmen</button></div></div>';
}

// Returns { request(afterGrant) }: runs afterGrant right away if consent is
// already given, otherwise shows the bar and opens the Online-Rezeption once
// the visitor agrees. The page reloads after the first consent so the vendor
// widget gets loaded the same way as before (see rezeption-loader.js).
export function initCookieBanner(doc = document, storage = window.localStorage) {
  const win = doc.defaultView;
  const state = { consent: getConsent(storage) };
  let bar = null;
  let openAfter = false;

  function grant() {
    setConsent(storage, 'granted');
    try {
      if (openAfter) win.sessionStorage.setItem(OPEN_AFTER_RELOAD_KEY, '1');
    } catch {
      // No sessionStorage: the visitor just clicks the link again after the reload.
    }
    win.location.reload();
  }

  function show() {
    if (bar) return;
    bar = doc.createElement('div');
    bar.className = 'cookie-banner';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Einwilligung zu externen Diensten');
    bar.innerHTML = renderCookieBannerHTML();
    bar.querySelector('.cookie-banner__btn').addEventListener('click', grant);
    doc.body.appendChild(bar);
    bar.querySelector('.cookie-banner__btn').focus();
  }

  // The "Externe Dienste zulassen" buttons inside the embed placeholders.
  doc.querySelectorAll('.js-embed-consent').forEach((btn) => btn.addEventListener('click', grant));

  if (state.consent === 'granted') {
    loadExternalServices(doc);
    let reopen = false;
    try {
      reopen = win.sessionStorage.getItem(OPEN_AFTER_RELOAD_KEY) === '1';
      win.sessionStorage.removeItem(OPEN_AFTER_RELOAD_KEY);
    } catch {
      // see above
    }
    if (reopen) {
      if (doc.readyState === 'complete') openOnlineRezeption();
      else win.addEventListener('load', () => openOnlineRezeption());
    }
  } else {
    show();
  }

  return {
    request(afterGrant) {
      if (state.consent === 'granted') {
        afterGrant();
        return;
      }
      openAfter = true;
      show();
    },
  };
}
