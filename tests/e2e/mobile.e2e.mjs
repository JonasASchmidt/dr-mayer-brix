// Mobile tap check — run by hand, not part of `npm test` (needs a browser):
//   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs CHROMIUM_PATH=/path/to/chrome \
//     node tests/e2e/mobile.e2e.mjs
// With a plain `npm i playwright`, PLAYWRIGHT_MODULE can be left out.
//
// For every phone/tablet/desktop size and every failure scenario it checks
// that each interactive target is actually hit by a tap (nothing lies on top
// of it: announcement banner, cookie bar, ...) and that the action happens.
// External hosts are stubbed; WebKit is NOT covered (Chromium emulation).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ROOT = process.env.SITE_ROOT || fileURLToPath(new URL('../../', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    const file = join(ROOT, path === '/' ? 'index.html' : path);
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('nope'); }
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const VIEWPORTS = [
  ['iPhone SE', 375, 667, true], ['iPhone 13', 390, 844, true], ['iPhone Pro Max', 430, 932, true],
  ['iPad', 768, 1024, true], ['Desktop', 1440, 900, false],
];
// vendor-slow: the 321med host answers after 3 s (main.js waits for it, as a
// module script after the synchronous widget scripts); vendor-fail: blocked.
// files-blocked: an ad/cookie-notice blocker drops the files it matches by name
// (cookie / consent / banner ...) — the rest of the page must keep working.
const BLOCKED_BY_NAME = /\/(dienste-leiste|dienste|mitteilung)\.js(\?|$)|\/mitteilung\.txt(\?|$)/;
const SCENARIOS = (process.env.SCENARIOS || 'fresh,decided,storage-blocked,vendor-slow,vendor-fail,files-blocked').split(',');
const VENDOR = /321med(17)?\.com|321med-cdn\.com/;
const STUB = 'window.open_321med=function(){window.__rez=(window.__rez||0)+1};';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
let failures = 0;
const check = (ok, label, detail = '') => { if (!ok) failures += 1; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ' — ' + detail}`); };

// Is the element's centre really hit by a tap? (instant scroll: the site uses smooth scrolling)
const hit = (page, selector, index = 0) => page.evaluate(({ selector, index }) => {
  document.documentElement.style.scrollBehavior = 'auto';
  const el = document.querySelectorAll(selector)[index];
  if (!el) return 'missing';
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  if (top && (top === el || el.contains(top))) return 'ok';
  return 'covered by ' + (top ? top.tagName + '.' + top.className : 'nothing (off-screen)');
}, { selector, index });

for (const scenario of SCENARIOS) {
  for (const [name, width, height, touch] of VIEWPORTS) {
    console.log(`${scenario} · ${name} ${width}x${height}`);
    const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 2 });
    if (scenario === 'storage-blocked') {
      await ctx.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } }));
    }
    if (scenario === 'decided') {
      await ctx.addInitScript(() => { try { localStorage.setItem('external-services-consent', 'essential'); } catch {} });
    }
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push(m.text()); });
    await page.route(VENDOR, (route) => {
      if (scenario === 'vendor-slow') return new Promise((r) => setTimeout(r, 3000)).then(() => route.fulfill({ contentType: 'application/javascript', body: STUB }));
      if (scenario === 'vendor-fail') return route.abort();
      return route.fulfill({ contentType: 'application/javascript', body: STUB });
    });
    if (scenario === 'files-blocked') await page.route(BLOCKED_BY_NAME, (route) => route.abort());
    await page.route(/player\.vimeo\.com|google\.com\/maps|maps\.google/, (route) => route.fulfill({ contentType: 'text/html', body: '<html>stub</html>' }));

    await page.goto(`${BASE}/index.html?debug`, { waitUntil: 'load' });
    await page.waitForSelector('.hero__media button');
    await page.waitForTimeout(scenario === 'files-blocked' ? 1800 : 700);   // main.js + message fetch; ?debug overlay re-renders after its probe
    const dbg = await page.locator('#pmb-debug').textContent().catch(() => '');
    const blocked = scenario === 'files-blocked';
    if (blocked) {
      check(/main\.js: gestartet/.test(dbg) && /externe dienste/.test(dbg) && /mitteilung/.test(dbg), '?debug overlay: main.js started, only the blocked features failed', dbg.split('\n').slice(1, 3).join(' / '));
      check(!/Fehlgeschlagene Schritte:[^\n]*(nav|video|accordions|online-rezeption)/.test(dbg), 'blocked files do not take down nav / video / accordions / Rezeption');
    } else {
      check(/main\.js: gestartet/.test(dbg) && /Fehlgeschlagene Schritte: keine/.test(dbg), '?debug overlay: main.js started, no failed step', dbg.split('\n').slice(1, 3).join(' / '));
    }
    await page.evaluate(() => document.getElementById('pmb-debug')?.remove());
    const tap = (sel, opts = {}) => (touch ? page.locator(sel).first().tap({ timeout: 4000, ...opts }) : page.locator(sel).first().click({ timeout: 4000, ...opts }));

    if (!blocked) check(await page.locator('.mitteilung:not([hidden])').count() === 1, 'announcement banner is shown');
    const bar = await page.locator('.dienste-leiste').count();
    if (blocked) check(bar === 0, 'no cookie bar when its file is blocked (nothing else breaks)');
    else if (scenario === 'decided') check(bar === 0, 'no cookie bar after a choice');
    else check(bar === 1, 'cookie bar is shown');
    if (bar) {
      const h = await page.locator('.dienste-leiste').evaluate((el) => el.getBoundingClientRect().height);
      check(h <= height * 0.28 || (width >= 768 && h <= 120), 'cookie bar stays compact', `${Math.round(h)}px of ${height}px`);
    }

    // 1) video: poster visible straight away, tap starts it
    const posterOk = await page.evaluate(() => { const i = document.querySelector('.hero__media img'); return i.complete && i.naturalWidth > 0; });
    check(posterOk, 'video poster is visible without any tap');
    let r = await hit(page, '.hero__media button'); check(r === 'ok', 'video play target is reachable', r);
    await page.evaluate(() => window.scrollTo(0, 0));
    try { await tap('.hero__media button'); await page.waitForTimeout(300);
      const src = await page.locator('iframe.hero__video-frame').getAttribute('src');
      check(/player\.vimeo\.com\/video\/\d+/.test(src || ''), 'tap starts the Vimeo player', String(src));
    } catch (e) { check(false, 'tap starts the Vimeo player', e.message.split('\n')[0]); }

    // 2) Online-Rezeption links (hero, banner, contact)
    const links = await page.locator('.js-open-321med').count();
    check(links >= (blocked ? 2 : 3), 'Online-Rezeption links present (hero, contact, and the message)', `found ${links}`);
    for (let i = 0; i < links; i += 1) {
      r = await hit(page, '.js-open-321med', i); check(r === 'ok', `Rezeption link #${i + 1} is reachable`, r);
    }
    if (scenario === 'vendor-fail') {
      // never a dead end: without the widget the link takes the visitor to the contact section
      await page.evaluate(() => { window.scrollTo(0, 0); document.documentElement.style.scrollBehavior = 'auto'; });
      try { await tap('.js-open-321med'); } catch { /* intercepted: counted below */ }
      await page.waitForTimeout(5200);
      const y = await page.evaluate(() => { const k = document.getElementById('kontakt').getBoundingClientRect(); return k.top < innerHeight && k.bottom > 0; });
      check(y, 'without the widget the link falls back to the contact section');
    } else {
      for (let i = 0; i < links; i += 1) {
        await hit(page, '.js-open-321med', i);
        const before = await page.evaluate(() => window.__rez || 0);
        try {
          await (touch ? page.locator('.js-open-321med').nth(i).tap({ timeout: 2500 }) : page.locator('.js-open-321med').nth(i).click({ timeout: 2500 }));
        } catch { /* intercepted: counted below */ }
        await page.waitForTimeout(150);
        const after = await page.evaluate(() => window.__rez || 0);
        check(after === before + 1, `Rezeption link #${i + 1} opens the widget`, `${before} → ${after}`);
      }
    }

    // 3) team photo: not lazy, loaded before anyone scrolls or taps
    const team = await page.evaluate(() => { const i = document.querySelector('.team-photo img'); return { lazy: i.loading === 'lazy', ok: i.complete && i.naturalWidth > 0 }; });
    check(!team.lazy && team.ok, 'team photo is loaded without scrolling or tapping', JSON.stringify(team));

    // 4) maps: placeholder button loads both maps (no consent decision yet / "Nur Notwendige")
    if (blocked) {
      check(await page.locator('.embed-platzhalter a[href^="https://"]').count() === 2, 'map placeholders keep a plain link to Google Maps');
    } else if (scenario !== 'decided') {
      r = await hit(page, '.js-embed-laden'); check(r === 'ok', 'map placeholder button is reachable', r);
    }
    const placeholders = blocked ? 0 : await page.locator('.js-embed-laden').count();
    if (placeholders) {
      await hit(page, '.js-embed-laden');
      try {
        await (touch ? page.locator('.js-embed-laden').first().tap({ timeout: 2500 }) : page.locator('.js-embed-laden').first().click({ timeout: 2500 }));
      } catch { /* intercepted: counted below */ }
      await page.waitForTimeout(300);
      check(await page.locator('.embed-frame iframe').count() === 2, 'tap on the map shows the map(s)');
    }

    // 5) nav toggle + banner dismiss
    if (width < 1024) {
      await page.evaluate(() => window.scrollTo(0, 0));
      try { await tap('#nav-toggle'); await page.waitForTimeout(250);
        check(await page.locator('#nav-toggle').getAttribute('aria-expanded') === 'true', 'menu button opens the menu');
      } catch (e) { check(false, 'menu button opens the menu', e.message.split('\n').filter((l) => /intercept|not stable|not visible|outside/.test(l)).slice(-1)[0] || e.message.split('\n')[0]); }
    }

    const unexpected = blocked ? errors.filter((e) => !/dynamically imported module/.test(e)) : errors;
    check(unexpected.length === 0, 'no script errors', unexpected.join(' | '));
    await ctx.close();
  }
}
// Layout sweep, every 10px from 300 to 1440: no horizontal page overflow,
// every image keeps its proportions, nothing sticks out of its card.
console.log('layout · 300–1440px');
{
  const page = await browser.newPage();
  await page.route(/321med|vimeo|google/, (route) => route.abort());
  const problems = [];
  for (let w = 300; w <= 1440; w += 10) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });
    await page.waitForTimeout(150);
    const found = await page.evaluate(() => {
      const out = [];
      if (document.documentElement.scrollWidth > innerWidth) out.push(`page scrolls sideways (${document.documentElement.scrollWidth}px)`);
      for (const img of document.querySelectorAll('main img')) {
        if (!img.naturalWidth || getComputedStyle(img).objectFit === 'cover') continue;
        const r = img.getBoundingClientRect();
        if (r.width && Math.abs(r.height / r.width - img.naturalHeight / img.naturalWidth) > 0.02) out.push(`${img.getAttribute('src')} distorted`);
      }
      for (const card of document.querySelectorAll('.buch-card, .schwerpunkte__card, .accordion, .leistungen-group')) {
        const cb = card.getBoundingClientRect();
        for (const child of card.querySelectorAll('*')) {
          const r = child.getBoundingClientRect();
          if (r.width && r.right > cb.right + 0.5) { out.push(`${child.tagName.toLowerCase()} sticks out of .${card.classList[0]} by ${Math.round(r.right - cb.right)}px`); break; }
        }
      }
      return out;
    });
    for (const f of found) problems.push(`${w}px: ${f}`);
  }
  check(problems.length === 0, 'no overflow, no distorted images at any width', problems.slice(0, 8).join(' | '));
  await page.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed');
process.exit(failures ? 1 : 0);
