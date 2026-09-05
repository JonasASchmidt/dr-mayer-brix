export function nextAccordionState(isOpen) {
  return !isOpen;
}

export function initAccordions(root) {
  root.querySelectorAll('[data-accordion-item]').forEach((item) => {
    const trigger = item.querySelector('[data-accordion-trigger]');
    const panel = item.querySelector('[data-accordion-panel]');
    const chevron = item.querySelector('.accordion__chevron');
    let isOpen = false;
    trigger.addEventListener('click', () => {
      isOpen = nextAccordionState(isOpen);
      item.classList.toggle('is-open', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
      // A CSS grid-rows transition (0fr/1fr) animates the collapse/expand
      // smoothly, which the old `hidden` attribute (display:none) can't —
      // `inert` takes over hidden's job of pulling closed-panel content
      // out of focus order and assistive-tech exposure.
      panel.inert = !isOpen;
      // Figma exports the open/closed chevron as two distinct icon assets
      // (left- vs down-pointing), not one icon rotated by CSS.
      if (chevron) {
        chevron.src = isOpen ? chevron.dataset.chevronOpen : chevron.dataset.chevronClosed;
      }
    });
  });
}
