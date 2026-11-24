// Weiterfliegen nach dem Platzen (Version 1.1): einmal, an der Stelle vor dem
// Platzen, stillstehend, eine Sekunde geschuetzt — und weiter deterministisch.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DT, schritt } from './physik.ts';
import { neueWelt } from './welt.ts';
import { kannWeiterfliegen, SCHUTZZEIT, unverwundbar, weiterfliegen } from './weiterfliegen.ts';
import type { Level, Welt } from './typen.ts';

// Eine waagerechte Nadel knapp ueber dem Start: Der Ballon steigt mit vollem
// Geblaese hinein und platzt.
const level = (): Level => ({
  id: 0,
  name: 'Pruefstand',
  art: 'hoch',
  groesse: { breite: 720, hoehe: 1280 },
  start: { x: 360, y: 1050 },
  geblaeseStart: 360,
  // Ziel unerreichbar: Hier geht es nur ums Platzen.
  ziel: { pos: { x: 360, y: -5000 }, radius: 40 },
  nadeln: [{ von: { x: 200, y: 800 }, bis: { x: 520, y: 800 } }],
  zonen: [],
  tempo: { blaskraft: 620, daempfung: 1.6, zeitlimit: 0 },
});

function bisGeplatzt(w: Welt) {
  w.geblaese.an = true;
  for (let i = 0; i < 120 * 20 && w.ausgang === 'laeuft'; i++) schritt(w);
  assert.equal(w.ausgang, 'geplatzt');
}

test('weiterfliegen setzt an der Stelle vor dem Platzen fort, ohne Tempo', () => {
  const w = neueWelt(level());
  bisGeplatzt(w);
  const vorher = { ...w.ballon.vorher };
  const zeit = w.zeit;
  assert.ok(kannWeiterfliegen(w));
  assert.equal(weiterfliegen(w), true);
  assert.equal(w.ausgang, 'laeuft');
  assert.deepEqual(w.ballon.pos, vorher);
  assert.deepEqual(w.ballon.geschw, { x: 0, y: 0 });
  assert.equal(w.nachher, 0);
  assert.equal(w.zeit, zeit, 'die Zeit wird nicht zurueckgedreht');
  assert.ok(unverwundbar(w));
});

test('eine Sekunde lang platzt der Ballon nicht, danach wieder', () => {
  const w = neueWelt(level());
  bisGeplatzt(w);
  weiterfliegen(w);
  w.geblaese.an = false;
  // Den Ballon mitten auf die Nadel setzen: geschuetzt kein Platzen.
  const aufNadel = () => { w.ballon.pos = { x: 360, y: 790 }; w.ballon.vorher = { x: 360, y: 810 }; };
  for (let i = 0; i < Math.floor(SCHUTZZEIT / DT) - 1; i++) {
    aufNadel();
    schritt(w);
    assert.equal(w.ausgang, 'laeuft', `Schritt ${i}`);
  }
  for (let i = 0; i < 3; i++) schritt(w);
  assert.ok(!unverwundbar(w));
  aufNadel();
  schritt(w);
  assert.equal(w.ausgang, 'geplatzt');
});

test('nur einmal je Versuch', () => {
  const w = neueWelt(level());
  bisGeplatzt(w);
  assert.equal(weiterfliegen(w), true);
  // Waehrend des Schutzes sinken lassen, dann wieder in die Nadel blasen.
  w.geblaese.an = false;
  for (let i = 0; i < Math.ceil(SCHUTZZEIT / DT) + 1; i++) schritt(w);
  w.geblaese.an = true;
  for (let i = 0; i < 120 * 20 && w.ausgang === 'laeuft'; i++) schritt(w);
  assert.equal(w.ausgang, 'geplatzt');
  assert.equal(kannWeiterfliegen(w), false);
  const pos = { ...w.ballon.pos };
  assert.equal(weiterfliegen(w), false);
  assert.equal(w.ausgang, 'geplatzt');
  assert.deepEqual(w.ballon.pos, pos);
});

test('nicht nach dem Ankommen oder ohne Ende', () => {
  const w = neueWelt(level());
  assert.equal(weiterfliegen(w), false);
  w.ausgang = 'geschafft';
  assert.equal(weiterfliegen(w), false);
  w.ausgang = 'zeit-aus';
  assert.equal(weiterfliegen(w), false);
});

test('Weiterfliegen bleibt deterministisch', () => {
  const lauf = () => {
    const w = neueWelt(level());
    bisGeplatzt(w);
    weiterfliegen(w);
    for (let i = 0; i < 300; i++) {
      w.geblaese.an = i % 50 < 20;
      w.geblaese.x = 300 + (i % 7) * 10;
      schritt(w);
    }
    return JSON.stringify([w.ballon, w.zeit, w.ausgang]);
  };
  assert.equal(lauf(), lauf());
});
