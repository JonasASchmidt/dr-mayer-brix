import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONSENT_KEY, getConsent, setConsent } from '../assets/js/consent.js';
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
  setConsent(s, 'granted');
  assert.equal(getConsent(s), 'granted');
});

test('unknown stored values count as undecided', () => {
  assert.equal(getConsent(fakeStorage({ [CONSENT_KEY]: 'yes' })), null);
});

test('blocked storage never throws and counts as undecided', () => {
  assert.equal(getConsent(brokenStorage), null);
  assert.doesNotThrow(() => setConsent(brokenStorage, 'granted'));
});

test('banner has exactly one button (consent, no decline) and links to the cookie section', () => {
  const html = renderCookieBannerHTML();
  assert.equal(html.match(/<button/g).length, 1);
  assert.match(html, />Zustimmen</);
  assert.match(html, /href="datenschutz\.html#cookies"/);
});

test('no page loads Google Maps or 321med before consent', () => {
  const loader = readFileSync(new URL('../assets/js/rezeption-loader.js', import.meta.url), 'utf8');
  const vendorSrcs = [...loader.matchAll(/'(https:\/\/321med[^']+)'/g)].map((m) => m[1]);
  assert.equal(vendorSrcs.length, 2);
  assert.ok(loader.includes(CONSENT_KEY), 'loader must check the consent key');
  for (const page of ['index.html', 'impressum.html', 'datenschutz.html']) {
    const html = readFileSync(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /<iframe/i, `${page} has a static iframe`);
    assert.doesNotMatch(html, /<script[^>]+src="https?:\/\//i, `${page} has a static external script`);
    for (const src of vendorSrcs) assert.ok(!html.includes(src), `${page} still references ${src}`);
    assert.ok(html.includes('assets/js/rezeption-loader.js'), `${page} is missing the loader`);
  }
});
