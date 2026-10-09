import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONSENT_KEY, REZEPTION_SCRIPTS, getConsent, setConsent } from '../assets/js/consent.js';
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
  setConsent(s, 'denied');
  assert.equal(getConsent(s), 'denied');
});

test('unknown stored values count as undecided', () => {
  assert.equal(getConsent(fakeStorage({ [CONSENT_KEY]: 'yes' })), null);
});

test('blocked storage never throws and counts as undecided', () => {
  assert.equal(getConsent(brokenStorage), null);
  assert.doesNotThrow(() => setConsent(brokenStorage, 'granted'));
});

test('first-visit banner has a single consent button and links to the cookie section', () => {
  const html = renderCookieBannerHTML();
  assert.equal(html.match(/<button/g).length, 1);
  assert.match(html, /data-consent="granted"/);
  assert.match(html, /href="datenschutz\.html#cookies"/);
});

test('banner reopened after consent offers a single withdraw button', () => {
  const html = renderCookieBannerHTML(true);
  assert.equal(html.match(/<button/g).length, 1);
  assert.match(html, /data-consent="denied"/);
});

test('no page loads Google Maps or 321med before consent', () => {
  for (const page of ['index.html', 'impressum.html', 'datenschutz.html']) {
    const html = readFileSync(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /<iframe/i, `${page} has a static iframe`);
    assert.doesNotMatch(html, /<script[^>]+src="https?:\/\/(?!cdn)/i, `${page} has a static external script`);
    for (const src of REZEPTION_SCRIPTS) assert.ok(!html.includes(src), `${page} still references ${src}`);
  }
});
