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
//
// ⚠ DAS LAUBGEBLAESE LAESST SICH NICHT DREHEN. Es blaest senkrecht nach oben,
// und genau daraus entsteht das Spiel: Der Strahl wird nach oben hin breiter
// und schwaecher, und wer den Ballon am RAND des Strahls trifft, schiebt ihn
// zur Seite. Seitlich gesteuert wird also ueber die eigene Position, nicht
// ueber eine Richtung. Wer hier eine Neigung einbaut, nimmt dem Spiel seine
// einzige Idee.

import type { Punkt, Welt, Nadel } from './typen.ts';
import { streckeTrifftNadel, laenge, minus } from './kollision.ts';
import { nadelnIn, bodenNachziehen } from './endlos.ts';

/** Ein Physikschritt = 1/120 Sekunde. */
export const DT = 1 / 120;

/** Schwerkraft (px/s²), nach unten — y waechst nach unten, wie im Canvas. */
const SCHWERKRAFT = 900;

/**
 * Auftrieb (px/s²), nach oben. Knapp KLEINER als die Schwerkraft: Der Ballon
 * sinkt ganz langsam und wird vom Geblaese getragen.
 *
 * ⚠ Bis zum 27.09.2026 war es umgekehrt — der Ballon stieg von allein. Damit
 * hatte das Geblaese keine echte Aufgabe mehr, man brauchte es nur zum
 * Seitwaertsschieben. Netto sind es jetzt 60 px/s² nach unten, bei Daempfung
 * 1,6 also rund 37 px/s Sinkgeschwindigkeit: gemaechlich genug, um zu denken.
 */
const AUFTRIEB = 840;

/** Wie schnell das Geblaese nach dem Druecken volle Kraft hat (Sekunden). */
const WIND_AN = 0.12;
/** Wie lange es nach dem Loslassen ausklingt (Sekunden). Das ist das Nachtreiben. */
const WIND_AUS = 0.3;

/**
 * Halber Durchmesser des Strahls direkt an der Duese (px).
 * ⚠ Exportiert, weil zeichnen.ts denselben Kegel malen muss, den hier
 * gerechnet wird. Standen die Werte doppelt im Code, liefen sie frueher oder
 * spaeter auseinander — und dann zielt der Spieler nach dem Bild und trifft
 * daneben. Ein Spiel, das anders aussieht als es rechnet, ist unfair.
 */
export const MUND = 34;
/**
 * Wie stark sich der Strahl nach oben hin aufweitet (px je px Hoehe).
 * ⚠ 0,38 war zu viel: Der Kegel wurde oben breiter als das Level selbst, der
 * Strahl traf den Ballon ueberall, und die Seitensteuerung war dort wirkungslos.
 */
export const AUFWEITUNG = 0.22;
/**
 * Wie viel vom Strahl ganz oben noch ankommt. Ein Laubgeblaese traegt nah
 * kraeftig und fern kaum — daraus ergibt sich das Schwierigkeitsgefaelle von
 * allein: unten fein steuerbar, oben grob.
 */
const HOEHEN_REST = 0.35;
/**
 * Wie stark der Strahlrand seitlich wegdrueckt, gemessen an seiner Hubkraft.
 * Das IST die Seitensteuerung — ohne sie liesse sich der Ballon nur heben.
 */
const SEITENSCHUB = 0.55;

/** Wie hoch die Duese ueber dem unteren Rand sitzt (px). */
export const DUESE_HOEHE = 96;

/**
 * Gegen welche Hoehe der Strahl abfaellt (px). Fest, nicht die Levelhoehe:
 * Im Endlos-Lauf gibt es keine Levelhoehe, und ein Strahl, der in einem
 * hoeheren Level weiter truege, waere ein zweites Spiel (Regel 2). Alle
 * Level sind 1280 hoch, fuer sie aendert sich nichts.
 */
export const BEZUGSHOEHE = 1280;

/**
 * Wie weit der Ballon TIEFSTENS sinken darf, gemessen ueber der Duese.
 *
 * ⚠ Das ist keine Kosmetik, sondern die Rettung vor einem toten Spiel: Ein
 * Geblaese blaest nur nach oben (strahlKraft liefert unterhalb der Duese
 * nichts). Sinkt der Ballon einmal unter die Duesenhoehe, erreicht ihn kein
 * Strahl mehr — er liegt unten fest, und der Lauf endet nie, weil auch nichts
 * platzt. Am 27.09.2026 genau so passiert: nach 23 Sekunden lag er im Gras und
 * das Spiel war nur noch Zusehen.
 */
const BODEN_UEBER_DUESE = 12;

/** Die tiefste Mittelpunktshoehe, die der Ballon einnehmen kann. */
export const bodenHoehe = (levelHoehe: number) =>
  levelHoehe - DUESE_HOEHE - BODEN_UEBER_DUESE;

/**
 * Was der Luftstrahl auf den Ballon ausuebt. Ausgelagert, weil genau hier das
 * Spielgefuehl sitzt — und weil es sich so ohne Browser testen laesst.
 */
export function strahlKraft(
  geblaeseX: number, dueseY: number, ballon: Punkt,
  blaskraft: number, staerke: number, levelHoehe: number,
): Punkt {
  const dy = dueseY - ballon.y;             // Hoehe ueber der Duese
  const dx = ballon.x - geblaeseX;          // seitlicher Versatz

  // Unterhalb der Duese passiert nichts — ein Geblaese saugt nicht.
  if (dy <= 0 || staerke <= 0) return { x: 0, y: 0 };

  const radius = MUND + dy * AUFWEITUNG;
  const ab = Math.abs(dx);
  if (ab > radius) return { x: 0, y: 0 };   // ausserhalb des Kegels

  const hoehenAbfall = 1 - (1 - HOEHEN_REST) * Math.min(1, dy / levelHoehe);
  // Am Strahlrand traegt es weniger als in der Mitte.
  const mittenAbfall = 1 - (ab / radius) * 0.55;
  const k = blaskraft * staerke * hoehenAbfall * mittenAbfall;

  return {
    x: (dx === 0 ? 0 : Math.sign(dx)) * k * SEITENSCHUB * (ab / radius),
    y: -k,
  };
}

/** Wie viel Schwung eine Wand zurueckgibt. 0 = klebt, 1 = springt ungebremst. */
const WAND_ABPRALL = 0.35;

/** Wo eine bewegte Nadel zum Zeitpunkt t steht. */
export function nadelJetzt(nadel: Nadel, zeit: number, levelHoehe = 1280): { von: Punkt; bis: Punkt } {
  if (nadel.faellt) {
    // Faellt von ueber dem oberen Rand bis unter den unteren und beginnt von
    // vorn. Die Nadel wird dabei NICHT fortgeschrieben, sondern aus der Zeit
    // gerechnet — sonst waere der Lauf nicht mehr reproduzierbar.
    const laenge = Math.abs(nadel.bis.y - nadel.von.y);
    const von = nadel.faellt.oben ?? 0;
    const bis = nadel.faellt.unten ?? levelHoehe;
    const strecke = bis - von + laenge * 2;
    const p = (((zeit + nadel.faellt.versatz) % nadel.faellt.takt) + nadel.faellt.takt)
      % nadel.faellt.takt / nadel.faellt.takt;
    const oben = von - laenge + p * strecke;
    return {
      von: { x: nadel.von.x, y: oben },
      bis: { x: nadel.bis.x, y: oben + laenge },
    };
  }
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
  if (welt.ausgang !== 'laeuft') {
    // Die Physik ruht, aber die Uhr fuer den Nachklang laeuft weiter — das
    // Zeichnen braucht sie fuer den Platz-Effekt.
    welt.nachher += DT;
    return;
  }

  const { ballon, level, geblaese } = welt;
  const { blaskraft, daempfung, zeitlimit } = level.tempo;

  welt.zeit += DT;
  // Im Endlos-Lauf nach oben steigt der Boden mit (siehe endlos.ts).
  bodenNachziehen(welt, DT);

  // --- Geblaese nachfuehren ----------------------------------------------
  // Schnell an, langsam aus: Druecken soll sich unmittelbar anfuehlen,
  // Loslassen darf nachwirken.
  const ziel = geblaese.an ? 1 : 0;
  const tempo = geblaese.an ? DT / WIND_AN : DT / WIND_AUS;
  geblaese.staerke += Math.max(-tempo, Math.min(tempo, ziel - geblaese.staerke));
  geblaese.staerke = Math.max(0, Math.min(1, geblaese.staerke));

  // --- Kraefte sammeln ----------------------------------------------------
  let ax = 0;
  let ay = SCHWERKRAFT - AUFTRIEB;

  const strahl = strahlKraft(
    geblaese.x, welt.boden - DUESE_HOEHE, ballon.pos,
    blaskraft, geblaese.staerke, BEZUGSHOEHE,
  );
  ax += strahl.x;
  ay += strahl.y;

  // Grundwind: treibt auf Strecken nach rechts.
  if (level.grundwind) {
    ax += level.grundwind.x;
    ay += level.grundwind.y;
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
  const { breite } = level.groesse;
  if (ballon.pos.x < r) { ballon.pos.x = r; ballon.geschw.x = Math.abs(ballon.geschw.x) * WAND_ABPRALL; }
  if (ballon.pos.x > breite - r) { ballon.pos.x = breite - r; ballon.geschw.x = -Math.abs(ballon.geschw.x) * WAND_ABPRALL; }
  // Endlos nach oben gibt es keine Decke.
  const decke = welt.endlos?.art !== 'hoch';
  if (decke && ballon.pos.y < r) { ballon.pos.y = r; ballon.geschw.y = Math.abs(ballon.geschw.y) * WAND_ABPRALL; }
  const boden = bodenHoehe(welt.boden);
  if (ballon.pos.y > boden) { ballon.pos.y = boden; ballon.geschw.y = -Math.abs(ballon.geschw.y) * WAND_ABPRALL; }

  // --- Nadeln -------------------------------------------------------------
  // Ueber den zurueckgelegten WEG geprueft, nicht ueber die Endposition.
  // Im Endlos-Lauf nur die Nadeln in der Naehe — es sind sonst unendlich viele.
  const nadeln = !welt.endlos ? level.nadeln
    : welt.endlos.art === 'hoch'
      ? nadelnIn(welt, ballon.pos.y - 200, ballon.pos.y + 200, boden)
      : nadelnIn(welt, ballon.pos.x - 200, ballon.pos.x + 200, boden);
  for (const nadel of nadeln) {
    const n = nadelJetzt(nadel, welt.zeit, level.groesse.hoehe);
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
