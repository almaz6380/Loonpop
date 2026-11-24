// Die Bewertungsbitte darf nicht nerven: erst ab 5 Leveln, hoechstens alle 90
// Tage, nie neben einer Vollbild-Anzeige, nie im Browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ABSTAND_MS, AB_LEVELN, darfFragen } from './bewertung.ts';

const lage = { geschafft: AB_LEVELN, zuletzt: null, jetzt: 1_000_000_000_000, vollbild: false, nativ: true };

test('ab 5 geschafften Leveln wird gefragt, vorher nicht', () => {
  assert.equal(darfFragen(lage), true);
  assert.equal(darfFragen({ ...lage, geschafft: AB_LEVELN - 1 }), false);
  assert.equal(darfFragen({ ...lage, geschafft: 0 }), false);
});

test('hoechstens alle 90 Tage', () => {
  assert.equal(darfFragen({ ...lage, zuletzt: lage.jetzt - ABSTAND_MS + 1 }), false);
  assert.equal(darfFragen({ ...lage, zuletzt: lage.jetzt - ABSTAND_MS }), true);
});

test('nie im selben Moment wie eine Vollbild-Anzeige', () => {
  assert.equal(darfFragen({ ...lage, vollbild: true }), false);
});

test('nie im Browser', () => {
  assert.equal(darfFragen({ ...lage, nativ: false }), false);
});
