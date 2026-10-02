// Menue und Spiel. Mehr braucht der erste spielbare Stand nicht — Routing,
// Konten und Bestenliste kommen in spaeteren Schritten (siehe README).

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LEVEL } from './spiel/level/index.ts';
import SpielPage from './pages/SpielPage.tsx';
import { lade, offen } from './lib/fortschritt.ts';
import { SPRACHEN } from './lib/sprache.ts';
import { setzeSprache } from './i18n/index.ts';
import type { EndlosArt } from './spiel/typen.ts';

const IDS = LEVEL.map((l) => l.id);

/**
 * Der Ballon im Menue — dasselbe Bild wie im Spiel, damit es zusammenpasst.
 * Die Schnur ist gemalt, wie im Spiel auch.
 */
function MenueBallon() {
  return (
    <div className="w-24 mx-auto drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
      <img src="/bilder/ballon.png" alt="" className="w-full h-auto" />
      <svg viewBox="0 0 20 40" className="w-5 h-10 mx-auto -mt-1" aria-hidden="true">
        <path d="M10 0c8 12-8 20 0 40" stroke="#fff" strokeWidth="2" fill="none" opacity=".6" />
      </svg>
    </div>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);
  const [endlos, setEndlos] = useState<EndlosArt | null>(null);
  const [fortschritt, setFortschritt] = useState(lade);

  if (endlos !== null) {
    return (
      <SpielPage
        endlos={endlos}
        zurueck={() => { setFortschritt(lade()); setEndlos(null); }}
      />
    );
  }

  if (gewaehlt !== null) {
    return (
      <SpielPage
        level={LEVEL[gewaehlt]}
        // Neu laden: Die Spielseite hat inzwischen vielleicht einen Sieg gespeichert.
        zurueck={() => { setFortschritt(lade()); setGewaehlt(null); }}
        weiter={gewaehlt + 1 < LEVEL.length ? () => setGewaehlt(gewaehlt + 1) : undefined}
      />
    );
  }

  return (
    <div className="min-h-dvh relative overflow-hidden
                    bg-gradient-to-b from-[#152364] via-[#2f5cb4] to-[#bfe2f2]">
      {/* Sonnenschein und Wiese — derselbe Himmel wie im Spiel, damit der
          Wechsel ins Level nicht wie ein Szenenwechsel wirkt. */}
      <div className="pointer-events-none absolute -top-24 -right-20 w-[28rem] h-[28rem] rounded-full
                      bg-[radial-gradient(circle,rgba(255,240,200,0.45),rgba(255,220,150,0)_65%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20
                      bg-gradient-to-b from-[#7dc25e] to-[#3d6e30]" />

      {/* ⚠ pb-28: Ohne den Abstand liegt der Hinweis unten auf der Wiese —
          weiss auf hellgruen ist kaum zu lesen. */}
      <div className="relative min-h-dvh grid place-items-center px-8 pt-12 pb-28">
        <div className="w-full max-w-sm text-center text-white">
          <MenueBallon />
          <h1 className="mt-5 text-5xl font-black tracking-tight
                         drop-shadow-[0_3px_10px_rgba(0,0,0,0.3)]">
            {t('menue.titel')}
          </h1>
          <p className="mt-3 text-white/85 leading-relaxed">{t('menue.untertitel')}</p>

          {/* Endlos: sofort frei. Wer nur ein paar Minuten hat, soll nicht
              erst zwoelf Level spielen muessen. */}
          <div className="mt-8 grid gap-2">
            {/* Nur noch nach oben (02.10.2026); der Lauf nach rechts ist
                ausgeblendet, sein Code bleibt. */}
            {(['hoch'] as const).map((art) => {
              const weite = fortschritt.endlos?.[art];
              return (
                <button
                  key={art}
                  onClick={() => setEndlos(art)}
                  className="px-3 py-3 rounded-2xl text-start bg-[#ffd75e] text-[#12204f]
                             shadow-lg shadow-black/15 active:scale-[0.98] transition"
                >
                  <span className="flex items-center gap-1.5 font-black">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor"
                         strokeWidth="3" aria-hidden="true">
                      <path d={art === 'hoch' ? 'M12 19V5M6 11l6-6 6 6' : 'M5 12h14M13 6l6 6-6 6'}
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t('menue.endlos')}
                  </span>
                  <span className="block text-xs font-semibold opacity-75 leading-snug">
                    {art === 'hoch' ? t('menue.endlosHoch') : t('menue.endlosStrecke')}
                  </span>
                  {weite !== undefined && (
                    <span className="block mt-1 text-sm font-bold tabular-nums">
                      {t('menue.bestweite', { m: weite })}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2">
            {LEVEL.map((lvl, i) => {
              const frei = offen(fortschritt, IDS, i);
              const bestzeit = fortschritt.bestzeit[lvl.id];
              return (
                <button
                  key={lvl.id}
                  disabled={!frei}
                  onClick={() => setGewaehlt(i)}
                  aria-label={frei ? undefined : `${t(`levelname.${lvl.id}`, lvl.name)} (${t('menue.gesperrt')})`}
                  className="group w-full ps-3.5 pe-4 py-2.5 rounded-2xl text-start
                             bg-white/12 enabled:hover:bg-white/20 backdrop-blur-sm
                             border border-white/15 shadow-lg shadow-black/10
                             flex items-center gap-3.5 enabled:active:scale-[0.98] transition
                             disabled:opacity-45"
                >
                  <span className="shrink-0 w-9 h-9 rounded-xl bg-white/20 border border-white/20
                                   grid place-items-center font-bold tabular-nums">
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">{t(`levelname.${lvl.id}`, lvl.name)}</span>
                  </span>
                  {bestzeit !== undefined && (
                    <span className="shrink-0 flex items-center gap-1.5 text-sm font-semibold tabular-nums text-[#ffe48a]">
                      {t('menue.bestzeit', { s: bestzeit.toFixed(1) })}
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                  {!frei && (
                    <svg viewBox="0 0 24 24" className="shrink-0 w-5 h-5 text-white/80" fill="none"
                         stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                      <rect x="5" y="11" width="14" height="10" rx="2.5" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-8 text-sm text-white/65 leading-relaxed">{t('menue.hinweis')}</p>

          {/* Die Sprache folgt dem Handy; hier laesst sie sich ueberstimmen.
              Ein natives <select>, weil das Handy dafuer seine eigene,
              grosse Auswahlliste zeigt. */}
          <label className="mt-5 inline-flex items-center gap-2 px-3.5 py-2 rounded-full
                            bg-white/12 border border-white/15 text-sm text-white/85">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor"
                 strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
            </svg>
            <span className="sr-only">{t('menue.sprache')}</span>
            <select
              value={i18n.resolvedLanguage}
              onChange={(e) => setzeSprache(e.target.value)}
              className="bg-transparent font-semibold outline-none"
            >
              {SPRACHEN.map((s) => (
                <option key={s.code} value={s.code} className="text-black">{s.name}</option>
              ))}
            </select>
          </label>

          {/* Statische Seiten (scripts/rechtstexte.py): Die Stores verlangen
              sie ohne App erreichbar, im App-Paket liegen sie trotzdem. */}
          <p className="mt-4 flex justify-center gap-4 text-xs text-white/60">
            <a href="datenschutz.html" className="underline underline-offset-2">{t('menue.datenschutz')}</a>
            <a href="impressum.html" className="underline underline-offset-2">{t('menue.impressum')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
