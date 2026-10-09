// assets/js/consent.js
//
// Consent for external services (Google Maps iframes, 321med
// Online-Rezeption widget). Nothing from these providers is requested
// before the visitor opts in, so no data (IP address etc.) reaches them
// beforehand. The choice is stored in localStorage (one key, no cookie);
// 'granted' | 'denied' | absent = not decided yet.
export const CONSENT_KEY = 'external-services-consent';

// 321med Online-Rezeption widget, provided directly by the practice's vendor
// (321 MED GmbH) on 2026-09-04. No SRI hash: this is a vendor-hosted,
// server-rendered widget script expected to update without a version bump —
// pinning a hash would break it on the vendor's next legitimate update.
// Order matters (the first is loaded before the second), as it was with the
// former static <script> tags.
export const REZEPTION_SCRIPTS = [
  'https://321med17.com/cdn/server/11cb0eefca4e16e350aca235e8bea2608a35c85f/321med.js',
  'https://321med-cdn.com/321med.js',
];

export function getConsent(storage) {
  try {
    const value = storage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
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

function loadScript(doc, src) {
  return new Promise((resolve, reject) => {
    const script = doc.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`failed to load ${src}`));
    doc.head.appendChild(script);
  });
}

let rezeptionLoad = null;

// Loads the vendor scripts once (sequentially); resolves when both are in.
export function loadRezeption(doc) {
  if (!rezeptionLoad) {
    rezeptionLoad = REZEPTION_SCRIPTS.reduce(
      (chain, src) => chain.then(() => loadScript(doc, src)),
      Promise.resolve()
    ).catch((err) => {
      // Allow a retry on the next opt-in/click instead of caching the failure.
      rezeptionLoad = null;
      console.error('[consent] 321med widget failed to load', err);
    });
  }
  return rezeptionLoad;
}

// Everything that talks to external providers starts here, and only here.
export function loadExternalServices(doc) {
  activateEmbeds(doc);
  return loadRezeption(doc);
}
