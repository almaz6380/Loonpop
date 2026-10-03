// Welche Sprache das Spiel spricht.
//
// Reine Rechnung, damit sie ohne Browser testbar bleibt — den Speicher und
// `navigator` fasst nur src/i18n/index.ts an.
//
// ⚠ Die Liste ist zugleich die Liste fuer den Store (02.10.2026): Jede Sprache
// hier muss auch dort einen Eintrag bekommen, sonst sieht jemand den Store auf
// Englisch und das Spiel in seiner Sprache, oder umgekehrt.

export type Sprache = { code: string; name: string; rtl?: boolean };

/** Der Name steht in der Sprache selbst — wer sie sucht, kann sie lesen. */
export const SPRACHEN: readonly Sprache[] = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'pl', name: 'Polski' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية', rtl: true },
];

const CODES = new Set(SPRACHEN.map((s) => s.code));
export const RUECKFALL = 'en';

/**
 * Gespeicherte Wahl zuerst, dann die Geraetesprachen der Reihe nach.
 * `pt-BR` wird zu `pt`, `zh-Hans-CN` zu `zh`. ⚠ Auch `zh-TW` landet bei `zh`
 * (Kurzzeichen) — besser als Englisch, bis es eine eigene Fassung gibt.
 */
export function waehleSprache(gespeichert: string | null, geraet: readonly string[]): string {
  if (gespeichert && CODES.has(gespeichert)) return gespeichert;
  for (const g of geraet) {
    const kurz = g.toLowerCase().split('-')[0];
    if (CODES.has(kurz)) return kurz;
  }
  return RUECKFALL;
}

export function istRtl(code: string): boolean {
  return SPRACHEN.some((s) => s.code === code && s.rtl);
}
