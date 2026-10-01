// Prueft alle Level und zeigt die Zahlen dazu.
//
//   npm run pruefen          alle Level
//   npm run pruefen -- 6     nur Level 6
//
// Dieselben Pruefungen laufen in `npm test` — hier sieht man zusaetzlich,
// WIE knapp ein Level ist, nicht nur ob.

import { readdirSync, readFileSync } from 'node:fs';

import { pruefeLevel, STEIGFLUG_RICHTWERT } from '../src/spiel/pruefung.ts';
import type { Level } from '../src/spiel/typen.ts';

const ordner = new URL('../src/spiel/level/', import.meta.url);
const nur = process.argv[2] ? Number(process.argv[2]) : null;

let fehler = 0;
for (const datei of readdirSync(ordner).filter((d) => d.endsWith('.json')).sort()) {
  const level = JSON.parse(readFileSync(new URL(datei, ordner), 'utf8')) as Level;
  if (nur !== null && level.id !== nur) continue;
  const b = pruefeLevel(level);
  const ok = b.maengel.length === 0;
  if (!ok) fehler++;
  console.log(`${ok ? '✓' : '✗'} ${String(level.id).padStart(2)} ${level.name} (${level.art})`);
  console.log(`     Weg frei: ${b.schaffbar ? 'ja' : 'NEIN'}` +
    `   Steigflug: ${b.steigflug.toFixed(0)} px/s (Richtwert ${STEIGFLUG_RICHTWERT})` +
    `   Vorlauf: ${Number.isFinite(b.vorlauf) ? b.vorlauf.toFixed(0) + ' px' : '–'}` +
    `   Fallfenster: ${Number.isFinite(b.fallFenster) ? b.fallFenster.toFixed(2) + ' s' : '–'}`);
  for (const m of b.maengel) console.log(`     ⚠ ${m}`);
}
process.exit(fehler ? 1 : 0);
