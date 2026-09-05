// tests/accordion.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextAccordionState } from '../assets/js/accordion.js';

test('nextAccordionState flips closed to open', () => {
  assert.equal(nextAccordionState(false), true);
});
test('nextAccordionState flips open to closed', () => {
  assert.equal(nextAccordionState(true), false);
});
