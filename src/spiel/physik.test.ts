// Was hier geprueft wird, ist genau das, was man im Spiel NICHT sehen kann.
//
//   node --experimental-strip-types --test src/spiel/*.test.ts
//
// Determinismus, Tunneling, Traegheit — und seit dem Umbau auf das Laubgeblaese
// (27.09.2026) das Strahlmodell, an dem das ganze Spielgefuehl haengt.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DT, schritt, strahlKraft, DUESE_HOEHE, bodenHoehe } from './physik.ts';
import { neueWelt } from './welt.ts';
import { streckeTrifftNadel } from './kollision.ts';
import { mulberry32, saat } from './zufall.ts';
import type { Level } from './typen.ts';

const testLevel = (): Level => ({
  id: 0,
  name: 'Pruefstand',
  art: 'hoch',
  groesse: { breite: 720, hoehe: 1280 },
  start: { x: 360, y: 1050 },
  geblaeseStart: 360,
  ziel: { pos: { x: 360, y: 100 }, radius: 50 },
  nadeln: [],
  zonen: [],
  tempo: { blaskraft: 620, daempfung: 1.6, zeitlimit: 0 },
});

const DUESE_Y = 1280 - DUESE_HOEHE;

test('gleiche Eingaben ergeben denselben Lauf (Determinismus)', () => {
  // Ohne das ist der Endlos-Seed wertlos: Zwei Geraete spielten verschiedene
  // Laeufe, und ein Bestenlisten-Eintrag waere nicht nachvollziehbar.
  const lauf = () => {
    const w = neueWelt(testLevel());
    for (let i = 0; i < 600; i++) {
      w.geblaese.an = i % 90 < 60;
      w.geblaese.x = i < 300 ? 320 : 420;
      schritt(w);
    }
    return w.ballon.pos;
  };
  const a = lauf();
  const b = lauf();
  assert.equal(a.x, b.x);
  assert.equal(a.y, b.y);
});

test('ohne Geblaese sinkt der Ballon — langsam', () => {
  // Er sinkt, damit das Geblaese eine echte Aufgabe hat. Aber gemaechlich:
  // Es muss Zeit bleiben, den naechsten Zug zu denken.
  const w = neueWelt(testLevel());
  const start = w.ballon.pos.y;
  for (let i = 0; i < 120; i++) schritt(w);
  const gesunken = w.ballon.pos.y - start;
  assert.ok(gesunken > 2, `sinkt gar nicht (${gesunken.toFixed(1)} px/s)`);
  assert.ok(gesunken < 80, `faellt wie ein Stein (${gesunken.toFixed(1)} px/s)`);
});

test('der Ballon sinkt nie unter die Duese — sonst ist das Spiel tot', () => {
  // ⚠ Der wichtigste Test hier. Ein Geblaese blaest nur nach oben; laege der
  // Ballon unterhalb der Duese, erreichte ihn nie wieder ein Strahl. Der Lauf
  // wuerde auch nicht enden, weil nichts platzt — man saehe nur noch zu.
  const w = neueWelt(testLevel());
  w.geblaese.an = false;
  for (let i = 0; i < 120 * 20; i++) schritt(w);   // 20 s fallen lassen
  const boden = bodenHoehe(w.level.groesse.hoehe);
  assert.ok(w.ballon.pos.y <= boden + 0.001, `Ballon liegt bei ${w.ballon.pos.y.toFixed(0)}, unter dem Boden ${boden}`);
  // Und von dort muss der Strahl ihn wieder aufnehmen koennen.
  const kraft = strahlKraft(w.geblaese.x, DUESE_Y, w.ballon.pos, 620, 1, 1280);
  assert.ok(kraft.y < 0, 'vom Boden aus hebt der Strahl den Ballon nicht mehr an');
});

test('der Strahl saugt nicht: unterhalb der Duese wirkt nichts', () => {
  const unten = strahlKraft(360, DUESE_Y, { x: 360, y: DUESE_Y + 50 }, 620, 1, 1280);
  assert.equal(unten.x, 0);
  assert.equal(unten.y, 0);
});

test('ausserhalb des Kegels wirkt nichts, innerhalb hebt es', () => {
  const hoch = 300;                       // Hoehe ueber der Duese
  const y = DUESE_Y - hoch;
  const drin = strahlKraft(360, DUESE_Y, { x: 360, y }, 620, 1, 1280);
  assert.ok(drin.y < 0, 'mittig im Strahl wird nicht gehoben');

  // Kegelradius = 34 + 300 * 0.38 = 148. Weit daneben darf nichts tun.
  const draussen = strahlKraft(360, DUESE_Y, { x: 360 + 200, y }, 620, 1, 1280);
  assert.equal(draussen.x, 0);
  assert.equal(draussen.y, 0);
});

test('der Strahlrand drueckt zur Seite WEG — das ist die Seitensteuerung', () => {
  // ⚠ Hier vertut man sich leicht im Vorzeichen: Steht der Ballon RECHTS vom
  // Geblaese, muss er weiter nach RECHTS gedrueckt werden. Waere es umgekehrt,
  // zoege der Strahl ihn in seine Mitte und das Spiel waere unsteuerbar.
  const y = DUESE_Y - 300;
  const rechts = strahlKraft(360, DUESE_Y, { x: 360 + 100, y }, 620, 1, 1280);
  const links = strahlKraft(360, DUESE_Y, { x: 360 - 100, y }, 620, 1, 1280);
  assert.ok(rechts.x > 0, 'Ballon rechts vom Strahl wird nicht nach rechts gedrueckt');
  assert.ok(links.x < 0, 'Ballon links vom Strahl wird nicht nach links gedrueckt');
  // Genau mittig: kein Seitenschub, sonst driftete er ohne Zutun ab.
  assert.equal(strahlKraft(360, DUESE_Y, { x: 360, y }, 620, 1, 1280).x, 0);
});

test('nah an der Duese traegt es kraeftiger als weit oben', () => {
  // Daraus entsteht das Schwierigkeitsgefaelle: unten fein, oben grob.
  const nah = strahlKraft(360, DUESE_Y, { x: 360, y: DUESE_Y - 100 }, 620, 1, 1280);
  const fern = strahlKraft(360, DUESE_Y, { x: 360, y: 100 }, 620, 1, 1280);
  assert.ok(Math.abs(nah.y) > Math.abs(fern.y) * 1.8, 'die Hoehe macht kaum einen Unterschied');
  assert.ok(Math.abs(fern.y) > 0, 'ganz oben traegt der Strahl gar nicht mehr');
});

test('nach dem Loslassen treibt der Ballon nach', () => {
  // Das Nachtreiben IST das Spiel. Wer es wegoptimiert, baut ein anderes.
  const w = neueWelt(testLevel());
  w.geblaese.an = true;
  for (let i = 0; i < 90; i++) schritt(w);
  const beimLoslassen = w.ballon.pos.y;
  w.geblaese.an = false;
  for (let i = 0; i < 20; i++) schritt(w);
  assert.ok(
    w.ballon.pos.y < beimLoslassen - 5,
    'der Ballon bleibt beim Loslassen sofort stehen — Traegheit ist weg',
  );
});

test('eine duenne Nadel wird auch bei hohem Tempo getroffen (kein Tunneling)', () => {
  // Der teuerste Fehler in so einem Spiel: Bei hohem Tempo springt der Ballon
  // in einem Schritt ueber die Nadel und ueberlebt sie zufaellig. Geprueft wird
  // deshalb der WEG, nicht die Endposition.
  const vorher = { x: 100, y: 100 };
  const jetzt = { x: 100, y: 400 };
  const nadel = { von: { x: 0, y: 250 }, bis: { x: 200, y: 250 } };
  assert.ok(
    streckeTrifftNadel(vorher, jetzt, 26, nadel.von, nadel.bis),
    'Ballon ist durch die Nadel hindurchgeflogen',
  );
  const daneben = { von: { x: 400, y: 250 }, bis: { x: 600, y: 250 } };
  assert.ok(!streckeTrifftNadel(vorher, jetzt, 26, daneben.von, daneben.bis));
});

test('das Zeitlimit beendet den Lauf', () => {
  const level = { ...testLevel(), tempo: { blaskraft: 620, daempfung: 1.6, zeitlimit: 1 } };
  const w = neueWelt(level);
  for (let i = 0; i < 200 && w.ausgang === 'laeuft'; i++) schritt(w);
  assert.equal(w.ausgang, 'zeit-aus');
  assert.ok(Math.abs(w.zeit - 1) < DT * 2);
});

test('Grundwind treibt den Ballon zur Seite', () => {
  // Auf Strecken traegt der Grundwind den Ballon nach rechts. Ohne ihn muesste
  // man ihn ueber den Strahlrand dorthinschieben — bei 2400 px waere das eine
  // halbe Minute Seitwaertsschieben.
  const level: Level = { ...testLevel(), art: 'strecke', grundwind: { x: 210, y: 0 } };
  const w = neueWelt(level);
  const start = w.ballon.pos.x;
  for (let i = 0; i < 120 * 2; i++) schritt(w);
  const gewandert = w.ballon.pos.x - start;
  assert.ok(gewandert > 60, `treibt kaum (${gewandert.toFixed(0)} px in 2 s)`);
  assert.ok(gewandert < 600, `wird fortgerissen (${gewandert.toFixed(0)} px in 2 s)`);
});

test('ohne Grundwind treibt nichts zur Seite', () => {
  const w = neueWelt(testLevel());
  const start = w.ballon.pos.x;
  for (let i = 0; i < 240; i++) schritt(w);
  assert.equal(w.ballon.pos.x, start);
});

test('derselbe Seed ergibt dieselbe Zufallsfolge', () => {
  const a = mulberry32(saat('loonpop-7'));
  const b = mulberry32(saat('loonpop-7'));
  for (let i = 0; i < 50; i++) assert.equal(a(), b());
  const c = mulberry32(saat('loonpop-8'));
  assert.notEqual(mulberry32(saat('loonpop-7'))(), c());
});
