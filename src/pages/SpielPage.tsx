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
import { glaetten, KAMERA_TEMPO } from '../spiel/kamera.ts';
import { naechsteDichte, startDichte, DICHTE_FENSTER } from '../spiel/dichte.ts';
import {
  sichtBerechnen, sichtEndlosHoch, kameraFuer, kameraMitte, kameraYFuer, zuLevel, zeichne, type Sicht,
} from '../spiel/zeichnen.ts';
import { neueEndlosWelt, neuerSeed, meter } from '../spiel/endlos.ts';
import type { Ausgang, EndlosArt, Level, Welt } from '../spiel/typen.ts';
import { lade, speichere, mitSieg, mitWeite, mitSternen } from '../lib/fortschritt.ts';
import { sterneFuer } from '../spiel/sterne.ts';
import * as ton from '../lib/ton.ts';
import * as haptik from '../lib/haptik.ts';
import { platzerGezaehlt, vielleichtVollbild, weiterfliegenMoeglich, zeigeBelohnungsvideo } from '../lib/werbung.ts';
import { vielleichtUmBewertungBitten } from '../lib/bewertung.ts';
import { kannWeiterfliegen, weiterfliegen } from '../spiel/weiterfliegen.ts';
import { istWisch } from '../spiel/steuerung.ts';
import { LEVEL } from '../spiel/level/index.ts';

/**
 * Wie der Lauf zur bisherigen Bestmarke steht — fuers Ende-Fenster. Bei
 * Leveln ist das die Bestzeit (s), im Endlos-Lauf die Bestweite (m).
 */
type Rekord = { neu: boolean; beste: number | null };

/**
 * Die Anleitung im ersten Level (30.10.2026): erst „halten“, dann „versetzt
 * stehen“. ⚠ Die zweite Stufe ist die eigentliche Idee des Spiels (Regel 1a).
 * Ohne sie hielt man LoonPop nach dem ersten Blick für eines der vielen
 * Ballon-Spiele, und Apple tat genau das (4.3(a)).
 */
type Tipp = 'halten' | 'versetzt' | null;

/** So lange bleibt „versetzt stehen“ höchstens stehen (Spielsekunden). */
const TIPP_DAUER = 8;
/** Ab dieser Neigung (rad) hat man das Kippen offenbar verstanden. */
const TIPP_NEIGUNG = 0.35;

/**
 * Die Pixeldichte, die dieses Geraet schafft (siehe dichte.ts). Ausserhalb der
 * Komponente: Einmal gesenkt, gilt sie fuer alle weiteren Laeufe der Sitzung.
 */
let dichte: number | null = null;

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
  /** Sterne und neu verdiente Muenzen dieses Laufs (Ende-Fenster). */
  const [sterne, setSterne] = useState(0);
  const [plusMuenzen, setPlusMuenzen] = useState(0);
  /** Eingesammelte Muenzen im laufenden Versuch (HUD). */
  const [gesammelt, setGesammelt] = useState(0);
  const [tipp, setTipp] = useState<Tipp>(null);
  /** Laeuft gerade das Video fuers Weiterfliegen? (sperrt den Knopf) */
  const [videoLaeuft, setVideoLaeuft] = useState(false);
  const [videoFehlt, setVideoFehlt] = useState(false);
  /** Darf dieser Lauf noch weiterfliegen? Beim Ende gesetzt (Refs nicht im Rendern lesen). */
  const [nochWeiter, setNochWeiter] = useState(false);
  /**
   * Wo der Finger auf dem BILDSCHIRM liegt (CSS-Pixel im Canvas), nicht in der
   * Welt. ⚠ Das ist der Unterschied, der auf Strecken zaehlt: Die Welt scrollt
   * unter dem Geblaese weg. Merkte man sich die Weltposition, bliebe das
   * Geblaese stehen und liefe nach links aus dem Bild, obwohl der Finger
   * ruhig liegt. Du gehst neben dem Ballon her, also zeigt der Finger, wo auf
   * dem Schirm du stehst.
   */
  const fingerRef = useRef<number | null>(null);
  /** Wo und wann der Finger aufgesetzt hat — fuer den Wisch-Windstoss. */
  const wischRef = useRef<{ x: number; t: number } | null>(null);

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
    setSterne(0);
    setPlusMuenzen(0);
    setGesammelt(0);
    let endeUhr = 0;
    // Nur im ersten Level, und dort bei jedem Versuch: Wer zum ersten Mal
    // platzt, hat die Anleitung meist noch nicht verinnerlicht.
    let tippJetzt: Tipp = !endlos && level?.id === 1 ? 'halten' : null;
    let tippSeit = 0;
    setTipp(tippJetzt);

    // ⚠ Auf dem Canvas in GERAETEPIXELN zeichnen, sonst ist auf einem Handy mit
    // doppelter Pixeldichte alles unscharf.
    dichte ??= startDichte(window.devicePixelRatio);
    const anpassen = () => {
      const dpr = dichte!;
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
    const uhr = setInterval(() => {
      setZeit(welt.zeit);
      setWeite(meter(welt));
      setGesammelt(welt.gesammelt?.length ?? 0);
      if (tippJetzt === 'halten' && welt.geblaese.an) {
        tippJetzt = 'versetzt';
        tippSeit = welt.zeit;
        setTipp(tippJetzt);
      } else if (tippJetzt === 'versetzt' && (welt.zeit - tippSeit > TIPP_DAUER
        || Math.abs(welt.geblaese.neigung ?? 0) > TIPP_NEIGUNG || welt.ausgang !== 'laeuft')) {
        tippJetzt = null;
        setTipp(null);
      }
    }, 200);

    let letztesBild = performance.now();
    let messSumme = 0;
    let messBilder = -10; // die ersten Bilder (Laden, Aufwaermen) zaehlen nicht
    const schleife = starteSchleife(
      welt,
      (w, blende) => {
        const jetztMs = performance.now();
        const dtMs = jetztMs - letztesBild;
        letztesBild = jetztMs;
        if (++messBilder > 0) {
          messSumme += dtMs;
          if (messBilder === DICHTE_FENSTER) {
            const neu = naechsteDichte(dichte!, messSumme / DICHTE_FENSTER);
            if (neu !== dichte) { dichte = neu; anpassen(); }
            messBilder = 0;
            messSumme = 0;
          }
        }
        // Hoechstens 0,1 s auf einmal nachziehen: Nach einem Tab-Wechsel soll
        // die Kamera nicht ueber den Ballon hinwegspringen.
        const dt = Math.min(dtMs / 1000, 0.1);
        // ⚠ Die Kamera wird beim ZEICHNEN nachgefuehrt, nicht in der Physik.
        // Sonst haenge der Weltzustand vom Bildschirm ab und derselbe Lauf
        // liefe auf zwei Geraeten verschieden.
        if (lvl.art === 'hoch' && !endlos) {
          const ziel = kameraMitte(sichtRef.current, w.ballon.pos.x, lvl.groesse.breite);
          sichtRef.current.kameraX = glaetten(sichtRef.current.kameraX, ziel, dt, KAMERA_TEMPO.strecke);
        }
        if (lvl.art === 'strecke') {
          const ziel = kameraFuer(sichtRef.current, w.ballon.pos.x, lvl.groesse.breite);
          // Weich nachziehen, damit das Bild nicht am Ballon klebt.
          sichtRef.current.kameraX = glaetten(sichtRef.current.kameraX, ziel, dt, KAMERA_TEMPO.strecke);
        }
        // Endlos nach oben haengt die Kamera am Boden, den die Physik fuehrt.
        // Weich nachgezogen wie auf Strecken: Der Ballon wird zwischen zwei
        // Physikschritten gezeichnet, die Kamera soll nicht dazwischen springen.
        if (endlos === 'hoch') {
          const ziel = kameraYFuer(sichtRef.current, w.boden);
          const jetzt = sichtRef.current.kameraY;
          sichtRef.current.kameraY = jetzt === undefined || Math.abs(ziel - jetzt) > 600
            ? ziel : glaetten(jetzt, ziel, dt, KAMERA_TEMPO.hoch);
        }
        // Das Ziel des Geblaeses jedes Bild neu umrechnen, nicht nur wenn sich
        // der Finger bewegt (die Kamera kann wandern). Hinfahren und Kippen
        // rechnet die Physik (steuerung.ts) — sonst hinge es an der Bildrate.
        w.geblaese.ziel = fingerRef.current === null
          ? undefined
          : zuLevel({ x: fingerRef.current, y: 0 }, sichtRef.current).x;
        ctx.setTransform(dichte!, 0, 0, dichte!, 0, 0);
        zeichne(ctx, w, blende, sichtRef.current);
        // Nach dem Ende rechnet die Physik nicht weiter, die Stärke bliebe
        // stehen. Dann soll das Gebläse verstummen.
        ton.geblaese(w.ausgang === 'laeuft' ? w.geblaese.staerke : 0);
      },
      // ⚠ Verzoegert: Der Platz-Effekt dauert knapp eine Sekunde, und ein
      // Fenster, das sofort darueberfaellt, verdeckt genau den Moment, auf den
      // man gewartet hat.
      (w) => {
        if (w.ausgang === 'geschafft') { ton.ankommen(); haptik.erfolg(); }
        else if (w.ausgang === 'geplatzt') { ton.platzen(); haptik.stoss(); }
        // Nur zaehlen — gezeigt wird erst beim Weitertippen (werbetakt.ts).
        if (w.ausgang === 'geplatzt') platzerGezaehlt();
        setNochWeiter(kannWeiterfliegen(w));
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
          const { f: mitZeit, neu } = mitSieg(vorher, lvl.id, w.zeit);
          const st = sterneFuer(w);
          const { f, plusMuenzen: plus } = mitSternen(mitZeit, lvl.id, st, w.gesammelt?.length ?? 0);
          speichere(f);
          setSterne(st);
          setPlusMuenzen(plus);
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
      ton.geblaese(0);
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
    wischRef.current = { x: e.clientX, t: performance.now() };
    ton.wecken();
    haptik.tippen();
    if (weltRef.current) weltRef.current.geblaese.an = true;
  };
  const loslassen = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    // Kurz und schnell seitwaerts gewischt? Dann ein Windstoss (steuerung.ts).
    const w0 = wischRef.current;
    wischRef.current = null;
    if (e && w0 && weltRef.current) {
      const r = istWisch(e.clientX - w0.x, performance.now() - w0.t);
      if (r) { weltRef.current.geblaese.stoss = r; haptik.tippen(); }
    }
    if (weltRef.current) weltRef.current.geblaese.an = false;
    // Der Finger ist weg — das Geblaese bleibt stehen, wo es zuletzt war.
    fingerRef.current = null;
  };

  // Eine faellige Vollbild-Anzeige laeuft beim Verlassen des Ende-Fensters,
  // nie mitten im Platzen. Das Spiel wartet nicht auf sie: Sie legt sich
  // ueber die WebView, und danach geht es genau dort weiter.
  //
  // Nach einem geschafften Level darf beim Verlassen die Bewertungsbitte kommen
  // (bewertung.ts) — aber nie zugleich mit einer Vollbild-Anzeige.
  // „Weiter“ zeigt keine Vollbild-Anzeige: Die kommen nur nach dem Platzen
  // (werbetakt.ts), und nach einem Sieg soll es ohne Pause weitergehen.
  const verlassen = (mitVollbild = true) => {
    const vollbild = mitVollbild && vielleichtVollbild();
    if (ende === 'geschafft') {
      const f = lade();
      const geschafft = LEVEL.filter((l) => f.bestzeit[l.id] !== undefined).length;
      void vielleichtUmBewertungBitten(geschafft, vollbild);
    }
  };
  const nochmal = () => { verlassen(); setVideoFehlt(false); setVersuch((v) => v + 1); };
  const zurLevelwahl = () => { verlassen(); zurueck(); };
  const naechstesLevel = weiter && (() => { verlassen(false); weiter(); });

  // „Weiterfliegen“: einmal je Versuch nach dem Platzen, gegen ein freiwilliges
  // Video (src/spiel/weiterfliegen.ts). Nur wenn es eine Anzeigen-ID gibt.
  const weiterfliegenAnbieten = ende === 'geplatzt' && nochWeiter && weiterfliegenMoeglich();
  const videoAnsehen = async () => {
    if (videoLaeuft) return;
    setVideoLaeuft(true);
    setVideoFehlt(false);
    const ergebnis = await zeigeBelohnungsvideo();
    setVideoLaeuft(false);
    const w = weltRef.current;
    if (ergebnis === 'earned' && w && weiterfliegen(w)) {
      // Der Finger liegt nicht mehr auf dem Spielfeld.
      w.geblaese.an = false;
      fingerRef.current = null;
      setRekord(null);
      setNochWeiter(false);
      setEnde(null);
    } else if (ergebnis === 'unavailable') {
      setVideoFehlt(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0d1330] select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); anschalten(e); }}
        onPointerMove={(e) => { if (e.buttons > 0 || e.pointerType === 'touch') fahren(e); }}
        onPointerUp={loslassen}
        onPointerCancel={() => loslassen()}
      />

      {/* HUD. ⚠ Auf Android (ab 15 randlos) meldet Capacitor die Statusleiste
          nicht ueber env(), sondern als --safe-area-inset-top (SystemBars). */}
      <div className="absolute top-0 inset-x-0 p-3.5 pt-[max(0.9rem,env(safe-area-inset-top),var(--safe-area-inset-top,0px))]
                      flex items-center justify-between text-white text-sm font-semibold">
        <button
          onClick={zurueck}
          className="ps-2.5 pe-3.5 py-2 rounded-full bg-black/40
                     border border-white/10 flex items-center gap-1.5 active:scale-95 transition"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('spiel.zurueck')}
        </button>
        {!endlos && level?.muenzen && (
          <span className="schrift-rund px-3 py-1.5 rounded-full bg-black/40 border border-white/10
                           flex items-center gap-1.5 tabular-nums text-base">
            <Muenze klein />
            {gesammelt}/{level.muenzen.length}
          </span>
        )}
        <span className="schrift-rund text-base px-3.5 py-1.5 rounded-full bg-black/40
                         border border-white/10 tabular-nums">
          {endlos
            ? t('spiel.meter', { m: Math.floor(weite) })
            : level && level.tempo.zeitlimit > 0
              ? t('spiel.verbleibend', { s: Math.max(0, level.tempo.zeitlimit - zeit).toFixed(1) })
              : t('spiel.zeit', { s: zeit.toFixed(1) })}
        </span>
      </div>

      {/* Anleitung im ersten Level. pointer-events-none: Der Finger muss
          durch sie hindurch aufs Spielfeld. ⚠ Oben unter der Kopfleiste: Unten
          verdeckte sie den Ballon, gerade wenn man ihn am dringendsten sieht. */}
      {tipp && !ende && (
        <div className="pointer-events-none absolute inset-x-0 top-[max(4.5rem,calc(env(safe-area-inset-top)+3.75rem),calc(var(--safe-area-inset-top,0px)+3.75rem))]
                        flex justify-center px-6">
          <p key={tipp}
             className="max-w-xs rounded-2xl bg-[#12204f]/85 border border-white/20 px-4 py-3 text-center
                        text-white text-sm font-semibold leading-snug shadow-lg shadow-black/25
                        animate-[einblenden_240ms_ease-out]">
            {t(`spiel.tipp.${tipp}`)}
          </p>
        </div>
      )}

      {/* Ende — erscheint verzoegert, damit man den Platz-Effekt noch sieht */}
      {ende && ende !== 'laeuft' && (
        <div className="absolute inset-0 grid place-items-center px-8
                        bg-gradient-to-b from-black/45 via-black/60 to-black/75
                        animate-[einblenden_240ms_ease-out]">
          <div className="text-center text-white w-full max-w-xs rounded-[28px] px-6 pt-6 pb-6
                          bg-gradient-to-b from-[#24407f]/95 to-[#12204f]/95 border border-white/15
                          shadow-2xl shadow-black/40 animate-[auftauchen_380ms_cubic-bezier(.2,1.4,.4,1)]">
            <div className="mx-auto mb-2 w-20 h-20 grid place-items-center">
              {ende === 'geschafft' ? <BallonSymbol /> : <PlatzSymbol />}
            </div>
            <h2 className="schrift-rund text-3xl font-bold tracking-tight mb-1">{t(`spiel.ende.${ende}`)}</h2>
            {ende === 'geschafft' && !endlos && (
              <div className="flex justify-center gap-2 my-2" aria-label={`${sterne}/3`}>
                {[0, 1, 2].map((i) => (
                  <Stern key={i} an={i < sterne} verzoegerung={250 + i * 220} gross={i === 1} />
                ))}
              </div>
            )}
            <p className="text-white/80 leading-relaxed">
              {endlos
                ? t('spiel.weit', { m: Math.floor(weite) })
                : ende === 'geschafft'
                  ? t('spiel.gebraucht', { s: zeit.toFixed(1) })
                  : t('spiel.trostworte')}
            </p>
            {plusMuenzen > 0 && (
              <p className="schrift-rund mt-1 flex items-center justify-center gap-1.5 text-[#ffe48a] text-lg">
                <Muenze klein /> +{plusMuenzen}
              </p>
            )}
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
            {weiterfliegenAnbieten && (
              <button onClick={() => void videoAnsehen()} disabled={videoLaeuft}
                className="w-full mb-3 px-6 py-3.5 rounded-2xl bg-[#ffd75e] text-[#12204f] font-bold
                           shadow-lg shadow-black/25 active:scale-95 transition disabled:opacity-60
                           flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 rtl:-scale-x-100" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                </svg>
                {t('spiel.weiterfliegen')}
              </button>
            )}
            {videoFehlt && ende === 'geplatzt' && (
              <p className="-mt-1 mb-3 text-sm text-[#ffe48a]" role="status">{t('spiel.videoFehlt')}</p>
            )}
            {ende === 'geschafft' && naechstesLevel && (
              <button onClick={naechstesLevel}
                className="w-full mb-3 px-6 py-3.5 rounded-2xl bg-[#ffd75e] text-[#12204f] font-bold
                           shadow-lg shadow-black/25 active:scale-95 transition">
                {t('spiel.weiter')}
              </button>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={nochmal}
                className="px-6 py-3.5 rounded-2xl bg-white text-[#12204f] font-bold
                           shadow-lg shadow-black/25 active:scale-95 transition schrift-rund">
                {t('spiel.nochmal')}
              </button>
              <button onClick={zurLevelwahl}
                className="px-6 py-3.5 rounded-2xl bg-white/12 border border-white/20
                           font-semibold active:scale-95 transition schrift-rund">
                {t('spiel.levelwahl')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------- kleine Bilder
// Gezeichnet statt Emoji (Neugestaltung 23.11.2026): Emoji sehen auf jedem
// Geraet anders aus und wirkten billig.

function Muenze({ klein }: { klein?: boolean }) {
  const g = klein ? 'w-5 h-5' : 'w-8 h-8';
  return (
    <svg viewBox="0 0 24 24" className={g} aria-hidden="true">
      <defs>
        <linearGradient id="mz" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3a8" /><stop offset=".45" stopColor="#ffc93c" /><stop offset="1" stopColor="#d9860b" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="13" r="10" fill="#a8650a" />
      <circle cx="12" cy="12" r="10" fill="url(#mz)" />
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.4" />
    </svg>
  );
}

function Stern({ an, verzoegerung, gross }: { an: boolean; verzoegerung: number; gross?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"
      className={`${gross ? 'w-14 h-14 -mt-2' : 'w-11 h-11'} ${an ? 'anim-stern' : 'opacity-35'}`}
      style={an ? { animationDelay: `${verzoegerung}ms` } : undefined}>
      <defs>
        <linearGradient id="st" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1a0" /><stop offset=".5" stopColor="#ffc93c" /><stop offset="1" stopColor="#e08a0b" />
        </linearGradient>
      </defs>
      <path d="M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z"
        fill={an ? 'url(#st)' : '#0b1638'} stroke={an ? '#fff6c8' : '#ffffff40'} strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

function BallonSymbol() {
  return (
    <img src="/bilder/ballon.png" alt="" className="h-20 drop-shadow-[0_8px_14px_rgba(0,0,0,0.4)] anim-schweben-klein" />
  );
}

function PlatzSymbol() {
  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20" aria-hidden="true">
      <g fill="#e63a52">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} transform={`rotate(${i * 45 + 10} 40 40) translate(40 14)`}
            d="M-6 -3 Q0 -8 7 -2 Q3 4 -5 4 Z" opacity={i % 2 ? 0.75 : 1} />
        ))}
      </g>
      <circle cx="40" cy="40" r="12" fill="none" stroke="#fff" strokeWidth="3" strokeOpacity=".85" />
    </svg>
  );
}
