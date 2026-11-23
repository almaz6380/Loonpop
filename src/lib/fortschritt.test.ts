import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mitSieg, mitSternen, mitWeite, mitTageslauf, naechstes, offen, skinBesitzt, skinKaufen, tagesSchluessel, weltOffen, type Fortschritt } from './fortschritt.ts';

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

test('nur eine groessere Weite ersetzt die Bestweite, je Richtung', () => {
  let r = mitWeite(leer(), 'hoch', 120);
  assert.equal(r.neu, true);
  r = mitWeite(r.f, 'hoch', 80);
  assert.equal(r.neu, false);
  r = mitWeite(r.f, 'strecke', 40);
  assert.equal(r.neu, true);
  assert.deepEqual(r.f.endlos, { hoch: 120, strecke: 40 });
  // Die Level bleiben davon unberuehrt.
  assert.deepEqual(r.f.bestzeit, {});
});

test('der Spielen-Knopf startet das erste offene, nicht geschaffte Level', () => {
  const ids = [1, 2, 3, 6];
  const leer: Fortschritt = { v: 1, bestzeit: {} };
  assert.equal(naechstes(leer, ids), 0);
  assert.equal(naechstes({ v: 1, bestzeit: { 1: 5, 2: 7 } }, ids), 2);
  // Alles geschafft: das letzte, dort jagt man Bestzeiten.
  assert.equal(naechstes({ v: 1, bestzeit: { 1: 5, 2: 7, 3: 9, 6: 4 } }, ids), 3);
});

test('Sterne bleiben beim Besten, Muenzkonto zaehlt nur Verbesserungen', () => {
  let r = mitSternen({ v: 1, bestzeit: {} }, 3, 2, 2);
  assert.equal(r.plusMuenzen, 2);
  assert.equal(r.f.muenzen, 2);
  r = mitSternen(r.f, 3, 1, 2);
  assert.equal(r.plusMuenzen, 0);
  assert.equal(r.f.sterne?.[3], 2);
  r = mitSternen(r.f, 3, 3, 3);
  assert.equal(r.f.muenzen, 3);
  assert.ok(r.neueSterne);
});

test('Welten oeffnen sich mit anderthalb Sternen je Level der vorigen Welt', () => {
  const welten = [[1, 2], [101, 102], [201]];
  let f: Fortschritt = { v: 1, bestzeit: {} };
  assert.equal(weltOffen(f, welten, 1), true);
  assert.equal(weltOffen(f, welten, 2), false);
  f = { ...f, sterne: { 1: 2, 2: 1 } };
  assert.equal(weltOffen(f, welten, 2), true);
  assert.equal(weltOffen(f, welten, 3), false);
});

test('Skins: kaufen nur mit genug Muenzen, Rot ist immer da', () => {
  let f: Fortschritt = { v: 1, bestzeit: {}, muenzen: 20 };
  assert.equal(skinBesitzt(f, 'rot'), true);
  assert.equal(skinKaufen(f, 'blau'), null);
  f = { ...f, muenzen: 35 };
  const g = skinKaufen(f, 'blau')!;
  assert.equal(g.muenzen, 5);
  assert.equal(g.skin, 'blau');
  assert.equal(skinBesitzt(g, 'blau'), true);
});

test('Tageslauf: Bestweite des Tages und Serie ueber aufeinanderfolgende Tage', () => {
  let f: Fortschritt = { v: 1, bestzeit: {} };
  f = mitTageslauf(f, '2026-11-22', 40).f;
  f = mitTageslauf(f, '2026-11-23', 30).f;
  assert.deepEqual(f.tages, { tag: '2026-11-23', beste: 30, serie: 2 });
  const r = mitTageslauf(f, '2026-11-23', 25);
  assert.equal(r.neu, false);
  f = mitTageslauf(r.f, '2026-11-25', 10).f;
  assert.equal(f.tages?.serie, 1);
  assert.equal(tagesSchluessel(new Date(2026, 0, 5)), '2026-01-05');
});
