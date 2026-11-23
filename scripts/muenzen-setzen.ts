// Setzt je Hoch-Level drei Muenzen auf den kuerzesten freien Weg und eine
// Sternzeit (23.11.2026). Aufruf: node --experimental-strip-types scripts/muenzen-setzen.ts
//
// Die Muenzen liegen auf dem Weg der Wegsuche (pruefung.ts), also garantiert
// erreichbar. Die Sternzeit rechnet mit gemuetlichen 80 px/s entlang des Wegs
// plus 2 s Anlauf — Richtwert, nach Josefs Probespiel nachstellbar.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { wegPunkte } from '../src/spiel/pruefung.ts';
import type { Level } from '../src/spiel/typen.ts';

const ORDNER = 'src/spiel/level';
for (const datei of readdirSync(ORDNER).filter((d) => d.endsWith('.json')).sort()) {
  const pfad = `${ORDNER}/${datei}`;
  const level = JSON.parse(readFileSync(pfad, 'utf8')) as Level;
  if (level.art !== 'hoch') continue;
  const weg = wegPunkte({ ...level, muenzen: undefined });
  if (!weg) { console.log(`${datei}: kein Weg — uebersprungen`); continue; }
  let laenge = 0;
  for (let i = 1; i < weg.length; i++) laenge += Math.hypot(weg[i].x - weg[i - 1].x, weg[i].y - weg[i - 1].y);
  level.muenzen = [0.3, 0.55, 0.8].map((f) => {
    const p = weg[Math.round(f * (weg.length - 1))];
    return { x: Math.round(p.x), y: Math.round(p.y) };
  });
  level.sterneZeit = Math.round(laenge / 80 + 2);
  writeFileSync(pfad, JSON.stringify(level, null, 2) + '\n');
  console.log(`${datei}: Weg ${Math.round(laenge)} px, Sternzeit ${level.sterneZeit} s, Muenzen ${JSON.stringify(level.muenzen)}`);
}
