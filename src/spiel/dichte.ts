// Mit wie vielen Pixeln das Spielfeld gezeichnet wird.
//
// ⚠ Josef meldete am 03.10.2026 im Browser: Das Bild stockt, der Ballon springt,
// die Steuerung hakt. Fast die ganze Zeit eines Bildes geht ins Fuellen der
// Pixel (CPU-Profil: ueber 90 % ausserhalb von JavaScript), und das waechst mit
// der Pixeldichte im Quadrat. Ein Handy mit doppelter Dichte zeichnet viermal so
// viele Pixel wie noetig waeren, um scharf genug zu wirken.
// Deshalb: mit der vollen Dichte (hoechstens 2) beginnen und, wenn die Bilder
// im Mittel zu lange dauern, in kleinen Stufen herunter. Nie wieder hinauf,
// sonst pendelt es zwischen scharf-und-ruckelig und weich-und-fluessig.

export const DICHTE_MAX = 2;
export const DICHTE_MIN = 1;
/** Ueber so viele Bilder wird gemittelt, bevor entschieden wird. */
export const DICHTE_FENSTER = 30;
/** Mittlere Bilddauer (ms), ab der die Dichte sinkt — gut 40 Bilder je Sekunde. */
const ZU_LANGSAM_MS = 24;
/** Ab hier (unter 25 Bildern je Sekunde) gleich eine doppelte Stufe. */
const VIEL_ZU_LANGSAM_MS = 40;
const STUFE = 0.25;

export const startDichte = (geraet: number) => Math.min(Math.max(geraet || 1, DICHTE_MIN), DICHTE_MAX);

/** Die Dichte nach einem Messfenster mit dieser mittleren Bilddauer. */
export function naechsteDichte(dichte: number, mittelMs: number): number {
  if (mittelMs <= ZU_LANGSAM_MS) return dichte;
  // ⚠ Nur eine Stufe je Fenster brauchte auf einem schwachen Geraet rund 20 s
  // bis ganz unten — so lange ruckelte es.
  const stufe = mittelMs > VIEL_ZU_LANGSAM_MS ? 2 * STUFE : STUFE;
  return Math.max(DICHTE_MIN, dichte - stufe);
}
