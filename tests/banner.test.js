import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBannerHTML, escapeHtml } from '../assets/js/banner.js';
import { isBannerDismissed, dismissBanner } from '../assets/js/banner.js';

test('escapeHtml escapes angle brackets and ampersands', () => {
  assert.equal(escapeHtml('<b> & "x"'), '&lt;b&gt; &amp; &quot;x&quot;');
});

test('renderBannerHTML returns empty string for empty/missing text', () => {
  assert.equal(renderBannerHTML(''), '');
  assert.equal(renderBannerHTML(undefined), '');
  assert.equal(renderBannerHTML(null), '');
});

test('renderBannerHTML returns empty string for whitespace-only text', () => {
  assert.equal(renderBannerHTML('   \n\n  \t  '), '');
});

test('renderBannerHTML renders paragraphs split on blank lines', () => {
  const html = renderBannerHTML('Zeile eins\n\nZeile zwei');
  assert.match(html, /<p>Zeile eins<\/p>/);
  assert.match(html, /<p>Zeile zwei<\/p>/);
});

test('renderBannerHTML obfuscates a plain-text email address in the message', () => {
  const html = renderBannerHTML('Schreiben Sie uns: mbpraxis@duck.com');
  assert.equal(html.includes('mbpraxis@duck.com'), false, 'raw address must not appear in the source HTML');
  assert.match(html, /class="js-email" data-user="mbpraxis" data-domain="duck\.com"/);
});

test('dismissBanner sets sessionStorage and isBannerDismissed reads it back', () => {
  // node:test runs in Node, not a browser — sessionStorage isn't global.
  // Stub a minimal sessionStorage before calling either function.
  const store = {};
  global.sessionStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
  };
  assert.equal(isBannerDismissed(), false);
  dismissBanner();
  assert.equal(isBannerDismissed(), true);
  delete global.sessionStorage;
});
