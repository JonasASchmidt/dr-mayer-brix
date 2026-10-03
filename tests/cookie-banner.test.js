import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COOKIE_NOTICE_KEY, isAcknowledged, acknowledge, renderCookieBannerHTML } from '../assets/js/cookie-banner.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}
const brokenStorage = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
};

test('not acknowledged until the key is set', () => {
  const s = fakeStorage();
  assert.equal(isAcknowledged(s), false);
  acknowledge(s);
  assert.equal(isAcknowledged(s), true);
  assert.equal(s.getItem(COOKIE_NOTICE_KEY), '1');
});

test('blocked storage never throws and counts as not acknowledged', () => {
  assert.equal(isAcknowledged(brokenStorage), false);
  assert.doesNotThrow(() => acknowledge(brokenStorage));
});

test('markup links to the cookie section of the Datenschutzerklärung and has an accept button', () => {
  const html = renderCookieBannerHTML();
  assert.match(html, /href="datenschutz\.html#cookies"/);
  assert.match(html, /<button type="button" class="cookie-banner__accept">/);
});
