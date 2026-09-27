// Die Spielseite: Canvas, Finger, Ende.
//
// ⚠ Der Weltzustand liegt in einem Ref, NICHT in React-State. Die Schleife
// rechnet 120-mal je Sekunde; waere das State, wuerde React genauso oft neu
// rendern und das Spiel ruckelte genau dann, wenn es spannend wird. React
// erfaehrt nur, wenn ein Lauf endet — das ist ein Ereignis pro Versuch.

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { neueWelt } from '../spiel/welt.ts';
import { starteSchleife } from '../spiel/schleife.ts';
import { sichtBerechnen, zuLevel, zeichne, type Sicht } from '../spiel/zeichnen.ts';
import type { Ausgang, Level, Welt } from '../spiel/typen.ts';

export default function SpielPage({ level, zurueck }: { level: Level; zurueck: () => void }) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const weltRef = useRef<Welt | null>(null);
  const sichtRef = useRef<Sicht>({ skala: 1, randX: 0, randY: 0, breite: 0, hoehe: 0 });
  const [ende, setEnde] = useState<Ausgang | null>(null);
  const [versuch, setVersuch] = useState(0);
  const [zeit, setZeit] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const welt = neueWelt(level);
    weltRef.current = welt;
    setEnde(null);

    // ⚠ Auf dem Canvas in GERAETEPIXELN zeichnen, sonst ist auf einem Handy mit
    // doppelter Pixeldichte alles unscharf.
    const anpassen = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const b = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(b * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sichtRef.current = sichtBerechnen(b, h, level.groesse.breite, level.groesse.hoehe);
    };
    anpassen();
    window.addEventListener('resize', anpassen);

    // Die Uhr im HUD darf nicht an der Schleife haengen — 5-mal je Sekunde
    // reicht fuers Auge und kostet React fast nichts.
    const uhr = setInterval(() => setZeit(welt.zeit), 200);

    const schleife = starteSchleife(
      welt,
      (w, blende) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        zeichne(ctx, w, blende, sichtRef.current);
      },
      (w) => setEnde(w.ausgang),
    );

    return () => {
      schleife.stopp();
      clearInterval(uhr);
      window.removeEventListener('resize', anpassen);
    };
  }, [level, versuch]);

  // --- Finger -------------------------------------------------------------
  // Der Finger schiebt das Geblaese WAAGERECHT; die Hoehe des Fingers ist
  // bedeutungslos, das Geblaese steht am Boden. Druecken laesst es blasen,
  // Loslassen stellt es ab — der Strahl klingt dann aus, statt abzureissen
  // (siehe physik.ts).
  const fahren = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const welt = weltRef.current;
    const canvas = canvasRef.current;
    if (!welt || !canvas) return;
    const kasten = canvas.getBoundingClientRect();
    const im = zuLevel({ x: e.clientX - kasten.left, y: e.clientY - kasten.top }, sichtRef.current);
    // In den Levelgrenzen halten, sonst schoebe man es aus dem Bild.
    welt.geblaese.x = Math.max(40, Math.min(level.groesse.breite - 40, im.x));
  };
  const anschalten = (e: React.PointerEvent<HTMLCanvasElement>) => {
    fahren(e);
    if (weltRef.current) weltRef.current.geblaese.an = true;
  };
  const loslassen = () => {
    if (weltRef.current) weltRef.current.geblaese.an = false;
  };

  const nochmal = () => setVersuch((v) => v + 1);

  return (
    <div className="fixed inset-0 bg-[#0d1330] select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); anschalten(e); }}
        onPointerMove={(e) => { if (e.buttons > 0 || e.pointerType === 'touch') fahren(e); }}
        onPointerUp={loslassen}
        onPointerCancel={loslassen}
      />

      {/* HUD */}
      <div className="absolute top-0 inset-x-0 p-4 pt-[max(1rem,env(safe-area-inset-top))]
                      flex items-center justify-between text-white/90 text-sm font-medium">
        <button onClick={zurueck} className="px-3 py-1.5 rounded-full bg-black/35 backdrop-blur">
          {t('spiel.zurueck')}
        </button>
        <span className="px-3 py-1.5 rounded-full bg-black/35 backdrop-blur tabular-nums">
          {level.tempo.zeitlimit > 0
            ? t('spiel.verbleibend', { s: Math.max(0, level.tempo.zeitlimit - zeit).toFixed(1) })
            : t('spiel.zeit', { s: zeit.toFixed(1) })}
        </span>
      </div>

      {/* Ende */}
      {ende && ende !== 'laeuft' && (
        <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm px-8">
          <div className="text-center text-white max-w-xs">
            <p className="text-5xl mb-3">{ende === 'geschafft' ? '🎈' : '💥'}</p>
            <h2 className="text-2xl font-semibold mb-1">{t(`spiel.ende.${ende}`)}</h2>
            <p className="text-white/70 mb-6">
              {ende === 'geschafft'
                ? t('spiel.gebraucht', { s: zeit.toFixed(1) })
                : t('spiel.trostworte')}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={nochmal}
                className="px-5 py-3 rounded-2xl bg-white text-[#0d1330] font-semibold">
                {t('spiel.nochmal')}
              </button>
              <button onClick={zurueck}
                className="px-5 py-3 rounded-2xl bg-white/15 font-semibold">
                {t('spiel.levelwahl')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
