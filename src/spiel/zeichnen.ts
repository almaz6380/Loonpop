// Alles, was auf das Canvas kommt.
//
// Getrennt von der Physik, damit der Spielkern ohne Browser testbar bleibt —
// diese Datei ist die einzige im Ordner, die ein Canvas ueberhaupt kennt.
//
// ⚠ Das Level rechnet in EIGENEN Koordinaten (720×1280). Hier wird einmal
// umgerechnet und danach in Levelkoordinaten gezeichnet. Wer stattdessen
// ueberall mit Bildschirmpixeln rechnet, bekommt auf jedem Geraet ein anderes
// Spielfeld — und damit unterschiedlich schwere Level.

import type { Welt, Punkt } from './typen.ts';
import { nadelJetzt } from './physik.ts';

// ⚠ breite/hoehe sind CSS-Pixel, nicht Geraetepixel. Das Canvas ist bei
// doppelter Pixeldichte doppelt so gross; die Umrechnung macht EINMAL die
// Spielseite per ctx.setTransform(dpr, …). Wer sie hier noch einmal setzt oder
// zurueckstellt, zeichnet das ganze Spielfeld in die linke obere Ecke — genau
// das ist am 27.09.2026 passiert.
export type Sicht = { skala: number; randX: number; randY: number; breite: number; hoehe: number };

/** Wie das Level auf diesen Bildschirm passt: ganz sichtbar, mittig. */
export function sichtBerechnen(
  breite: number, hoehe: number,
  levelBreite: number, levelHoehe: number,
): Sicht {
  const skala = Math.min(breite / levelBreite, hoehe / levelHoehe);
  return {
    skala,
    randX: (breite - levelBreite * skala) / 2,
    randY: (hoehe - levelHoehe * skala) / 2,
    breite,
    hoehe,
  };
}

/** Bildschirmpunkt → Levelkoordinate. Fuer die Fingereingabe. */
export function zuLevel(p: Punkt, sicht: Sicht): Punkt {
  return { x: (p.x - sicht.randX) / sicht.skala, y: (p.y - sicht.randY) / sicht.skala };
}

function zwischen(a: Punkt, b: Punkt, blende: number): Punkt {
  return { x: a.x + (b.x - a.x) * blende, y: a.y + (b.y - a.y) * blende };
}

export function zeichne(
  ctx: CanvasRenderingContext2D,
  welt: Welt,
  blende: number,
  sicht: Sicht,
): void {
  const { level, ballon } = welt;
  const { breite, hoehe } = level.groesse;

  // Kein setTransform hier: Die Pixeldichte steckt bereits im Transform, den
  // die Spielseite gesetzt hat. Gerechnet wird ab hier in CSS-Pixeln.
  ctx.save();
  ctx.clearRect(0, 0, sicht.breite, sicht.hoehe);
  ctx.translate(sicht.randX, sicht.randY);
  ctx.scale(sicht.skala, sicht.skala);

  // --- Himmel -------------------------------------------------------------
  const himmel = ctx.createLinearGradient(0, 0, 0, hoehe);
  himmel.addColorStop(0, '#1b2a6b');
  himmel.addColorStop(0.55, '#3f6bc4');
  himmel.addColorStop(1, '#8fc4e8');
  ctx.fillStyle = himmel;
  ctx.fillRect(0, 0, breite, hoehe);

  // --- Zonen: sichtbar, sonst wirkt ihre Kraft wie ein Fehler -------------
  for (const z of level.zonen) {
    const b = z.bereich;
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(b.x, b.y, b.breite, b.hoehe);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.breite, b.hoehe);
    ctx.setLineDash([]);
    // Pfeilchen in Kraftrichtung
    const mx = b.x + b.breite / 2;
    const my = b.y + b.hoehe / 2;
    const d = Math.hypot(z.kraft.x, z.kraft.y) || 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(mx - (z.kraft.x / d) * 26, my - (z.kraft.y / d) * 26);
    ctx.lineTo(mx + (z.kraft.x / d) * 26, my + (z.kraft.y / d) * 26);
    ctx.stroke();
  }

  // --- Ziel ---------------------------------------------------------------
  const z = level.ziel;
  const puls = 1 + Math.sin(welt.zeit * 3) * 0.05;
  ctx.strokeStyle = '#ffe06a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(z.pos.x, z.pos.y, z.radius * puls, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,224,106,0.18)';
  ctx.fill();

  // --- Nadeln -------------------------------------------------------------
  for (const nadel of level.nadeln) {
    const n = nadelJetzt(nadel, welt.zeit);
    ctx.strokeStyle = '#e8ecf5';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(n.von.x, n.von.y);
    ctx.lineTo(n.bis.x, n.bis.y);
    ctx.stroke();
    // Spitze markieren — sie ist das, was toetet
    ctx.fillStyle = '#ff5d73';
    ctx.beginPath();
    ctx.arc(n.bis.x, n.bis.y, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Wind: zeigen, wohin geblasen wird ----------------------------------
  const pos = zwischen(ballon.vorher, ballon.pos, blende);
  if (welt.windZiel && welt.windStaerke > 0.02) {
    ctx.strokeStyle = `rgba(255,255,255,${0.10 + welt.windStaerke * 0.35})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(welt.windZiel.x, welt.windZiel.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + welt.windStaerke * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(welt.windZiel.x, welt.windZiel.y, 20 + welt.windStaerke * 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- Ballon -------------------------------------------------------------
  const r = ballon.radius;
  // Schnur, haengt der Bewegung hinterher — verraet die Traegheit aufs Auge
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y + r);
  ctx.quadraticCurveTo(
    pos.x - ballon.geschw.x * 0.03, pos.y + r + 20,
    pos.x - ballon.geschw.x * 0.05, pos.y + r + 38,
  );
  ctx.stroke();

  ctx.fillStyle = '#ff5d73';
  ctx.beginPath();
  ctx.ellipse(pos.x, pos.y, r * 0.92, r, 0, 0, Math.PI * 2);
  ctx.fill();
  // Knoten
  ctx.beginPath();
  ctx.moveTo(pos.x - 5, pos.y + r);
  ctx.lineTo(pos.x + 5, pos.y + r);
  ctx.lineTo(pos.x, pos.y + r + 8);
  ctx.closePath();
  ctx.fill();
  // Glanzlicht
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(pos.x - r * 0.3, pos.y - r * 0.35, r * 0.22, r * 0.3, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
