import { test } from 'node:test';
import assert from 'node:assert/strict';

import { geblaeseMass, TRICHTER_BREITE } from './bildmasse.ts';
import { MUND, DUESE_HOEHE } from './physik.ts';

test('der Trichter ist fast so breit wie der Strahl an der Duese', () => {
  // Falle 7: Der Spieler zielt nach dem Bild. Ein Strahl, der aus einem
  // duennen Roehrchen 68 px breit herauskommt, sieht nach etwas anderem aus.
  assert.ok(TRICHTER_BREITE >= 2 * MUND * 0.7 && TRICHTER_BREITE <= 2 * MUND);
});

test('das Geblaese steht ganz ueber dem Boden', () => {
  // Oberkante an der Duese. ⚠ Mit 56 px Trichter ragte es 24 px unter den
  // Rand, und vom Motor sah man kaum noch etwas.
  const { hoehe } = geblaeseMass();
  assert.ok(hoehe - 3 - DUESE_HOEHE < 8, `${(hoehe - 3 - DUESE_HOEHE).toFixed(0)} px unter dem Boden`);
});
