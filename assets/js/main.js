import { initNav, initScrollSpy } from './nav.js';
import { initVideoFacades } from './video-facade.js';
import { initAccordions, initSchwerpunkteCards } from './accordion.js';
import { loadBanner } from './banner.js';
import { initEmailLinks } from './email-obfuscate.js';
import { initOnlineRezeptionButtons } from './online-rezeption.js';

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) initNav(toggle, nav);

  // Scroll-spy only applies on the homepage, which is the only page with
  // in-page anchor sections; Impressum/Datenschutz link back to
  // index.html#... instead and have no local sections to observe.
  if (nav) {
    const sections = [...document.querySelectorAll('main > section[id]')];
    if (sections.length) initScrollSpy(nav, sections, document.querySelector('.site-header'));
  }

  initVideoFacades(document);

  initAccordions(document);
  initSchwerpunkteCards(document);

  initEmailLinks(document);

  initOnlineRezeptionButtons(document);

  const bannerSlot = document.getElementById('site-banner');
  if (bannerSlot) {
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
      initEmailLinks(bannerSlot);
    });
  }
});
