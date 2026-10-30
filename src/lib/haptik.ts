// Vibration (30.10.2026, nach der Ablehnung nach Apple 4.3(a), siehe ton.ts).
//
// Ein leichtes Tippen beim Anschalten des Gebläses, ein harter Stoß beim
// Platzen und ein „Erfolg“ beim Ankommen. Über @capacitor/haptics, das auf
// iPhone die Taptic Engine nutzt. Im Browser tut es, was der Browser kann (oft
// nichts), und Fehler werden geschluckt: Vibration ist Beiwerk und darf das
// Spiel nie anhalten.

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

import { tonAn } from './ton.ts';

/** ⚠ Hängt am selben Schalter wie der Ton: Wer es still will, will es ganz still. */
function still(): boolean {
  return !tonAn();
}

export function tippen(): void {
  if (still()) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

export function stoss(): void {
  if (still()) return;
  Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
}

export function erfolg(): void {
  if (still()) return;
  Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}
