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
import type { Level } from '../typen.ts';

export const LEVEL = [
  level001, level002, level003, level004, level005, level006,
  level007, level008, level009, level010, level011, level012,
] as Level[];
