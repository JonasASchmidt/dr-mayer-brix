// tests/nav.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextNavState, buildScrollSpyMap } from '../assets/js/nav.js';

test('nextNavState flips closed to open', () => {
  assert.equal(nextNavState(false), true);
});

test('nextNavState flips open to closed', () => {
  assert.equal(nextNavState(true), false);
});

test('buildScrollSpyMap maps a nav-linked section to itself', () => {
  const map = buildScrollSpyMap(['willkommen', 'leistungen'], ['willkommen', 'leistungen']);
  assert.equal(map.willkommen, 'willkommen');
  assert.equal(map.leistungen, 'leistungen');
});

test('buildScrollSpyMap maps an unlinked section forward to the nearest preceding linked one', () => {
  // Mirrors the real page: "schwerpunkte" and "zitat" have no nav link of
  // their own and should highlight "leistungen" / "kontakt" respectively.
  const sectionIds = ['willkommen', 'leistungen', 'schwerpunkte', 'team', 'kontakt', 'zitat'];
  const linkedIds = ['willkommen', 'leistungen', 'team', 'kontakt'];
  const map = buildScrollSpyMap(sectionIds, linkedIds);
  assert.equal(map.schwerpunkte, 'leistungen');
  assert.equal(map.zitat, 'kontakt');
});

test('buildScrollSpyMap maps a leading unlinked section to null', () => {
  const map = buildScrollSpyMap(['intro', 'willkommen'], ['willkommen']);
  assert.equal(map.intro, null);
  assert.equal(map.willkommen, 'willkommen');
});
