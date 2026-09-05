import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAddress, obfuscateEmailsInHtml } from '../assets/js/email-obfuscate.js';

test('buildAddress joins user and domain with @', () => {
  assert.equal(buildAddress('mbpraxis', 'duck.com'), 'mbpraxis@duck.com');
});

test('obfuscateEmailsInHtml replaces a bare email with non-crawlable split markup', () => {
  const out = obfuscateEmailsInHtml('Kontakt: mbpraxis@duck.com bitte.');
  assert.equal(out.includes('mbpraxis@duck.com'), false);
  assert.match(out, /data-user="mbpraxis"/);
  assert.match(out, /data-domain="duck\.com"/);
  assert.match(out, />mbpraxis \(at\) duck \(dot\) com</);
});

test('obfuscateEmailsInHtml leaves text with no email untouched', () => {
  assert.equal(obfuscateEmailsInHtml('Kein Kontakt hier.'), 'Kein Kontakt hier.');
});
