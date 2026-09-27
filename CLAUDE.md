# CLAUDE.md — loonpop (Ballon-Geschicklichkeitsspiel)

## In einem Satz

Ein Ballon schwebt durch ein Level; der Spieler bedient ein **Laubgebläse** am
unteren Rand, das den Ballon nach oben bläst. **Nadeln** lassen ihn platzen.
Die sechste App von Josef.

**Repository:** https://github.com/almaz6380/loonpop (privat)
**Stand:** M1 — spielbar, drei Level. Siehe README für die Reihenfolge bis zum Store.
**Bedienung:** Josef arbeitet meist vom Handy. Kein Deploy, kein Release, kein
Löschen ohne ausdrückliches „ja" im Chat.

## Die drei Regeln, an denen das Spiel hängt

**1. Trägheit ist Absicht, kein Fehler.** Der Ballon reagiert verzögert und treibt
nach dem Loslassen weiter. Wer das „schwammig" findet und die Dämpfung hochdreht,
baut ein anderes Spiel — das Vorausdenken IST die Aufgabe.

**1a. Das Gebläse lässt sich NICHT drehen.** Es bläst senkrecht nach oben; der
Strahl wird nach oben breiter und schwächer. Seitlich gesteuert wird über die
**eigene Position**: Am Strahlrand getroffen, wird der Ballon zur Seite gedrückt.
⚠ Wer hier eine Neigung einbaut, nimmt dem Spiel seine einzige Idee. Die
Steuerung war bis zum 27.09.2026 falsch gebaut (tippen, wohin der Wind soll) —
das war ein anderes Spiel.

**2. Tempo kommt über den Level, nie über die Physik.** Schneller wird ein Level
durch engere Gassen, stärkeren Wind (`tempo.windKraft`) und Zeitlimits. Ein
zweiter Physik-Modus wären zwei Spiele, die sich beide nur halb gut anfühlen.
⚠ Nachmessen statt raten: `scratchpad/balance.mts` simuliert einen Steigflug ohne
Browser und sagt, wie viele Pixel der Ballon in der ersten Sekunde steigt.
Richtwert **rund 150 px** — bei den ersten Werten waren es 504, und der Ballon
schoss durchs Level. `blaskraft` ist die Schraube.

**3. Der Spielkern kennt kein React und keinen Browser.** `src/spiel/` ist reines
TypeScript. Nur so ist er testbar — und nur so bleibt er deterministisch.

## Zwei Level-Arten

| `art` | Aufgabe | Kamera |
|---|---|---|
| `hoch` | Der Ballon muss nach **oben**; das ganze Level passt auf den Schirm | fest |
| `strecke` | Der Ballon muss nach **rechts**; das Level ist breiter als der Schirm | läuft waagerecht mit |

Auf Strecken treibt ein **Grundwind** (`Level.grundwind`) den Ballon nach rechts.
⚠ Ohne ihn müsste man ihn über den Strahlrand dorthinschieben — bei 2700 px
Strecke wären das gut 30 Sekunden Seitwärtsschieben. Mit Grundwind wird daraus,
was es sein soll: Der Ballon treibt wie ein Blatt, du hältst ihn in der Luft und
lenkst; durch Versetzen beschleunigst du oder bremst.

⚠ **`art` wird nicht aus der Größe erraten.** Bei welchem Seitenverhältnis
gescrollt würde, hinge sonst vom Gerät ab — dasselbe Level wäre auf einem
breiten Schirm ein anderes Spiel.

## Fallen, die schon zugeschnappt sind

1. **Tunneling.** Geprüft wird der **Weg** des Ballons (vorher → jetzt) gegen die
   Nadel, nicht seine Endposition. Sonst springt er bei hohem Tempo in einem
   Schritt über die Nadel und überlebt sie zufällig, je nach Bildrate. Ein
   Test in `physik.test.ts` hält das fest.
2. **Feste Schrittweite.** `schritt()` rechnet immer mit `DT` (1/120 s), die
   Schleife ruft dafür mehrmals auf. Ohne das ist das Spiel auf einem 120-Hz-Gerät
   ein anderes als auf einem mit 60 Hz, und kein Lauf ist reproduzierbar.
3. **Das Canvas-Transform nur EINMAL setzen.** Die Pixeldichte (`dpr`) setzt die
   Spielseite; `zeichne()` darf sie nicht zurückstellen. Am 27.09. tat es das —
   das ganze Spielfeld saß in der linken oberen Ecke, der Rest war schwarz.
4. **`Math.random()` hat hier nichts verloren.** Zufall läuft über
   `zufall.ts` (mulberry32, übernommen aus der Social-Automatik). Ein Endlos-Lauf
   muss aus seinem Seed nachspielbar sein, sonst ist ein Bestenlisten-Eintrag
   nicht überprüfbar.
5. **Ein Level, das man ohne Eingabe schafft, ist kein Level.** Level 1 hatte
   Start und beide Lücken auf einer Linie — der Ballon stieg von allein durch.
   Lücken gehören versetzt.
6. **Vorschau serviert `dist/`.** Nach einer Änderung an einem Level (JSON wird
   ins Bundle eingebacken) erst `npm run build`, sonst prüft man den alten Stand.
7. **Der gezeichnete Kegel MUSS der gerechnete sein.** `MUND` und `AUFWEITUNG`
   stehen in `physik.ts` und werden von `zeichnen.ts` importiert — nie
   duplizieren. Ein Spiel, das anders aussieht, als es rechnet, ist unfair: Der
   Spieler zielt nach dem Bild und trifft daneben.
8. **Vercel prueft den COMMIT-AUTOR.** Deploys werden abgelehnt, wenn die
   E-Mail des Commit-Autors nicht Mitglied des Vercel-Teams ist — die Meldung
   lautet „the commit author doesn't have permission" bzw. „they're not a
   member of the team", und Josef bekommt je Versuch eine Mail. Richtig ist
   **`63almaz80@gmail.com`**; am 27.09.2026 stand dort eine andere Adresse aus
   dem Sitzungskontext, und zwei Deploys scheiterten daran. Ein Deploy aus
   einem Ordner OHNE `.git` umgeht die Pruefung — das ist der Notausgang,
   nicht die Loesung.
9. **Auf Strecken zeigt der Finger auf den SCHIRM, nicht in die Welt.** Das
    Gebläse merkt sich die Bildschirmposition und wird jedes Bild neu
    umgerechnet. Würde die Weltposition gespeichert, bliebe es stehen, während
    die Welt darunter wegscrollt — bei ruhigem Finger liefe es nach links aus
    dem Bild. Du gehst neben dem Ballon her.
10. **Die Kamera wird beim ZEICHNEN nachgeführt, nie in der Physik.** Sonst
    hinge der Weltzustand vom Bildschirm ab und derselbe Lauf liefe auf zwei
    Geräten verschieden.
11. **Der Start eines Streckenlevels muss im freien Korridor der ersten Nadel
    liegen** — und weit genug davor. In der ersten Fassung lag er genau auf
    Höhe der ersten Nadelspitze: Man flog ohne Vorwarnung hinein.
    `scratchpad/streckenpruefung.mts` prüft beides; es tat das anfangs *nicht*
    und meldete „schaffbar", weil es nur die Nadeln untereinander ansah.
12. **Ein Tutorial-Level lehrt EINE Sache nach der anderen.** Level 1: erste
   Lücke mittig über dem Start (halten hebt), zweite seitlich (versetzt lenkt).
   Zwischendurch stand die erste Nadel direkt über dem Start — man platzte,
   bevor man irgendetwas verstanden hatte.

## Konventionen

- Dokumentation und Kommentare auf Deutsch; ein Kommentar sagt, **warum** etwas so
  ist, nicht was der Code tut. Fallen mit ⚠ und Datum.
- Alle Texte über i18n (`src/i18n/locales/`), nie fest im Code.
- Level sind Daten (JSON), nicht Code.
- Änderungen am Spielgefühl gehören mit einem Test abgesichert — „fühlt sich
  besser an" ist nach zwei Wochen nicht mehr nachprüfbar.
- `at.gallab.loonpop` als Bundle-ID (Konvention wie `at.gallab.animequiz`).
