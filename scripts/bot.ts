// Ein Bot, der die Level mit der echten Physik spielt.
//
//   npm run bot           alle Level
//   npm run bot -- 5 7    nur diese
//   npm run bot -- endlos die Endlos-Laeufe, je 12 Seeds: wie viele Meter?
//
// ⚠ Die Wegsuche (src/spiel/pruefung.ts) sieht nur die Geometrie. Am
// 01.10.2026 meldete sie Level 5 als schaffbar, und es war es nicht: Eine
// Aufwindzone hob den Ballon um rund 100 px, und bis zur naechsten Nadelspalte
// konnte er nicht wieder sinken — ohne Geblaese sinkt er hoechstens 40 px/s.
// Kein einziger von 30 000 Zufallsversuchen kam durch. Diesen Fehler findet nur,
// wer die Physik mitrechnet.
//
// Der Bot folgt einem Weg aus der Wegsuche und steuert nur ueber das, was auch
// der Spieler hat: Geblaese versetzen, druecken, loslassen. Er probiert ein
// Raster von Reglereinstellungen und meldet, wie viele davon ankommen.
//
// Er ist bewusst einfach und WARTET NICHT auf bewegte Nadeln. Fallende und
// pendelnde Nadeln laesst er deshalb weg; deren Zeitfenster prueft die
// Wegsuche. "0 von N" heisst also nicht sicher "unschaffbar" — aber es heisst:
// selbst nachspielen, bevor das Level ins Spiel kommt. Kein Teil von `npm test`,
// weil ein Bot daneben liegen kann, wo ein Test es nicht darf.

import { readdirSync, readFileSync } from 'node:fs';

import { neueWelt, BALLON_RADIUS } from '../src/spiel/welt.ts';
import { neueEndlosWelt, abschnitt, meter } from '../src/spiel/endlos.ts';
import type { EndlosArt } from '../src/spiel/typen.ts';
import { schritt, bodenHoehe, DUESE_HOEHE } from '../src/spiel/physik.ts';
import { abstandPunktStrecke } from '../src/spiel/kollision.ts';
import type { Level, Punkt } from '../src/spiel/typen.ts';

const ZELLE = 10;

/**
 * Ein Weg vom Start ins Ziel, mit `polster` px Extra-Abstand zu jeder Nadel.
 * Auf Strecken wird er danach zur gespannten Schnur geglaettet: Der kuerzeste
 * Gitterweg klebt an den Nadelspitzen und sinkt erst im letzten Moment — dafuer
 * ist der Ballon viel zu traege.
 */
function weg(level: Level, polster: number): Punkt[] | null {
  const { breite, hoehe } = level.groesse;
  const r = BALLON_RADIUS + polster;
  const spalten = Math.ceil(breite / ZELLE);
  const zeilen = Math.ceil(hoehe / ZELLE);
  const boden = bodenHoehe(hoehe);
  const fest = level.nadeln.filter((n) => !n.faellt && !n.pendel);
  const mitte = (i: number) => (i + 0.5) * ZELLE;

  const frei = new Uint8Array(spalten * zeilen);
  for (let sy = 0; sy < zeilen; sy++) {
    for (let sx = 0; sx < spalten; sx++) {
      const p = { x: mitte(sx), y: mitte(sy) };
      if (p.x < BALLON_RADIUS || p.x > breite - BALLON_RADIUS || p.y < BALLON_RADIUS || p.y > boden) continue;
      const getroffen = fest.some((n) =>
        Math.min(n.von.x, n.bis.x) - r <= p.x && Math.max(n.von.x, n.bis.x) + r >= p.x &&
        abstandPunktStrecke(p, n.von, n.bis) < r);
      if (!getroffen) frei[sy * spalten + sx] = 1;
    }
  }

  const zelle = (p: Punkt) =>
    Math.min(zeilen - 1, Math.floor(p.y / ZELLE)) * spalten + Math.min(spalten - 1, Math.floor(p.x / ZELLE));
  const start = zelle(level.start);
  frei[start] = 1;
  const vorher = new Int32Array(spalten * zeilen).fill(-2);
  vorher[start] = -1;
  const schlange = [start];
  let ziel = -1;
  for (let k = 0; k < schlange.length; k++) {
    const i = schlange[k];
    if (Math.hypot(mitte(i % spalten) - level.ziel.pos.x, mitte(Math.floor(i / spalten)) - level.ziel.pos.y) < level.ziel.radius) {
      ziel = i;
      break;
    }
    const sx = i % spalten;
    for (const n of [sx > 0 ? i - 1 : -1, sx < spalten - 1 ? i + 1 : -1, i - spalten, i + spalten]) {
      if (n < 0 || n >= frei.length || vorher[n] !== -2 || !frei[n]) continue;
      vorher[n] = i;
      schlange.push(n);
    }
  }
  if (ziel < 0) return null;
  const punkte: Punkt[] = [];
  for (let i = ziel; i >= 0; i = vorher[i]) punkte.unshift({ x: mitte(i % spalten), y: mitte(Math.floor(i / spalten)) });
  if (level.art !== 'strecke') return punkte;

  // Gespannte Schnur: je Spalte das freie Stueck um den Weg, dann so lange
  // mitteln, bis sich nichts mehr bewegt.
  const jeSpalte = new Map<number, number>();
  for (const p of punkte) {
    const sx = Math.floor(p.x / ZELLE);
    if (!jeSpalte.has(sx) && mitte(sx) < level.ziel.pos.x) jeSpalte.set(sx, Math.floor(p.y / ZELLE));
  }
  const xs = [...jeSpalte.keys()].sort((a, b) => a - b);
  const lo: number[] = [];
  const hi: number[] = [];
  const ys: number[] = [];
  for (const sx of xs) {
    let a = jeSpalte.get(sx)!;
    let b = a;
    while (a > 0 && frei[(a - 1) * spalten + sx]) a--;
    while (b < zeilen - 1 && frei[(b + 1) * spalten + sx]) b++;
    lo.push(mitte(a));
    hi.push(mitte(b));
    ys.push(mitte(jeSpalte.get(sx)!));
  }
  xs.push(Math.floor(level.ziel.pos.x / ZELLE));
  lo.push(level.ziel.pos.y);
  hi.push(level.ziel.pos.y);
  ys.push(level.ziel.pos.y);
  for (let runde = 0; runde < 4000; runde++) {
    for (let i = 1; i < ys.length - 1; i++) ys[i] = Math.max(lo[i], Math.min(hi[i], (ys[i - 1] + ys[i + 1]) / 2));
  }
  return xs.map((sx, i) => ({ x: mitte(sx), y: ys[i] }));
}

type Regler = { polster: number; voraus: number; kx: number; ky: number; versatz: number };

/** Ein Lauf mit einer Reglereinstellung. */
function spiele(level: Level, regler: Regler): { ausgang: string; zeit: number } {
  let punkte: Punkt[] | null = null;
  for (let p = regler.polster; p >= 0 && !punkte; p -= 5) punkte = weg(level, p);
  if (!punkte) return { ausgang: 'kein Weg', zeit: 0 };
  const w = neueWelt(level);
  const rand = (x: number) => Math.max(40, Math.min(level.groesse.breite - 40, x));
  let k = 0;
  for (let i = 0; i < 120 * 90 && w.ausgang === 'laeuft'; i++) {
    const b = w.ballon;
    if (level.art === 'strecke') {
      // Den Grundwind treiben lassen und nur die Hoehe halten: Ziel ist die
      // Weghoehe ein Stueck voraus.
      const ziel = punkte.find((q) => q.x >= b.pos.x + regler.voraus * 8) ?? punkte[punkte.length - 1];
      w.geblaese.x = rand(b.pos.x);
      w.geblaese.an = b.pos.y + b.geschw.y * regler.ky * 0.5 > ziel.y;
    } else {
      // Naechsten Wegpunkt suchen, dann ein Stueck voraus zielen.
      let beste = k;
      let abstand = Infinity;
      for (let j = k; j < Math.min(punkte.length, k + 60); j++) {
        const d = Math.hypot(punkte[j].x - b.pos.x, punkte[j].y - b.pos.y);
        if (d < abstand) { abstand = d; beste = j; }
      }
      k = beste;
      const ziel = punkte[Math.min(punkte.length - 1, k + regler.voraus)];
      const wunschVx = Math.max(-160, Math.min(160, (ziel.x - b.pos.x) * regler.kx));
      const wunschVy = Math.max(-160, Math.min(120, (ziel.y - b.pos.y) * regler.ky));
      const fehlerVx = wunschVx - b.geschw.x;
      // Seitlich lenkt nur der Strahlrand: Das Geblaese links vom Ballon
      // schiebt ihn nach rechts. Weiter oben ist der Strahl breiter, also
      // muss man weiter daneben stehen.
      const hoeheUeberDuese = level.groesse.hoehe - DUESE_HOEHE - b.pos.y;
      const daneben = Math.max(-1, Math.min(1, fehlerVx / 80)) * regler.versatz * (1 + (hoeheUeberDuese * 0.22) / 60);
      w.geblaese.x = rand(b.pos.x - daneben);
      w.geblaese.an = b.geschw.y > wunschVy || Math.abs(fehlerVx) > 60;
    }
    schritt(w);
  }
  return { ausgang: w.ausgang, zeit: w.zeit };
}

function raster(level: Level): Regler[] {
  const r: Regler[] = [];
  const strecke = level.art === 'strecke';
  for (const polster of strecke ? [10, 20, 30] : [20, 30, 40])
    for (const voraus of strecke ? [2, 5, 8, 12] : [8, 14, 22, 30])
      for (const kx of strecke ? [1] : [0.5, 0.9, 1.5])
        for (const ky of [0.8, 1.2, 2])
          for (const versatz of strecke ? [0] : [25, 40, 60]) r.push({ polster, voraus, kx, ky, versatz });
  return r;
}

/**
 * Ein Endlos-Lauf mit derselben Steuerung wie in den Leveln. Bewegte Nadeln
 * nimmt er heraus (er wartet nicht), den Nadelboden nicht: Wer zu langsam
 * steigt, platzt auch hier.
 */
function spieleEndlos(art: EndlosArt, seed: number): { meter: number; ausgang: string; zeit: number } {
  const w = neueEndlosWelt(art, seed);
  const e = w.endlos!;
  for (let i = 0; i < 600; i++) {
    const a = abschnitt(e, i);
    a.nadeln = a.nadeln.filter((n) => !n.faellt && !n.pendel);
  }
  // Der Weg: durch jede Luecke senkrecht hindurch.
  const punkte: Punkt[] = [];
  if (art === 'hoch') {
    let p = { ...w.ballon.pos };
    for (const a of e.abschnitte) {
      for (const q of [{ x: a.mitte, y: a.lage + 150 }, { x: a.mitte, y: a.lage - 40 }]) {
        const n = Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / ZELLE);
        for (let k = 1; k <= n; k++) punkte.push({ x: p.x + ((q.x - p.x) * k) / n, y: p.y + ((q.y - p.y) * k) / n });
        p = q;
      }
    }
  }
  const regler: Regler = { polster: 0, voraus: 30, kx: 0.9, ky: 2, versatz: 25 };
  let k = 0;
  for (let i = 0; i < 120 * 600 && w.ausgang === 'laeuft'; i++) {
    const b = w.ballon;
    if (art === 'strecke') {
      // Hoehe halten auf die Mitte der naechsten Saeule.
      const naechste = e.abschnitte.find((a) => a.lage > b.pos.x - 10)!;
      w.geblaese.x = b.pos.x;
      w.geblaese.an = b.pos.y + b.geschw.y * 0.4 > naechste.mitte;
    } else {
      let beste = k;
      let abstand = Infinity;
      for (let j = k; j < Math.min(punkte.length, k + 60); j++) {
        const d = Math.hypot(punkte[j].x - b.pos.x, punkte[j].y - b.pos.y);
        if (d < abstand) { abstand = d; beste = j; }
      }
      k = beste;
      const ziel = punkte[Math.min(punkte.length - 1, k + regler.voraus)];
      const wunschVx = Math.max(-160, Math.min(160, (ziel.x - b.pos.x) * regler.kx));
      const wunschVy = Math.max(-160, Math.min(120, (ziel.y - b.pos.y) * regler.ky));
      const fehlerVx = wunschVx - b.geschw.x;
      const hoeheUeberDuese = w.boden - DUESE_HOEHE - b.pos.y;
      const daneben = Math.max(-1, Math.min(1, fehlerVx / 80)) * regler.versatz * (1 + (hoeheUeberDuese * 0.22) / 60);
      w.geblaese.x = Math.max(40, Math.min(w.level.groesse.breite - 40, b.pos.x - daneben));
      w.geblaese.an = b.geschw.y > wunschVy || Math.abs(fehlerVx) > 60;
    }
    schritt(w);
  }
  return { meter: meter(w), ausgang: w.ausgang, zeit: w.zeit };
}

if (process.argv[2] === 'endlos') {
  for (const art of ['hoch', 'strecke'] as EndlosArt[]) {
    const laeufe = Array.from({ length: 12 }, (_, s) => spieleEndlos(art, 500 + s * 104729));
    const m = laeufe.map((l) => Math.round(l.meter)).sort((a, b) => a - b);
    const offen = laeufe.filter((l) => l.ausgang === 'laeuft').length;
    console.log(`Endlos ${art === 'hoch' ? '↑' : '→'}: ${m.join(' ')} m` +
      ` (Mitte ${m[6]} m${offen ? `, ${offen}× nach 10 min noch unterwegs` : ''})`);
  }
  process.exit(0);
}

const ordner = new URL('../src/spiel/level/', import.meta.url);
const nur = process.argv.slice(2).map(Number);
for (const datei of readdirSync(ordner).filter((d) => d.endsWith('.json')).sort()) {
  const level = JSON.parse(readFileSync(new URL(datei, ordner), 'utf8')) as Level;
  if (nur.length && !nur.includes(level.id)) continue;
  // Ohne bewegte Nadeln und ohne Zeitlimit: Der Bot wartet nicht, und die
  // Zeit soll er messen, nicht an ihr scheitern.
  const ohne: Level = {
    ...level,
    nadeln: level.nadeln.filter((n) => !n.faellt && !n.pendel),
    tempo: { ...level.tempo, zeitlimit: 0 },
  };
  const laeufe = raster(level).map((r) => spiele(ohne, r));
  const geschafft = laeufe.filter((l) => l.ausgang === 'geschafft');
  const beste = geschafft.length ? Math.min(...geschafft.map((l) => l.zeit)) : null;
  const limit = level.tempo.zeitlimit ? `, Limit ${level.tempo.zeitlimit} s` : '';
  console.log(`${geschafft.length ? '✓' : '✗'} ${String(level.id).padStart(2)} ${level.name}: ` +
    `${geschafft.length} von ${laeufe.length} angekommen` +
    (beste !== null ? `, schnellster in ${beste.toFixed(1)} s${limit}` : ''));
}
