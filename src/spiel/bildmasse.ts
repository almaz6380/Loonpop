// Masse der Bilder, die die Physik beruehren — gemessen von
// scripts/bilder-freistellen.py. ⚠ Neues Bild → neu messen.

import { MUND } from './physik.ts';

/** Das Geblaesebild (public/bilder/geblaese.png), Anteile an Breite bzw. Hoehe. */
export const GEBLAESE_BILD = {
  /** Breite zu Hoehe des ganzen Bilds. */
  seiten: 0.7701,
  /** Mitte der Trichteroeffnung, Anteil der Bildbreite. */
  oeffnungMitte: 0.4988,
  /** Aussenbreite des Trichterrands, Anteil der Bildbreite. */
  oeffnungBreite: 0.6045,
};

/**
 * Wie breit der Trichterrand gezeichnet wird (px), etwas schmaler als der
 * Strahl an der Duese (2·MUND = 68): Der Strahl weitet sich sichtbar aus der
 * Oeffnung. ⚠ Breiter geht nicht: Die Duese sitzt nur 96 px ueber dem Boden.
 * Mit 56 px ragte das Bild so weit unter den Rand, dass vom Motor fast nichts
 * mehr zu sehen war (02.10.2026). Das erste Bild mit langem Rohr waere sogar
 * nur 12 px schmal gewesen.
 */
export const TRICHTER_BREITE = 48;

/** Die Groesse, in der das Geblaesebild gezeichnet wird. */
export function geblaeseMass() {
  const breite = TRICHTER_BREITE / GEBLAESE_BILD.oeffnungBreite;
  return { breite, hoehe: breite / GEBLAESE_BILD.seiten, mund: MUND };
}
