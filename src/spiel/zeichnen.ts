// Alles, was auf das Canvas kommt.
//
// Getrennt von der Physik, damit der Spielkern ohne Browser testbar bleibt —
// diese Datei ist die einzige im Ordner, die ein Canvas ueberhaupt kennt.
//
// ⚠ Das Level rechnet in EIGENEN Koordinaten (720×1280). Hier wird einmal
// umgerechnet und danach in Levelkoordinaten gezeichnet. Wer stattdessen
// ueberall mit Bildschirmpixeln rechnet, bekommt auf jedem Geraet ein anderes
// Spielfeld — und damit unterschiedlich schwere Level.
//
// ⚠ NICHTS hier darf Math.random() benutzen. Jede Streuung wird aus dem Index
// und der Spielzeit gerechnet, sonst flackert das Bild von Bild zu Bild und
// ein Screenshot liesse sich nie wiederholen.

import type { Welt, Punkt } from './typen.ts';
import { nadelJetzt, DUESE_HOEHE, MUND, AUFWEITUNG, bodenHoehe } from './physik.ts';
import { nadelnIn, meter } from './endlos.ts';
import { ballonform, KNOTEN, BALLON_BILD_SEITEN } from './ballonform.ts';

/**
 * Bilder, einmal geladen und dann wiederverwendet. Liefert `null`, solange
 * ein Bild noch laedt — dann zeichnet jede Stelle ihren gemalten Rueckfall.
 * ⚠ Ohne Rueckfall waere das Level in den ersten Bildern leer, und das sieht
 * aus wie ein Fehler (CLAUDE.md).
 *
 * Herkunft: mit Gemini erzeugt. Die Nadel stellt scripts/nadel-freistellen.py
 * frei, alles unter /bilder/ scripts/bilder-freistellen.py.
 */
const bilder = new Map<string, HTMLImageElement>();
function bild(pfad: string): HTMLImageElement | null {
  let b = bilder.get(pfad);
  if (!b) {
    b = new Image();
    b.src = pfad;
    bilder.set(pfad, b);
  }
  return b.complete && b.naturalWidth > 0 ? b : null;
}

/**
 * Eine Bildkachel ueber den sichtbaren Ausschnitt wiederholen, jede zweite
 * gespiegelt. ⚠ Gemini liefert "nahtlose" Kacheln nicht wirklich nahtlos;
 * gespiegelt passen die Raender immer. Ein Ueberblenden ergab doppelte Kanten.
 */
function kacheln(
  ctx: CanvasRenderingContext2D, b: HTMLImageElement,
  von: number, bis: number, versatz: number, y: number, hoehe: number,
) {
  const breite = hoehe * (b.naturalWidth / b.naturalHeight);
  const erste = Math.floor((von - versatz) / breite);
  const letzte = Math.ceil((bis - versatz) / breite);
  for (let n = erste; n <= letzte; n++) {
    const x = versatz + n * breite;
    if (n % 2 === 0) {
      ctx.drawImage(b, x, y, breite + 1, hoehe);
    } else {
      ctx.save();
      ctx.translate(x + breite, y);
      ctx.scale(-1, 1);
      ctx.drawImage(b, -1, 0, breite + 1, hoehe);
      ctx.restore();
    }
  }
}

/**
 * Wie viel breiter als massstabsgetreu die Nadel gezeichnet wird.
 * ⚠ Massstabsgetreu (1:12) waere sie bei 60 px Laenge fuenf Pixel breit und auf
 * einem Handy kaum zu sehen. Leicht gestaucht faellt nicht auf, macht sie aber
 * lesbar.
 */
const NADEL_BREITER = 1.5;

export type Sicht = {
  skala: number; randX: number; randY: number; breite: number; hoehe: number;
  /** Wie weit die Kamera nach rechts gewandert ist (Levelkoordinaten). */
  kameraX: number;
  /**
   * Wie weit die Kamera nach oben gewandert ist (Levelkoordinaten, negativ =
   * hoeher). Nur im Endlos-Lauf nach oben, sonst 0.
   */
  kameraY?: number;
};

/**
 * Die Sicht fuer den Endlos-Lauf nach oben: volle Breite, und senkrecht so
 * viel, wie der Schirm hergibt — kein Rand oben und unten.
 */
export function sichtEndlosHoch(breite: number, hoehe: number, levelBreite: number): Sicht {
  // Auf einem Querformat nicht so weit hineinzoomen, dass man nichts sieht.
  const skala = Math.min(breite / levelBreite, hoehe / 900);
  return {
    skala, randX: (breite - levelBreite * skala) / 2, randY: 0,
    breite, hoehe, kameraX: 0, kameraY: 0,
  };
}

/**
 * Wohin die Kamera im Endlos-Lauf nach oben schaut: Der Boden sitzt am
 * unteren Bildrand. ⚠ Sie folgt dem Boden, den die PHYSIK fuehrt, und fuehrt
 * selbst nichts (Falle 10).
 */
export function kameraYFuer(sicht: Sicht, boden: number): number {
  return boden - sicht.hoehe / sicht.skala;
}

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
    y: (p.y - sicht.randY) / sicht.skala + (sicht.kameraY ?? 0),
  };
}

function zwischen(a: Punkt, b: Punkt, blende: number): Punkt {
  return { x: a.x + (b.x - a.x) * blende, y: a.y + (b.y - a.y) * blende };
}

/** Streuung aus einer Zahl — ersetzt Math.random(), bleibt aber wiederholbar. */
const streu = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------- Hintergrund

/**
 * Wolken, Huegel und Sonne.
 *
 * ⚠ Sie laufen LANGSAMER als das Level (Parallaxe). Das ist der ganze Grund,
 * warum eine Strecke nach Tiefe aussieht statt nach einer Tapete: Was weit weg
 * ist, wandert weniger. Ohne das klebt der Himmel am Vordergrund.
 */
function hintergrund(
  ctx: CanvasRenderingContext2D, welt: Welt, sicht: Sicht, bodenY: number, oben: number, hoehe: number,
) {
  const sichtbar = sicht.breite / sicht.skala;

  // Der Himmel selbst steht fest — er fuellt immer den ganzen Ausschnitt.
  // Das Bild bringt seine Sonne mit; nur der gemalte Rueckfall braucht eine.
  const himmelBild = bild('/bilder/himmel.jpg');
  if (himmelBild) {
    ctx.drawImage(himmelBild, sicht.kameraX - 20, oben, sichtbar + 40, hoehe);
  } else {
    const himmel = ctx.createLinearGradient(0, oben, 0, oben + hoehe);
    himmel.addColorStop(0, '#152364');
    himmel.addColorStop(0.35, '#2f5cb4');
    himmel.addColorStop(0.7, '#5f9ddb');
    himmel.addColorStop(1, '#bfe2f2');
    ctx.fillStyle = himmel;
    ctx.fillRect(sicht.kameraX - 20, oben, sichtbar + 40, hoehe);
  }

  // Endlos nach oben wird der Himmel mit der Hoehe dunkler — man sieht, dass
  // man weit gekommen ist, auch ohne auf die Meter zu schauen.
  if (welt.endlos?.art === 'hoch') {
    const nacht = Math.min(0.62, meter(welt) / 900);
    ctx.fillStyle = `rgba(6,10,38,${nacht})`;
    ctx.fillRect(sicht.kameraX - 20, oben, sichtbar + 40, hoehe);
  }

  // Sonne, tief am Horizont — gibt dem Himmel eine Richtung.
  if (!himmelBild) {
    const sx = sicht.kameraX + sichtbar * 0.76;
    const sy = oben + hoehe * 0.42;
    const sonne = ctx.createRadialGradient(sx, sy, 10, sx, sy, hoehe * 0.42);
    sonne.addColorStop(0, 'rgba(255,240,200,0.55)');
    sonne.addColorStop(0.25, 'rgba(255,225,160,0.18)');
    sonne.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = sonne;
    ctx.fillRect(sicht.kameraX - 20, oben, sichtbar + 40, hoehe);
  }

  // --- Wolken, drei Schichten ---------------------------------------------
  const wolke = (x: number, y: number, gr: number, deckung: number, n: number) => {
    // Eine der vier Wolken aus dem Bild — welche, entscheidet streu, nicht
    // der Zufall. Ferne Schichten blasser, wie beim gemalten Rueckfall.
    const b = bild(`/bilder/wolke${1 + Math.floor(streu(n * 2.3 + gr) * 4) % 4}.png`);
    if (b) {
      const breite = gr * 3.6;
      const hoch = breite * (b.naturalHeight / b.naturalWidth);
      ctx.globalAlpha = Math.min(1, deckung * 3.6);
      ctx.drawImage(b, x - breite / 2, y - hoch / 2, breite, hoch);
      ctx.globalAlpha = 1;
      return;
    }
    ctx.fillStyle = `rgba(255,255,255,${deckung})`;
    for (const [dx, dy, f] of [[-1, 0.15, 0.62], [-0.35, -0.2, 0.85], [0.4, -0.1, 0.72], [1, 0.2, 0.52]]) {
      ctx.beginPath();
      ctx.ellipse(x + dx * gr, y + dy * gr, gr * f, gr * f * 0.66, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  // ⚠ Der Abstand richtet sich nach dem SICHTBAREN Ausschnitt. Ein fester
  // Abstand von 2500 px liess auf einem 590 px breiten Handy-Ausschnitt nie
  // eine Wolke ins Bild — der Himmel blieb leer, und es sah nicht danach aus,
  // als fehlte etwas, sondern als waere nie etwas da gewesen.
  for (const [tiefe, gr, deckung] of [[0.25, 58, 0.13], [0.45, 44, 0.17], [0.7, 32, 0.22]]) {
    const abstand = sichtbar / 1.8;
    const versatz = sicht.kameraX * tiefe + welt.zeit * 6 * tiefe;
    const von = Math.floor((sicht.kameraX - versatz - gr * 2) / abstand);
    const bis = Math.ceil((sicht.kameraX + sichtbar - versatz + gr * 2) / abstand);
    if (welt.endlos?.art !== 'hoch') {
      for (let n = von; n <= bis; n++) {
        const x = n * abstand + versatz;
        const y = hoehe * (0.06 + streu(n * 3.7 + tiefe) * 0.32);
        wolke(x, y, gr * (0.7 + streu(n + tiefe * 9) * 0.6), deckung, n);
      }
      continue;
    }
    // Endlos nach oben: Wolken auch uebereinander, und sie wandern senkrecht
    // langsamer als der Boden — dieselbe Parallaxe wie auf Strecken, nur
    // um 90 Grad gedreht. ⚠ Auch hier nur der sichtbare Ausschnitt.
    const abstandY = hoehe / 2.2;
    const versatzY = oben * tiefe;
    const vonY = Math.floor((oben - versatzY - gr * 2) / abstandY);
    const bisY = Math.ceil((oben + hoehe - versatzY + gr * 2) / abstandY);
    for (let m = vonY; m <= bisY; m++) {
      for (let n = von; n <= bis; n++) {
        if (streu(n * 7.1 + m * 3.3 + tiefe) < 0.35) continue;
        const x = n * abstand + versatz + (streu(m * 1.7 + n) - 0.5) * abstand * 0.6;
        const y = m * abstandY + versatzY + streu(n * 3.7 + m + tiefe) * abstandY * 0.6;
        wolke(x, y, gr * (0.7 + streu(n + m * 5 + tiefe * 9) * 0.6), deckung, n * 31 + m);
      }
    }
  }

  // --- Huegel, zwei Schichten ---------------------------------------------
  // Mit Bild: ferne Huegel wandern auf dem Schirm mit einem Viertel, nahe mit
  // der Haelfte des Tempos — wie die gemalten Schichten.
  const fern = bild('/bilder/huegel-fern.png');
  const nah = bild('/bilder/huegel-nah.png');
  if (fern && nah) {
    const von = sicht.kameraX - 40;
    const bis = sicht.kameraX + sichtbar + 40;
    kacheln(ctx, fern, von, bis, sicht.kameraX * 0.75, bodenY - 250, 270);
    kacheln(ctx, nah, von, bis, sicht.kameraX * 0.5, bodenY - 170, 190);
    return;
  }
  for (const [tiefe, hoehenAnteil, farbe] of [[0.35, 0.16, '#5e86a8'], [0.6, 0.1, '#4a7a6a']] as const) {
    const versatz = sicht.kameraX * (1 - tiefe);
    ctx.fillStyle = farbe;
    ctx.beginPath();
    ctx.moveTo(sicht.kameraX - 40, bodenY + 10);
    const kuppe = 1280 * hoehenAnteil;
    for (let x = sicht.kameraX - 40; x <= sicht.kameraX + sichtbar + 40; x += 18) {
      const w = (x + versatz) * 0.0042;
      const y = bodenY - kuppe * (0.55 + 0.45 * Math.sin(w) * Math.cos(w * 0.6 + tiefe * 4));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(sicht.kameraX + sichtbar + 40, bodenY + 10);
    ctx.closePath();
    ctx.fill();
  }
}

/** Wiese mit Halmen und ein paar Blumen. */
function wiese(ctx: CanvasRenderingContext2D, welt: Welt, sicht: Sicht, bodenY: number, unten: number) {
  const hoehe = unten > bodenY ? unten : bodenY + 120;
  const sichtbar = sicht.breite / sicht.skala;
  const von = sicht.kameraX - 30;
  const bis = sicht.kameraX + sichtbar + 30;

  const gras = ctx.createLinearGradient(0, bodenY, 0, hoehe);
  gras.addColorStop(0, '#7dc25e');
  gras.addColorStop(0.3, '#5da046');
  gras.addColorStop(1, '#3d6e30');
  ctx.fillStyle = gras;
  ctx.fillRect(von, bodenY, bis - von, hoehe - bodenY);

  // Mit Bild: ein Streifen Wiese, die Grasbueschel ragen ueber bodenY hinaus.
  // Darunter bleibt der Verlauf sichtbar, wo das Bild nicht hinreicht.
  const wiesenBild = bild('/bilder/wiese.png');
  if (wiesenBild) {
    ctx.fillStyle = '#3e6a3a';
    ctx.fillRect(von, bodenY + 60, bis - von, hoehe - bodenY - 60);
    kacheln(ctx, wiesenBild, von, bis, 0, bodenY - 46, 136);
    return;
  }

  // ⚠ Nur den sichtbaren Ausschnitt bestuecken. Ueber eine 3500 px lange
  // Strecke waeren es sonst hunderte Halme je Bild, von denen 85 % niemand
  // sieht.
  const ersteX = Math.floor(von / 15) * 15;
  for (let x = ersteX; x < bis; x += 15) {
    const s = streu(x);
    const h = 10 + s * 16;
    const neigung = Math.sin(welt.zeit * 1.4 + x * 0.05) * 4;
    ctx.strokeStyle = s > 0.5 ? 'rgba(138,204,104,0.85)' : 'rgba(96,168,76,0.9)';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, bodenY + 3);
    ctx.quadraticCurveTo(x + neigung * 0.5, bodenY - h * 0.6, x + neigung, bodenY - h);
    ctx.stroke();

    if (s > 0.955) {
      ctx.fillStyle = ['#ffd6e7', '#fff2a8', '#d6c9ff'][Math.floor(s * 97) % 3];
      ctx.beginPath();
      ctx.arc(x + neigung, bodenY - h - 2, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ------------------------------------------------------------------- Figuren

function zeichneGeblaese(ctx: CanvasRenderingContext2D, welt: Welt, gy: number, bodenY: number) {
  const gx = welt.geblaese.x;
  const st = welt.geblaese.staerke;

  // Schatten auf der Wiese — ohne ihn schwebt das Geraet ueber dem Gras.
  ctx.fillStyle = 'rgba(30,60,25,0.22)';
  ctx.beginPath();
  ctx.ellipse(gx, bodenY + 62, 46, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(gx, gy);

  // Duese
  const duese = ctx.createLinearGradient(-30, -14, 30, 6);
  duese.addColorStop(0, '#3c4a63');
  duese.addColorStop(1, '#232d40');
  ctx.fillStyle = duese;
  ctx.beginPath();
  ctx.moveTo(-30, 6);
  ctx.lineTo(-19, -15);
  ctx.quadraticCurveTo(0, -19, 19, -15);
  ctx.lineTo(30, 6);
  ctx.closePath();
  ctx.fill();

  // Gehaeuse
  const korpus = ctx.createLinearGradient(-34, 6, 34, 58);
  korpus.addColorStop(0, '#ffb547');
  korpus.addColorStop(0.55, '#ff9f1c');
  korpus.addColorStop(1, '#e07d0a');
  ctx.fillStyle = korpus;
  ctx.beginPath();
  ctx.roundRect(-34, 6, 68, 54, 16);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.roundRect(-27, 11, 20, 12, 6);
  ctx.fill();

  // Griff
  ctx.fillStyle = '#2b3547';
  ctx.beginPath();
  ctx.roundRect(-11, 54, 22, 30, 9);
  ctx.fill();

  // Laufrad: dreht sich nur, wenn geblasen wird
  ctx.save();
  ctx.translate(0, 33);
  ctx.rotate(welt.zeit * 14 * st);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.ellipse(0, -9, 4.5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2b3547';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function zeichneBallon(ctx: CanvasRenderingContext2D, welt: Welt, pos: Punkt, bodenY: number) {
  const { ballon } = welt;
  const r = ballon.radius;
  const form = ballonform(pos, ballon.geschw, r);

  // Schatten auf der Wiese: kleiner und blasser, je hoeher der Ballon steht.
  const hoeheUeber = Math.max(0, bodenY - pos.y);
  const naehe = Math.max(0, 1 - hoeheUeber / 900);
  if (naehe > 0.02) {
    ctx.fillStyle = `rgba(30,60,25,${0.24 * naehe})`;
    ctx.beginPath();
    ctx.ellipse(pos.x, bodenY + 58, r * (0.5 + naehe * 0.7), 8 * naehe + 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Schnur, haengt der Bewegung hinterher — verraet die Traegheit aufs Auge
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  // ⚠ Am KNOTEN beginnen, nicht fest unter der Mitte — sonst passt die
  // Schnur nicht mehr zum Ballon, sobald er sich neigt (siehe ballonform.ts).
  const k = form.knoten;
  ctx.moveTo(k.x, k.y);
  ctx.quadraticCurveTo(
    k.x - ballon.geschw.x * 0.03, k.y + 14,
    k.x - ballon.geschw.x * 0.05, k.y + 30,
  );
  ctx.stroke();

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(form.neigung);
  ctx.scale(1 / form.dehnung, form.dehnung);
  // Das Bild reicht von der Oberkante (−r) bis zur Knotenspitze (r + KNOTEN) —
  // genau dort, wo die Schnur ansetzt und wo der gemalte Ballon lag.
  const ballonBild = bild('/bilder/ballon.png');
  if (ballonBild) {
    const hoch = 2 * r + KNOTEN;
    const breit = hoch * BALLON_BILD_SEITEN;
    ctx.drawImage(ballonBild, -breit / 2, -r, breit, hoch);
    ctx.restore();
    return;
  }
  const haut = ctx.createRadialGradient(-r * 0.32, -r * 0.38, r * 0.12, 0, 0, r * 1.15);
  haut.addColorStop(0, '#ff8d9e');
  haut.addColorStop(0.55, '#f94d67');
  haut.addColorStop(1, '#c62d47');
  ctx.fillStyle = haut;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.92, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-5, r - 1);
  ctx.lineTo(5, r - 1);
  ctx.lineTo(0, r + KNOTEN);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.2, r * 0.3, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Der Nachklang: Fetzen beim Platzen, Funken beim Ankommen. */
function nachklang(ctx: CanvasRenderingContext2D, welt: Welt, pos: Punkt) {
  const t = welt.nachher;
  if (t > 1.2) return;
  const r = welt.ballon.radius;

  if (welt.ausgang === 'geplatzt') {
    for (let i = 0; i < 14; i++) {
      const w = (i / 14) * Math.PI * 2 + streu(i) * 0.6;
      const tempo = 180 + streu(i * 5) * 260;
      const x = pos.x + Math.cos(w) * tempo * t;
      const y = pos.y + Math.sin(w) * tempo * t + 420 * t * t;
      ctx.fillStyle = `rgba(230,60,88,${Math.max(0, 1 - t / 1.2)})`;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(w + t * 7);
      ctx.beginPath();
      ctx.moveTo(-6, -4); ctx.lineTo(7, 0); ctx.lineTo(-4, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (welt.ausgang === 'geschafft') {
    for (let i = 0; i < 16; i++) {
      const w = (i / 16) * Math.PI * 2;
      const d = r + t * 200;
      ctx.fillStyle = `rgba(255,226,120,${Math.max(0, 1 - t / 1.2)})`;
      ctx.beginPath();
      ctx.arc(pos.x + Math.cos(w) * d, pos.y + Math.sin(w) * d, 4 - t * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------------------- Bild

export function zeichne(
  ctx: CanvasRenderingContext2D,
  welt: Welt,
  blende: number,
  sicht: Sicht,
): void {
  const { level, ballon } = welt;
  const { hoehe } = level.groesse;
  const bodenY = bodenHoehe(welt.boden);
  // Der sichtbare Ausschnitt senkrecht. In den Leveln das ganze Level; im
  // Endlos-Lauf nach oben, was der Schirm zeigt.
  const kameraY = sicht.kameraY ?? 0;
  const endlosHoch = welt.endlos?.art === 'hoch';
  const oben = endlosHoch ? kameraY : 0;
  const sichtHoehe = endlosHoch ? sicht.hoehe / sicht.skala : hoehe;
  const sichtbar = sicht.breite / sicht.skala;

  // Kein setTransform hier: Die Pixeldichte steckt bereits im Transform, den
  // die Spielseite gesetzt hat. Gerechnet wird ab hier in CSS-Pixeln.
  ctx.save();
  ctx.clearRect(0, 0, sicht.breite, sicht.hoehe);
  ctx.translate(sicht.randX, sicht.randY);
  ctx.scale(sicht.skala, sicht.skala);
  ctx.translate(-sicht.kameraX, -kameraY);

  hintergrund(ctx, welt, sicht, bodenY, oben, sichtHoehe);

  // Treibende Blaetter: Sie zeigen den Grundwind. Ohne das wirkt es wie ein
  // Fehler, wenn der Ballon von allein nach rechts zieht.
  if (level.grundwind && level.grundwind.x !== 0) {
    const richtung = Math.sign(level.grundwind.x);
    for (let i = 0; i < 22; i++) {
      const tempo = 45 + (i % 5) * 28;
      const spanne = sichtbar + 220;
      const x = sicht.kameraX - 110
        + (((i * 317) + welt.zeit * tempo * richtung) % spanne + spanne) % spanne;
      const y = (i * 197) % hoehe;
      ctx.fillStyle = `rgba(255,252,230,${0.14 + (i % 3) * 0.05})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 2.6, Math.sin(welt.zeit + i) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  wiese(ctx, welt, sicht, bodenY, oben + sichtHoehe);

  // --- Zonen: sichtbar, sonst wirkt ihre Kraft wie ein Fehler -------------
  for (const z of level.zonen) {
    const b = z.bereich;
    const d = Math.hypot(z.kraft.x, z.kraft.y) || 1;
    const fluss = ctx.createLinearGradient(b.x, b.y + b.hoehe, b.x, b.y);
    fluss.addColorStop(0, 'rgba(198,235,255,0.05)');
    fluss.addColorStop(1, 'rgba(198,235,255,0.22)');
    ctx.fillStyle = fluss;
    ctx.fillRect(b.x, b.y, b.breite, b.hoehe);
    // Statt eines Pfeils: Teilchen, die in Kraftrichtung wandern. Man sieht
    // sofort, wohin es einen zieht.
    // ⚠ Bis zum 01.10.2026 stiegen sie immer nach oben — bei Seiten- oder
    // Fallwind zeigte das Bild dann das Gegenteil dessen, was gerechnet wird.
    const ux = z.kraft.x / d;
    const uy = z.kraft.y / d;
    const weg = Math.abs(ux) * b.breite + Math.abs(uy) * b.hoehe;
    const umlauf = (v: number, von: number, l: number) => von + ((((v - von) % l) + l) % l);
    const anzahl = Math.max(9, Math.round((b.breite * b.hoehe) / 22000));
    for (let i = 0; i < anzahl; i++) {
      const p = ((welt.zeit * 0.55 + i / anzahl) % 1);
      const x = umlauf(b.x + (0.06 + streu(i) * 0.88) * b.breite + ux * p * weg, b.x, b.breite);
      const y = umlauf(b.y + (0.06 + streu(i + 31) * 0.88) * b.hoehe + uy * p * weg, b.y, b.hoehe);
      ctx.fillStyle = `rgba(226,246,255,${0.5 * Math.sin(p * Math.PI)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 2.6, 7, Math.atan2(uy, ux) - Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- Ziel ---------------------------------------------------------------
  // Endlos gibt es keins.
  const z = level.ziel;
  if (!welt.endlos) {
  const puls = 1 + Math.sin(welt.zeit * 3) * 0.05;
  const schein = ctx.createRadialGradient(z.pos.x, z.pos.y, z.radius * 0.35,
                                          z.pos.x, z.pos.y, z.radius * 2.3);
  schein.addColorStop(0, 'rgba(255,228,130,0.42)');
  schein.addColorStop(0.55, 'rgba(255,214,96,0.16)');
  schein.addColorStop(1, 'rgba(255,214,96,0)');
  ctx.fillStyle = schein;
  ctx.beginPath();
  ctx.arc(z.pos.x, z.pos.y, z.radius * 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,236,168,0.22)';
  ctx.beginPath();
  ctx.arc(z.pos.x, z.pos.y, z.radius * puls, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffe06a';
  ctx.lineWidth = 5;
  ctx.stroke();
  // Funken, die den Ring umkreisen
  for (let i = 0; i < 7; i++) {
    const w = welt.zeit * 0.9 + (i / 7) * Math.PI * 2;
    ctx.fillStyle = 'rgba(255,245,200,0.75)';
    ctx.beginPath();
    ctx.arc(z.pos.x + Math.cos(w) * z.radius * 1.28,
            z.pos.y + Math.sin(w) * z.radius * 1.28, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  }

  // --- Nadeln -------------------------------------------------------------
  // Im Endlos-Lauf nur die im Bild — es gibt unendlich viele.
  const nadeln = !welt.endlos ? level.nadeln
    : endlosHoch
      ? nadelnIn(welt, oben - 100, oben + sichtHoehe + 100, bodenY)
      : nadelnIn(welt, sicht.kameraX - 100, sicht.kameraX + sichtbar + 100, bodenY);
  for (const nadel of nadeln) {
    const n = nadelJetzt(nadel, welt.zeit, hoehe);
    // ⚠ Fallende Nadeln unterhalb der Wiese nicht mehr zeichnen — sonst sieht
    // man sie durch den Boden sinken, was wie ein Fehler aussieht. Fuer die
    // Physik ist das ohne Belang: Der Ballon kommt nie unter bodenY.
    if (nadel.faellt) {
      if (Math.min(n.von.y, n.bis.y) > bodenY) continue;
      n.bis = { ...n.bis, y: Math.min(n.bis.y, bodenY) };
      // Schweif — sonst sieht man nicht, dass sie sich bewegt, und wundert
      // sich, warum man ploetzlich platzt.
      const s = ctx.createLinearGradient(n.von.x, n.von.y - 110, n.von.x, n.von.y);
      s.addColorStop(0, 'rgba(232,236,245,0)');
      s.addColorStop(1, 'rgba(232,236,245,0.4)');
      ctx.strokeStyle = s;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(n.von.x, n.von.y - 110);
      ctx.lineTo(n.von.x, n.von.y);
      ctx.stroke();
    }
    const dx = n.bis.x - n.von.x;
    const dy = n.bis.y - n.von.y;
    const laenge = Math.hypot(dx, dy);

    const nadelBild = bild('/nadel.png');
    if (nadelBild && laenge > 1) {
      // Das Bild zeigt nach unten (+y), also entspricht es dem Winkel π/2.
      ctx.save();
      ctx.translate(n.von.x, n.von.y);
      ctx.rotate(Math.atan2(dy, dx) - Math.PI / 2);
      const breite = laenge * (nadelBild.naturalWidth / nadelBild.naturalHeight) * NADEL_BREITER;
      // Engstellen im Endlos-Lauf schimmern rot — man soll sie kommen sehen.
      if (nadel.warnung) {
        // Zweimal mit rotem Schein: Einmal war am Handy kaum zu sehen.
        ctx.shadowColor = 'rgba(255,60,90,1)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 0;
        ctx.drawImage(nadelBild, -breite / 2, 0, breite, laenge);
      } else {
        ctx.shadowColor = 'rgba(10,20,45,0.35)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
      }
      ctx.drawImage(nadelBild, -breite / 2, 0, breite, laenge);
      ctx.restore();
    } else {
      // Rueckfall, solange das Bild laedt.
      ctx.strokeStyle = '#e8ecf5';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(n.von.x, n.von.y);
      ctx.lineTo(n.bis.x, n.bis.y);
      ctx.stroke();
      ctx.fillStyle = '#ff5d73';
      ctx.beginPath();
      ctx.arc(n.bis.x, n.bis.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- Luftstrahl ---------------------------------------------------------
  // Der Kegel wird nach oben breiter und blasser — genau so, wie er auch wirkt
  // (siehe strahlKraft in physik.ts). Wer den Strahl anders zeichnet, als er
  // rechnet, baut eine Luege ins Spiel: Der Spieler zielt dann nach dem Bild
  // und trifft daneben.
  const gx = welt.geblaese.x;
  const gy = welt.boden - DUESE_HOEHE;
  const st = welt.geblaese.staerke;
  if (st > 0.02) {
    const kegel = ctx.createLinearGradient(0, gy, 0, oben);
    kegel.addColorStop(0, `rgba(255,255,255,${0.4 * st})`);
    kegel.addColorStop(0.5, `rgba(226,244,255,${0.17 * st})`);
    kegel.addColorStop(1, 'rgba(226,244,255,0)');
    ctx.fillStyle = kegel;
    ctx.beginPath();
    ctx.moveTo(gx - MUND, gy);
    ctx.lineTo(gx - (MUND + (gy - oben) * AUFWEITUNG), oben);
    ctx.lineTo(gx + (MUND + (gy - oben) * AUFWEITUNG), oben);
    ctx.lineTo(gx + MUND, gy);
    ctx.closePath();
    ctx.fill();

    // Mitgerissene Blaetter: machen die Stroemung sichtbar und verraten, wo
    // der Strahl noch traegt.
    for (let i = 0; i < 16; i++) {
      const p = ((welt.zeit * (0.55 + (i % 4) * 0.12) + i / 16) % 1);
      const y = gy - p * (gy - oben);
      const seit = Math.sin(i * 12.9898 + welt.zeit * 0.8) * (MUND + (gy - y) * AUFWEITUNG) * 0.7;
      ctx.fillStyle = `rgba(255,248,214,${(1 - p) * 0.8 * st})`;
      ctx.beginPath();
      ctx.ellipse(gx + seit, y, 5, 3, p * 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  zeichneGeblaese(ctx, welt, gy, bodenY);

  const pos = zwischen(ballon.vorher, ballon.pos, blende);
  if (welt.ausgang === 'laeuft' || welt.nachher < 0.06) {
    zeichneBallon(ctx, welt, pos, bodenY);
  }
  nachklang(ctx, welt, pos);

  ctx.restore();
}
