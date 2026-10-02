// Wie der Ballon im Bild liegt: Neigung, Dehnung, wo der Knoten sitzt.
//
// Eigene Datei, weil zeichnen.ts beim Laden ein Bild anlegt und sich deshalb
// nicht ohne Browser testen laesst. Das hier ist reine Geometrie.
//
// ⚠ Bis zum 02.10.2026 drehte sich der Ballon voll in Flugrichtung. Beim
// Sinken stand er auf dem Kopf, der Knoten zeigte nach oben, und die Schnur
// hing trotzdem unten. Schnur und Knoten passten nie zusammen, sobald er sich
// bewegte. Jetzt neigt er sich nur, und die Schnur beginnt am Knoten.

import type { Punkt } from './typen.ts';

/** Staerkste Neigung (rad), rund 25°. Mehr sieht aus wie Umkippen. */
export const NEIGUNG_MAX = 0.44;
/** Wie stark seitliches Tempo neigt (rad je px/s). */
const NEIGUNG_JE_TEMPO = 0.0035;
/** Wie weit der Knoten unter dem Rand der Haut sitzt (px). */
export const KNOTEN = 8;

/**
 * Breite zu Hoehe des Ballonbilds (public/bilder/ballon.png), von der
 * Oberkante bis zur Knotenspitze. Gemessen von scripts/bilder-freistellen.py.
 * ⚠ Neues Bild → neu messen, sonst wird der Ballon verzerrt gezeichnet.
 */
export const BALLON_BILD_SEITEN = 0.7527;

export type Ballonform = {
  /** Drehung im Uhrzeigersinn (rad). Positiv = Knoten schwingt nach links. */
  neigung: number;
  /** Streckung entlang der Ballonachse, 1 = rund. */
  dehnung: number;
  /** Spitze des Knotens in Levelkoordinaten — dort haengt die Schnur. */
  knoten: Punkt;
};

export function ballonform(pos: Punkt, geschw: Punkt, radius: number): Ballonform {
  // Der Knoten haengt der Bewegung hinterher: Faehrt der Ballon nach rechts,
  // schwingt er nach links. Nur das seitliche Tempo zaehlt — rauf und runter
  // bleibt er aufrecht.
  const neigung = Math.max(-NEIGUNG_MAX, Math.min(NEIGUNG_MAX, geschw.x * NEIGUNG_JE_TEMPO));
  // In der Bewegung leicht gestreckt. Ein starrer Kreis wirkt tot; zu viel
  // Verformung sieht nach Gummiball aus. 12 % bei vollem Tempo reichen.
  const dehnung = 1 + Math.min(0.12, Math.hypot(geschw.x, geschw.y) / 3200);
  const abstand = (radius + KNOTEN) * dehnung;
  return {
    neigung,
    dehnung,
    knoten: { x: pos.x - Math.sin(neigung) * abstand, y: pos.y + Math.cos(neigung) * abstand },
  };
}
