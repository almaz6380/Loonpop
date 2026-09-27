// Alle Texte laufen hierueber — nie fest im Code, gleiche Regel wie in den
// anderen fuenf Apps. Neue Sprache: JSON in locales/ anlegen und hier
// eintragen, sonst faellt sie stumm auf Englisch zurueck.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';

const gespeichert = localStorage.getItem('sprache');
const geraet = navigator.language?.slice(0, 2);

i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: gespeichert || (geraet === 'de' ? 'de' : 'en'),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
