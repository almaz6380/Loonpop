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
import { nadelJetzt, DUESE_HOEHE, MUND, AUFWEITUNG, bodenHoehe } from './physik.ts';

// ⚠ breite/hoehe sind CSS-Pixel, nicht Geraetepixel. Das Canvas ist bei
// doppelter Pixeldichte doppelt so gross; die Umrechnung macht EINMAL die
// Spielseite per ctx.setTransform(dpr, …). Wer sie hier noch einmal setzt oder
// zurueckstellt, zeichnet das ganze Spielfeld in die linke obere Ecke — genau
// das ist am 27.09.2026 passiert.
export type Sicht = {
  skala: number; randX: number; randY: number; breite: number; hoehe: number;
  /** Wie weit die Kamera nach rechts gewandert ist (Levelkoordinaten). */
  kameraX: number;
};

/** Wie das Level auf diesen Bildschirm passt: ganz sichtbar, mittig. */
export function sichtBerechnen(
  breite: number, hoehe: number,
  levelBreite: number, levelHoehe: number,
  art: 'hoch' | 'strecke' = 'hoch',
): Sicht {
  // ⚠ Auf Strecken bestimmt allein die HOEHE die Skala. Wuerde hier wie bei
  // `hoch` das Minimum genommen, schrumpfte eine 2400 px breite Strecke auf
  // Briefmarkengroesse.
  const skala = art === 'strecke'
    ? hoehe / levelHoehe
    : Math.min(breite / levelBreite, hoehe / levelHoehe);
  return {
    skala,
    randX: art === 'strecke' ? 0 : (breite - levelBreite * skala) / 2,
    randY: (hoehe - levelHoehe * skala) / 2,
    breite,
    hoehe,
    kameraX: 0,
  };
}

/**
 * Wohin die Kamera auf einer Strecke schauen soll.
 *
 * Der Ballon bleibt in der linken Bildhaelfte: So sieht man, was KOMMT, und
 * nicht, was man hinter sich gelassen hat. Am Levelanfang und -ende laeuft die
 * Kamera nicht ueber den Rand hinaus — sonst saehe man ins Leere.
 */
export function kameraFuer(sicht: Sicht, ballonX: number, levelBreite: number): number {
  const sichtbar = sicht.breite / sicht.skala;
  const wunsch = ballonX - sichtbar * 0.38;
  return Math.max(0, Math.min(levelBreite - sichtbar, wunsch));
}

/** Bildschirmpunkt → Levelkoordinate. Fuer die Fingereingabe. */
export function zuLevel(p: Punkt, sicht: Sicht): Punkt {
  return {
    x: (p.x - sicht.randX) / sicht.skala + sicht.kameraX,
    y: (p.y - sicht.randY) / sicht.skala,
  };
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
  ctx.translate(-sicht.kameraX, 0);

  // --- Himmel -------------------------------------------------------------
  const himmel = ctx.createLinearGradient(0, 0, 0, hoehe);
  himmel.addColorStop(0, '#1b2a6b');
  himmel.addColorStop(0.55, '#3f6bc4');
  himmel.addColorStop(1, '#8fc4e8');
  ctx.fillStyle = himmel;
  ctx.fillRect(0, 0, breite, hoehe);

  // Treibende Blaetter im Hintergrund: Sie zeigen den Grundwind. Ohne das
  // wirkt es wie ein Fehler, wenn der Ballon von allein nach rechts zieht.
  if (level.grundwind && level.grundwind.x !== 0) {
    const richtung = Math.sign(level.grundwind.x);
    for (let i = 0; i < 26; i++) {
      const tempo = 40 + (i % 5) * 26;
      const x = (((i * 317) + welt.zeit * tempo * richtung) % (breite + 200)) - 100;
      const y = (i * 197) % hoehe;
      ctx.fillStyle = `rgba(255,255,255,${0.10 + (i % 3) * 0.045})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 2.6, Math.sin(welt.zeit + i) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- Wiese -------------------------------------------------------------
  // Der Ballon kommt nie tiefer als knapp ueber die Duese (siehe bodenHoehe).
  // Ohne sichtbaren Boden haelt er an einer unsichtbaren Linie an und das wirkt
  // wie ein Fehler.
  const bodenY = bodenHoehe(hoehe);
  const wiese = ctx.createLinearGradient(0, bodenY, 0, hoehe);
  wiese.addColorStop(0, 'rgba(126,196,120,0.35)');
  wiese.addColorStop(0.35, '#6aa84f');
  wiese.addColorStop(1, '#4b7a38');
  ctx.fillStyle = wiese;
  ctx.fillRect(0, bodenY, breite, hoehe - bodenY);

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
  ctx.fillStyle = 'rgba(255,224,106,0.30)';
  ctx.fill();
  // Schein aussen herum — oben ist der Himmel dunkel, ein duenner Ring geht
  // dort sonst unter, und ein Ziel, das man sucht, ist kein Ziel.
  const schein = ctx.createRadialGradient(z.pos.x, z.pos.y, z.radius * 0.6,
                                          z.pos.x, z.pos.y, z.radius * 2.1);
  schein.addColorStop(0, 'rgba(255,224,106,0.34)');
  schein.addColorStop(1, 'rgba(255,224,106,0)');
  ctx.fillStyle = schein;
  ctx.beginPath();
  ctx.arc(z.pos.x, z.pos.y, z.radius * 2.1, 0, Math.PI * 2);
  ctx.fill();

  // --- Nadeln -------------------------------------------------------------
  for (const nadel of level.nadeln) {
    const n = nadelJetzt(nadel, welt.zeit, hoehe);
    // ⚠ Fallende Nadeln unterhalb der Wiese nicht mehr zeichnen — sonst sieht
    // man sie durch den Boden sinken, was wie ein Fehler aussieht. Fuer die
    // Physik ist das ohne Belang: Der Ballon kommt nie unter bodenY.
    if (nadel.faellt) {
      if (Math.min(n.von.y, n.bis.y) > bodenY) continue;
      n.bis = { ...n.bis, y: Math.min(n.bis.y, bodenY) };
    }
    // Fallende Nadeln bekommen einen Schweif — sonst sieht man nicht, dass
    // sie sich bewegen, und wundert sich, warum man plötzlich platzt.
    if (nadel.faellt) {
      const s = ctx.createLinearGradient(n.von.x, n.von.y - 90, n.von.x, n.von.y);
      s.addColorStop(0, 'rgba(232,236,245,0)');
      s.addColorStop(1, 'rgba(232,236,245,0.35)');
      ctx.strokeStyle = s;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(n.von.x, n.von.y - 90);
      ctx.lineTo(n.von.x, n.von.y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#e8ecf5';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(n.von.x, n.von.y);
    ctx.lineTo(n.bis.x, n.bis.y);
    ctx.stroke();
    // Spitze markieren — sie ist das, was toetet
    ctx.fillStyle = '#ff5d73';
    ctx.beginPath();
    ctx.arc(n.bis.x, n.bis.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Luftstrahl ---------------------------------------------------------
  // Der Kegel wird nach oben breiter und blasser — genau so, wie er auch wirkt
  // (siehe strahlKraft in physik.ts). Wer den Strahl anders zeichnet, als er
  // rechnet, baut eine Luege ins Spiel: Der Spieler zielt dann nach dem Bild
  // und trifft daneben.
  const gx = welt.geblaese.x;
  const gy = hoehe - DUESE_HOEHE;
  const st = welt.geblaese.staerke;
  if (st > 0.02) {
    const kegel = ctx.createLinearGradient(0, gy, 0, 0);
    kegel.addColorStop(0, `rgba(255,255,255,${0.42 * st})`);
    kegel.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = kegel;
    ctx.beginPath();
    ctx.moveTo(gx - MUND, gy);
    ctx.lineTo(gx - (MUND + gy * AUFWEITUNG), 0);
    ctx.lineTo(gx + (MUND + gy * AUFWEITUNG), 0);
    ctx.lineTo(gx + MUND, gy);
    ctx.closePath();
    ctx.fill();

    // Mitgerissene Blaetter: machen die Stroemung sichtbar und verraten, wo
    // der Strahl noch traegt.
    for (let i = 0; i < 14; i++) {
      const p = ((welt.zeit * (0.55 + (i % 4) * 0.12) + i / 14) % 1);
      const y = gy - p * gy;
      const streu = Math.sin(i * 12.9898 + welt.zeit * 0.8) * (MUND + (gy - y) * AUFWEITUNG) * 0.7;
      ctx.fillStyle = `rgba(255,245,210,${(1 - p) * 0.75 * st})`;
      ctx.beginPath();
      ctx.ellipse(gx + streu, y, 5, 3, p * 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- Das Geblaese -------------------------------------------------------
  ctx.save();
  ctx.translate(gx, gy);
  // Duese
  ctx.fillStyle = '#2f3b52';
  ctx.beginPath();
  ctx.moveTo(-30, 6);
  ctx.lineTo(-19, -14);
  ctx.lineTo(19, -14);
  ctx.lineTo(30, 6);
  ctx.closePath();
  ctx.fill();
  // Gehaeuse
  ctx.fillStyle = '#ff9f1c';
  ctx.beginPath();
  ctx.roundRect(-34, 6, 68, 52, 14);
  ctx.fill();
  // Griff
  ctx.fillStyle = '#2f3b52';
  ctx.beginPath();
  ctx.roundRect(-10, 52, 20, 30, 8);
  ctx.fill();
  // Laufrad: dreht sich nur, wenn geblasen wird
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 3;
  const dreh = welt.zeit * 14 * st;
  for (let i = 0; i < 3; i++) {
    const w = dreh + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(0, 32);
    ctx.lineTo(Math.cos(w) * 15, 32 + Math.sin(w) * 15);
    ctx.stroke();
  }
  ctx.restore();

  // --- Ballon -------------------------------------------------------------
  const pos = zwischen(ballon.vorher, ballon.pos, blende);
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
