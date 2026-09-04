import { initNav } from './nav.js';
import { initVideoFacades } from './video-facade.js';
import { loadBanner } from './banner.js';

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) initNav(toggle, nav);

  initVideoFacades(document);

  const bannerSlot = document.getElementById('site-banner');
  if (bannerSlot) loadBanner(bannerSlot);
});
