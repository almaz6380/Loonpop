// Zufall, der sich wiederholen laesst.
//
// Uebernommen aus tools/social/waehlen.mjs der Social-Automatik (dort wiederum
// aus tools/reels/storyboard.mjs) — bewaehrt und bewusst nicht neu erfunden.
//
// ⚠ Math.random() waere hier falsch: Ein Endlos-Lauf muss aus seinem Seed
// nachspielbar sein. Nur so laesst sich ein Bestenlisten-Eintrag ueberhaupt
// nachvollziehen und ein Fehlerbericht nachstellen.

/** Derselbe Seed ergibt dieselbe Zahlenfolge — auf jedem Geraet. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Aus einer Zeichenkette einen Seed machen (FNV-1a). */
export function saat(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
