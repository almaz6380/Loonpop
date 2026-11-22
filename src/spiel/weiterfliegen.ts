// „Weiterfliegen“ nach dem Platzen (Version 1.1, 22.11.2026).
//
// Wer ein freiwilliges Werbevideo ansieht, darf einen geplatzten Lauf einmal
// fortsetzen. Der Spielkern weiss davon nichts ausser dem, was hier steht: Der
// Ballon kehrt an die Stelle kurz vor dem Platzen zurueck, steht still und ist
// eine Sekunde lang unverwundbar.
//
// ⚠ Regel 3: kein Browser, kein React. Ob das Video lief, entscheidet die
// Spielseite. Hier geht es nur um den Zustand der Welt.
//
// ⚠ Die Zeit laeuft einfach weiter. Nadeln werden aus `welt.zeit` gerechnet
// (nadelJetzt), nie fortgeschrieben — zurueckgedreht wird deshalb nichts, und
// der Lauf bleibt nachspielbar: Dieselben Eingaben plus „hier weiterfliegen“
// ergeben auf jedem Geraet dieselbe Flugbahn.

import type { Welt } from './typen.ts';

/** So lange (Spielsekunden) kann der Ballon nach dem Weiterfliegen nicht platzen. */
export const SCHUTZZEIT = 1;

/** Darf dieser Lauf noch weiterfliegen? Nur nach dem Platzen und nur einmal. */
export const kannWeiterfliegen = (welt: Welt) =>
  welt.ausgang === 'geplatzt' && !welt.weitergeflogen;

/**
 * Setzt einen geplatzten Lauf fort. Gibt `false` zurueck (und aendert nichts),
 * wenn das nicht geht: nicht geplatzt, oder schon einmal weitergeflogen.
 *
 * „Kurz vor dem Platzen“ ist `ballon.vorher`: die Position VOR dem Schritt, in
 * dem die Nadel getroffen wurde. Der Weg dorthin war noch frei (die
 * Kollisionspruefung laeuft ueber den Weg, siehe physik.ts).
 */
export function weiterfliegen(welt: Welt): boolean {
  if (!kannWeiterfliegen(welt)) return false;
  const { ballon } = welt;
  ballon.pos = { ...ballon.vorher };
  ballon.vorher = { ...ballon.pos };
  ballon.geschw = { x: 0, y: 0 };
  welt.ausgang = 'laeuft';
  welt.nachher = 0;
  welt.weitergeflogen = true;
  welt.unverwundbarBis = welt.zeit + SCHUTZZEIT;
  return true;
}

/** Ist der Ballon gerade geschuetzt? (Physik: keine Nadelpruefung; Zeichnen: blinken) */
export const unverwundbar = (welt: Welt) =>
  welt.unverwundbarBis !== undefined && welt.zeit < welt.unverwundbarBis;
