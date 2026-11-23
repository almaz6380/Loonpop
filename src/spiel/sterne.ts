// Sterne je Level (Neugestaltung 23.11.2026). Reine Rechnung (Regel 3).
//
//   1 Stern  — Ziel erreicht
//   +1       — unter `level.sterneZeit` (Spielzeit)
//   +1       — alle Muenzen eingesammelt
//
// Ein Level ohne Zeit- oder Muenzvorgabe schenkt den jeweiligen Stern nicht,
// sonst waeren alte Level ohne Muenzen sofort drei Sterne wert.

import type { Welt } from './typen.ts';

export function alleMuenzen(welt: Welt): boolean {
  const n = welt.level.muenzen?.length ?? 0;
  return n > 0 && (welt.gesammelt?.length ?? 0) >= n;
}

export function sterneFuer(welt: Welt): 0 | 1 | 2 | 3 {
  if (welt.ausgang !== 'geschafft') return 0;
  let s = 1;
  const z = welt.level.sterneZeit;
  if (z !== undefined && welt.zeit <= z) s++;
  if (alleMuenzen(welt)) s++;
  return s as 1 | 2 | 3;
}
