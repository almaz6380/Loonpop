// Wie die Kamera dem Ballon nachzieht — als reine Rechnung, damit sie ohne
// Browser testbar ist (zeichnen.ts laedt beim Import Bilder).
//
// ⚠ Bis zum 03.10.2026 zog die Kamera je BILD einen festen Anteil nach (0,25
// bzw. 0,12). Kamen die Bilder ungleichmaessig, hinkte sie mal mehr, mal weniger
// hinterher — und weil der Ballon zwischen zwei Physikschritten zeitgenau
// gezeichnet wird, sah es aus, als springe er. Jetzt haengt das Nachziehen an
// der vergangenen ZEIT, nicht an der Zahl der Bilder.

/** Nachziehtempo (1/s). Bei 60 Bildern je Sekunde dasselbe wie frueher je Bild. */
export const KAMERA_TEMPO = {
  /** Endlos nach oben: frueher 0,25 je Bild. */
  hoch: -60 * Math.log(1 - 0.25),
  /** Strecken: frueher 0,12 je Bild. */
  strecke: -60 * Math.log(1 - 0.12),
};

/**
 * Einen Wert in `dt` Sekunden ein Stueck auf `ziel` zu bewegen. Zwei Schritte
 * zu je 8 ms enden genau dort, wo einer mit 16 ms endet.
 */
export function glaetten(jetzt: number, ziel: number, dt: number, tempo: number): number {
  return jetzt + (ziel - jetzt) * (1 - Math.exp(-Math.max(0, dt) * tempo));
}
