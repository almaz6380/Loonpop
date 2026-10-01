// Ist ein Level fair? Die Pruefungen, die man im Spiel nicht sieht.
//
// ⚠ Lag bis zum 01.10.2026 als `scratchpad/balance.mts` und
// `scratchpad/streckenpruefung.mts` im Scratchpad einer Sitzung — und war mit
// ihr weg. Deshalb jetzt hier, als reine Funktionen im Spielkern: `npm test`
// prueft damit jedes Level, und `npm run pruefen` zeigt die Zahlen dazu.
//
// ⚠ Ein Level prueft man mit einer WEGSUCHE, nicht mit Abstandsregeln. Zwei
// Heuristiken davor lagen daneben: "Luecke zwischen langen Balken" wurde
// wertlos, sobald es Stachelfelder gab; "Mindestabstand fallender Nadeln"
// verbot sie in Hoch-Leveln ganz, obwohl sie dort passen. Die einzige ehrliche
// Frage lautet: Kommt der Ballon durch?

import type { Level, Nadel, Punkt } from './typen.ts';
import { abstandPunktStrecke } from './kollision.ts';
import { schritt, nadelJetzt, bodenHoehe } from './physik.ts';
import { neueWelt, BALLON_RADIUS } from './welt.ts';

/** Kantenlaenge einer Gitterzelle der Wegsuche (px). */
const ZELLE = 10;

/**
 * Wie lange eine fallende Nadel den Weg mindestens freigeben muss (s).
 * Der Ballon ist traege; er braucht Zeit, um durch die Spalte zu treiben.
 */
export const FALL_FENSTER_MIN = 0.6;

/** Mindestvorlauf vom Start bis zur ersten Nadelreihe auf Strecken (px). */
export const VORLAUF_MIN = 400;
/**
 * In Hoch-Leveln darf eine Nadel ueber dem Start stehen — man muss dann erst
 * zur Seite, bevor man steigt (Level 2). Aber nicht so dicht, dass schon ein
 * kurzer Druck hineinfuehrt (px).
 */
export const HOCH_ABSTAND_MIN = 120;

/**
 * Richtwert fuer den Steigflug: Pixel in der ersten Sekunde, Geblaese voll
 * unter dem Ballon. ⚠ Bei den ersten Werten waren es 504, und der Ballon schoss
 * durchs Level. `tempo.blaskraft` ist die Schraube.
 */
export const STEIGFLUG_RICHTWERT = 150;
/** Wie weit ein Level davon abweichen darf, bevor es sich anders anfuehlt. */
export const STEIGFLUG_SPANNE = { min: 100, max: 200 };

/**
 * Wie weit steigt der Ballon in der ersten Sekunde, wenn man das Geblaese
 * genau unter ihn haelt?
 */
export function steigflug(level: Level): number {
  const w = neueWelt({ ...level, nadeln: [] });
  w.geblaese.an = true;
  for (let i = 0; i < 120; i++) {
    // Das Geblaese geht mit — auf Strecken treibt der Grundwind den Ballon weg.
    w.geblaese.x = w.ballon.pos.x;
    schritt(w);
  }
  return level.start.y - w.ballon.pos.y;
}

/**
 * Wo eine Nadel im Lauf ueberall stehen kann. Pendelnde Nadeln werden
 * abgetastet und als Ganzes gesperrt — lieber einmal zu oft "nicht schaffbar"
 * als ein falsches "schaffbar". Fallende Nadeln stehen NICHT hier, sie
 * sperren nur zeitweise (siehe `fallFenster`).
 */
function sperrstrecken(nadel: Nadel, hoehe: number): { von: Punkt; bis: Punkt }[] {
  if (nadel.faellt) return [];
  if (!nadel.pendel) return [{ von: nadel.von, bis: nadel.bis }];
  const proben = 24;
  const teile = [];
  for (let i = 0; i <= proben; i++) teile.push(nadelJetzt(nadel, (nadel.pendel.dauer / 2) * (i / proben), hoehe));
  return teile;
}

/**
 * Wie lange gibt eine fallende Nadel eine Hoehe frei, bevor sie wiederkommt?
 * Sie belegt jede Hoehe fuer die Zeit, die sie braucht, um mit ihrer eigenen
 * Laenge plus dem Ballondurchmesser daran vorbeizufallen.
 */
export function fallFenster(nadel: Nadel, hoehe: number): number {
  if (!nadel.faellt) return Infinity;
  const laenge = Math.abs(nadel.bis.y - nadel.von.y);
  const tempo = (hoehe + laenge * 2) / nadel.faellt.takt;
  return nadel.faellt.takt - (laenge + 2 * BALLON_RADIUS) / tempo;
}

/** Erreicht der Ballon das Ziel, ohne dass man etwas tut? */
function ohneZutun(level: Level, halten: boolean): boolean {
  const w = neueWelt(level);
  w.geblaese.an = halten;
  for (let i = 0; i < 120 * 60 && w.ausgang === 'laeuft'; i++) schritt(w);
  return w.ausgang === 'geschafft';
}

/** Stoesst der Ballon an dieser Querposition an eine Nadel der Gruppe? */
function versperrt(level: Level, gruppe: Nadel[], quer: number): boolean {
  const r = BALLON_RADIUS;
  return gruppe.some((n) => {
    const p = level.art === 'strecke' ? { x: n.von.x, y: quer } : { x: quer, y: n.von.y };
    return abstandPunktStrecke(p, n.von, n.bis) < r;
  });
}

export type Befund = {
  /** Gibt es einen freien Weg vom Start ins Ziel? */
  schaffbar: boolean;
  /** Steigflug in der ersten Sekunde (px). */
  steigflug: number;
  /** Erreicht der Ballon das Ziel ganz ohne Eingabe? Dann ist es kein Level. */
  ohneEingabe: boolean;
  /** ...oder wenn man nur still haelt? */
  nurHalten: boolean;
  /** Liegt der Start im freien Korridor der ersten Nadelgruppe? */
  startFrei: boolean;
  /** Abstand vom Start zur ersten Nadelgruppe in Flugrichtung (px). */
  vorlauf: number;
  /** Kuerzestes Zeitfenster, das eine fallende Nadel laesst (s). */
  fallFenster: number;
  /** Was nicht stimmt, in Worten — leer heisst: in Ordnung. */
  maengel: string[];
};

/**
 * Die Wegsuche: Ein Gitter ueber das Level, belegte Zellen gesperrt, dann
 * vom Start aus geflutet. Gesperrt ist eine Zelle, wenn der Ballon dort eine
 * Nadel beruehren wuerde oder nicht hinpasst.
 */
function wegFrei(level: Level): boolean {
  const { breite, hoehe } = level.groesse;
  const r = BALLON_RADIUS;
  const spalten = Math.ceil(breite / ZELLE);
  const zeilen = Math.ceil(hoehe / ZELLE);
  const boden = bodenHoehe(hoehe);
  const strecken = level.nadeln.flatMap((n) => sperrstrecken(n, hoehe));

  const mitte = (i: number) => (i + 0.5) * ZELLE;
  const frei = new Uint8Array(spalten * zeilen);
  for (let sy = 0; sy < zeilen; sy++) {
    const y = mitte(sy);
    if (y < r || y > boden) continue;
    for (let sx = 0; sx < spalten; sx++) {
      const x = mitte(sx);
      if (x < r || x > breite - r) continue;
      const p = { x, y };
      // Nur Nadeln in Reichweite pruefen — auf langen Strecken sind das wenige.
      const getroffen = strecken.some((s) =>
        Math.min(s.von.x, s.bis.x) - r <= x && Math.max(s.von.x, s.bis.x) + r >= x &&
        abstandPunktStrecke(p, s.von, s.bis) < r);
      if (!getroffen) frei[sy * spalten + sx] = 1;
    }
  }

  const zelle = (p: Punkt) => {
    const sx = Math.min(spalten - 1, Math.max(0, Math.floor(p.x / ZELLE)));
    const sy = Math.min(zeilen - 1, Math.max(0, Math.floor(p.y / ZELLE)));
    return sy * spalten + sx;
  };
  const start = zelle(level.start);
  if (!frei[start]) return false;

  const imZiel = (i: number) => {
    const x = mitte(i % spalten);
    const y = mitte(Math.floor(i / spalten));
    return Math.hypot(x - level.ziel.pos.x, y - level.ziel.pos.y) < level.ziel.radius + r;
  };

  const gesehen = new Uint8Array(spalten * zeilen);
  const warteschlange = [start];
  gesehen[start] = 1;
  while (warteschlange.length) {
    const i = warteschlange.pop()!;
    if (imZiel(i)) return true;
    const sx = i % spalten;
    const nachbarn = [
      sx > 0 ? i - 1 : -1,
      sx < spalten - 1 ? i + 1 : -1,
      i - spalten,
      i + spalten,
    ];
    for (const n of nachbarn) {
      if (n < 0 || n >= frei.length || gesehen[n] || !frei[n]) continue;
      gesehen[n] = 1;
      warteschlange.push(n);
    }
  }
  return false;
}

/** Die erste feste Nadelgruppe in Flugrichtung und ihr Abstand zum Start. */
function ersteGruppe(level: Level): { gruppe: Nadel[]; abstand: number } | null {
  const fest = level.nadeln.filter((n) => !n.faellt && !n.pendel);
  if (level.art === 'strecke') {
    // Gruppen sind Spalten: gleiche x-Position.
    const vorn = fest.filter((n) => Math.min(n.von.x, n.bis.x) > level.start.x);
    if (!vorn.length) return null;
    const x = Math.min(...vorn.map((n) => Math.min(n.von.x, n.bis.x)));
    return {
      gruppe: vorn.filter((n) => Math.abs(Math.min(n.von.x, n.bis.x) - x) < 1),
      abstand: x - level.start.x,
    };
  }
  // Hoch: Gruppen sind Reihen. Die erste ist die tiefste UEBER dem Start.
  const oben = fest.filter((n) => Math.max(n.von.y, n.bis.y) < level.start.y);
  if (!oben.length) return null;
  const y = Math.max(...oben.map((n) => Math.max(n.von.y, n.bis.y)));
  const gruppe = oben.filter((n) =>
    Math.min(n.von.y, n.bis.y) <= y && Math.max(n.von.y, n.bis.y) >= y - 60);
  return { gruppe, abstand: level.start.y - y };
}

export function pruefeLevel(level: Level): Befund {
  const hoehe = level.groesse.hoehe;
  const maengel: string[] = [];

  const schaffbar = wegFrei(level);
  if (!schaffbar) maengel.push('kein freier Weg vom Start ins Ziel');

  const steig = steigflug(level);
  if (steig < STEIGFLUG_SPANNE.min || steig > STEIGFLUG_SPANNE.max) {
    maengel.push(`Steigflug ${steig.toFixed(0)} px/s, Richtwert ${STEIGFLUG_RICHTWERT}`);
  }

  // ⚠ Level 1 hatte Start und beide Luecken auf einer Linie — der Ballon stieg
  // von allein durch. Ein Level, das man ohne Eingabe schafft, ist keins.
  const ohneEingabe = ohneZutun(level, false);
  const nurHalten = ohneZutun(level, true);
  if (ohneEingabe) maengel.push('ohne Eingabe geschafft');
  if (nurHalten) maengel.push('mit stillem Halten geschafft');

  // ⚠ In der ersten Fassung lag der Start eines Streckenlevels genau auf Hoehe
  // der ersten Nadelspitze: Man flog ohne Vorwarnung hinein.
  const erste = ersteGruppe(level);
  const quer = level.art === 'strecke' ? level.start.y : level.start.x;
  const startFrei = !erste || !versperrt(level, erste.gruppe, quer);
  const vorlauf = erste ? erste.abstand : Infinity;
  if (level.art === 'strecke' && !startFrei) {
    maengel.push('Start liegt nicht im freien Korridor der ersten Nadeln');
  }
  if (level.art === 'hoch' && !startFrei && vorlauf < HOCH_ABSTAND_MIN) {
    maengel.push(`Nadel nur ${vorlauf.toFixed(0)} px ueber dem Start`);
  }
  if (level.art === 'strecke' && vorlauf < VORLAUF_MIN) {
    maengel.push(`nur ${vorlauf.toFixed(0)} px Vorlauf bis zur ersten Nadel`);
  }

  const fenster = Math.min(...level.nadeln.map((n) => fallFenster(n, hoehe)));
  if (fenster < FALL_FENSTER_MIN) {
    maengel.push(`fallende Nadel laesst nur ${fenster.toFixed(2)} s Zeit`);
  }

  return {
    schaffbar, steigflug: steig, ohneEingabe, nurHalten,
    startFrei, vorlauf, fallFenster: fenster, maengel,
  };
}
