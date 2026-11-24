import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sterneFuer } from './sterne.ts';
import { schritt } from './physik.ts';
import { neueWelt } from './welt.ts';
import { readFileSync, readdirSync } from 'node:fs';
import type { Level } from './typen.ts';

const basis: Level = {
  id: 99, name: 't', art: 'hoch', groesse: { breite: 720, hoehe: 1280 },
  start: { x: 360, y: 900 }, geblaeseStart: 360, ziel: { pos: { x: 360, y: 100 }, radius: 40 },
  nadeln: [], zonen: [], tempo: { blaskraft: 700, daempfung: 1.5, zeitlimit: 0 },
  muenzen: [{ x: 360, y: 905 }, { x: 100, y: 100 }], sterneZeit: 10,
};

test('Muenze unter dem Ballon wird eingesammelt, entfernte nicht', () => {
  const w = neueWelt(basis);
  schritt(w);
  assert.deepEqual(w.gesammelt, [0]);
});

test('Sterne: 1 fuers Ziel, +1 Zeit, +1 alle Muenzen', () => {
  const w = neueWelt(basis);
  w.ausgang = 'geschafft'; w.zeit = 20;
  assert.equal(sterneFuer(w), 1);
  w.zeit = 8;
  assert.equal(sterneFuer(w), 2);
  w.gesammelt = [0, 1];
  assert.equal(sterneFuer(w), 3);
  w.ausgang = 'geplatzt';
  assert.equal(sterneFuer(w), 0);
});

test('jedes Hoch-Level hat drei Muenzen und eine Sternzeit', () => {
  const ordner = new URL('./level/', import.meta.url);
  for (const d of readdirSync(ordner).filter((d) => d.endsWith('.json'))) {
    const l = JSON.parse(readFileSync(new URL(d, ordner), 'utf8')) as Level;
    if (l.art !== 'hoch') continue;
    assert.equal(l.muenzen?.length, 3, `Level ${l.id}`);
    assert.ok((l.sterneZeit ?? 0) > 5, `Level ${l.id}`);
  }
});
