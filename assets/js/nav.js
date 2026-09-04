// assets/js/nav.js
export function nextNavState(isOpen) {
  return !isOpen;
}

export function initNav(toggleEl, panelEl) {
  let isOpen = false;
  toggleEl.addEventListener('click', () => {
    isOpen = nextNavState(isOpen);
    panelEl.classList.toggle('is-open', isOpen);
    toggleEl.setAttribute('aria-expanded', String(isOpen));
  });
}
