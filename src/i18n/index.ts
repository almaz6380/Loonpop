// Alle Texte laufen hierueber — nie fest im Code, gleiche Regel wie in den
// anderen fuenf Apps. Neue Sprache: JSON in locales/ anlegen, hier und in
// src/lib/sprache.ts eintragen. Der Test in sprache.test.ts prueft, dass jede
// Datei alle Schluessel hat.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { istRtl, RUECKFALL, waehleSprache } from '../lib/sprache.ts';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import tr from './locales/tr.json';
import pl from './locales/pl.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';

const SCHLUESSEL = 'sprache';

/** ⚠ In privaten Fenstern wirft localStorage — dann eben ohne Merken. */
function gespeichert(): string | null {
  try { return localStorage.getItem(SCHLUESSEL); } catch { return null; }
}

/** Arabisch liest von rechts: Richtung und Sprache stehen am <html>. */
function seiteAnpassen(code: string): void {
  document.documentElement.lang = code;
  document.documentElement.dir = istRtl(code) ? 'rtl' : 'ltr';
}

const resources = Object.fromEntries(
  Object.entries({ de, en, es, fr, it, pt, tr, pl, ru, ja, ko, zh, ar })
    .map(([code, translation]) => [code, { translation }]),
);

const start = waehleSprache(gespeichert(), navigator.languages ?? [navigator.language]);

i18n.use(initReactI18next).init({
  resources,
  lng: start,
  fallbackLng: RUECKFALL,
  interpolation: { escapeValue: false },
});
seiteAnpassen(start);
i18n.on('languageChanged', seiteAnpassen);

export function setzeSprache(code: string): void {
  void i18n.changeLanguage(code);
  try { localStorage.setItem(SCHLUESSEL, code); } catch { /* siehe gespeichert() */ }
}

export default i18n;
