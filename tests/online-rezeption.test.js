import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openOnlineRezeption, requestOnlineRezeption } from '../assets/js/online-rezeption.js';

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

function fakeTimers() {
  let t = 0;
  let tick = null;
  return {
    now: () => t,
    setTimer: (fn) => { tick = fn; return 1; },
    clearTimer: () => { tick = null; },
    advance(ms) { t += ms; if (tick) tick(); },
    get running() { return tick !== null; },
  };
}

test('requestOnlineRezeption opens right away when the widget is there', () => {
  const calls = [];
  requestOnlineRezeption({ open: () => { calls.push('open'); return true; }, setTimer: () => assert.fail('no timer needed') });
  assert.deepEqual(calls, ['open']);
});

test('requestOnlineRezeption waits for a slow vendor script, then opens', () => {
  const timers = fakeTimers();
  let ready = false;
  let opened = 0;
  requestOnlineRezeption({ open: () => { if (ready) opened += 1; return ready; }, ...timers, fallback: () => assert.fail('no fallback') });
  timers.advance(300);
  assert.equal(opened, 0);
  ready = true;
  timers.advance(150);
  assert.equal(opened, 1);
  assert.equal(timers.running, false);
});

test('requestOnlineRezeption falls back to the contact section when the widget never loads', () => {
  const timers = fakeTimers();
  let fallbacks = 0;
  requestOnlineRezeption({ open: () => false, ...timers, fallback: () => { fallbacks += 1; } });
  timers.advance(5000);
  assert.equal(fallbacks, 0);
  timers.advance(4000);
  assert.equal(fallbacks, 1);
  assert.equal(timers.running, false);
});
