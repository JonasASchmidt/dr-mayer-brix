// assets/js/consent.js
//
// Consent for external services (Google Maps iframes, 321med
// Online-Rezeption widget). Nothing from these providers is requested
// before the visitor opts in, so no data (IP address etc.) reaches them
// beforehand. Consent is stored in localStorage (one key, no cookie);
// 'granted' or absent.
export const CONSENT_KEY = 'external-services-consent';

// The 321med widget scripts are emitted by rezeption-loader.js (synchronously,
// during parsing, when consent is stored).

export function getConsent(storage) {
  try {
    return storage.getItem(CONSENT_KEY) === 'granted' ? 'granted' : null;
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

// Everything that talks to external providers starts here (the widget is
// handled by rezeption-loader.js on the next page load).
export function loadExternalServices(doc) {
  activateEmbeds(doc);
}
