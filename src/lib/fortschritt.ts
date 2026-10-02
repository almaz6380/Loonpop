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

const SCHLUESSEL = 'loonpop.fortschritt';

export type Fortschritt = {
  /** Fuer spaetere Umbauten (M5: Konten) — dann weiss man, was hier lag. */
  v: 1;
  /** Bestzeit in Sekunden je geschafftem Level, nach Level-ID. */
  bestzeit: Record<string, number>;
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
    return { v: 1, bestzeit: f.bestzeit };
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
