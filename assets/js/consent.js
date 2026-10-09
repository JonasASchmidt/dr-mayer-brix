// assets/js/consent.js
//
// Consent for Google Maps (360° tour, map iframes), stored in localStorage
// (one key, no cookie):
//   'essential' - "Nur Notwendige": no Google Maps
//   'all'       - "Alle zulassen": Google Maps
//   absent      - not decided yet: no Google Maps
// The 321med Online-Rezeption is not part of this: it always loads (see
// rezeption-loader.js). ('granted' is the value of earlier previews and
// counts as 'all'.)
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
