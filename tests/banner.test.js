import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBannerHTML, escapeHtml } from '../assets/js/banner.js';

test('escapeHtml escapes angle brackets and ampersands', () => {
  assert.equal(escapeHtml('<b> & "x"'), '&lt;b&gt; &amp; &quot;x&quot;');
});

test('renderBannerHTML returns empty string when disabled', () => {
  assert.equal(renderBannerHTML({ enabled: false, message: 'hi' }), '');
});

test('renderBannerHTML returns empty string when enabled but message is empty/missing', () => {
  assert.equal(renderBannerHTML({ enabled: true, message: '' }), '');
  assert.equal(renderBannerHTML({ enabled: true }), '');
});

test('renderBannerHTML renders paragraphs split on blank lines', () => {
  const html = renderBannerHTML({ enabled: true, message: 'Zeile eins\n\nZeile zwei' });
  assert.match(html, /<p>Zeile eins<\/p>/);
  assert.match(html, /<p>Zeile zwei<\/p>/);
});

test('renderBannerHTML includes the optional link when present', () => {
  const html = renderBannerHTML({
    enabled: true,
    message: 'Info',
    linkLabel: 'Termin buchen',
    linkUrl: 'https://webtermin.medatixx.de/#/bec45e38-6a42-46f2-a0da-36f22b64ebee/search',
  });
  assert.match(html, /<a class="banner__link" href="https:\/\/webtermin\.medatixx\.de\/#\/bec45e38-6a42-46f2-a0da-36f22b64ebee\/search">Termin buchen<\/a>/);
});
