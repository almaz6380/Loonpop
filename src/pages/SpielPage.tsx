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
import {
  sichtBerechnen, sichtEndlosHoch, kameraFuer, kameraYFuer, zuLevel, zeichne, type Sicht,
} from '../spiel/zeichnen.ts';
import { neueEndlosWelt, neuerSeed, meter } from '../spiel/endlos.ts';
import type { Ausgang, EndlosArt, Level, Welt } from '../spiel/typen.ts';
import { lade, speichere, mitSieg, mitWeite } from '../lib/fortschritt.ts';

/**
 * Wie der Lauf zur bisherigen Bestmarke steht — fuers Ende-Fenster. Bei
 * Leveln ist das die Bestzeit (s), im Endlos-Lauf die Bestweite (m).
 */
type Rekord = { neu: boolean; beste: number | null };

export default function SpielPage({ level, endlos, zurueck, weiter }: {
  /** Ein gebautes Level — oder `endlos` fuer einen Endlos-Lauf. */
  level?: Level;
  endlos?: EndlosArt;
  zurueck: () => void;
  /** Fehlt beim letzten Level und im Endlos-Lauf. */
  weiter?: () => void;
}) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const weltRef = useRef<Welt | null>(null);
  const sichtRef = useRef<Sicht>({ skala: 1, randX: 0, randY: 0, breite: 0, hoehe: 0, kameraX: 0 });
  const [ende, setEnde] = useState<Ausgang | null>(null);
  const [versuch, setVersuch] = useState(0);
  const [zeit, setZeit] = useState(0);
  const [weite, setWeite] = useState(0);
  const [rekord, setRekord] = useState<Rekord | null>(null);
  /**
   * Wo der Finger auf dem BILDSCHIRM liegt (CSS-Pixel im Canvas), nicht in der
   * Welt. ⚠ Das ist der Unterschied, der auf Strecken zaehlt: Die Welt scrollt
   * unter dem Geblaese weg. Merkte man sich die Weltposition, bliebe das
   * Geblaese stehen und liefe nach links aus dem Bild, obwohl der Finger
   * ruhig liegt. Du gehst neben dem Ballon her, also zeigt der Finger, wo auf
   * dem Schirm du stehst.
   */
  const fingerRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Jeder Versuch im Endlos-Lauf bekommt einen neuen Seed. Die Uhr waehlt
    // nur den Seed — der Lauf selbst haengt dann allein an ihm.
    const welt = endlos ? neueEndlosWelt(endlos, neuerSeed(Date.now())) : neueWelt(level!);
    const lvl = welt.level;
    weltRef.current = welt;
    setEnde(null);
    setRekord(null);
    let endeUhr = 0;

    // ⚠ Auf dem Canvas in GERAETEPIXELN zeichnen, sonst ist auf einem Handy mit
    // doppelter Pixeldichte alles unscharf.
    const anpassen = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const b = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(b * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sichtRef.current = {
        ...(endlos === 'hoch'
          ? sichtEndlosHoch(b, h, lvl.groesse.breite)
          : sichtBerechnen(b, h, lvl.groesse.breite, lvl.groesse.hoehe, lvl.art)),
        kameraX: sichtRef.current.kameraX,
      };
    };
    anpassen();
    window.addEventListener('resize', anpassen);

    // Die Uhr im HUD darf nicht an der Schleife haengen — 5-mal je Sekunde
    // reicht fuers Auge und kostet React fast nichts.
    const uhr = setInterval(() => { setZeit(welt.zeit); setWeite(meter(welt)); }, 200);

    const schleife = starteSchleife(
      welt,
      (w, blende) => {
        // ⚠ Die Kamera wird beim ZEICHNEN nachgefuehrt, nicht in der Physik.
        // Sonst haenge der Weltzustand vom Bildschirm ab und derselbe Lauf
        // liefe auf zwei Geraeten verschieden.
        if (lvl.art === 'strecke') {
          const ziel = kameraFuer(sichtRef.current, w.ballon.pos.x, lvl.groesse.breite);
          // Weich nachziehen, damit das Bild nicht am Ballon klebt.
          sichtRef.current.kameraX += (ziel - sichtRef.current.kameraX) * 0.12;
        }
        // Endlos nach oben haengt die Kamera am Boden, den die Physik fuehrt.
        // Weich nachgezogen wie auf Strecken: Der Ballon wird zwischen zwei
        // Physikschritten gezeichnet, die Kamera soll nicht dazwischen springen.
        if (endlos === 'hoch') {
          const ziel = kameraYFuer(sichtRef.current, w.boden);
          const jetzt = sichtRef.current.kameraY;
          sichtRef.current.kameraY = jetzt === undefined || Math.abs(ziel - jetzt) > 600
            ? ziel : jetzt + (ziel - jetzt) * 0.25;
        }
        // Geblaese der Kamera nachfuehren — jedes Bild, nicht nur wenn sich der
        // Finger bewegt.
        if (fingerRef.current !== null) {
          const im = zuLevel({ x: fingerRef.current, y: 0 }, sichtRef.current);
          w.geblaese.x = Math.max(40, Math.min(lvl.groesse.breite - 40, im.x));
        }
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        zeichne(ctx, w, blende, sichtRef.current);
      },
      // ⚠ Verzoegert: Der Platz-Effekt dauert knapp eine Sekunde, und ein
      // Fenster, das sofort darueberfaellt, verdeckt genau den Moment, auf den
      // man gewartet hat.
      (w) => {
        // Sofort speichern, nicht erst mit dem Fenster: Wer gleich nach dem
        // Ankommen zurueck tippt, soll den Sieg trotzdem behalten.
        if (endlos) {
          const vorher = lade();
          const m = Math.floor(meter(w));
          const { f, neu } = mitWeite(vorher, endlos, m);
          speichere(f);
          const alt = vorher.endlos?.[endlos];
          // Schon der erste Lauf ist eine Bestweite — anders als bei Leveln,
          // wo das Ankommen selbst die Nachricht ist.
          setRekord({ neu: neu && m > 0, beste: alt ?? null });
          setWeite(meter(w));
        } else if (w.ausgang === 'geschafft') {
          const vorher = lade();
          const { f, neu } = mitSieg(vorher, lvl.id, w.zeit);
          speichere(f);
          const alt = vorher.bestzeit[lvl.id];
          setRekord({ neu: neu && alt !== undefined, beste: alt ?? null });
        }
        // Die Uhr im HUD laeuft nur alle 200 ms nach — fuers Ende-Fenster
        // zaehlt die genaue Zeit, sonst passt sie nicht zur Bestzeit.
        setZeit(w.zeit);
        endeUhr = window.setTimeout(() => setEnde(w.ausgang), 800);
      },
    );

    return () => {
      schleife.stopp();
      clearInterval(uhr);
      clearTimeout(endeUhr);
      window.removeEventListener('resize', anpassen);
    };
  }, [level, endlos, versuch]);

  // --- Finger -------------------------------------------------------------
  // Der Finger schiebt das Geblaese WAAGERECHT; die Hoehe des Fingers ist
  // bedeutungslos, das Geblaese steht am Boden. Druecken laesst es blasen,
  // Loslassen stellt es ab — der Strahl klingt dann aus, statt abzureissen
  // (siehe physik.ts).
  const fahren = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const kasten = canvas.getBoundingClientRect();
    // Nur die Bildschirmposition merken — umgerechnet wird bei jedem Bild,
    // weil sich die Kamera zwischendurch bewegt.
    fingerRef.current = Math.max(0, Math.min(kasten.width, e.clientX - kasten.left));
  };
  const anschalten = (e: React.PointerEvent<HTMLCanvasElement>) => {
    fahren(e);
    if (weltRef.current) weltRef.current.geblaese.an = true;
  };
  const loslassen = () => {
    if (weltRef.current) weltRef.current.geblaese.an = false;
    // Der Finger ist weg — das Geblaese bleibt stehen, wo es zuletzt war.
    fingerRef.current = null;
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
      <div className="absolute top-0 inset-x-0 p-3.5 pt-[max(0.9rem,env(safe-area-inset-top))]
                      flex items-center justify-between text-white text-sm font-semibold">
        <button
          onClick={zurueck}
          className="ps-2.5 pe-3.5 py-2 rounded-full bg-black/30 backdrop-blur-md
                     border border-white/10 flex items-center gap-1.5 active:scale-95 transition"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('spiel.zurueck')}
        </button>
        <span className="px-3.5 py-2 rounded-full bg-black/30 backdrop-blur-md
                         border border-white/10 tabular-nums">
          {endlos
            ? t('spiel.meter', { m: Math.floor(weite) })
            : level && level.tempo.zeitlimit > 0
              ? t('spiel.verbleibend', { s: Math.max(0, level.tempo.zeitlimit - zeit).toFixed(1) })
              : t('spiel.zeit', { s: zeit.toFixed(1) })}
        </span>
      </div>

      {/* Ende — erscheint verzoegert, damit man den Platz-Effekt noch sieht */}
      {ende && ende !== 'laeuft' && (
        <div className="absolute inset-0 grid place-items-center px-8
                        bg-gradient-to-b from-black/45 via-black/60 to-black/75 backdrop-blur-[3px]
                        animate-[einblenden_240ms_ease-out]">
          <div className="text-center text-white max-w-xs">
            <p className="text-6xl mb-3 drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
              {ende === 'geschafft' ? '🎈' : '💥'}
            </p>
            <h2 className="text-3xl font-black tracking-tight mb-1.5">{t(`spiel.ende.${ende}`)}</h2>
            <p className="text-white/75 leading-relaxed">
              {endlos
                ? t('spiel.weit', { m: Math.floor(weite) })
                : ende === 'geschafft'
                  ? t('spiel.gebraucht', { s: zeit.toFixed(1) })
                  : t('spiel.trostworte')}
            </p>
            {(ende === 'geschafft' || endlos) && rekord && (
              <p className="mt-1 text-sm font-semibold text-[#ffe48a]">
                {endlos
                  ? rekord.neu
                    ? t('spiel.neueBestweite')
                    : rekord.beste !== null && t('spiel.bestweite', { m: rekord.beste })
                  : rekord.neu
                    ? t('spiel.neueBestzeit')
                    : rekord.beste !== null && t('spiel.bestzeit', { s: rekord.beste.toFixed(1) })}
              </p>
            )}
            <div className="mb-7" />
            {ende === 'geschafft' && weiter && (
              <button onClick={weiter}
                className="w-full mb-3 px-6 py-3.5 rounded-2xl bg-[#ffd75e] text-[#12204f] font-bold
                           shadow-lg shadow-black/25 active:scale-95 transition">
                {t('spiel.weiter')}
              </button>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={nochmal}
                className="px-6 py-3.5 rounded-2xl bg-white text-[#12204f] font-bold
                           shadow-lg shadow-black/25 active:scale-95 transition">
                {t('spiel.nochmal')}
              </button>
              <button onClick={zurueck}
                className="px-6 py-3.5 rounded-2xl bg-white/12 border border-white/20
                           font-semibold backdrop-blur-sm active:scale-95 transition">
                {t('spiel.levelwahl')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
