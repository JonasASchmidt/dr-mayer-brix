import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBannerHTML, escapeHtml } from '../assets/js/banner.js';

// Every <a>/<button> the renderer emits must be closed, and never nested
// inside another one — the old renderer turned [x@y.de](mailto:x@y.de)
// into an <a> whose href and label each contained a second, obfuscated <a>.
function assertWellFormedLinks(html) {
  assert.equal((html.match(/<a[\s>]/g) || []).length, (html.match(/<\/a>/g) || []).length, html);
  assert.doesNotMatch(html, /<a[^>]*<a/, html);
  assert.doesNotMatch(html, /href="[^"]*</, html);
}

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

test('comment lines starting with # are never shown', () => {
  assert.equal(renderBannerHTML('# nur ein Kommentar'), '');
  assert.doesNotMatch(renderBannerHTML('# versteckt\nSichtbar'), /versteckt/);
});

test('**text** renders bold', () => {
  assert.match(renderBannerHTML('Hallo **wichtig** du'), /<strong>wichtig<\/strong>/);
});

test('a plain-text email address is auto-linked and obfuscated', () => {
  const html = renderBannerHTML('Schreiben Sie uns: mbpraxis@duck.com');
  assert.equal(html.includes('mbpraxis@duck.com'), false, 'raw address must not appear in the generated HTML');
  assert.match(html, /class="js-email" data-user="mbpraxis" data-domain="duck\.com"/);
  assertWellFormedLinks(html);
});

test('[address](mailto:address) renders one clean email link, not broken nested markup', () => {
  const html = renderBannerHTML('Mail: [mbpraxis@duck.com](mailto:mbpraxis@duck.com).');
  assertWellFormedLinks(html);
  assert.equal((html.match(/<a[\s>]/g) || []).length, 1);
  assert.match(html, /class="js-email" data-user="mbpraxis" data-domain="duck\.com"/);
  assert.equal(html.includes('mbpraxis@duck.com'), false);
  assert.doesNotMatch(html, /\[|\]\(/, 'no leftover markdown syntax');
});

test('[address](address) without mailto: also becomes an email link', () => {
  const html = renderBannerHTML('[mbpraxis@duck.com](mbpraxis@duck.com)');
  assertWellFormedLinks(html);
  assert.match(html, /class="js-email" data-user="mbpraxis" data-domain="duck\.com"/);
});

test('[custom label](mailto:address) keeps the label', () => {
  const html = renderBannerHTML('[Schreiben Sie uns](mailto:mbpraxis@duck.com)');
  assertWellFormedLinks(html);
  assert.match(html, /data-label="1"[^>]*>Schreiben Sie uns<\/a>/);
});

test('a plain-text German phone number is auto-linked as tel:', () => {
  const html = renderBannerHTML('telefonisch 09131/208899 oder');
  assert.match(html, /<a href="tel:\+499131208899">09131\/208899<\/a>/);
  assertWellFormedLinks(html);
});

test('phone numbers in international and spaced formats are auto-linked', () => {
  assert.match(renderBannerHTML('Tel. +49 (0) 91 31 / 20 88 99'), /href="tel:\+499131208899"/);
  assert.match(renderBannerHTML('Tel. +49 9131 208899'), /href="tel:\+499131208899"/);
  assert.match(renderBannerHTML('Tel. 09131 208899'), /href="tel:\+499131208899"/);
});

test('dates, years, times and postal codes are not mistaken for phone numbers', () => {
  const html = renderBannerHTML('Geschlossen vom 31.8. bis 04.09.2026, ab 08:00 Uhr, 91052 Erlangen, 01067 Dresden');
  assert.doesNotMatch(html, /tel:/);
});

test('[label](phone number) renders a tel: link', () => {
  const html = renderBannerHTML('[Rufen Sie an](09131/208899)');
  assert.match(html, /<a href="tel:\+499131208899">Rufen Sie an<\/a>/);
  assertWellFormedLinks(html);
});

test('[phone](phone) renders exactly one tel: link', () => {
  const html = renderBannerHTML('[09131/208899](09131/208899)');
  assert.equal((html.match(/<a[\s>]/g) || []).length, 1);
  assert.match(html, /<a href="tel:\+499131208899">09131\/208899<\/a>/);
});

test('[label](https URL) renders a normal link', () => {
  const html = renderBannerHTML('Mehr auf [unserer Website](https://dr-mayer-brix.de/).');
  assert.match(html, /<a href="https:\/\/dr-mayer-brix\.de\/">unserer Website<\/a>/);
  assertWellFormedLinks(html);
});

test('[label](bare domain) gets https:// added', () => {
  assert.match(renderBannerHTML('[Website](dr-mayer-brix.de)'), /href="https:\/\/dr-mayer-brix\.de"/);
  assert.match(renderBannerHTML('[Website](www.dr-mayer-brix.de)'), /href="https:\/\/www\.dr-mayer-brix\.de"/);
});

test('[label](javascript:...) is not rendered as a link', () => {
  const html = renderBannerHTML('[klick](javascript:alert(1))');
  assert.doesNotMatch(html, /href="javascript/i);
});

test('[label](online-rezeption) renders the Online-Rezeption button', () => {
  const html = renderBannerHTML('Über die [Online-Rezeption](online-rezeption).');
  assert.match(html, /<button type="button" class="hero__rezeption-link js-open-321med">Online-Rezeption<\/button>/);
});

test('links inside **bold** stay bold and well-formed', () => {
  const html = renderBannerHTML('**Mail an mbpraxis@duck.com oder 09131/208899**');
  assert.match(html, /^<div class="banner__inner"><div class="banner__text"><p><strong>.*<\/strong><\/p>/);
  assertWellFormedLinks(html);
});

test('the live banner.txt message renders both contact links cleanly', () => {
  const html = renderBannerHTML(
    'Liebe Patientinnen und Patienten, aktuell erreichen Sie uns telefonisch 09131/208899 oder per Mail unter mbpraxis@duck.com, wir klären gerade eine technische Störung der Online-Rezeption.'
  );
  assert.match(html, /href="tel:\+499131208899"/);
  assert.match(html, /class="js-email" data-user="mbpraxis" data-domain="duck\.com"/);
  assertWellFormedLinks(html);
});
