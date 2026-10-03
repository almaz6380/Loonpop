// Der Fortschritt auf dem Geraet: welche Level geschafft sind und in welcher
// Bestzeit.
//
// Liegt bewusst AUSSERHALB von src/spiel/: Der Spielkern kennt keinen Browser
// (siehe CLAUDE.md, Regel 3). Die Rechnung selbst (`mitSieg`, `offen`) ist
// trotzdem rein, damit sie ohne Browser testbar bleibt — nur `lade` und
// `speichere` fassen den Speicher an.
//
// ⚠ Schluessel sind die Level-IDS, nicht die Positionen in der Liste. Schiebt
// man spaeter ein Level ein, bleibt der Fortschritt beim richtigen Level.

import type { EndlosArt } from '../spiel/typen.ts';

const SCHLUESSEL = 'loonpop.fortschritt';

export type Fortschritt = {
  /** Fuer spaetere Umbauten (M5: Konten) — dann weiss man, was hier lag. */
  v: 1;
  /** Bestzeit in Sekunden je geschafftem Level, nach Level-ID. */
  bestzeit: Record<string, number>;
  /**
   * Bestweite im Endlos-Lauf (m). Optional, damit Staende von vor dem
   * Endlos-Modus ohne Umbau weiter gelten.
   */
  endlos?: Partial<Record<EndlosArt, number>>;
};

const leer = (): Fortschritt => ({ v: 1, bestzeit: {} });

/**
 * ⚠ Jeder Zugriff in try/catch: In privaten Fenstern oder bei gesperrtem
 * Speicher wirft localStorage. Dann spielt man eben ohne Fortschritt — das
 * Spiel darf daran nicht haengen bleiben.
 */
export function lade(): Fortschritt {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return leer();
    const f = JSON.parse(roh) as Partial<Fortschritt>;
    if (f.v !== 1 || typeof f.bestzeit !== 'object' || f.bestzeit === null) return leer();
    const endlos = typeof f.endlos === 'object' && f.endlos !== null ? f.endlos : undefined;
    return { v: 1, bestzeit: f.bestzeit, ...(endlos ? { endlos } : {}) };
  } catch {
    return leer();
  }
}

export function speichere(f: Fortschritt): void {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(f));
  } catch {
    // Kein Speicher — siehe `lade`.
  }
}

/** Traegt einen geschafften Lauf ein. `neu` heisst: erste oder bessere Zeit. */
export function mitSieg(f: Fortschritt, id: number, zeit: number): { f: Fortschritt; neu: boolean } {
  const alt = f.bestzeit[id];
  if (alt !== undefined && alt <= zeit) return { f, neu: false };
  return { f: { ...f, bestzeit: { ...f.bestzeit, [id]: zeit } }, neu: true };
}

/**
 * Ist das Level an Stelle `index` spielbar? Das erste immer, jedes weitere,
 * sobald das davor geschafft ist.
 */
export function offen(f: Fortschritt, ids: number[], index: number): boolean {
  return index === 0 || f.bestzeit[ids[index - 1]] !== undefined;
}

/**
 * Welches Level der grosse Knopf im Menue startet: das erste offene, das noch
 * nicht geschafft ist. Ist alles geschafft, das letzte — dort jagt man Bestzeiten.
 */
export function naechstes(f: Fortschritt, ids: number[]): number {
  const i = ids.findIndex((id, k) => offen(f, ids, k) && f.bestzeit[id] === undefined);
  return i >= 0 ? i : ids.length - 1;
}

/** Traegt eine Endlos-Weite ein. `neu` heisst: weiter als je zuvor. */
export function mitWeite(f: Fortschritt, art: EndlosArt, meter: number): { f: Fortschritt; neu: boolean } {
  const alt = f.endlos?.[art];
  if (alt !== undefined && alt >= meter) return { f, neu: false };
  return { f: { ...f, endlos: { ...f.endlos, [art]: meter } }, neu: true };
}
