export function nextAccordionState(isOpen) {
  return !isOpen;
}

export function initAccordions(root) {
  root.querySelectorAll('[data-accordion-item]').forEach((item) => {
    const trigger = item.querySelector('[data-accordion-trigger]');
    const panel = item.querySelector('[data-accordion-panel]');
    let isOpen = false;
    trigger.addEventListener('click', () => {
      isOpen = nextAccordionState(isOpen);
      item.classList.toggle('is-open', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
      panel.hidden = !isOpen;
    });
  });
}
