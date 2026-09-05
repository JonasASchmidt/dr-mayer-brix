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

export function initOnlineRezeptionButtons(root) {
  root.querySelectorAll('.js-open-321med').forEach((el) => {
    el.addEventListener('click', () => {
      openOnlineRezeption();
    });
  });
}
