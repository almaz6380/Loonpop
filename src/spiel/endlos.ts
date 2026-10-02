// Der Endlos-Lauf: Nadeln, die erst entstehen, wenn man hinkommt.
//
// Zwei Richtungen:
//   hoch    — immer weiter nach oben. Das Geblaese steht auf einem Boden mit
//             Nadeln, der dem Ballon folgt und dazu langsam von selbst steigt.
//   strecke — immer weiter nach rechts, Saeulen oben und unten im Wechsel.
//
// ⚠ ABSCHNITTE STATT EINES WACHSENDEN ARRAYS. Ein Level mit allen Nadeln bis
// in die Unendlichkeit gibt es nicht. Der Lauf ist eine Folge von Abschnitten;
// Abschnitt i haengt nur vom Seed, von i und von Abschnitt i−1 ab. Die Physik
// fragt nur nach den Nadeln um den Ballon, das Zeichnen nur nach denen im Bild.
//
// ⚠ ZUFALL NUR AUS DEM SEED (mulberry32, siehe zufall.ts). Derselbe Seed muss
// auf jedem Geraet denselben Lauf ergeben, sonst ist eine Bestweite nicht
// nachpruefbar.
//
// ⚠ SCHWERER WIRD ES UEBER DEN LEVEL, NIE UEBER DIE PHYSIK (CLAUDE.md, Regel 2):
// engere Luecken, kuerzere Abstaende, mehr bewegte Nadeln.

import type { Abschnitt, Endlos, EndlosArt, Level, Nadel, Welt } from './typen.ts';
import { mulberry32, saat } from './zufall.ts';
import { reihe, spalte } from './nadelfeld.ts';
import { neueWelt, BALLON_RADIUS } from './welt.ts';

/** 50 px Level = 1 m. Der Ballon ist damit gut einen Meter breit. */
export const PX_JE_METER = 50;
/** Ab hier ist die volle Schwierigkeit erreicht (m). */
const VOLL_SCHWER = 300;

const BREITE = 720;
const HOEHE = 1280;
/** Tiefste Mittelpunktshoehe des Ballons auf einer Strecke (siehe physik.ts). */
const STRECKE_BODEN = HOEHE - 96 - 12;

/**
 * Wie weit der Boden hoechstens unter dem Ballon bleibt (px). So weit traegt
 * der Strahl noch gut; wer tiefer faellt, landet auf den Nadeln.
 */
export const BODEN_ABSTAND = 900;
/** Wie schnell der Boden von selbst steigt (px/s), am Anfang und ganz am Ende. */
const KRIECHEN = { von: 12, bis: 70 };

const mische = (a: number, b: number, t: number) => a + (b - a) * t;
const schwere = (meter: number) => Math.max(0, Math.min(1, meter / VOLL_SCHWER));

/**
 * Das Tempo: waechst ohne Ende, naehert sich aber einer Obergrenze. Bei 300 m
 * ist es halb oben, bei 1000 m zu 90 %.
 *
 * ⚠ Bis zum 02.10.2026 hoerte alles bei 300 m auf, schwerer zu werden — der
 * Bot flog danach zehn Minuten ungestoert weiter. Ohne Obergrenze waere es
 * irgendwann nicht mehr spielbar, sondern nur noch unfair.
 */
export const tempo = (meter: number) => 1 - Math.exp(-Math.max(0, meter) / 430);

/** Die Engstellen: wie lang, wie oft (in Abschnitten). */
const ENG = { laenge: 3, ruhig: 2, abstandMin: 8, abstandMax: 14 };

/**
 * Wo im Engstellen-Rhythmus Abschnitt i liegt. Haengt nur von Abschnitt i−1
 * und dem Zufall von i ab — wie alles hier.
 */
function rhythmus(i: number, vorher: Abschnitt | undefined, z: () => number) {
  const naechste = vorher ? vorher.naechsteEng : ENG.abstandMin;
  const eng = i >= naechste && i < naechste + ENG.laenge;
  const ruhig = i >= naechste + ENG.laenge && i < naechste + ENG.laenge + ENG.ruhig;
  const letzter = i === naechste + ENG.laenge + ENG.ruhig - 1;
  const naechsteEng = letzter
    ? i + 1 + ENG.abstandMin + Math.floor(z() * (ENG.abstandMax - ENG.abstandMin + 1))
    : naechste;
  return { eng, ruhig, naechsteEng };
}

/** Der Zufall fuer Abschnitt i — nur aus Seed und Index, nie aus der Uhr. */
const zufallFuer = (seed: number, i: number) => mulberry32(saat(`${seed}:${i}`));

// ------------------------------------------------------------------ hoch

const HOCH_START = { x: 360, y: 1052 };

/**
 * Eine Nadelreihe mit Luecke. Die naechste Luecke sitzt so weit seitlich, dass
 * sich die freien Bereiche gerade noch ueberlappen.
 *
 * ⚠ Die Lehre aus Level 6, 8 und 10: Liegen die freien Bereiche zweier Reihen
 * weiter auseinander, braucht es einen Haken, den der traege Ballon auf 260 px
 * Steighoehe kaum schafft. Ueberlappen sie zu viel, steigt er gerade durch,
 * und das ist kein Level (Falle 5). Am Anfang ueberlappen sie 70 px, am Ende 10.
 */
function hochAbschnitt(seed: number, i: number, vorher: Abschnitt | undefined): Abschnitt {
  const z = zufallFuer(seed, i);
  const r = BALLON_RADIUS;
  // Die erste Reihe hat ihre Luecke genau ueber dem Start: Halten hebt
  // hindurch, das ist die erste Lektion (Falle 13).
  const lage = vorher ? vorher.lage - mische(300, 230, tempo((HOCH_START.y - vorher.lage) / PX_JE_METER)) : 742;
  const meterHier = (HOCH_START.y - lage) / PX_JE_METER;
  const d = schwere(meterHier);
  const { eng, ruhig, naechsteEng } = rhythmus(i, vorher, z);
  const normal = Math.max(150, mische(300, 170, d) - 20 * tempo(meterHier));
  // Engstelle: 60 % der ueblichen Breite, mindestens 130 — man soll den
  // Unterschied sehen, nicht nur messen. Danach kurz etwas Luft.
  const weite = Math.round(eng ? Math.max(130, normal * 0.6) : ruhig ? normal + 30 : normal);
  let mitte = HOCH_START.x;
  if (vorher) {
    const halbVorher = vorher.weite / 2 - r;
    const halb = weite / 2 - r;
    // Wie weit sie sich ueberlappen, streut etwas — sonst pendelte die Luecke
    // nur zwischen zwei Stellen hin und her.
    // In einer Engstelle liegen die Luecken fast uebereinander (hoechstens
    // 30 px versetzt): eng, aber nicht verwinkelt — beides zugleich waere
    // unfair. ⚠ Die erste Fassung gab ihr eine feste Ueberlappung von 40 px —
    // weniger als sonst am Anfang, also MEHR Haken. Der Bot platzte fast immer
    // an der ersten Engstelle.
    const ueberlapp = mische(70, 10, d) + z() * mische(50, 25, d);
    const versatz = eng ? z() * 30 : halbVorher + halb - ueberlapp;
    const links = vorher.mitte - versatz;
    const rechts = vorher.mitte + versatz;
    const passt = (x: number) => x >= weite / 2 && x <= BREITE - weite / 2;
    const wunsch = z() < 0.5 ? links : rechts;
    mitte = passt(wunsch) ? wunsch : passt(links) ? links : passt(rechts) ? rechts
      : Math.max(weite / 2, Math.min(BREITE - weite / 2, wunsch));
    mitte = Math.round(mitte);
  }
  const nadeln: Nadel[] = [];
  const linkesEnde = mitte - weite / 2;
  const rechtesEnde = mitte + weite / 2;
  if (linkesEnde > 0) nadeln.push(...reihe(lage, 0, linkesEnde));
  if (rechtesEnde < BREITE) nadeln.push(...reihe(lage, rechtesEnde, BREITE));
  if (eng) for (const n of nadeln) n.warnung = true;
  const bewegt = !eng && !ruhig;

  // Ab 100 m faehrt manchmal eine Pendelnadel durch die Luecke. Man wartet
  // darunter, bis sie zur Seite ist — in der Luft geht das.
  if (bewegt && d >= 1 / 3 && z() < 0.5) {
    nadeln.push({
      von: { x: linkesEnde + 12, y: lage }, bis: { x: linkesEnde + 12, y: lage + 60 },
      pendel: { weg: { x: weite - 24, y: 0 }, dauer: mische(3.8, 3, d) },
    });
  }
  // Ab 200 m faellt manchmal eine Nadel durch die Luecke — nur durch ihr Band,
  // nicht durch das ganze Level.
  if (bewegt && d >= 2 / 3 && z() < 0.5) {
    nadeln.push({
      von: { x: mitte, y: 0 }, bis: { x: mitte, y: 150 },
      faellt: { takt: mische(2.8, 2.4, d), versatz: z() * 3, oben: lage - 260, unten: lage + 220 },
    });
  }
  return { nadeln, lage, mitte, weite, eng, ruhig, naechsteEng };
}

// --------------------------------------------------------------- strecke

const STRECKE_START = { x: 200, y: 500 };
const GRUNDWIND = { von: 230, bis: 420 };
const STRECKE_DAEMPFUNG = 1.5;

/**
 * Der Grundwind an einer Stelle der Strecke (px/s²). Er waechst mit dem Tempo:
 * Der Ballon treibt anfangs gut 150 px/s, spaeter bis 280 px/s. Das ist
 * "schneller" ueber den Level, nicht ueber die Physik (Regel 2) — Wind ist
 * eine Eigenschaft des Levels.
 */
export const windBei = (meter: number) => mische(GRUNDWIND.von, GRUNDWIND.bis, tempo(meter));

/**
 * Eine Saeule, abwechselnd von unten und von oben. Dazwischen ein Korridor.
 *
 * ⚠ Wie weit der Korridor zur naechsten Saeule nach UNTEN springen darf,
 * begrenzt das Sinktempo: Ohne Geblaese sinkt der Ballon hoechstens ~40 px/s
 * (Falle 14). Bei Grundwind 230 und Daempfung 1,5 treibt er gut 150 px/s nach
 * rechts — auf 300 px Abstand bleiben zwei Sekunden, also rund 80 px. Davon
 * nur die Haelfte, sonst muesste man perfekt fliegen. Nach oben geht es
 * leicht, das Geblaese hebt schnell.
 */
function streckeAbschnitt(seed: number, i: number, vorher: Abschnitt | undefined): Abschnitt {
  const z = zufallFuer(seed, i);
  const meterVorher = vorher ? (vorher.lage - STRECKE_START.x) / PX_JE_METER : 0;
  const abstand = mische(320, 250, schwere(meterVorher));
  const lage = vorher ? vorher.lage + abstand : 900;
  const meterHier = (lage - STRECKE_START.x) / PX_JE_METER;
  const d = schwere(meterHier);
  const { eng, ruhig, naechsteEng } = rhythmus(i, vorher, z);
  const normal = Math.max(160, mische(320, 170, d) - 10 * tempo(meterHier));
  // Engstelle: 60 % des ueblichen Korridors, mindestens 140. Danach kurz Luft.
  const weite = Math.round(eng ? Math.max(140, normal * 0.6) : ruhig ? normal + 40 : normal);
  let mitte = STRECKE_START.y;
  if (vorher && eng) {
    // In der Engstelle laeuft der Korridor gerade: eng, aber ohne Sprung.
    mitte = vorher.mitte;
  } else if (vorher) {
    // ⚠ Mit dem Wind AN DIESER STELLE rechnen: Schnellerer Wind heisst
    // weniger Zeit zum Sinken, also kleinere Spruenge nach unten.
    const vx = windBei(meterVorher) / STRECKE_DAEMPFUNG;
    const runter = 40 * (abstand / vx) * 0.5;
    const rauf = 140;
    // Runter geht es in kleinen Schritten, rauf in grossen. Damit der Korridor
    // nicht oben klebt, zieht er zur Mitte: Je hoeher er liegt, desto eher
    // geht es runter.
    const nachUnten = Math.max(0.25, Math.min(0.9, 0.55 + (620 - vorher.mitte) / 500));
    const schritt = z() < nachUnten ? runter * (0.4 + 0.6 * z()) : -rauf * (0.25 + 0.75 * z());
    mitte = vorher.mitte + schritt;
    mitte = Math.max(weite / 2 + 120, Math.min(STRECKE_BODEN - weite / 2 - 60, mitte));
    // ⚠ Der Rand darf den Korridor nie weiter nach unten schieben, als der
    // Ballon sinken kann — etwa wenn er nach einer Engstelle wieder breiter wird.
    mitte = Math.floor(Math.min(mitte, vorher.mitte + runter));
  }
  // Gerade Abschnitte stehen am Boden, ungerade haengen von oben — wie Level 4.
  // `weite` zaehlt von Spitze zu Spitze; der Ballon hat davon `weite − 2r`.
  const nadeln: Nadel[] = i % 2 === 0
    ? spalte(lage, mitte + weite / 2, STRECKE_BODEN, 'oben')
    : spalte(lage, 0, mitte - weite / 2);
  if (eng) for (const n of nadeln) n.warnung = true;

  // Ab 150 m faellt manchmal eine Nadel zwischen die Saeulen.
  if (!eng && !ruhig && d >= 0.5 && z() < 0.5) {
    nadeln.push({
      von: { x: lage + abstand / 2, y: 0 }, bis: { x: lage + abstand / 2, y: 150 },
      faellt: { takt: mische(2.8, 2.4, d), versatz: z() * 3 },
    });
  }
  return { nadeln, lage, mitte, weite, eng, ruhig, naechsteEng };
}

// ------------------------------------------------------------------ Lauf

/** Die Grundwerte eines Endlos-Laufs — ein Level ohne Ziel und ohne Ende. */
export function endlosLevel(art: EndlosArt): Level {
  const ohneZiel = { pos: { x: 0, y: -1e12 }, radius: 0 };
  if (art === 'hoch') {
    return {
      id: 0, name: 'Endlos ↑', art: 'hoch',
      groesse: { breite: BREITE, hoehe: HOEHE },
      start: { ...HOCH_START }, geblaeseStart: HOCH_START.x,
      ziel: ohneZiel, nadeln: [], zonen: [],
      tempo: { blaskraft: 600, daempfung: 1.45, zeitlimit: 0 },
    };
  }
  return {
    id: 0, name: 'Endlos →', art: 'strecke',
    groesse: { breite: Infinity, hoehe: HOEHE },
    start: { ...STRECKE_START }, geblaeseStart: 170,
    ziel: ohneZiel, nadeln: [], zonen: [],
    grundwind: { x: GRUNDWIND.von, y: 0 },
    tempo: { blaskraft: 820, daempfung: STRECKE_DAEMPFUNG, zeitlimit: 0 },
  };
}

export function neueEndlosWelt(art: EndlosArt, seed: number): Welt {
  const welt = neueWelt(endlosLevel(art));
  welt.endlos = { art, seed: seed >>> 0, abschnitte: [] };
  return welt;
}

/** Abschnitt i, bei Bedarf samt allen davor erzeugt. */
export function abschnitt(e: Endlos, i: number): Abschnitt {
  const bau = e.art === 'hoch' ? hochAbschnitt : streckeAbschnitt;
  while (e.abschnitte.length <= i) {
    const k = e.abschnitte.length;
    e.abschnitte.push(bau(e.seed, k, e.abschnitte[k - 1]));
  }
  return e.abschnitte[i];
}

/**
 * Alle Nadeln, die zwischen `von` und `bis` liegen koennen — y bei hoch,
 * x bei strecke. Bei hoch gehoert der Nadelboden dazu: eine Reihe mit den
 * Spitzen nach oben, knapp ueber der tiefsten Ballonhoehe `bodenY`.
 */
export function nadelnIn(welt: Welt, von: number, bis: number, bodenY: number): Nadel[] {
  const e = welt.endlos!;
  const raus: Nadel[] = [];
  if (e.art === 'hoch') {
    // Ein Band reicht bis 300 px ueber seine Reihe (fallende Nadeln).
    for (let i = 0; ; i++) {
      const a = abschnitt(e, i);
      if (a.lage + 260 < von - 300) break;
      if (a.lage - 300 <= bis) raus.push(...a.nadeln);
    }
    raus.push(...bodenNadeln(bodenY));
  } else {
    for (let i = 0; ; i++) {
      const a = abschnitt(e, i);
      if (a.lage > bis + 300) break;
      if (a.lage + 300 >= von) raus.push(...a.nadeln);
    }
  }
  return raus;
}

/** Wie weit die Spitzen des Nadelbodens ueber das Gras ragen (px). */
export const BODEN_SPITZE = 36;

/**
 * Der Nadelboden: Spitzen nach oben, so hoch, dass sie den Ballon erwischen,
 * bevor er auf dem Gras aufsetzt.
 * ⚠ Am 02.10.2026 ragten sie nur 6 px aus dem Gras. Man sah sie kaum und
 * platzte scheinbar am Gras. Was toetet, muss man sehen.
 */
export function bodenNadeln(bodenY: number): Nadel[] {
  return reihe(0, 0, BREITE).map((n) => ({
    von: { x: n.von.x, y: bodenY + 24 },
    bis: { x: n.von.x, y: bodenY - BODEN_SPITZE },
  }));
}

/** Wie schnell der Boden gerade von selbst steigt (px/s). */
export const kriechen = (meter: number) => mische(KRIECHEN.von, KRIECHEN.bis, tempo(meter));

/** Der Grundwind, der gerade wirkt — auf Strecken waechst er mit (siehe windBei). */
export function endlosWind(welt: Welt): { x: number; y: number } | undefined {
  if (welt.endlos?.art !== 'strecke') return welt.level.grundwind;
  return { x: windBei(meter(welt)), y: 0 };
}

/**
 * Den Boden nachziehen — vor jedem Physikschritt. Er folgt dem Ballon nach
 * oben, sinkt nie, und kriecht dazu von selbst. ⚠ Das rechnet die PHYSIK,
 * nicht die Kamera (Falle 10): Sonst liefe derselbe Lauf auf zwei
 * Bildschirmen verschieden.
 */
export function bodenNachziehen(welt: Welt, dt: number): void {
  if (welt.endlos?.art !== 'hoch') return;
  const folgt = welt.ballon.pos.y + BODEN_ABSTAND;
  welt.boden = Math.min(welt.boden - kriechen(meter(welt)) * dt, folgt, welt.boden);
}

/** Wie weit der Lauf gekommen ist (m). */
export function meter(welt: Welt): number {
  const e = welt.endlos;
  if (!e) return 0;
  const strecke = e.art === 'hoch'
    ? welt.level.start.y - welt.ballon.pos.y
    : welt.ballon.pos.x - welt.level.start.x;
  return Math.max(0, strecke / PX_JE_METER);
}

/**
 * Ein Stueck des Laufs als gewoehnliches, endliches Level: die Abschnitte
 * `von` bis `von + anzahl − 1`, mit Start davor und Ziel dahinter. So prueft
 * dieselbe Wegsuche wie bei den Leveln (pruefung.ts), ob der Generator faire
 * Stuecke baut.
 */
export function endlosStueck(art: EndlosArt, seed: number, von: number, anzahl: number): Level {
  const e: Endlos = { art, seed: seed >>> 0, abschnitte: [] };
  const teile = Array.from({ length: anzahl }, (_, k) => abschnitt(e, von + k));
  const davor = von > 0 ? abschnitt(e, von - 1) : undefined;
  const basis = endlosLevel(art);
  const verschiebe = (n: Nadel, dx: number, dy: number): Nadel => ({
    ...n,
    von: { x: n.von.x + dx, y: n.von.y + dy },
    bis: { x: n.bis.x + dx, y: n.bis.y + dy },
    ...(n.faellt ? {
      faellt: {
        ...n.faellt,
        ...(n.faellt.oben !== undefined ? { oben: n.faellt.oben + dy } : {}),
        ...(n.faellt.unten !== undefined ? { unten: n.faellt.unten + dy } : {}),
      },
    } : {}),
  });

  if (art === 'hoch') {
    const erste = teile[0];
    const letzte = teile[teile.length - 1];
    // Boden 380 px unter der ersten Reihe, Start wie in der Welt 228 px darueber.
    const boden = erste.lage + 60 + 380;
    const oben = letzte.lage - 320;
    const dy = -oben;
    const startX = davor ? davor.mitte : HOCH_START.x;
    return {
      ...basis,
      name: `${basis.name} ${seed}/${von}`,
      groesse: { breite: BREITE, hoehe: boden + dy },
      start: { x: startX, y: boden - 228 + dy },
      geblaeseStart: startX,
      ziel: { pos: { x: letzte.mitte, y: letzte.lage - 160 + dy }, radius: 60 },
      nadeln: teile.flatMap((t) => t.nadeln.map((n) => verschiebe(n, 0, dy))),
    };
  }
  const erste = teile[0];
  const letzte = teile[teile.length - 1];
  const dx = 700 - erste.lage;
  // Der Wind dieses Stuecks — weiter hinten weht es staerker.
  const wind = windBei((erste.lage - STRECKE_START.x) / PX_JE_METER);
  // Im Korridor der ersten Saeule — wie bei den Leveln (Falle 11).
  const startY = erste.mitte;
  return {
    ...basis,
    name: `${basis.name} ${seed}/${von}`,
    groesse: { breite: letzte.lage + dx + 500, hoehe: HOEHE },
    start: { x: 200, y: startY },
    ziel: { pos: { x: letzte.lage + dx + 300, y: letzte.mitte }, radius: 70 },
    grundwind: { x: wind, y: 0 },
    nadeln: teile.flatMap((t) => t.nadeln.map((n) => verschiebe(n, dx, 0))),
  };
}

/** Ein neuer Seed fuer einen neuen Lauf. Die Uhr waehlt nur den Seed aus. */
export const neuerSeed = (jetzt: number) => saat(`loonpop-${jetzt}`);
