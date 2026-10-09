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

test('no page loads Google Maps before consent; 321med only via the loader', () => {
  const loader = readFileSync(new URL('../assets/js/rezeption-loader.js', import.meta.url), 'utf8');
  const vendorSrcs = [...loader.matchAll(/'(https:\/\/321med[^']+)'/g)].map((m) => m[1]);
  assert.equal(vendorSrcs.length, 2);
  for (const page of ['index.html', 'impressum.html', 'datenschutz.html']) {
    const html = readFileSync(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /<iframe/i, `${page} has a static iframe`);
    assert.doesNotMatch(html, /<script[^>]+src="https?:\/\//i, `${page} has a static external script`);
    for (const src of vendorSrcs) assert.ok(!html.includes(src), `${page} still references ${src}`);
    assert.ok(html.includes('assets/js/rezeption-loader.js'), `${page} is missing the loader`);
  }
});
