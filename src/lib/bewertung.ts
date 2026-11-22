// Bitte um eine Store-Bewertung (Version 1.1, 22.11.2026).
//
// Bewertungen sind fuer eine kleine App der staerkste Hebel in der Store-Suche.
// Gefragt wird aber nur, wenn es passt:
//   • erst ab 5 geschafften Leveln — wer so weit kommt, mag das Spiel;
//   • nur direkt nach einem geschafften Level, beim Verlassen des Ende-Fensters,
//     nie nach dem Platzen;
//   • hoechstens alle 90 Tage (unsere eigene Bremse; das System drosselt
//     zusaetzlich, iOS zeigt den Dialog hoechstens 3-mal im Jahr);
//   • nie im selben Moment wie eine Vollbild-Anzeige;
//   • nur in der App, nie im Browser;
//   • ⚠ nie gegen eine Belohnung. Apple und Google verbieten Anreize, und das
//     System meldet auch nicht zurueck, ob jemand bewertet hat.

import { Capacitor } from '@capacitor/core';

/** Ab so vielen geschafften Leveln darf gefragt werden. */
export const AB_LEVELN = 5;
/** So lange (ms) nach einer Frage wird nicht wieder gefragt. */
export const ABSTAND_MS = 90 * 24 * 60 * 60 * 1000;

const SCHLUESSEL = 'bewertungGefragt';

export type BewertungsLage = {
  /** Wie viele Level insgesamt geschafft sind. */
  geschafft: number;
  /** Wann zuletzt gefragt wurde (ms), null = noch nie. */
  zuletzt: number | null;
  jetzt: number;
  /** Kommt gerade eine Vollbild-Anzeige? */
  vollbild: boolean;
  /** Laeuft die App nativ (nicht im Browser)? */
  nativ: boolean;
};

/** Die reine Regel, ohne Speicher und ohne Plugin (bewertung.test.ts). */
export function darfFragen(l: BewertungsLage): boolean {
  if (!l.nativ || l.vollbild) return false;
  if (l.geschafft < AB_LEVELN) return false;
  return l.zuletzt === null || l.jetzt - l.zuletzt >= ABSTAND_MS;
}

function zuletztGefragt(): number | null {
  try {
    const w = Number(localStorage.getItem(SCHLUESSEL));
    return Number.isFinite(w) && w > 0 ? w : null;
  } catch {
    return null;
  }
}

/**
 * Nach einem geschafften Level aufrufen, wenn das Ende-Fenster verlassen wird.
 * Fehler werden geschluckt: Die Bitte ist Beiwerk und darf das Spiel nie
 * aufhalten.
 */
export async function vielleichtUmBewertungBitten(geschafft: number, vollbild: boolean): Promise<void> {
  try {
    const jetzt = Date.now();
    if (!darfFragen({ geschafft, zuletzt: zuletztGefragt(), jetzt, vollbild, nativ: Capacitor.isNativePlatform() })) return;
    try { localStorage.setItem(SCHLUESSEL, String(jetzt)); } catch { /* dann eben ohne Merken */ }
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch (e) {
    console.warn('Bewertungsbitte fehlgeschlagen:', e);
  }
}
