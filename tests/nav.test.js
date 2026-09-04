// tests/nav.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextNavState } from '../assets/js/nav.js';

test('nextNavState flips closed to open', () => {
  assert.equal(nextNavState(false), true);
});

test('nextNavState flips open to closed', () => {
  assert.equal(nextNavState(true), false);
});
