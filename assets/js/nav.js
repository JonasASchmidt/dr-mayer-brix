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
    if (isOpen && event.target.closest('a, .site-nav__close')) setOpen(false);
  });
}

/**
 * Given every <section id> on the page in document order and the set of ids
 * that have a matching nav link, returns a lookup mapping EVERY section id
 * to the nav link id that should be highlighted while it's in view — a
 * section with no nav link of its own (e.g. "schwerpunkte", "zitat") maps
 * forward to the nearest nav-linked section above it.
 */
export function buildScrollSpyMap(sectionIds, linkedIds) {
  const linked = new Set(linkedIds);
  const map = {};
  let current = null;
  for (const id of sectionIds) {
    if (linked.has(id)) current = id;
    map[id] = current;
  }
  return map;
}

export function initScrollSpy(navEl, sectionEls) {
  if (!sectionEls.length) return;
  const links = new Map(
    [...navEl.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a])
  );
  const spyMap = buildScrollSpyMap(
    sectionEls.map((s) => s.id),
    links.keys()
  );

  function setCurrent(sectionId) {
    const targetId = spyMap[sectionId];
    for (const [id, link] of links) {
      link.classList.toggle('is-current', id === targetId);
    }
  }

  const visible = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      }
      let bestId = null;
      let bestRatio = 0;
      for (const [id, ratio] of visible) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      }
      if (bestId) setCurrent(bestId);
    },
    // A band centered just below the sticky header: a section counts as
    // "current" once it occupies that band, not merely on first touching
    // the viewport edge.
    { rootMargin: '-15% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
  );
  sectionEls.forEach((section) => observer.observe(section));

  // First section is current before any scrolling/intersection fires.
  setCurrent(sectionEls[0].id);
}
