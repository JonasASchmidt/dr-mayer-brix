import { initNav, initScrollSpy } from './nav.js';
import { initVideoFacades } from './video-facade.js';
import { initAccordions, initSchwerpunkteCards } from './accordion.js';
import { loadBanner } from './banner.js';
import { initEmailLinks } from './email-obfuscate.js';
import { initOnlineRezeptionButtons } from './online-rezeption.js';
import { initCookieBanner } from './cookie-banner.js';

let booted = false;

// Every step runs on its own: if one throws (a blocked storage, a missing
// element, ...) the others — video, Online-Rezeption links, nav — still work.
function step(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[pmb] ${name} failed`, err);
  }
}

// Called by start.js once main.js is loaded. The script tag sits at the end
// of <body>, so the whole page is in the DOM by then.
export function boot(doc = document) {
  if (booted) return;
  booted = true;

  step('nav', () => {
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

  step('video', () => initVideoFacades(doc));
  step('accordions', () => initAccordions(doc));
  step('schwerpunkte', () => initSchwerpunkteCards(doc));
  step('email links', () => initEmailLinks(doc));
  step('online-rezeption', () => initOnlineRezeptionButtons(doc));
  step('cookie banner', () => initCookieBanner(doc));

  step('announcement banner', () => {
    const bannerSlot = doc.getElementById('site-banner');
    if (!bannerSlot) return;
    loadBanner(bannerSlot).then(() => {
      const dismissBtn = bannerSlot.querySelector('.banner__dismiss');
      if (dismissBtn) {
        // Hides the banner for this page view only — nothing is persisted,
        // so a reload always shows it again (per direct request).
        dismissBtn.addEventListener('click', () => {
          bannerSlot.hidden = true;
        });
      }
      // The banner's own message can contain an email address (obfuscated
      // into .js-email markup by renderBannerHTML); it's injected after
      // the page's initial initEmailLinks() pass, so resolve it here too.
      // (A [label](online-rezeption) link needs nothing: the Rezeption
      // click handler is delegated on the document.)
      initEmailLinks(bannerSlot);
    }).catch((err) => console.error('[pmb] announcement banner failed', err));
  });
}
