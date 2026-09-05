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

export function initScrollSpy(navEl, sectionEls, headerEl) {
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

  // "Current" is the last section (in document order) whose top has
  // scrolled up past the sticky header — i.e. whichever section's heading
  // sits right under the header right now. Deliberately not an
  // IntersectionObserver ratio comparison (the previous approach): ratio is
  // relative to each section's own height, which varies wildly across this
  // page (a 700px section vs. a 1800px one), and the observer only re-fires
  // when a ratio crosses one of its fixed thresholds — both of which let a
  // stale "current" section linger after jumping straight into a much
  // taller section, until the user scrolled a little further.
  function update() {
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const line = headerHeight + 1;
    let current = sectionEls[0];
    for (const section of sectionEls) {
      if (section.getBoundingClientRect().top <= line) current = section;
      else break;
    }
    setCurrent(current.id);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}
