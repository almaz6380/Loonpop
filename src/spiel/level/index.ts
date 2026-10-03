// Die handgebauten Level in Reihenfolge.
//
// Ein Level ist eine JSON-Datei — mit Absicht: So laesst sich ein Level in zwei
// Minuten aendern, ohne Code anzufassen, und der Schwierigkeitsverlauf bleibt
// an einer Stelle nachlesbar. Neues Level: Datei anlegen, hier eintragen, dann
// `npm test` (Wegsuche) und `npm run bot` (echte Physik).

import level001 from './001.json';
import level002 from './002.json';
import level003 from './003.json';
import level004 from './004.json';
import level005 from './005.json';
import level006 from './006.json';
import level007 from './007.json';
import level008 from './008.json';
import level009 from './009.json';
import level010 from './010.json';
import level011 from './011.json';
import level012 from './012.json';
import level013 from './013.json';
import level014 from './014.json';
import level015 from './015.json';
import level016 from './016.json';
import level017 from './017.json';
import level018 from './018.json';
import type { Level } from '../typen.ts';

const ALLE = [
  level001, level002, level003, level004, level005, level006,
  level007, level008, level009, level010, level011, level012,
  level013, level014, level015, level016, level017, level018,
] as Level[];

/**
 * Gespielt wird nur noch nach oben (Josef, 02.10.2026). Die Strecken bleiben
 * als Dateien liegen und werden weiter geprueft — ausgeblendet, nicht
 * geloescht, falls sie zurueckkommen. Fortschritt haengt an der ID, nicht an
 * der Stelle in der Liste, und bleibt deshalb gueltig.
 */
export const LEVEL = ALLE.filter((l) => l.art === 'hoch');
