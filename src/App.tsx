// Menue und Spiel. Mehr braucht der erste spielbare Stand nicht — Routing,
// Konten und Bestenliste kommen in spaeteren Schritten (siehe README).

import { useEffect, useState } from 'react';

import { LEVEL } from './spiel/level/index.ts';
import SpielPage from './pages/SpielPage.tsx';
import MenuePage from './pages/MenuePage.tsx';
import { lade } from './lib/fortschritt.ts';
import type { EndlosArt } from './spiel/typen.ts';
import { menueSichtbar, starteWerbung } from './lib/werbung.ts';
import { werbefreiPruefen } from './lib/kauf.ts';

export default function App() {
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);
  const [endlos, setEndlos] = useState<EndlosArt | null>(null);
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
    <MenuePage
      fortschritt={fortschritt}
      werbefrei={werbefrei}
      setWerbefrei={setWerbefrei}
      spieleLevel={setGewaehlt}
      // Nur noch nach oben (02.10.2026); der Lauf nach rechts ist
      // ausgeblendet, sein Code bleibt.
      spieleEndlos={() => setEndlos('hoch')}
    />
  );
}
