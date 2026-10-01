import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mitSieg, offen, type Fortschritt } from './fortschritt.ts';

const leer = (): Fortschritt => ({ v: 1, bestzeit: {} });

test('ein Sieg schaltet das naechste Level frei', () => {
  const ids = [1, 2, 3];
  let f = leer();
  assert.equal(offen(f, ids, 0), true);
  assert.equal(offen(f, ids, 1), false);
  f = mitSieg(f, 1, 12.3).f;
  assert.equal(offen(f, ids, 1), true);
  assert.equal(offen(f, ids, 2), false);
});

test('nur eine bessere Zeit ersetzt die Bestzeit', () => {
  let r = mitSieg(leer(), 4, 20);
  assert.equal(r.neu, true);
  r = mitSieg(r.f, 4, 25);
  assert.equal(r.neu, false);
  assert.equal(r.f.bestzeit[4], 20);
  r = mitSieg(r.f, 4, 18.5);
  assert.equal(r.neu, true);
  assert.equal(r.f.bestzeit[4], 18.5);
});

test('der Fortschritt haengt an der Level-ID, nicht an der Position', () => {
  // Wird spaeter ein Level eingeschoben, bleibt "Level 2 geschafft" bei Level 2.
  const f = mitSieg(leer(), 2, 10).f;
  assert.equal(offen(f, [1, 2, 3], 2), true);
  assert.equal(offen(f, [1, 9, 2, 3], 2), false);
  assert.equal(offen(f, [1, 9, 2, 3], 3), true);
});
