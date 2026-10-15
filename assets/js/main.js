// Each feature lives in its own module and is loaded on its own, so a module
// that a content blocker (ad / popup / cookie-notice blockers match on file
// names), a flaky connection or a bug takes out only that one feature — the
// menu, the accordions, the video and the Online-Rezeption links keep
// working. With static imports a single blocked file would have stopped
// the whole page script.

let booted = false;

// Status for the ?debug overlay (debug.js): what ran, what failed.
const status = { booted: false, failed: [] };
window.__pmb = status;

async function feature(name, path, run) {
  try {
    const mod = await import(path);
    run(mod);
  } catch (err) {
    status.failed.push(`${name} (${path}): ${err && err.message}`);
    console.error(`[pmb] ${name} failed`, err);
  }
}

export function boot(doc = document) {
  if (booted) return;
  booted = true;
  status.booted = true;

  feature('nav', './nav.js', ({ initNav, initScrollSpy }) => {
    const toggle = doc.getElementById('nav-toggle');
    const nav = doc.getElementById('site-nav');
    if (toggle && nav) initNav(toggle, nav);

    // Scroll-spy only applies on the homepage, which is the only page with
    // in-page anchor sections; Impressum/Datenschutz link back to
    // index.html#... instead and have no local sections to observe.
    if (nav) {
      const sections = [...doc.querySelectorAll('main > section[id]')];
      if (sections.length) initScrollSpy(nav, sections, doc.querySelector('.site-header'));
    }
  });

  feature('video', './video-facade.js', ({ initVideoFacades }) => initVideoFacades(doc));
  feature('accordions', './accordion.js', ({ initAccordions, initSchwerpunkteCards }) => {
    initAccordions(doc);
    initSchwerpunkteCards(doc);
  });
  feature('email links', './email-obfuscate.js', ({ initEmailLinks }) => initEmailLinks(doc));
  feature('online-rezeption', './online-rezeption.js', ({ initOnlineRezeptionButtons }) => initOnlineRezeptionButtons(doc));
  feature('externe dienste', './dienste-leiste.js', ({ initCookieBanner }) => initCookieBanner(doc));

  feature('mitteilung', './mitteilung.js', async ({ loadBanner }) => {
    const slot = doc.getElementById('site-mitteilung');
    if (!slot) return;
    await loadBanner(slot);
    const dismissBtn = slot.querySelector('.mitteilung__dismiss');
    if (dismissBtn) {
      // Hides the message for this page view only — nothing is persisted,
      // so a reload always shows it again (per direct request).
      dismissBtn.addEventListener('click', () => { slot.hidden = true; });
    }
    // The message can contain an email address (obfuscated into .js-email
    // markup by renderBannerHTML); it arrives after the page's own pass.
    // (A [label](online-rezeption) link needs nothing: the Rezeption click
    // handler is delegated on the document.)
    const { initEmailLinks } = await import('./email-obfuscate.js');
    initEmailLinks(slot);
  });
}

// main.js is a module script (deferred): by the time it runs the page is
// parsed, so readyState is already past 'loading' — boot right away.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot());
else boot();
