// Die handgebauten Level in Reihenfolge.
//
// Ein Level ist eine JSON-Datei — mit Absicht: So laesst sich ein Level in zwei
// Minuten aendern, ohne Code anzufassen, und der Schwierigkeitsverlauf bleibt
// an einer Stelle nachlesbar. Neues Level: Datei anlegen, hier eintragen.

import level001 from './001.json';
import level002 from './002.json';
import level003 from './003.json';
import level004 from './004.json';
import level005 from './005.json';
import type { Level } from '../typen.ts';

export const LEVEL = [level001, level002, level003, level004, level005] as Level[];
