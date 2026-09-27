// Menue und Spiel. Mehr braucht der erste spielbare Stand nicht — Routing,
// Konten und Bestenliste kommen in spaeteren Schritten (siehe README).

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LEVEL } from './spiel/level/index.ts';
import SpielPage from './pages/SpielPage.tsx';

export default function App() {
  const { t } = useTranslation();
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);

  if (gewaehlt !== null) {
    return <SpielPage level={LEVEL[gewaehlt]} zurueck={() => setGewaehlt(null)} />;
  }

  return (
    <div className="min-h-dvh grid place-items-center px-8 py-12
                    bg-gradient-to-b from-[#1b2a6b] via-[#3f6bc4] to-[#8fc4e8]">
      <div className="w-full max-w-sm text-center text-white">
        <p className="text-6xl mb-4">🎈</p>
        <h1 className="text-4xl font-bold tracking-tight">{t('menue.titel')}</h1>
        <p className="mt-2 text-white/80">{t('menue.untertitel')}</p>

        <div className="mt-8 grid gap-3">
          {LEVEL.map((lvl, i) => (
            <button
              key={lvl.id}
              onClick={() => setGewaehlt(i)}
              className="w-full px-5 py-4 rounded-2xl bg-white/15 backdrop-blur
                         flex items-center justify-between active:scale-[0.98] transition"
            >
              <span className="font-semibold">{t('menue.level', { n: lvl.id })}</span>
              <span className="text-white/70 text-sm">{lvl.name}</span>
            </button>
          ))}
        </div>

        <p className="mt-8 text-sm text-white/60 leading-relaxed">{t('menue.hinweis')}</p>
      </div>
    </div>
  );
}
