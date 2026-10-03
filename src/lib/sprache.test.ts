// Jede Sprache muss vollstaendig sein. Fehlt ein Schluessel, faellt i18next
// stumm auf Englisch zurueck — mitten in einem arabischen Menue stuende dann
// ein englisches Wort, und keiner merkt es vor dem Store-Review.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

import { SPRACHEN, waehleSprache, istRtl } from './sprache.ts';

type Baum = { [k: string]: string | Baum };
const ordner = new URL('../i18n/locales/', import.meta.url);
const lade = (code: string) => JSON.parse(readFileSync(new URL(`${code}.json`, ordner), 'utf8')) as Baum;

function blaetter(b: Baum, vor = ''): Map<string, string> {
  const m = new Map<string, string>();
  for (const [k, v] of Object.entries(b)) {
    if (typeof v === 'string') m.set(vor + k, v);
    else for (const [kk, vv] of blaetter(v, `${vor}${k}.`)) m.set(kk, vv);
  }
  return m;
}
const platzhalter = (s: string) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((x) => x[1]).sort().join(',');

test('fuer jede Sprache gibt es genau eine Datei', () => {
  const dateien = readdirSync(ordner).filter((d) => d.endsWith('.json')).map((d) => d.slice(0, -5)).sort();
  assert.deepEqual(dateien, SPRACHEN.map((s) => s.code).sort());
});

const deutsch = blaetter(lade('de'));
for (const { code } of SPRACHEN) {
  test(`${code}: alle Schluessel, gleiche Platzhalter, nichts leer`, () => {
    const t = blaetter(lade(code));
    assert.deepEqual([...t.keys()].sort(), [...deutsch.keys()].sort());
    for (const [k, v] of deutsch) {
      assert.equal(platzhalter(t.get(k)!), platzhalter(v), `${code} ${k}`);
      assert.ok(t.get(k)!.trim().length > 0, `${code} ${k} ist leer`);
    }
  });
}

test('jedes spielbare Level hat einen Namen in jeder Sprache', () => {
  const lv = new URL('../spiel/level/', import.meta.url);
  const hoch = readdirSync(lv).filter((d) => d.endsWith('.json'))
    .map((d) => JSON.parse(readFileSync(new URL(d, lv), 'utf8')) as { id: number; art: string })
    .filter((l) => l.art === 'hoch');
  for (const { code } of SPRACHEN) {
    const namen = lade(code).levelname as Baum;
    for (const l of hoch) assert.ok(namen[String(l.id)], `${code}: Level ${l.id} ohne Namen`);
  }
});

test('Sprachwahl: gespeichert vor Geraet, Region egal, sonst Englisch', () => {
  assert.equal(waehleSprache('fr', ['de-AT']), 'fr');
  assert.equal(waehleSprache(null, ['de-AT', 'en']), 'de');
  assert.equal(waehleSprache(null, ['pt-BR']), 'pt');
  assert.equal(waehleSprache(null, ['zh-Hans-CN']), 'zh');
  assert.equal(waehleSprache(null, ['nl-NL', 'ar-EG']), 'ar');
  assert.equal(waehleSprache(null, ['nl-NL']), 'en');
  assert.equal(waehleSprache('xx', []), 'en');
});

test('nur Arabisch liest von rechts', () => {
  assert.deepEqual(SPRACHEN.filter((s) => istRtl(s.code)).map((s) => s.code), ['ar']);
});
