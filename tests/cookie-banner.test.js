import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONSENT_KEY, getConsent, setConsent, safeStorage } from '../assets/js/consent.js';
import { renderCookieBannerHTML } from '../assets/js/cookie-banner.js';
import { readFileSync } from 'node:fs';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}
const brokenStorage = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
};

test('consent is undecided until set, then round-trips', () => {
  const s = fakeStorage();
  assert.equal(getConsent(s), null);
  setConsent(s, 'essential');
  assert.equal(getConsent(s), 'essential');
  setConsent(s, 'all');
  assert.equal(getConsent(s), 'all');
});

test('values from earlier previews: granted counts as all, denied as undecided', () => {
  assert.equal(getConsent(fakeStorage({ [CONSENT_KEY]: 'granted' })), 'all');
  assert.equal(getConsent(fakeStorage({ [CONSENT_KEY]: 'denied' })), null);
});

test('unknown stored values count as undecided', () => {
  assert.equal(getConsent(fakeStorage({ [CONSENT_KEY]: 'yes' })), null);
});

test('blocked storage never throws and counts as undecided', () => {
  assert.equal(getConsent(brokenStorage), null);
  assert.doesNotThrow(() => setConsent(brokenStorage, 'granted'));
});

test('banner offers Nur Notwendige and Alle zulassen and links to the cookie section', () => {
  const html = renderCookieBannerHTML();
  assert.equal(html.match(/<button/g).length, 2);
  assert.match(html, /data-consent="essential">Nur Notwendige</);
  assert.match(html, /data-consent="all">Alle zulassen</);
  assert.match(html, /href="datenschutz\.html#cookies"/);
});

test('the widget loader is unconditional: the Online-Rezeption is not behind the consent', () => {
  const loader = readFileSync(new URL('../assets/js/rezeption-loader.js', import.meta.url), 'utf8');
  assert.doesNotMatch(loader, /localStorage|CONSENT/);
});

test('safeStorage falls back to memory when window.localStorage throws', () => {
  const win = { get localStorage() { throw new Error('SecurityError'); } };
  const storage = safeStorage(win);
  assert.equal(getConsent(storage), null);
  setConsent(storage, 'all');
  assert.equal(getConsent(storage), 'all');
});

test('safeStorage returns the real storage when it works', () => {
  const real = fakeStorage();
  assert.equal(safeStorage({ localStorage: real }), real);
});

const PAGES = ['index.html', 'impressum.html', 'datenschutz.html'];
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('no page loads Google Maps before consent; 321med only via the loader', () => {
  const loader = read('assets/js/rezeption-loader.js');
  const vendorSrcs = [...loader.matchAll(/'(https:\/\/321med[^']+)'/g)].map((m) => m[1]);
  assert.equal(vendorSrcs.length, 2);
  for (const page of PAGES) {
    const html = read(page);
    assert.doesNotMatch(html, /<iframe/i, `${page} has a static iframe`);
    assert.doesNotMatch(html, /<script[^>]+src="https?:\/\//i, `${page} has a static external script`);
    for (const src of vendorSrcs) assert.ok(!html.includes(src), `${page} still references ${src}`);
    assert.ok(html.includes('assets/js/rezeption-loader.js'), `${page} is missing the loader`);
  }
});

test('every page loads the widget loader, main.js as a module and the debug helper', () => {
  for (const page of PAGES) {
    const html = read(page);
    const loader = html.indexOf('<script src="assets/js/rezeption-loader.js"></script>');
    const main = html.indexOf('<script type="module" src="assets/js/main.js"></script>');
    assert.ok(loader > -1 && main > loader, `${page}: loader, then main.js module`);
    assert.ok(html.indexOf('<script src="assets/js/debug.js"></script>') < html.indexOf('</head>'), `${page}: debug.js in <head>`);
  }
});

test('the announcement banner is in the page flow, outside the sticky header', () => {
  for (const page of PAGES) {
    const html = read(page);
    assert.ok(html.indexOf('</header>') < html.indexOf('id="site-banner"'), `${page}: banner is inside the header`);
  }
  assert.doesNotMatch(read('assets/css/styles.css'), /\.banner \{[^}]*position:\s*absolute/);
});

test('images are not lazy-loaded (team photo must show without a tap)', () => {
  assert.doesNotMatch(read('index.html'), /loading="lazy"/);
});
