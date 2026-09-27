// Geometrie: Wer beruehrt was.
//
// ⚠ Die wichtigste Entscheidung steckt in `streckeTrifftNadel`: Geprueft wird
// nicht, WO der Ballon jetzt steht, sondern WELCHEN WEG er seit dem letzten
// Schritt genommen hat. Sonst fliegt er bei hohem Tempo in einem einzigen
// Schritt durch eine duenne Nadel hindurch und ueberlebt sie — zufaellig, je
// nach Bildrate. Genau dieser Fehler ("Tunneling") macht ein
// Geschicklichkeitsspiel unfair, ohne dass man es je reproduzieren koennte.

import type { Punkt } from './typen.ts';

export const laenge = (a: Punkt) => Math.hypot(a.x, a.y);
export const minus = (a: Punkt, b: Punkt): Punkt => ({ x: a.x - b.x, y: a.y - b.y });

/** Kuerzester Abstand von Punkt p zur Strecke a–b. */
export function abstandPunktStrecke(p: Punkt, a: Punkt, b: Punkt): number {
  const ab = minus(b, a);
  const laengeQuadrat = ab.x * ab.x + ab.y * ab.y;
  // Entartete Strecke (a === b): dann ist es schlicht der Punktabstand.
  if (laengeQuadrat === 0) return laenge(minus(p, a));
  // Wie weit entlang a→b liegt der Lotfusspunkt? Auf [0,1] begrenzt, damit
  // hinter den Enden der Abstand zum Endpunkt zaehlt und nicht zur Geraden.
  let t = ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / laengeQuadrat;
  t = Math.max(0, Math.min(1, t));
  return laenge(minus(p, { x: a.x + ab.x * t, y: a.y + ab.y * t }));
}

/** Schneiden sich die Strecken p1–p2 und p3–p4? */
function streckenSchneidenSich(p1: Punkt, p2: Punkt, p3: Punkt, p4: Punkt): boolean {
  const d1 = minus(p2, p1);
  const d2 = minus(p4, p3);
  const nenner = d1.x * d2.y - d1.y * d2.x;
  // Parallel (oder beide entartet): kein sauberer Schnittpunkt. Der
  // Abstandsvergleich in streckeTrifftNadel faengt diesen Fall ohnehin ab.
  if (nenner === 0) return false;
  const t = ((p3.x - p1.x) * d2.y - (p3.y - p1.y) * d2.x) / nenner;
  const u = ((p3.x - p1.x) * d1.y - (p3.y - p1.y) * d1.x) / nenner;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/** Kuerzester Abstand zwischen zwei Strecken. 0, wenn sie sich schneiden. */
export function abstandStreckeStrecke(a1: Punkt, a2: Punkt, b1: Punkt, b2: Punkt): number {
  if (streckenSchneidenSich(a1, a2, b1, b2)) return 0;
  // Kein Schnitt: Das Minimum liegt garantiert an einem der vier Endpunkte.
  return Math.min(
    abstandPunktStrecke(a1, b1, b2),
    abstandPunktStrecke(a2, b1, b2),
    abstandPunktStrecke(b1, a1, a2),
    abstandPunktStrecke(b2, a1, a2),
  );
}

/**
 * Hat der Ballon auf seinem Weg von `vorher` nach `jetzt` die Nadel beruehrt?
 *
 * Der Ballon ist ein Kreis; sein ueberstrichener Bereich ist die Strecke
 * vorher→jetzt, um seinen Radius verdickt. Die Nadel trifft also genau dann,
 * wenn der Abstand der beiden Strecken kleiner als der Radius ist.
 */
export function streckeTrifftNadel(
  vorher: Punkt,
  jetzt: Punkt,
  radius: number,
  nadelVon: Punkt,
  nadelBis: Punkt,
): boolean {
  return abstandStreckeStrecke(vorher, jetzt, nadelVon, nadelBis) < radius;
}
