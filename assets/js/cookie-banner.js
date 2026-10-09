// assets/js/cookie-banner.js
//
// Sticky bottom consent bar for external services (see consent.js). Both
// choices are equally prominent. "Cookie-Einstellungen" in the footer
// (.js-cookie-settings) reopens it, so the choice can be changed any time.
import { getConsent, setConsent, loadExternalServices } from './consent.js';

export function renderCookieBannerHTML() {
  return '<div class="cookie-banner__inner">'
    + '<p class="cookie-banner__text">Diese Website setzt selbst keine Cookies. Für Karten (Google Maps) und die '
    + 'Online-Rezeption (321med) werden Inhalte externer Anbieter geladen. Dabei werden Daten an diese '
    + 'übertragen und möglicherweise Cookies gesetzt. '
    + '<a href="datenschutz.html#cookies">Mehr in der Datenschutzerklärung</a></p>'
    + '<div class="cookie-banner__actions">'
    + '<button type="button" class="cookie-banner__btn" data-consent="denied">Nur notwendige</button>'
    + '<button type="button" class="cookie-banner__btn" data-consent="granted">Externe Dienste zulassen</button>'
    + '</div></div>';
}

// Returns { request(afterGrant) }: shows the bar (if undecided) and runs
// afterGrant once external services are allowed — used by the Online-Rezeption
// buttons, which can't do anything before the widget script is loaded.
export function initCookieBanner(doc = document, storage = window.localStorage) {
  let bar = null;
  let pending = null;
  const state = { consent: getConsent(storage) };

  function grant() {
    close();
    state.consent = 'granted';
    setConsent(storage, 'granted');
    const done = loadExternalServices(doc);
    if (pending) {
      const run = pending;
      pending = null;
      done.then(run);
    }
  }

  function close() {
    if (bar) bar.remove();
    bar = null;
  }

  function show() {
    if (bar) return;
    bar = doc.createElement('div');
    bar.className = 'cookie-banner';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Einwilligung zu externen Diensten');
    bar.innerHTML = renderCookieBannerHTML();
    bar.addEventListener('click', (event) => {
      const choice = event.target.closest('[data-consent]')?.dataset.consent;
      if (!choice) return;
      if (choice === 'granted') {
        grant();
      } else {
        close();
        pending = null;
        const wasGranted = state.consent === 'granted';
        state.consent = 'denied';
        setConsent(storage, 'denied');
        // Already-loaded provider scripts can't be unloaded; a reload does.
        if (wasGranted) doc.defaultView.location.reload();
      }
    });
    doc.body.appendChild(bar);
    bar.querySelector('[data-consent="granted"]').focus();
  }

  // The "Karte laden" buttons inside the embed placeholders.
  doc.querySelectorAll('.js-embed-consent').forEach((btn) => btn.addEventListener('click', grant));
  doc.querySelectorAll('.js-cookie-settings').forEach((btn) => btn.addEventListener('click', show));

  if (state.consent === 'granted') loadExternalServices(doc);
  else if (state.consent === null) show();

  return {
    isGranted: () => state.consent === 'granted',
    request(afterGrant) {
      if (state.consent === 'granted') {
        loadExternalServices(doc).then(afterGrant);
        return;
      }
      pending = afterGrant;
      show();
    },
  };
}
