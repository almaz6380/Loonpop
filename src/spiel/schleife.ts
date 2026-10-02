// Die Spielschleife: verbindet die feste Physik-Schrittweite mit der
// wechselhaften Bildrate des Geraets.
//
// ⚠ Sie fasst React NICHT an. Waere der Weltzustand React-State, wuerde die
// Oberflaeche 120-mal je Sekunde neu rendern und das Spiel genau dann ruckeln,
// wenn es spannend wird. React bekommt nur das Ende gemeldet (`beiEnde`).

import { DT, schritt } from './physik.ts';
import type { Welt } from './typen.ts';

/**
 * Wie schnell das Spiel ablaeuft: 1,4 Spielsekunden je echter Sekunde.
 *
 * ⚠ Josef fand den Ballon am 02.10.2026 zu traege und alles zu langsam. Statt
 * Schwerkraft, Blaskraft und Daempfung einzeln zu verdrehen, laeuft dieselbe
 * Physik schneller ab. So bleibt jede Pruefung gueltig — Wegsuche, Bot,
 * Zeitfenster der bewegten Nadeln rechnen in Spielzeit — und das Spiel
 * fuehlt sich trotzdem in allem flotter an. Regel 2 bleibt: Es gibt nur
 * eine Physik. Die angezeigte Zeit ist Spielzeit.
 */
export const SPIELTEMPO = 1.4;

export type Schleife = { stopp: () => void };

/**
 * @param welt      wird IN PLACE veraendert
 * @param zeichnen  bekommt den Zwischenstand 0…1 zwischen zwei Physikschritten
 * @param beiEnde   einmalig, sobald der Ausgang feststeht
 */
export function starteSchleife(
  welt: Welt,
  zeichnen: (welt: Welt, blende: number) => void,
  beiEnde: (welt: Welt) => void,
): Schleife {
  let laeuft = true;
  let zuletzt = performance.now();
  let akku = 0;
  let gemeldet = false;

  // ⚠ Obergrenze gegen die "Todesspirale": Kommt die Seite nach einem
  // Tab-Wechsel mit 30 Sekunden Rueckstand zurueck, duerfen nicht 3600
  // Physikschritte in einem Bild nachgeholt werden — das friert das Geraet ein
  // und der Ballon steht ploetzlich woanders. Lieber Zeit verwerfen.
  const MAX_SCHRITTE = 8;

  const bild = (jetzt: number) => {
    if (!laeuft) return;
    akku += Math.min(((jetzt - zuletzt) / 1000) * SPIELTEMPO, MAX_SCHRITTE * DT);
    zuletzt = jetzt;

    let n = 0;
    while (akku >= DT && n < MAX_SCHRITTE) {
      schritt(welt);
      akku -= DT;
      n++;
    }

    zeichnen(welt, akku / DT);

    if (welt.ausgang !== 'laeuft' && !gemeldet) {
      gemeldet = true;
      beiEnde(welt);
    }
    requestAnimationFrame(bild);
  };

  requestAnimationFrame(bild);
  return { stopp: () => { laeuft = false; } };
}
