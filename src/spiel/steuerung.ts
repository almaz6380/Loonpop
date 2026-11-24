// Die Steuerung seit der Neugestaltung (23.11.2026): Das Geblaese faehrt dem
// Finger auf einer Schiene hinterher und KIPPT in Fahrtrichtung.
//
// ⚠ Das hebt die alte Regel 1a („das Geblaese laesst sich nicht drehen“) auf —
// Josefs Entscheidung vom 23.11.2026. Grund: Seitlich ging es bisher nur ueber
// den Strahlrand, und das war fuer schnelle Ausweichbewegungen viel zu traege.
// Die alte Idee bleibt erhalten: Wer still steht, blaest senkrecht, und der
// Strahlrand drueckt weiterhin zur Seite.
//
// Wie es sich anfuehlt:
//   - Finger ueber dem Geblaese → gerade nach oben.
//   - Finger dem Geblaese voraus → es faehrt hinterher (hoechstens FAHRT_MAX)
//     und kippt, je weiter der Finger voraus ist, bis NEIGUNG_MAX.
//   - Kurzer Wisch → einmaliger Windstoss zur Seite (mit Abklingzeit).
//
// Reine Rechnung, kein Browser (Regel 3). Die Physik ruft `steuern()` in jedem
// Schritt auf; nur so bleibt ein Lauf aus denselben Eingaben reproduzierbar.

import type { Geblaese } from './typen.ts';

/** Wie schnell das Geblaese hoechstens faehrt (px/s Spielzeit). */
export const FAHRT_MAX = 420;
/** Groesste Neigung (Bogenmass) — 40°. */
export const NEIGUNG_MAX = (40 * Math.PI) / 180;
/** Ab diesem Vorsprung des Fingers (px) ist die Neigung voll. */
export const NEIGUNG_WEG = 200;
/** Wie schnell die Neigung ihrem Ziel folgt (1/s). Weich, aber nicht trage. */
const NEIGUNG_TEMPO = 10;
/** Seitlicher Geschwindigkeitsschub des Windstosses (px/s). */
export const STOSS = 320;
/** Abklingzeit des Windstosses (Spielsekunden). */
export const STOSS_PAUSE = 1.5;
/** Rand, den das Geblaese zur Levelwand haelt (px). */
const RAND = 40;

/**
 * Faehrt das Geblaese einen Schritt `dt` auf sein Ziel zu und stellt die
 * Neigung nach. Ohne `ziel` (Finger weg, Bot, alte Tests) bleibt es stehen
 * und richtet sich wieder auf.
 */
export function steuern(g: Geblaese, dt: number, breite: number): void {
  const neigungJetzt = g.neigung ?? 0;
  let wunsch = 0;
  if (g.ziel !== undefined) {
    const ziel = Math.max(RAND, Math.min(breite - RAND, g.ziel));
    const d = ziel - g.x;
    const weg = Math.max(-FAHRT_MAX * dt, Math.min(FAHRT_MAX * dt, d));
    g.x += weg;
    // Der Vorsprung NACH der Fahrt zaehlt: Holt das Geblaese den Finger ein,
    // richtet es sich auf.
    const vorsprung = g.ziel - g.x;
    wunsch = Math.max(-1, Math.min(1, vorsprung / NEIGUNG_WEG)) * NEIGUNG_MAX;
  }
  g.neigung = neigungJetzt + (wunsch - neigungJetzt) * (1 - Math.exp(-dt * NEIGUNG_TEMPO));
}

/**
 * Ist ein Wisch ein Windstoss? Kurz (unter 250 ms) und schnell (ueber
 * 900 CSS-px/s) seitwaerts. Rein, damit es testbar bleibt.
 */
export function istWisch(dx: number, dauerMs: number): -1 | 0 | 1 {
  if (dauerMs <= 0 || dauerMs > 250) return 0;
  const tempo = Math.abs(dx) / (dauerMs / 1000);
  if (Math.abs(dx) < 40 || tempo < 900) return 0;
  return dx > 0 ? 1 : -1;
}
