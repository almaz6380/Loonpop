// Baut die Level der Welten 2–4 (Neugestaltung 23.11.2026).
// Aufruf: node --experimental-strip-types scripts/welten-bauen.ts
//
// Statt 36 Level von Hand zu setzen, schneidet das Skript je Level drei
// Abschnitte aus dem Endlos-Generator (endlosStueck) — derselbe Generator,
// dessen Stuecke `npm test` ohnehin auf Fairness prueft. Die Schwierigkeit
// steigt ueber den Abschnitt-Index (`von`): weiter oben im Endlos-Lauf heisst
// engere Luecken, Pendel- und wandernde Reihen, fallende Nadeln.
// Jedes Stueck muss `pruefeLevel` OHNE Maengel bestehen, sonst wird der
// naechste Seed probiert. Danach drei Muenzen auf den freien Weg und eine
// Sternzeit wie in muenzen-setzen.ts. Deterministisch: gleicher Lauf, gleiche Level.

import { writeFileSync } from 'node:fs';
import { endlosStueck } from '../src/spiel/endlos.ts';
import { pruefeLevel, wegPunkte } from '../src/spiel/pruefung.ts';

const WELTEN = [
  { welt: 2, idBasis: 100, von: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  { welt: 3, idBasis: 200, von: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] },
  { welt: 4, idBasis: 300, von: [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33] },
];

for (const { welt, idBasis, von: liste } of WELTEN) {
  liste.forEach((von, k) => {
    for (let seed = 1000 * welt + k * 37; ; seed++) {
      const l = endlosStueck('hoch', seed, von, 3);
      const b = pruefeLevel(l);
      if (b.maengel.length) continue;
      const weg = wegPunkte(l);
      if (!weg) continue;
      let laenge = 0;
      for (let i = 1; i < weg.length; i++) laenge += Math.hypot(weg[i].x - weg[i - 1].x, weg[i].y - weg[i - 1].y);
      const r = (v: number) => Math.round(v);
      const id = idBasis + k + 1;
      const level = {
        ...l,
        id,
        welt,
        name: `Welt ${welt} · ${k + 1}`,
        groesse: { breite: l.groesse.breite, hoehe: r(l.groesse.hoehe) },
        start: { x: r(l.start.x), y: r(l.start.y) },
        geblaeseStart: r(l.geblaeseStart),
        ziel: { pos: { x: r(l.ziel.pos.x), y: r(l.ziel.pos.y) }, radius: l.ziel.radius },
        muenzen: [0.3, 0.55, 0.8].map((f) => {
          const p = weg[Math.round(f * (weg.length - 1))];
          return { x: r(p.x), y: r(p.y) };
        }),
        sterneZeit: r(laenge / 80 + 2),
      };
      writeFileSync(`src/spiel/level/${id}.json`, JSON.stringify(level, null, 2) + '\n');
      console.log(`${id}: von ${von}, seed ${seed}, Hoehe ${level.groesse.hoehe}, Nadeln ${l.nadeln.length}, Sternzeit ${level.sterneZeit}`);
      break;
    }
  });
}
