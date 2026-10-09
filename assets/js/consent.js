// assets/js/consent.js
//
// Consent levels, stored in localStorage (one key, no cookie):
//   'essential' - "Nur Notwendige": the 321med Online-Rezeption, the
//                 practice's main way to be reached (always allowed; the
//                 widget asks for its own data-processing consent)
//   'all'       - additionally Google Maps (360° tour, map iframes)
//   absent      - not decided yet: nothing external is loaded
// ('granted' is the value of earlier previews and counts as 'all'.)
// The widget scripts are emitted by rezeption-loader.js, synchronously during
// parsing, once any level is stored; Maps iframes are activated here.
export const CONSENT_KEY = 'external-services-consent';

export function getConsent(storage) {
  try {
    const value = storage.getItem(CONSENT_KEY);
    if (value === 'essential') return 'essential';
    return value === 'all' || value === 'granted' ? 'all' : null;
  } catch {
    return null;
  }
}

export function setConsent(storage, value) {
  try {
    storage.setItem(CONSENT_KEY, value);
  } catch {
    // Storage blocked: the choice only lasts for this page view.
  }
}

// Replaces every consent placeholder ([data-embed-src]) with its real iframe.
export function activateEmbeds(root) {
  root.querySelectorAll('[data-embed-src]').forEach((frame) => {
    const iframe = (root.ownerDocument || root).createElement('iframe');
    iframe.src = frame.dataset.embedSrc;
    iframe.title = frame.dataset.embedTitle || '';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    frame.removeAttribute('data-embed-src');
    frame.replaceChildren(iframe);
  });
}
