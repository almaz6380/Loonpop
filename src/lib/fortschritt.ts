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
  /** Beste Sternzahl je Level-ID (seit 23.11.2026). */
  sterne?: Record<string, number>;
  /** Meiste eingesammelte Muenzen je Level-ID — das Konto zaehlt nur Verbesserungen. */
  muenzenLevel?: Record<string, number>;
  /** Muenzkonto (fuer Ballon-Skins). */
  muenzen?: number;
  /** Gekaufte Ballon-Skins und der gewaehlte (siehe SKINS). */
  skins?: string[];
  skin?: string;
  /** Tages-Herausforderung: Tag (lokal, JJJJ-MM-TT), Bestweite, Serie. */
  tages?: { tag: string; beste: number; serie: number };
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
    const obj = (x: unknown) => (typeof x === 'object' && x !== null ? x as Record<string, number> : undefined);
    return {
      v: 1, bestzeit: f.bestzeit, ...(endlos ? { endlos } : {}),
      ...(obj(f.sterne) ? { sterne: obj(f.sterne) } : {}),
      ...(obj(f.muenzenLevel) ? { muenzenLevel: obj(f.muenzenLevel) } : {}),
      ...(typeof f.muenzen === 'number' ? { muenzen: f.muenzen } : {}),
      ...(Array.isArray(f.skins) ? { skins: f.skins } : {}),
      ...(typeof f.skin === 'string' ? { skin: f.skin } : {}),
      ...(typeof f.tages === 'object' && f.tages !== null ? { tages: f.tages } : {}),
    };
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

/**
 * Traegt Sterne und Muenzen eines geschafften Laufs ein. Ins Konto kommt nur,
 * was ueber das bisher Beste in diesem Level hinausgeht — sonst liesse sich ein
 * leichtes Level endlos melken.
 */
export function mitSternen(f: Fortschritt, id: number, sterne: number, muenzen: number): { f: Fortschritt; neueSterne: boolean; plusMuenzen: number } {
  const alteSterne = f.sterne?.[id] ?? 0;
  const alteMuenzen = f.muenzenLevel?.[id] ?? 0;
  const plusMuenzen = Math.max(0, muenzen - alteMuenzen);
  return {
    f: {
      ...f,
      sterne: { ...f.sterne, [id]: Math.max(alteSterne, sterne) },
      muenzenLevel: { ...f.muenzenLevel, [id]: Math.max(alteMuenzen, muenzen) },
      muenzen: (f.muenzen ?? 0) + plusMuenzen,
    },
    neueSterne: sterne > alteSterne,
    plusMuenzen,
  };
}

// ------------------------------------------------------------------ Welten
// Neugestaltung 23.11.2026: Eine Welt oeffnet sich mit Sternen aus der
// vorigen — anderthalb je Level. Wer jedes Level nur knapp schafft, muss also
// zurueck und Muenzen oder Zeit holen; das ist der Grund, ueberhaupt Sterne
// zu sammeln.

/** Sterne, die man in Welt w−1 braucht, damit Welt w aufgeht. */
export const sterneNoetig = (levelInVorigerWelt: number) => Math.ceil(levelInVorigerWelt * 1.5);

export function sterneIn(f: Fortschritt, ids: number[]): number {
  return ids.reduce((s, id) => s + (f.sterne?.[id] ?? 0), 0);
}

/** Ist Welt `w` (1-basiert) offen? `welten[i]` = IDs der Level in Welt i+1. */
export function weltOffen(f: Fortschritt, welten: number[][], w: number): boolean {
  if (w <= 1) return true;
  const vorige = welten[w - 2];
  return weltOffen(f, welten, w - 1) && sterneIn(f, vorige) >= sterneNoetig(vorige.length);
}

// ------------------------------------------------------------- Ballon-Skins

export const SKINS = [
  { id: 'rot', preis: 0 }, { id: 'blau', preis: 30 }, { id: 'gelb', preis: 30 },
  { id: 'gruen', preis: 40 }, { id: 'lila', preis: 40 }, { id: 'stern', preis: 80 },
  { id: 'herz', preis: 100 }, { id: 'heissluft', preis: 150 }, { id: 'gold', preis: 250 },
] as const;
export type SkinId = (typeof SKINS)[number]['id'];

export function skinBesitzt(f: Fortschritt, id: SkinId): boolean {
  return id === 'rot' || (f.skins?.includes(id) ?? false);
}

/** Kauft einen Skin, wenn das Konto reicht. Gibt null zurueck, wenn nicht. */
export function skinKaufen(f: Fortschritt, id: SkinId): Fortschritt | null {
  if (skinBesitzt(f, id)) return { ...f, skin: id };
  const preis = SKINS.find((s) => s.id === id)!.preis;
  if ((f.muenzen ?? 0) < preis) return null;
  return { ...f, muenzen: (f.muenzen ?? 0) - preis, skins: [...(f.skins ?? []), id], skin: id };
}

// ------------------------------------------------------ Tages-Herausforderung
// Ein Endlos-Lauf je Tag, fuer alle gleich (Seed aus dem lokalen Datum).
// Gezaehlt wird die Bestweite des Tages und eine Serie aufeinanderfolgender Tage.

export function tagesSchluessel(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function gestern(tag: string): string {
  const [j, m, t] = tag.split('-').map(Number);
  return tagesSchluessel(new Date(j, m - 1, t - 1));
}

/** Traegt einen Tageslauf ein. `neu` = neue Tagesbestweite. */
export function mitTageslauf(f: Fortschritt, tag: string, meter: number): { f: Fortschritt; neu: boolean } {
  const alt = f.tages;
  const heute = alt?.tag === tag;
  const serie = heute ? alt.serie : alt?.tag === gestern(tag) ? alt.serie + 1 : 1;
  const beste = heute ? Math.max(alt.beste, meter) : meter;
  return { f: { ...f, tages: { tag, beste, serie } }, neu: !heute || meter > alt.beste };
}
