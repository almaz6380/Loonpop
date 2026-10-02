// Der Generator muss faire Stuecke bauen — fuer jeden Seed, nicht nur fuer
// die paar, die man selbst gespielt hat.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { abschnitt, endlosStueck, neueEndlosWelt, meter, nadelnIn, BODEN_ABSTAND, BODEN_SPITZE } from './endlos.ts';
import { pruefeLevel } from './pruefung.ts';
import { schritt, bodenHoehe } from './physik.ts';
import { BALLON_RADIUS } from './welt.ts';
import type { Endlos, EndlosArt } from './typen.ts';

const SEEDS = Array.from({ length: 16 }, (_, i) => 1000 + i * 7919);

for (const art of ['hoch', 'strecke'] as EndlosArt[]) {
  test(`${art}: derselbe Seed ergibt dieselben Nadeln`, () => {
    const a: Endlos = { art, seed: 42, abschnitte: [] };
    const b: Endlos = { art, seed: 42, abschnitte: [] };
    assert.deepEqual(abschnitt(a, 30), abschnitt(b, 30));
    const c: Endlos = { art, seed: 43, abschnitte: [] };
    const folge = (e: Endlos) => Array.from({ length: 12 }, (_, i) => abschnitt(e, i).mitte);
    assert.notDeepEqual(folge(a), folge(c));
  });

  test(`${art}: jedes Stueck besteht die Levelpruefung`, () => {
    // Anfang, Mitte und volle Schwierigkeit.
    for (const seed of SEEDS) {
      for (const von of [0, 12, 30]) {
        const l = endlosStueck(art, seed, von, 6);
        assert.deepEqual(pruefeLevel(l).maengel, [], l.name);
      }
    }
  });

  test(`${art}: gleiche Eingaben ergeben denselben Lauf`, () => {
    const lauf = () => {
      const w = neueEndlosWelt(art, 7);
      for (let i = 0; i < 1200 && w.ausgang === 'laeuft'; i++) {
        w.geblaese.an = i % 50 < 30;
        w.geblaese.x = w.ballon.pos.x - 10;
        schritt(w);
      }
      return { pos: w.ballon.pos, boden: w.boden, ausgang: w.ausgang };
    };
    assert.deepEqual(lauf(), lauf());
  });
}

test('hoch: die freien Bereiche zweier Reihen beruehren sich', () => {
  // Liegen sie weiter auseinander, braucht es einen Haken, den der traege
  // Ballon kaum schafft (Level 6, 8, 10). Ueberlappen sie zu weit, steigt er
  // gerade durch.
  const r = BALLON_RADIUS;
  for (const seed of SEEDS) {
    const e: Endlos = { art: 'hoch', seed, abschnitte: [] };
    for (let i = 1; i < 60; i++) {
      const a = abschnitt(e, i - 1);
      const b = abschnitt(e, i);
      const ueberlapp = (a.weite / 2 - r) + (b.weite / 2 - r) - Math.abs(a.mitte - b.mitte);
      assert.ok(ueberlapp >= 0, `Seed ${seed}, Reihe ${i}: ${ueberlapp.toFixed(0)} px`);
    }
  }
});

test('strecke: der Korridor springt nie weiter nach unten, als der Ballon sinken kann', () => {
  // Ohne Geblaese sinkt er hoechstens ~40 px/s (Falle 14).
  for (const seed of SEEDS) {
    const e: Endlos = { art: 'strecke', seed, abschnitte: [] };
    for (let i = 1; i < 60; i++) {
      const a = abschnitt(e, i - 1);
      const b = abschnitt(e, i);
      const sekunden = (b.lage - a.lage) / (230 / 1.5);
      assert.ok(b.mitte - a.mitte <= 40 * sekunden * 0.5 + 0.5, `Seed ${seed}, Saeule ${i}`);
    }
  }
});

test('hoch: wer nichts tut, landet auf dem Nadelboden', () => {
  const w = neueEndlosWelt('hoch', 5);
  for (let i = 0; i < 120 * 30 && w.ausgang === 'laeuft'; i++) schritt(w);
  assert.equal(w.ausgang, 'geplatzt');
  assert.ok(w.ballon.pos.y > bodenHoehe(w.boden) - 60, 'nicht am Boden geplatzt');
});

test('hoch: der Boden folgt dem Ballon und sinkt nie', () => {
  const w = neueEndlosWelt('hoch', 5);
  let vorher = w.boden;
  for (let i = 0; i < 120 * 6 && w.ausgang === 'laeuft'; i++) {
    w.geblaese.an = true;
    w.geblaese.x = w.ballon.pos.x;
    schritt(w);
    assert.ok(w.boden <= vorher, 'Boden ist gesunken');
    assert.ok(w.boden <= w.ballon.pos.y + BODEN_ABSTAND + 1e-9);
    vorher = w.boden;
  }
  assert.ok(meter(w) > 0);
});

test('der Nadelboden gehoert zu den Nadeln um den Ballon', () => {
  const w = neueEndlosWelt('hoch', 5);
  const unten = bodenHoehe(w.boden);
  const n = nadelnIn(w, unten - 100, unten + 100, unten);
  assert.ok(n.some((x) => x.bis.y < x.von.y && Math.abs(x.bis.y - (unten - BODEN_SPITZE)) < 1));
});
