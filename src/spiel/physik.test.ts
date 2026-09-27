// Was hier geprueft wird, ist genau das, was man im Spiel NICHT sehen kann.
//
//   node --experimental-strip-types --test src/spiel/*.test.ts
//
// Drei Eigenschaften, die still kaputtgehen und dann jahrelang unbemerkt
// bleiben: Determinismus, Tunneling, Traegheit.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DT, schritt } from './physik.ts';
import { neueWelt } from './welt.ts';
import { streckeTrifftNadel } from './kollision.ts';
import { mulberry32, saat } from './zufall.ts';
import type { Level } from './typen.ts';

const testLevel = (): Level => ({
  id: 0,
  name: 'Pruefstand',
  groesse: { breite: 720, hoehe: 1280 },
  start: { x: 360, y: 1100 },
  ziel: { pos: { x: 360, y: 100 }, radius: 50 },
  nadeln: [],
  zonen: [],
  tempo: { windKraft: 1500, daempfung: 1.6, zeitlimit: 0 },
});

test('gleiche Eingaben ergeben denselben Lauf (Determinismus)', () => {
  // Ohne das ist der Endlos-Seed wertlos: Zwei Geraete spielten verschiedene
  // Laeufe, und ein Bestenlisten-Eintrag waere nicht nachvollziehbar.
  const lauf = () => {
    const w = neueWelt(testLevel());
    for (let i = 0; i < 600; i++) {
      w.windZiel = i < 300 ? { x: 200, y: 400 } : { x: 600, y: 900 };
      schritt(w);
    }
    return w.ballon.pos;
  };
  const a = lauf();
  const b = lauf();
  assert.equal(a.x, b.x);
  assert.equal(a.y, b.y);
});

test('der Ballon steigt von allein — langsam', () => {
  // Auftrieb knapp ueber Schwerkraft. Stuende er still, waere jedes Level eine
  // reine Zielsuche; schoesse er hoch, bliebe keine Zeit zum Vorausdenken.
  const w = neueWelt(testLevel());
  const start = w.ballon.pos.y;
  for (let i = 0; i < 120; i++) schritt(w); // eine Sekunde
  const gestiegen = start - w.ballon.pos.y;
  assert.ok(gestiegen > 5, `steigt gar nicht (${gestiegen.toFixed(1)} px/s)`);
  assert.ok(gestiegen < 120, `steigt zu hastig (${gestiegen.toFixed(1)} px/s)`);
});

test('nach dem Loslassen treibt er nach', () => {
  // Das Nachtreiben IST das Spiel. Wer es wegoptimiert, baut ein anderes.
  const w = neueWelt(testLevel());
  w.windZiel = { x: 700, y: 1100 };
  for (let i = 0; i < 60; i++) schritt(w);
  const beimLoslassen = w.ballon.pos.x;
  w.windZiel = null;
  for (let i = 0; i < 30; i++) schritt(w);
  assert.ok(
    w.ballon.pos.x > beimLoslassen + 10,
    'der Ballon bleibt beim Loslassen sofort stehen — Traegheit ist weg',
  );
});

test('eine duenne Nadel wird auch bei hohem Tempo getroffen (kein Tunneling)', () => {
  // Der teuerste Fehler in so einem Spiel: Bei hohem Tempo springt der Ballon
  // in einem Schritt ueber die Nadel und ueberlebt sie zufaellig. Geprueft wird
  // deshalb der WEG, nicht die Endposition.
  const vorher = { x: 100, y: 100 };
  const jetzt = { x: 100, y: 400 }; // 300 px in einem Schritt
  const nadel = { von: { x: 0, y: 250 }, bis: { x: 200, y: 250 } };
  assert.ok(
    streckeTrifftNadel(vorher, jetzt, 26, nadel.von, nadel.bis),
    'Ballon ist durch die Nadel hindurchgeflogen',
  );
  // Gegenprobe: knapp daneben darf NICHT ausloesen.
  const daneben = { von: { x: 400, y: 250 }, bis: { x: 600, y: 250 } };
  assert.ok(!streckeTrifftNadel(vorher, jetzt, 26, daneben.von, daneben.bis));
});

test('das Zeitlimit beendet den Lauf', () => {
  const level = { ...testLevel(), tempo: { windKraft: 1500, daempfung: 1.6, zeitlimit: 1 } };
  const w = neueWelt(level);
  for (let i = 0; i < 200 && w.ausgang === 'laeuft'; i++) schritt(w);
  assert.equal(w.ausgang, 'zeit-aus');
  assert.ok(Math.abs(w.zeit - 1) < DT * 2);
});

test('derselbe Seed ergibt dieselbe Zufallsfolge', () => {
  const a = mulberry32(saat('loonpop-7'));
  const b = mulberry32(saat('loonpop-7'));
  for (let i = 0; i < 50; i++) assert.equal(a(), b());
  const c = mulberry32(saat('loonpop-8'));
  assert.notEqual(mulberry32(saat('loonpop-7'))(), c());
});
