import { test } from 'node:test';
import assert from 'node:assert/strict';

import { naechsteDichte, startDichte, DICHTE_MIN } from './dichte.ts';

test('fluessige Bilder lassen die Dichte, wie sie ist', () => {
  assert.equal(naechsteDichte(2, 16.7), 2);
});

test('zu langsame Bilder senken die Dichte stufenweise bis zur Untergrenze', () => {
  let d = 2;
  for (let i = 0; i < 10; i++) d = naechsteDichte(d, 60);
  assert.equal(d, DICHTE_MIN);
  assert.equal(naechsteDichte(2, 30), 1.75);
  assert.equal(naechsteDichte(2, 60), 1.5);
});

test('die Startdichte ist hoechstens 2 und mindestens 1', () => {
  assert.equal(startDichte(3), 2);
  assert.equal(startDichte(0), 1);
  assert.equal(startDichte(1.5), 1.5);
});
