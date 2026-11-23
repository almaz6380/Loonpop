// Menue und Spiel. Mehr braucht der erste spielbare Stand nicht — Routing,
// Konten und Bestenliste kommen in spaeteren Schritten (siehe README).

import { useEffect, useState } from 'react';

import { LEVEL, weltVon } from './spiel/level/index.ts';
import SpielPage from './pages/SpielPage.tsx';
import MenuePage from './pages/MenuePage.tsx';
import { lade, weltOffen } from './lib/fortschritt.ts';
import type { EndlosArt } from './spiel/typen.ts';
import { menueSichtbar, starteWerbung } from './lib/werbung.ts';
import { werbefreiPruefen } from './lib/kauf.ts';

/** Level-IDs je Welt (Index 0 = Welt 1). */
const WELT_IDS = [1, 2, 3, 4].map((w) => LEVEL.filter((l) => weltVon(l) === w).map((l) => l.id));

export default function App() {
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);
  const [endlos, setEndlos] = useState<EndlosArt | null>(null);
  /** Laeuft gerade die Tages-Herausforderung (ein Endlos-Lauf mit Tages-Seed)? */
  const [tages, setTages] = useState(false);
  const [fortschritt, setFortschritt] = useState(lade);
  const [werbefrei, setWerbefrei] = useState(false);

  // Werbung und Kauf nur einmal je App-Start einrichten (im Browser passiert nichts).
  useEffect(() => {
    void starteWerbung();
    void werbefreiPruefen().then(setWerbefrei);
  }, []);

  // Der Banner steht nur im Menue, nie ueber dem Spielfeld.
  const imMenue = endlos === null && gewaehlt === null;
  useEffect(() => { menueSichtbar(imMenue); }, [imMenue]);

  if (endlos !== null) {
    return (
      <SpielPage
        endlos={endlos}
        tages={tages}
        zurueck={() => { setFortschritt(lade()); setEndlos(null); setTages(false); }}
      />
    );
  }

  if (gewaehlt !== null) {
    return (
      <SpielPage
        level={LEVEL[gewaehlt]}
        // Neu laden: Die Spielseite hat inzwischen vielleicht einen Sieg gespeichert.
        zurueck={() => { setFortschritt(lade()); setGewaehlt(null); }}
        // „Weiter“ nur, wenn das naechste Level offen ist — die erste Stufe einer
        // neuen Welt braucht Sterne aus der vorigen (fortschritt.weltOffen).
        weiter={gewaehlt + 1 < LEVEL.length ? () => {
          const w = weltVon(LEVEL[gewaehlt + 1]);
          if (weltOffen(lade(), WELT_IDS, w)) setGewaehlt(gewaehlt + 1);
          else { setFortschritt(lade()); setGewaehlt(null); }
        } : undefined}
      />
    );
  }

  return (
    <MenuePage
      fortschritt={fortschritt}
      werbefrei={werbefrei}
      setWerbefrei={setWerbefrei}
      spieleLevel={setGewaehlt}
      // Nur noch nach oben (02.10.2026); der Lauf nach rechts ist
      // ausgeblendet, sein Code bleibt.
      spieleEndlos={() => { setTages(false); setEndlos('hoch'); }}
      spieleTagesflug={() => { setTages(true); setEndlos('hoch'); }}
      setFortschritt={setFortschritt}
    />
  );
}
