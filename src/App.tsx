// Menue und Spiel. Mehr braucht der erste spielbare Stand nicht — Routing,
// Konten und Bestenliste kommen in spaeteren Schritten (siehe README).

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LEVEL } from './spiel/level/index.ts';
import SpielPage from './pages/SpielPage.tsx';

/** Der Ballon im Menue — dasselbe Motiv wie im Spiel, damit es zusammenpasst. */
function MenueBallon() {
  return (
    <svg viewBox="0 0 120 170" className="w-24 h-auto mx-auto drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
      <defs>
        <radialGradient id="haut" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ff8d9e" />
          <stop offset="55%" stopColor="#f94d67" />
          <stop offset="100%" stopColor="#c62d47" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="58" rx="46" ry="52" fill="url(#haut)" />
      <path d="M52 108h16l-8 12z" fill="#c62d47" />
      <ellipse cx="42" cy="38" rx="11" ry="16" fill="#fff" opacity=".45" transform="rotate(-22 42 38)" />
      <path d="M60 120c12 14-12 20 0 30" stroke="#fff" strokeWidth="2.5" fill="none" opacity=".6" />
    </svg>
  );
}

export default function App() {
  const { t } = useTranslation();
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);

  if (gewaehlt !== null) {
    return <SpielPage level={LEVEL[gewaehlt]} zurueck={() => setGewaehlt(null)} />;
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

          <div className="mt-8 grid gap-2.5">
            {LEVEL.map((lvl, i) => (
              <button
                key={lvl.id}
                onClick={() => setGewaehlt(i)}
                className="group w-full pl-4 pr-5 py-3.5 rounded-2xl text-left
                           bg-white/12 hover:bg-white/20 backdrop-blur-sm
                           border border-white/15 shadow-lg shadow-black/10
                           flex items-center gap-3.5 active:scale-[0.98] transition"
              >
                <span className="shrink-0 w-9 h-9 rounded-xl bg-white/20 border border-white/20
                                 grid place-items-center font-bold tabular-nums">
                  {lvl.id}
                </span>
                <span className="flex-1 font-semibold">{lvl.name}</span>
                {/* Strecken kennzeichnen — sie spielen sich spuerbar anders. */}
                <span className="text-xs text-white/60 shrink-0">
                  {lvl.art === 'strecke' ? t('menue.strecke') : t('menue.hoch')}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-8 text-sm text-white/65 leading-relaxed">{t('menue.hinweis')}</p>
        </div>
      </div>
    </div>
  );
}
