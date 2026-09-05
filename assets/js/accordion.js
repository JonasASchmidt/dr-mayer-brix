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

// Schwerpunkte cards: collapsible below the desktop breakpoint (direct
// request), plain and always-expanded at desktop (still Figma's actual
// design there — verified live, no accordion component exists on either
// frame for these cards yet). Kept separate from initAccordions() above
// because that generic handler has no breakpoint awareness and Leistungen's
// real accordion items ARE meant to stay collapsible at every width.
export function initSchwerpunkteCards(root) {
  const items = [...root.querySelectorAll('.schwerpunkte__card[data-accordion-item]')];
  if (!items.length) return;

  const mql = window.matchMedia('(min-width: 64rem)');
  const controls = items.map((item) => {
    const trigger = item.querySelector('[data-accordion-trigger]');
    const panel = item.querySelector('[data-accordion-panel]');
    const chevron = item.querySelector('.accordion__chevron');
    let isOpen = false;

    function setOpen(next) {
      isOpen = next;
      item.classList.toggle('is-open', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
      panel.inert = !isOpen;
      if (chevron) chevron.src = isOpen ? chevron.dataset.chevronOpen : chevron.dataset.chevronClosed;
    }

    trigger.addEventListener('click', () => setOpen(!isOpen));
    return { trigger, panel, setOpen };
  });

  function applyBreakpoint() {
    const isDesktop = mql.matches;
    controls.forEach(({ trigger, panel, setOpen }) => {
      // Disabling the trigger at desktop removes it from the tab order and
      // blocks clicks natively — no separate "is this desktop" branch
      // needed in the click handler above.
      trigger.disabled = isDesktop;
      if (isDesktop) {
        panel.inert = false;
        trigger.setAttribute('aria-expanded', 'true');
      } else {
        setOpen(false);
      }
    });
  }
  applyBreakpoint();
  mql.addEventListener('change', applyBreakpoint);
}
