// assets/js/nav.js
export function nextNavState(isOpen) {
  return !isOpen;
}

export function initNav(toggleEl, panelEl) {
  let isOpen = false;

  function setOpen(next) {
    isOpen = next;
    panelEl.classList.toggle('is-open', isOpen);
    toggleEl.setAttribute('aria-expanded', String(isOpen));
    toggleEl.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
  }

  toggleEl.addEventListener('click', () => {
    setOpen(nextNavState(isOpen));
  });

  panelEl.addEventListener('click', (event) => {
    if (isOpen && event.target.closest('a')) setOpen(false);
  });
}
