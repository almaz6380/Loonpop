// Das Menue: eine kleine Szene statt einer Liste (03.10.2026).
//
// Josef wollte eine bessere Startseite. Die alte war ein Titel ueber fuenfzehn
// untereinander gestapelten Zeilen, man musste scrollen, um zu sehen, was es
// gibt. Jetzt erklaert das Bild das Spiel: Das Geblaese steht auf der Wiese,
// darueber schwebt der Ballon im Luftstrahl. Ein grosser Knopf fuehrt ins
// naechste offene Level, die Level liegen als Raster darunter.
//
// ⚠ Dieselben Bilder wie im Spiel (public/bilder/), damit der Wechsel ins
// Level nicht wie ein Szenenwechsel wirkt.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LEVEL } from '../spiel/level/index.ts';
import { naechstes as naechstesLevel, offen, type Fortschritt } from '../lib/fortschritt.ts';
import { SPRACHEN } from '../lib/sprache.ts';
import { setzeSprache } from '../i18n/index.ts';
import { setzeTon, tonAn } from '../lib/ton.ts';

const IDS = LEVEL.map((l) => l.id);

function Szene() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Gemini-Landschaft (scripts/bild-quellen/menue-himmel.jpg): Himmel,
          Sonne, Huegel und Wiese in einem Bild. Unten verankert, damit die Wiese
          auf jedem Seitenverhaeltnis am Rand bleibt. */}
      <img src="/bilder/menue-himmel.jpg" alt=""
           className="absolute inset-0 w-full h-full object-cover object-bottom" />
      {/* Zwei ziehende Wolken bringen Bewegung — die im Bild stehen still.
          ⚠ Nicht hinter dem Titel: weisse Schrift auf weisser Wolke ist weg. */}
      {[
        { bild: 1, top: '22%', breite: 'w-32', dauer: '80s', verzug: '-25s', blass: 'opacity-80' },
        { bild: 3, top: '40%', breite: 'w-24', dauer: '110s', verzug: '-70s', blass: 'opacity-60' },
      ].map((w) => (
        <img key={w.bild} src={`/bilder/wolke${w.bild}.png`} alt=""
             className={`anim-ziehen absolute left-0 ${w.breite} ${w.blass}`}
             style={{ top: w.top, animationDuration: w.dauer, animationDelay: w.verzug }} />
      ))}
    </div>
  );
}

/**
 * Wo im Strahl die Luftstreifen aufsteigen: Versatz zur Mitte (px), Dauer,
 * Verzug. Feste Werte statt Zufall, damit jeder Screenshot gleich aussieht.
 */
const STREIFEN = [
  { x: -14, dauer: '1.5s', verzug: '0s' },
  { x: 10, dauer: '1.8s', verzug: '-0.6s' },
  { x: -3, dauer: '1.3s', verzug: '-1.1s' },
  { x: 18, dauer: '1.7s', verzug: '-0.3s' },
  { x: -22, dauer: '1.9s', verzug: '-1.4s' },
];

/**
 * Geblaese, Luftstrahl und Ballon — das ganze Spiel in einem Bild.
 * ⚠ Die Luftstreifen steigen sichtbar aus der Duese (30.10.2026): Ohne sie sah
 * der Strahl wie ein Lichtkegel aus, und man verstand nicht, dass hier Luft
 * blaest. Bewegt wird nur per transform (Falle 18).
 */
function Held() {
  return (
    <div className="relative mx-auto w-44 h-52" aria-hidden="true">
      <div className="anim-atmen absolute left-1/2 -translate-x-1/2 bottom-14 w-40 h-40
                      [clip-path:polygon(40%_100%,60%_100%,100%_0,0_0)]
                      bg-gradient-to-t from-white/50 via-white/15 to-transparent" />
      {STREIFEN.map((st, i) => (
        <span key={i}
              className="anim-luft absolute bottom-16 left-1/2 w-1 h-6 rounded-full bg-white/80"
              style={{ marginLeft: st.x, animationDuration: st.dauer, animationDelay: st.verzug }} />
      ))}
      <div className="anim-schweben absolute left-1/2 -ml-10 top-0 w-20 drop-shadow-[0_12px_20px_rgba(0,0,0,0.3)]">
        <img src="/bilder/ballon.png" alt="" className="w-full h-auto" />
      </div>
      {/* Ein weicher Schatten auf der Wiese, damit das Geblaese steht statt schwebt */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-20 h-3 rounded-[50%] bg-black/25 blur-[3px]" />
      <img src="/bilder/geblaese.png" alt=""
           className="absolute left-1/2 -translate-x-1/2 bottom-0 w-16 drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]" />
    </div>
  );
}

export default function MenuePage({ fortschritt, spieleLevel, spieleEndlos }: {
  fortschritt: Fortschritt;
  spieleLevel: (index: number) => void;
  spieleEndlos: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [ton, setTon] = useState(tonAn);
  const naechstes = naechstesLevel(fortschritt, IDS);
  const geschafft = LEVEL.filter((l) => fortschritt.bestzeit[l.id] !== undefined).length;
  const weite = fortschritt.endlos?.hoch;
  const name = (i: number) => t(`levelname.${LEVEL[i].id}`, LEVEL[i].name);

  return (
    <div className="min-h-dvh relative bg-[#2f5cb4] text-white">
      <Szene />

      {/* ⚠ pb-24: Unten liegt die Wiese; weiss auf hellgruen waere kaum lesbar. */}
      <main className="relative mx-auto w-full max-w-sm px-6 pt-[max(1.75rem,env(safe-area-inset-top))] pb-24 text-center">
        {/* Der Schriftzug aus Gemini (public/bilder/logo.png). Laedt er noch,
            steht der Name als Text da — alt ist zugleich die Ueberschrift. */}
        <h1 className="anim-auftauchen schrift-rund text-5xl font-bold">
          <img src="/bilder/logo.png" alt={t('menue.titel')}
               className="mx-auto w-72 h-auto drop-shadow-[0_6px_14px_rgba(10,20,60,0.4)]" />
        </h1>
        <p className="anim-auftauchen [animation-delay:80ms] mt-1.5 text-sm font-medium text-white leading-relaxed drop-shadow-[0_1px_6px_rgba(10,20,60,0.8)]">
          {t('menue.untertitel')}
        </p>

        <div className="anim-auftauchen [animation-delay:160ms] mt-4"><Held /></div>

        {/* Der grosse Knopf: weiter, wo man aufgehoert hat */}
        <button
          onClick={() => spieleLevel(naechstes)}
          className="anim-auftauchen [animation-delay:240ms] glanz schrift-rund relative overflow-hidden mt-5 w-full rounded-3xl
                     bg-gradient-to-b from-[#ffe27e] to-[#ffd04a] text-[#12204f] px-5 py-3.5
                     shadow-[0_8px_0_#d9a92e,0_14px_24px_rgba(0,0,0,0.25)]
                     active:translate-y-1 active:shadow-[0_4px_0_#d9a92e,0_8px_16px_rgba(0,0,0,0.25)] transition"
        >
          <span className="flex items-center justify-center gap-2 text-2xl font-bold">
            <svg viewBox="0 0 24 24" className="w-6 h-6 rtl:-scale-x-100" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
            </svg>
            {t('menue.spielen')}
          </span>
          <span className="block mt-0.5 text-sm font-semibold opacity-75 truncate">
            {t('menue.level', { n: naechstes + 1 })} · {name(naechstes)}
          </span>
        </button>

        <button
          onClick={spieleEndlos}
          className="anim-auftauchen [animation-delay:320ms] mt-3 w-full rounded-3xl bg-gradient-to-b from-[#24418f]/90 to-[#162a66]/90 border border-white/25 px-5 py-3
                     shadow-[0_6px_0_rgba(10,20,60,0.35),0_12px_24px_rgba(10,20,60,0.25)]
                     flex items-center gap-3 text-start active:scale-[0.98] transition"
        >
          <span className="shrink-0 w-10 h-10 rounded-2xl bg-white/15 grid place-items-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
              <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="flex-1 min-w-0">
            <span className="schrift-rund block text-lg font-bold">{t('menue.endlos')}</span>
            <span className="block text-xs text-white/75 truncate">{t('menue.endlosHoch')}</span>
          </span>
          {weite !== undefined && (
            <span className="schrift-rund shrink-0 text-lg font-bold tabular-nums text-[#ffe48a]">
              {t('menue.bestweite', { m: weite })}
            </span>
          )}
        </button>

        {/* Alle Level als Raster: geschafft (gelb), naechstes (pulsiert), gesperrt */}
        <section className="anim-auftauchen [animation-delay:400ms] mt-5 rounded-3xl bg-[#12204f]/75 border border-white/20 p-4
                            shadow-[0_12px_30px_rgba(10,20,60,0.25)]">
          <div className="flex items-baseline justify-between">
            <h2 className="schrift-rund text-lg font-bold">{t('menue.alleLevel')}</h2>
            <span className="text-sm font-semibold tabular-nums text-white/80">
              {geschafft}/{LEVEL.length}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {LEVEL.map((lvl, i) => {
              const frei = offen(fortschritt, IDS, i);
              const bestzeit = fortschritt.bestzeit[lvl.id];
              const fertig = bestzeit !== undefined;
              return (
                <button
                  key={lvl.id}
                  disabled={!frei}
                  onClick={() => spieleLevel(i)}
                  aria-label={`${t('menue.level', { n: i + 1 })}: ${name(i)}${frei ? '' : ` (${t('menue.gesperrt')})`}`}
                  title={name(i)}
                  className={`schrift-rund relative aspect-square rounded-2xl grid place-items-center
                              text-lg font-bold tabular-nums transition active:scale-95
                              ${fertig ? 'bg-[#ffd75e] text-[#12204f] shadow-[0_3px_0_#d9a92e]'
                                : frei ? 'bg-white text-[#12204f] shadow-[0_3px_0_#b9c6e4]'
                                  : 'bg-white/10 text-white/40 border border-white/15'}
                              ${i === naechstes && !fertig ? 'anim-rufen' : ''}`}
                >
                  {frei ? i + 1 : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                      <rect x="5" y="11" width="14" height="10" rx="2.5" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                    </svg>
                  )}
                  {fertig && (
                    <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-[#4caf50] text-white grid place-items-center
                                     border-2 border-[#12204f]">
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="4" aria-hidden="true">
                        <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <p className="mt-5 text-xs text-white/85 leading-relaxed drop-shadow-[0_1px_4px_rgba(10,20,60,0.6)]">
          {t('menue.hinweis')}
        </p>

        {/* Die Sprache folgt dem Handy; hier laesst sie sich ueberstimmen.
            Ein natives <select>, weil das Handy dafuer seine eigene, grosse
            Auswahlliste zeigt. */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/85">
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12204f]/55 border border-white/20">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
            </svg>
            <span className="sr-only">{t('menue.sprache')}</span>
            <select value={i18n.resolvedLanguage} onChange={(e) => setzeSprache(e.target.value)}
                    className="bg-transparent font-semibold outline-none">
              {SPRACHEN.map((s) => (
                <option key={s.code} value={s.code} className="text-black">{s.name}</option>
              ))}
            </select>
          </label>
          {/* Ton und Vibration gemeinsam (ton.ts, haptik.ts). ⚠ Nicht als
              direktes Kind von <main>: store-bilder.mjs zaehlt dort die Knoepfe. */}
          <button
            onClick={() => { setzeTon(!ton); setTon(!ton); }}
            aria-pressed={ton}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#12204f]/55 border border-white/20 font-semibold"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
              {ton
                ? <path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
                : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
            </svg>
            {t(ton ? 'menue.tonAn' : 'menue.tonAus')}
          </button>
          {/* Statische Seiten (scripts/rechtstexte.py): Die Stores verlangen
              sie ohne App erreichbar, im App-Paket liegen sie trotzdem. */}
          <a href="datenschutz.html" className="underline underline-offset-2">{t('menue.datenschutz')}</a>
          <a href="impressum.html" className="underline underline-offset-2">{t('menue.impressum')}</a>
        </div>
      </main>
    </div>
  );
}
