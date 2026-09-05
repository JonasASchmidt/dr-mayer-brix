import { initNav } from './nav.js';
import { initVideoFacades } from './video-facade.js';
import { initAccordions } from './accordion.js';
import { loadBanner, dismissBanner } from './banner.js';

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) initNav(toggle, nav);

  initVideoFacades(document);

  initAccordions(document);

  const bannerSlot = document.getElementById('site-banner');
  if (bannerSlot) {
    loadBanner(bannerSlot).then(() => {
      const dismissBtn = bannerSlot.querySelector('.banner__dismiss');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          dismissBanner();
          bannerSlot.hidden = true;
        });
      }
    });
  }
});
