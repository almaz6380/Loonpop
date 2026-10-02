// Die Store-Texte (store-assets/texte/, erzeugt von scripts/store-texte.py)
// halten die Grenzen beider Stores ein. Zu lange Felder lehnt die Konsole erst
// beim Einfuegen ab — dann sitzt man mit dem Handy davor und kuerzt von Hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

import { SPRACHEN } from './sprache.ts';

const ordner = new URL('../../store-assets/texte/', import.meta.url);
const GRENZEN = {
  play: { title: 30, shortDescription: 80, fullDescription: 4000 },
  appstore: { name: 30, subtitle: 30, keywords: 100, promotionalText: 170, description: 4000 },
} as const;

test('fuer jede Spielsprache gibt es Store-Texte', () => {
  const da = readdirSync(ordner).filter((d) => d.endsWith('.json')).map((d) => d.slice(0, -5)).sort();
  assert.deepEqual(da, SPRACHEN.map((s) => s.code).sort());
});

for (const { code } of SPRACHEN) {
  test(`${code}: Store-Texte innerhalb der Grenzen`, () => {
    const t = JSON.parse(readFileSync(new URL(`${code}.json`, ordner), 'utf8'));
    for (const [store, felder] of Object.entries(GRENZEN)) {
      for (const [feld, max] of Object.entries(felder)) {
        const wert = t[store][feld] as string;
        assert.ok(wert && wert.trim().length > 0, `${store}.${feld} fehlt`);
        assert.ok([...wert].length <= max, `${store}.${feld}: ${[...wert].length} > ${max}`);
      }
    }
    // Apple trennt Stichworte nur am Komma; Leerzeichen danach kosten Zeichen.
    assert.ok(!/,\s/.test(t.appstore.keywords), 'Stichworte ohne Leerzeichen nach dem Komma');
  });
}
