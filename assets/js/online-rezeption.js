// assets/js/online-rezeption.js
//
// Opens the 321med "Online-Rezeption" widget from our own text buttons.
// The vendor's own script (321med.js, loaded at the end of the page)
// defines a plain global function, confirmed by reading the script's own
// source: window.open_321med(mode) — 'default' (also '', 'index') opens
// the same landing view as the vendor's own floating button. It isn't
// hooked up automatically to any element on the page; we call it
// ourselves on click.
export function openOnlineRezeption() {
  if (typeof window.open_321med === 'function') {
    window.open_321med('default');
    return true;
  }
  return false;
}

const WAIT_MS = 4000;
const POLL_MS = 150;

// Opens the widget; if the vendor script is still loading (slow connection),
// keeps trying for a few seconds (ad / privacy blockers often drop the vendor script altogether), and if it never shows up, takes the
// visitor to the contact section (phone) instead of doing nothing — the
// Online-Rezeption link is never a dead end.
export function requestOnlineRezeption({
  open = openOnlineRezeption,
  setTimer = (fn, ms) => setInterval(fn, ms),
  clearTimer = (id) => clearInterval(id),
  now = () => Date.now(),
  fallback = goToContact,
} = {}) {
  if (open()) return;
  const started = now();
  const id = setTimer(() => {
    if (open()) {
      clearTimer(id);
    } else if (now() - started > WAIT_MS) {
      clearTimer(id);
      fallback();
    }
  }, POLL_MS);
}

function goToContact() {
  const target = document.getElementById('kontakt');
  if (target) target.scrollIntoView();
  else window.location.href = 'index.html#kontakt';
}

let bound = false;

// One delegated listener for every .js-open-321med (hero and contact links,
// and the one the announcement banner injects later), so no link depends on
// init order or on when its markup arrived.
export function initOnlineRezeptionButtons(doc = document) {
  if (bound) return;
  bound = true;
  doc.addEventListener('click', (event) => {
    const el = event.target.closest && event.target.closest('.js-open-321med');
    if (!el) return;
    event.preventDefault();
    requestOnlineRezeption();
  });
}
