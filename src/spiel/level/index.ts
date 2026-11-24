// Die Level in Reihenfolge.
//
// Ein Level ist eine JSON-Datei — mit Absicht: So laesst sich ein Level in zwei
// Minuten aendern, ohne Code anzufassen. Neues Level: Datei anlegen, hier
// eintragen, dann `npm test` (Wegsuche) und `npm run bot` (echte Physik).
// Die Level der Welten 2–4 (101–112, 201–212, 301–312) baut
// `scripts/welten-bauen.ts` aus dem Endlos-Generator (23.11.2026).

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
import level019 from './019.json';
import level020 from './020.json';
import level021 from './021.json';
import level101 from './101.json';
import level102 from './102.json';
import level103 from './103.json';
import level104 from './104.json';
import level105 from './105.json';
import level106 from './106.json';
import level107 from './107.json';
import level108 from './108.json';
import level109 from './109.json';
import level110 from './110.json';
import level111 from './111.json';
import level112 from './112.json';
import level201 from './201.json';
import level202 from './202.json';
import level203 from './203.json';
import level204 from './204.json';
import level205 from './205.json';
import level206 from './206.json';
import level207 from './207.json';
import level208 from './208.json';
import level209 from './209.json';
import level210 from './210.json';
import level211 from './211.json';
import level212 from './212.json';
import level301 from './301.json';
import level302 from './302.json';
import level303 from './303.json';
import level304 from './304.json';
import level305 from './305.json';
import level306 from './306.json';
import level307 from './307.json';
import level308 from './308.json';
import level309 from './309.json';
import level310 from './310.json';
import level311 from './311.json';
import level312 from './312.json';
import type { Level } from '../typen.ts';

const ALLE = [
  level001, level002, level003, level004, level005, level006, level007, level008, level009, level010, level011, level012, level013, level014, level015, level016, level017, level018, level019, level020, level021, level101, level102, level103, level104, level105, level106, level107, level108, level109, level110, level111, level112, level201, level202, level203, level204, level205, level206, level207, level208, level209, level210, level211, level212, level301, level302, level303, level304, level305, level306, level307, level308, level309, level310, level311, level312,
] as Level[];

/** Zu welcher Welt ein Level gehoert. Die alten Level ohne Angabe sind Welt 1. */
export const weltVon = (l: Level) => l.welt ?? 1;

/**
 * Gespielt wird nur nach oben (Josef, 02.10.2026). Die Strecken bleiben als
 * Dateien liegen und werden weiter geprueft. Reihenfolge: nach Welt, darin
 * nach Datei. Fortschritt haengt an der ID, nicht an der Stelle in der Liste.
 */
export const LEVEL = ALLE.filter((l) => l.art === 'hoch')
  .sort((a, b) => weltVon(a) - weltVon(b));

/** Die vier Welten (Neugestaltung 23.11.2026). */
export const WELTEN = [1, 2, 3, 4] as const;
export type WeltNr = (typeof WELTEN)[number];
