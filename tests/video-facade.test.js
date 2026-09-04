import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vimeoEmbedSrc } from '../assets/js/video-facade.js';

test('vimeoEmbedSrc builds the player URL with autoplay', () => {
  assert.equal(
    vimeoEmbedSrc('109794949'),
    'https://player.vimeo.com/video/109794949?autoplay=1&title=0&byline=0'
  );
});
