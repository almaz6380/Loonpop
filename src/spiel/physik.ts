// Ein Schritt der Welt. Das Herz des Spiels.
//
// ⚠ FESTE SCHRITTWEITE. `schritt()` rechnet immer mit DT, nie mit der Zeit, die
// seit dem letzten Bild vergangen ist. Die Schleife ruft dafuer lieber mehrmals
// auf (siehe schleife.ts). Zwei Gruende, beide hart:
//
//   1. Auf einem Geraet mit 120 Hz waere das Spiel sonst ein anderes als auf
//      einem mit 60 Hz — kein Zufall, sondern eine andere Flugbahn.
//   2. Ohne feste Schrittweite ist nichts reproduzierbar. Dann ist der
//      Endlos-Seed wertlos, ein Fehlerbericht nicht nachstellbar und jeder Test
//      eine Wette.
//
// ⚠ TRAEGHEIT IST ABSICHT. Der Ballon reagiert verzoegert und treibt nach. Wer
// das "schwammig" findet und die Daempfung hochdreht, baut ein anderes Spiel:
// Das Vorausdenken IST die Aufgabe. Schneller wird ein Level ueber engere
// Gassen und Zeitlimits (Level.tempo), nicht ueber andere Physik.

import type { Punkt, Welt, Nadel } from './typen.ts';
import { streckeTrifftNadel, laenge, minus } from './kollision.ts';

/** Ein Physikschritt = 1/120 Sekunde. */
export const DT = 1 / 120;

/** Schwerkraft (px/s²), nach unten — y waechst nach unten, wie im Canvas. */
const SCHWERKRAFT = 900;

/**
 * Auftrieb (px/s²), nach oben. Knapp GROESSER als die Schwerkraft: Ein Ballon,
 * der von allein langsam steigt, gibt dem Spieler etwas zu tun, ohne ihn zu
 * hetzen. Stuende er still, waere jedes Level eine reine Zielsuche.
 */
const AUFTRIEB = 980;

/** Wie schnell der Wind nach dem Antippen seine volle Kraft hat (Sekunden). */
const WIND_AN = 0.12;
/** Wie lange er nach dem Loslassen ausklingt (Sekunden). Das ist das Nachtreiben. */
const WIND_AUS = 0.3;

/**
 * Ab diesem Abstand blaest der Wind mit voller Kraft (px). Naeher am Ziel wird
 * er sanfter — sonst schiesst der Ballon ueber den Finger hinaus und zittert
 * um ihn herum, was sich nach kaputter Steuerung anfuehlt.
 */
const WIND_VOLL_AB = 140;

/** Wie viel Schwung eine Wand zurueckgibt. 0 = klebt, 1 = springt ungebremst. */
const WAND_ABPRALL = 0.35;

/** Wo eine Pendel-Nadel zum Zeitpunkt t steht. */
export function nadelJetzt(nadel: Nadel, zeit: number): { von: Punkt; bis: Punkt } {
  if (!nadel.pendel) return { von: nadel.von, bis: nadel.bis };
  // Dreieckschwingung statt Sinus: Die Nadel laeuft mit gleichmaessigem Tempo
  // hin und her. Ein Sinus wuerde an den Umkehrpunkten verharren — dort steht
  // sie dann genau lange genug, um unfair zu wirken.
  const p = (zeit % nadel.pendel.dauer) / nadel.pendel.dauer;
  const f = p < 0.5 ? p * 2 : 2 - p * 2;
  const v = { x: nadel.pendel.weg.x * f, y: nadel.pendel.weg.y * f };
  return {
    von: { x: nadel.von.x + v.x, y: nadel.von.y + v.y },
    bis: { x: nadel.bis.x + v.x, y: nadel.bis.y + v.y },
  };
}

/**
 * Rechnet die Welt genau einen festen Zeitschritt weiter.
 *
 * Reine Funktion auf dem Zustand: keine Zufallszahlen, keine Uhr, kein Canvas.
 * Deshalb laesst sie sich ohne Browser testen.
 */
export function schritt(welt: Welt): void {
  if (welt.ausgang !== 'laeuft') return;

  const { ballon, level } = welt;
  const { windKraft, daempfung, zeitlimit } = level.tempo;

  welt.zeit += DT;

  // --- Windstaerke nachfuehren -------------------------------------------
  // Schnell an, langsam aus: Antippen soll sich unmittelbar anfuehlen,
  // Loslassen darf nachwirken.
  const ziel = welt.windZiel ? 1 : 0;
  const tempo = welt.windZiel ? DT / WIND_AN : DT / WIND_AUS;
  welt.windStaerke += Math.max(-tempo, Math.min(tempo, ziel - welt.windStaerke));
  welt.windStaerke = Math.max(0, Math.min(1, welt.windStaerke));

  // --- Kraefte sammeln ----------------------------------------------------
  let ax = 0;
  let ay = SCHWERKRAFT - AUFTRIEB;

  if (welt.windZiel && welt.windStaerke > 0) {
    const zum = minus(welt.windZiel, ballon.pos);
    const d = laenge(zum);
    if (d > 0.001) {
      const naehe = Math.min(1, d / WIND_VOLL_AB);
      const k = windKraft * welt.windStaerke * naehe;
      ax += (zum.x / d) * k;
      ay += (zum.y / d) * k;
    }
  }

  // Zonen: dauerhafte Kraefte an bestimmten Stellen (Aufwind, Seitenwind).
  for (const z of level.zonen) {
    const b = z.bereich;
    if (
      ballon.pos.x >= b.x && ballon.pos.x <= b.x + b.breite &&
      ballon.pos.y >= b.y && ballon.pos.y <= b.y + b.hoehe
    ) {
      ax += z.kraft.x;
      ay += z.kraft.y;
    }
  }

  // Luftwiderstand, linear zur Geschwindigkeit. Linear und nicht quadratisch,
  // weil ein Ballon langsam ist und linear sich bei kleinen Tempi ruhiger
  // anfuehlt — quadratisch laesst ihn bei Schleichfahrt fast ungebremst treiben.
  ax -= ballon.geschw.x * daempfung;
  ay -= ballon.geschw.y * daempfung;

  // --- Integrieren --------------------------------------------------------
  ballon.vorher = { ...ballon.pos };
  ballon.geschw.x += ax * DT;
  ballon.geschw.y += ay * DT;
  ballon.pos.x += ballon.geschw.x * DT;
  ballon.pos.y += ballon.geschw.y * DT;

  // --- Waende -------------------------------------------------------------
  const r = ballon.radius;
  const { breite, hoehe } = level.groesse;
  if (ballon.pos.x < r) { ballon.pos.x = r; ballon.geschw.x = Math.abs(ballon.geschw.x) * WAND_ABPRALL; }
  if (ballon.pos.x > breite - r) { ballon.pos.x = breite - r; ballon.geschw.x = -Math.abs(ballon.geschw.x) * WAND_ABPRALL; }
  if (ballon.pos.y < r) { ballon.pos.y = r; ballon.geschw.y = Math.abs(ballon.geschw.y) * WAND_ABPRALL; }
  if (ballon.pos.y > hoehe - r) { ballon.pos.y = hoehe - r; ballon.geschw.y = -Math.abs(ballon.geschw.y) * WAND_ABPRALL; }

  // --- Nadeln -------------------------------------------------------------
  // Ueber den zurueckgelegten WEG geprueft, nicht ueber die Endposition.
  for (const nadel of level.nadeln) {
    const n = nadelJetzt(nadel, welt.zeit);
    if (streckeTrifftNadel(ballon.vorher, ballon.pos, r, n.von, n.bis)) {
      welt.ausgang = 'geplatzt';
      return;
    }
  }

  // --- Ziel ---------------------------------------------------------------
  if (laenge(minus(level.ziel.pos, ballon.pos)) < level.ziel.radius + r) {
    welt.ausgang = 'geschafft';
    return;
  }

  // --- Zeit ---------------------------------------------------------------
  if (zeitlimit > 0 && welt.zeit >= zeitlimit) welt.ausgang = 'zeit-aus';
}
