import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openOnlineRezeption } from '../assets/js/online-rezeption.js';

test('openOnlineRezeption calls window.open_321med("default") when present', () => {
  const calls = [];
  global.window = { open_321med: (mode) => calls.push(mode) };
  const result = openOnlineRezeption();
  assert.equal(result, true);
  assert.deepEqual(calls, ['default']);
  delete global.window;
});

test('openOnlineRezeption returns false when the vendor script has not loaded', () => {
  global.window = {};
  const result = openOnlineRezeption();
  assert.equal(result, false);
  delete global.window;
});
