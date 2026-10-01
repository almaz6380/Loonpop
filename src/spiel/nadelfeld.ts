// Nadelfelder aus Einzelnadeln. Ein Level bleibt reines JSON — das hier
// erzeugt nur die langen Listen darin (siehe scripts/nadelfeld.ts).
//
// ⚠ Zwei Richtungen, zwei Regeln — verwechselt am 01.10.2026 aufgefallen:
//
//   SPALTE: Die Nadeln liegen HINTEREINANDER auf einer Linie. Dann muss jede
//   kuerzer sein als ihr Abstand (60 lang, 70 Abstand), sonst verschmelzen sie
//   optisch zum Balken. Die 10 px Luecke ist fuer den 52 px breiten Ballon dicht.
//
//   REIHE: Die Nadeln stehen NEBENEINANDER, jede senkrecht. Dann zaehlt der
//   Abstand quer — und der muss KLEINER als der Ballondurchmesser sein. Mit
//   70 px passte der Ballon mit je 9 px Luft dazwischen durch; die Reihen der
//   Level 1–3 waren damit gar nicht dicht.

import type { Nadel } from './typen.ts';
import { BALLON_RADIUS } from './welt.ts';

export const NADEL_LAENGE = 60;
/** Abstand hintereinanderliegender Nadeln in einer Spalte. */
export const SPALTEN_TAKT = 70;
/** Groesster Abstand nebeneinanderstehender Nadeln — knapp unter dem Durchmesser. */
export const REIHEN_TAKT_MAX = 2 * BALLON_RADIUS - 4;

/** Senkrechte Nadeln hintereinander von `vonY` bis `bisY` (Spitze unten). */
export function spalte(x: number, vonY: number, bisY: number): Nadel[] {
  const n: Nadel[] = [];
  for (let y = vonY; y + NADEL_LAENGE <= bisY + 0.5; y += SPALTEN_TAKT) {
    n.push({ von: { x, y }, bis: { x, y: y + NADEL_LAENGE } });
  }
  return n;
}

/**
 * Senkrechte Nadeln nebeneinander von `vonX` bis `bisX`, beide Enden besetzt.
 * Der Abstand wird so gewaehlt, dass er gleichmaessig aufgeht und nie ueber
 * REIHEN_TAKT_MAX liegt — die Raender der Luecken bleiben, wo sie geplant sind.
 */
export function reihe(y: number, vonX: number, bisX: number): Nadel[] {
  const breite = bisX - vonX;
  const teile = Math.max(1, Math.ceil(breite / REIHEN_TAKT_MAX));
  const n: Nadel[] = [];
  for (let i = 0; i <= (breite === 0 ? 0 : teile); i++) {
    const x = Math.round(vonX + (breite * i) / teile);
    n.push({ von: { x, y }, bis: { x, y: y + NADEL_LAENGE } });
  }
  return n;
}
