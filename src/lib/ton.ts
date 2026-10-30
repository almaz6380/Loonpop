// Ton: Gebläse, Platzen, Ankommen (30.10.2026).
//
// Apple lehnte 1.0 am 30.10.2026 nach Richtlinie 4.3(a) ab („ähnlich wie andere
// Apps“). Bis dahin war das Spiel stumm. Das Gebläse soll man jetzt auch hören:
// Es rauscht lauter und heller, je stärker es bläst, und klingt nach dem
// Loslassen so langsam aus, wie der Strahl in physik.ts ausklingt.
//
// ⚠ Alles wird mit WebAudio ERZEUGT, es gibt keine Tondateien. Das Rauschen ist
// gefiltertes weißes Rauschen, das Platzen ein kurzer Knall, das Ankommen zwei
// Töne. So bleibt die App klein und läuft offline.
//
// ⚠ iOS spielt erst nach einer Berührung Ton. `wecken()` hängt deshalb am
// pointerdown der Spielseite, nicht am Laden der Seite.
//
// Der Spielkern erfährt von alledem nichts (Regel 3): Die Spielseite liest
// `geblaese.staerke` und den Ausgang und gibt beides hierher weiter.

const SCHLUESSEL = 'ton';

/** Ist der Ton an? Ohne Eintrag: ja. ⚠ In privaten Fenstern wirft localStorage. */
export function tonAn(): boolean {
  try { return localStorage.getItem(SCHLUESSEL) !== 'aus'; } catch { return true; }
}

export function setzeTon(an: boolean): void {
  try { localStorage.setItem(SCHLUESSEL, an ? 'an' : 'aus'); } catch { /* dann eben ohne Merken */ }
  if (!an) geblaese(0);
}

/**
 * Wie das Gebläse bei einer Stärke 0…1 klingt. Eine reine Funktion, damit der
 * Test sie ohne Browser prüfen kann.
 *
 * Lautstärke und Tonhöhe steigen mit der Stärke. Unter 2 % ist es still, sonst
 * bliebe nach dem Ausklingen ein leises Dauerrauschen.
 */
export function geblaeseKlang(staerke: number): { lautstaerke: number; frequenz: number } {
  const s = Math.max(0, Math.min(1, staerke));
  if (s < 0.02) return { lautstaerke: 0, frequenz: 400 };
  return { lautstaerke: 0.05 + 0.2 * s, frequenz: 400 + 900 * s };
}

let ctx: AudioContext | null = null;
let rauschen: AudioBuffer | null = null;
let filter: BiquadFilterNode | null = null;
let pegel: GainNode | null = null;

function weisses(c: AudioContext, sekunden: number): AudioBuffer {
  const puffer = c.createBuffer(1, Math.round(c.sampleRate * sekunden), c.sampleRate);
  const d = puffer.getChannelData(0);
  // ⚠ Hier darf Math.random() stehen: Es ist Ton, kein Spielzustand. Der Lauf
  // bleibt aus seinem Seed nachspielbar (Falle 4 betrifft nur die Welt).
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return puffer;
}

/** Beim ersten Fingertipp: Audio anlegen bzw. nach einer Pause wieder aufwecken. */
export function wecken(): void {
  if (!tonAn() || typeof window === 'undefined') return;
  const Klasse = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Klasse) return;
  if (!ctx) {
    ctx = new Klasse();
    rauschen = weisses(ctx, 2);
    const quelle = ctx.createBufferSource();
    quelle.buffer = rauschen;
    quelle.loop = true;
    filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    pegel = ctx.createGain();
    pegel.gain.value = 0;
    quelle.connect(filter).connect(pegel).connect(ctx.destination);
    quelle.start();
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

/** Jedes Bild: das Rauschen der aktuellen Gebläsestärke nachführen. */
export function geblaese(staerke: number): void {
  if (!ctx || !pegel || !filter) return;
  const k = tonAn() ? geblaeseKlang(staerke) : { lautstaerke: 0, frequenz: 400 };
  const t = ctx.currentTime;
  // Weich nachziehen: Ein harter Sprung des Pegels knackt hörbar.
  pegel.gain.setTargetAtTime(k.lautstaerke, t, 0.04);
  filter.frequency.setTargetAtTime(k.frequenz, t, 0.06);
}

/** Der Ballon platzt: ein kurzer, gefilterter Knall. */
export function platzen(): void {
  if (!ctx || !rauschen || !tonAn()) return;
  const t = ctx.currentTime;
  const quelle = ctx.createBufferSource();
  quelle.buffer = rauschen;
  const hoch = ctx.createBiquadFilter();
  hoch.type = 'highpass';
  hoch.frequency.value = 900;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  quelle.connect(hoch).connect(g).connect(ctx.destination);
  quelle.start(t);
  quelle.stop(t + 0.2);
}

/** Angekommen: zwei helle Töne nacheinander (eine Quinte, dann die Oktave). */
export function ankommen(): void {
  if (!ctx || !tonAn()) return;
  const t = ctx.currentTime;
  [[784, 0], [1175, 0.12]].forEach(([hz, ab]) => {
    const osz = ctx!.createOscillator();
    osz.type = 'triangle';
    osz.frequency.value = hz;
    const g = ctx!.createGain();
    g.gain.setValueAtTime(0, t + ab);
    g.gain.linearRampToValueAtTime(0.22, t + ab + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + ab + 0.5);
    osz.connect(g).connect(ctx!.destination);
    osz.start(t + ab);
    osz.stop(t + ab + 0.55);
  });
}
