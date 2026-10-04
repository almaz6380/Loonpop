// Wann eine Vollbild-Anzeige kommen darf (04.10.2026, Version 1.1).
//
// Reine Logik ohne Capacitor, damit sie testbar ist (werbetakt.test.ts).
// Werbung kommt nur nach dem Platzen, und dann nur bei jedem dritten Mal und
// fruehestens 90 Sekunden nach der letzten. Ein Geschicklichkeitsspiel lebt vom
// schnellen „Nochmal“: Eine Anzeige nach jedem Fehlversuch wuerde genau das
// bestrafen, was das Spiel ausmacht.
//
// ⚠ Gezeigt wird erst, wenn man „Nochmal“ oder „Level“ tippt, nie im Moment des
// Platzens. Der Platz-Effekt und das Ende-Fenster gehoeren dem Spieler
// (siehe CLAUDE.md, „Der Nachklang“).

export const JEDER_WIEVIELTE = 3;
export const MINDESTABSTAND_MS = 90_000;

export type Takt = {
  /** Wie oft der Ballon seit dem Start geplatzt ist. */
  platzer: number;
  /** Steht eine Anzeige an (beim naechsten Tippen auf Nochmal/Level)? */
  faellig: boolean;
  /** Wann die letzte Anzeige lief (ms), 0 = noch keine. */
  zuletzt: number;
};

export const neuerTakt = (): Takt => ({ platzer: 0, faellig: false, zuletzt: 0 });

/** Der Ballon ist geplatzt: zaehlen und merken, ob danach eine Anzeige ansteht. */
export function geplatzt(t: Takt, jetzt: number): Takt {
  const platzer = t.platzer + 1;
  const wieder = t.zuletzt === 0 || jetzt - t.zuletzt >= MINDESTABSTAND_MS;
  return { ...t, platzer, faellig: t.faellig || (platzer % JEDER_WIEVIELTE === 0 && wieder) };
}

/**
 * Der Spieler verlaesst das Ende-Fenster. Gibt zurueck, ob JETZT eine Anzeige
 * laufen soll; die Faelligkeit ist danach verbraucht, ob gezeigt oder nicht.
 */
export function weiter(t: Takt, jetzt: number, werbefrei: boolean): { takt: Takt; zeigen: boolean } {
  if (!t.faellig) return { takt: t, zeigen: false };
  if (werbefrei) return { takt: { ...t, faellig: false }, zeigen: false };
  return { takt: { ...t, faellig: false, zuletzt: jetzt }, zeigen: true };
}
