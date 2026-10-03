// Jedes Level muss die Pruefung bestehen — und die Pruefung muss selbst etwas
// taugen. ⚠ Die erste Streckenpruefung meldete "schaffbar", weil sie nur die
// Nadeln untereinander ansah, nicht den Start. Deshalb wird sie hier auch mit
// Leveln gefuettert, die durchfallen MUESSEN.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

import { pruefeLevel } from './pruefung.ts';
import { reihe, spalte, wandernd } from './nadelfeld.ts';
import { schritt } from './physik.ts';
import * as physik from './physik.ts';
import { neueWelt } from './welt.ts';
import type { Level, Nadel } from './typen.ts';

const ordner = new URL('./level/', import.meta.url);
const dateien = readdirSync(ordner).filter((d) => d.endsWith('.json')).sort();
const alle = dateien.map((d) => JSON.parse(readFileSync(new URL(d, ordner), 'utf8')) as Level);

test('jede Level-Datei steht auch in level/index.ts', () => {
  // Sonst liegt ein geprueftes Level im Ordner, das niemand spielen kann.
  const index = readFileSync(new URL('index.ts', ordner), 'utf8');
  for (const d of dateien) assert.ok(index.includes(`'./${d}'`), `${d} fehlt in level/index.ts`);
});

test('die Level sind fortlaufend nummeriert', () => {
  alle.forEach((l, i) => assert.equal(l.id, i + 1, `${dateien[i]} hat id ${l.id}`));
});

for (const level of alle) {
  test(`Level ${level.id} „${level.name}“ ist fair`, () => {
    const b = pruefeLevel(level);
    assert.deepEqual(b.maengel, []);
  });
}

// --- Die Pruefung selbst ---------------------------------------------------

const probe = (nadeln: Nadel[], start = { x: 360, y: 1052 }): Level => ({
  id: 0, name: 'Probe', art: 'hoch',
  groesse: { breite: 720, hoehe: 1280 },
  start, geblaeseStart: start.x,
  ziel: { pos: { x: 600, y: 140 }, radius: 60 },
  nadeln, zonen: [],
  tempo: { blaskraft: 560, daempfung: 1.5, zeitlimit: 0 },
});

test('eine dichte Nadelreihe ueber die ganze Breite ist unschaffbar', () => {
  const b = pruefeLevel(probe(reihe(600, 0, 720)));
  assert.equal(b.schaffbar, false);
});

test('eine Reihe mit Luecke ist schaffbar', () => {
  const b = pruefeLevel(probe([...reihe(600, 0, 280), ...reihe(600, 490, 720)]));
  assert.equal(b.schaffbar, true);
});

test('ein Level, das man mit stillem Halten schafft, faellt durch', () => {
  // Start, Luecke und Ziel auf einer Linie — wie Level 1 in der ersten Fassung.
  const l = probe([], { x: 600, y: 1052 });
  const b = pruefeLevel(l);
  assert.equal(b.nurHalten, true);
  assert.ok(b.maengel.length > 0);
});

test('eine Nadel direkt ueber dem Start faellt durch', () => {
  const b = pruefeLevel(probe([...reihe(990, 290, 430), ...reihe(500, 0, 420)]));
  assert.ok(b.maengel.some((m) => m.includes('ueber dem Start')), b.maengel.join('; '));
});

test('eine Strecke, deren Start auf der ersten Nadel liegt, faellt durch', () => {
  const l: Level = {
    ...probe(spalte(900, 0, 480), { x: 200, y: 376 }), art: 'strecke',
    groesse: { breite: 2000, hoehe: 1280 },
    ziel: { pos: { x: 1860, y: 376 }, radius: 70 },
    grundwind: { x: 210, y: 0 },
    tempo: { blaskraft: 760, daempfung: 1.5, zeitlimit: 0 },
  };
  const b = pruefeLevel(l);
  assert.equal(b.startFrei, false);
});

test('eine zu schnell taktende fallende Nadel faellt durch', () => {
  const l = probe([{ von: { x: 500, y: 0 }, bis: { x: 500, y: 150 }, faellt: { takt: 0.5, versatz: 0 } }]);
  assert.ok(pruefeLevel(l).fallFenster < 0.6);
});

test('durch eine Nadelreihe schluepft der Ballon nirgends hindurch', () => {
  // ⚠ Bis zum 01.10.2026 standen die Nadeln einer Reihe 70 px auseinander —
  // breiter als der Ballon. Genau unter eine Luecke gehalten, stieg er durch
  // und kam an. Hier wird jede Stelle der Reihe mit stillem Halten probiert.
  const nadeln = reihe(600, 0, 720);
  for (let x = 30; x <= 690; x += 3) {
    const w = neueWelt({ ...probe(nadeln, { x, y: 1052 }), ziel: { pos: { x, y: 140 }, radius: 60 } });
    w.geblaese.an = true;
    for (let i = 0; i < 120 * 15 && w.ausgang === 'laeuft'; i++) schritt(w);
    assert.equal(w.ausgang, 'geplatzt', `bei x = ${x} durchgekommen`);
  }
});

test('durch eine Nadelspalte schluepft der Ballon nirgends hindurch', () => {
  const nadeln = spalte(500, 0, 1280);
  for (let y = 300; y <= 1100; y += 5) {
    const w = neueWelt({
      ...probe(nadeln, { x: 300, y }), art: 'strecke', grundwind: { x: 400, y: 0 },
      groesse: { breite: 900, hoehe: 1280 }, ziel: { pos: { x: 800, y }, radius: 40 },
      tempo: { blaskraft: 0, daempfung: 1.5, zeitlimit: 0 },
    });
    for (let i = 0; i < 120 * 5 && w.ausgang === 'laeuft'; i++) schritt(w);
    assert.equal(w.ausgang, 'geplatzt', `bei y = ${y} durchgekommen`);
  }
});

test('eine Pendelnadel in der Luecke sperrt sie nicht — man kann warten', () => {
  // ⚠ Die erste Fassung sperrte die ganze ueberstrichene Flaeche. Dann machte
  // jede Pendelnadel ihre Luecke zu, obwohl man in der Luft warten kann.
  const pendel: Nadel = { von: { x: 290, y: 450 }, bis: { x: 290, y: 510 }, pendel: { weg: { x: 200, y: 0 }, dauer: 3.6 } };
  const b = pruefeLevel(probe([...reihe(600, 0, 280), ...reihe(600, 490, 720), pendel]));
  assert.equal(b.schaffbar, true);
});

test('eine Pendelnadel, die nie lange genug wegbleibt, sperrt', () => {
  // Fuenf schnelle Pendel nebeneinander, jedes ueber eine kurze Strecke: Jede
  // Stelle der Luecke ist hoechstens Sekundenbruchteile frei.
  const pendel: Nadel[] = [290, 330, 370, 410, 450].map((x) => ({
    von: { x, y: 450 }, bis: { x, y: 510 }, pendel: { weg: { x: 40, y: 0 }, dauer: 0.4 },
  }));
  const b = pruefeLevel(probe([...reihe(480, 0, 280), ...reihe(480, 490, 720), ...pendel]));
  assert.equal(b.schaffbar, false);
});

test('eine wandernde Reihe mit Luecke ist schaffbar', () => {
  const b = pruefeLevel(probe([...reihe(850, 0, 250), ...reihe(850, 470, 720), ...wandernd(500, 120, 330, 260, 4)]));
  assert.equal(b.schaffbar, true);
});

test('eine wandernde Reihe ohne Luecke sperrt, auch wenn jede Nadel einzeln vorbeizieht', () => {
  // ⚠ Bis zum 02.10.2026 wurde jede bewegte Nadel fuer sich geprueft. Unter
  // einer fahrenden Reihe ist jede Stelle von jeder EINZELNEN Nadel meist frei,
  // also galt die Reihe als offen, obwohl sie nie eine Luecke hat.
  const b = pruefeLevel(probe([...reihe(850, 0, 250), ...reihe(850, 470, 720), ...wandernd(500, 300, 300, 200, 4)]));
  assert.equal(b.schaffbar, false);
});

test('eine wandernde Reihe hat am Rand nie ein Loch', () => {
  // Faehrt sie nach rechts, muss sie links ueber den Rand hinausreichen.
  const { nadelJetzt } = physik;
  for (const weg of [240, -240]) {
    const n = wandernd(500, 300, 420, weg, 4);
    for (let t = 0; t < 4; t += 0.25) {
      const xs = n.map((x) => nadelJetzt(x, t).von.x).sort((a, b) => a - b);
      assert.ok(xs[0] <= 0 && xs[xs.length - 1] >= 720, `weg ${weg}, t ${t}`);
    }
  }
});
