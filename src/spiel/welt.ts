// Eine Welt aufbauen und zuruecksetzen.

import type { Level, Welt } from './typen.ts';

/** Radius des Ballons in Levelkoordinaten. */
export const BALLON_RADIUS = 26;

export function neueWelt(level: Level): Welt {
  return {
    level,
    ballon: {
      pos: { ...level.start },
      vorher: { ...level.start },
      geschw: { x: 0, y: 0 },
      radius: BALLON_RADIUS,
    },
    geblaese: { x: level.geblaeseStart, an: false, staerke: 0 },
    zeit: 0,
    nachher: 0,
    ausgang: 'laeuft',
    boden: level.groesse.hoehe,
  };
}
