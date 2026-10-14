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
const SCENARIOS = ['fresh', 'decided', 'storage-blocked', 'vendor-hang', 'vendor-fail'];
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
      if (scenario === 'vendor-hang') return new Promise(() => {});
      if (scenario === 'vendor-fail') return route.abort();
      return route.fulfill({ contentType: 'application/javascript', body: STUB });
    });
    await page.route(/player\.vimeo\.com|google\.com\/maps|maps\.google/, (route) => route.fulfill({ contentType: 'text/html', body: '<html>stub</html>' }));

    await page.goto(`${BASE}/index.html`, { waitUntil: scenario === 'vendor-hang' ? 'commit' : 'load' });
    await page.waitForSelector('.hero__media button');
    await page.waitForTimeout(scenario === 'vendor-hang' ? 2500 : 700);   // main.js + banner.txt fetch
    const tap = (sel, opts = {}) => (touch ? page.locator(sel).first().tap({ timeout: 4000, ...opts }) : page.locator(sel).first().click({ timeout: 4000, ...opts }));

    check(await page.locator('.banner:not([hidden])').count() === 1, 'announcement banner is shown');
    const bar = await page.locator('.cookie-banner').count();
    if (scenario === 'decided') check(bar === 0, 'no cookie bar after a choice');
    else check(bar === 1, 'cookie bar is shown');
    if (bar) {
      const h = await page.locator('.cookie-banner').evaluate((el) => el.getBoundingClientRect().height);
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
    check(links >= 3, 'Online-Rezeption links present (hero, banner, contact)', `found ${links}`);
    for (let i = 0; i < links; i += 1) {
      r = await hit(page, '.js-open-321med', i); check(r === 'ok', `Rezeption link #${i + 1} is reachable`, r);
    }
    if (scenario === 'vendor-hang' || scenario === 'vendor-fail') {
      // never a dead end: without the widget the link takes the visitor to the contact section
      await page.evaluate(() => { window.scrollTo(0, 0); document.documentElement.style.scrollBehavior = 'auto'; });
      try { await tap('.js-open-321med'); } catch { /* intercepted: counted below */ }
      await page.waitForTimeout(9200);
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
    if (scenario !== 'decided') {
      r = await hit(page, '.js-embed-consent'); check(r === 'ok', 'map placeholder button is reachable', r);
    }
    const placeholders = await page.locator('.js-embed-consent').count();
    if (placeholders) {
      await hit(page, '.js-embed-consent');
      try {
        await (touch ? page.locator('.js-embed-consent').first().tap({ timeout: 2500 }) : page.locator('.js-embed-consent').first().click({ timeout: 2500 }));
      } catch { /* intercepted: counted below */ }
      await page.waitForTimeout(300);
      check(await page.locator('.embed-frame iframe').count() === 2, 'tap on the map shows the map(s)');
    }

    // 5) nav toggle + banner dismiss
    if (width < 1024) {
      await page.evaluate(() => window.scrollTo(0, 0));
      try { await tap('#nav-toggle'); await page.waitForTimeout(250);
        check(await page.locator('#nav-toggle').getAttribute('aria-expanded') === 'true', 'menu button opens the menu');
      } catch (e) { check(false, 'menu button opens the menu', e.message.split('\n')[0]); }
    }

    check(errors.length === 0, 'no script errors', errors.join(' | '));
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed');
process.exit(failures ? 1 : 0);
