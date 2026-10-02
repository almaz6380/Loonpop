# CLAUDE.md — loonpop (Ballon-Geschicklichkeitsspiel)

## In einem Satz

Ein Ballon schwebt durch ein Level; der Spieler bedient ein **Laubgebläse** am
unteren Rand, das den Ballon nach oben bläst. **Nadeln** lassen ihn platzen.
Die sechste App von Josef.

**Repository:** https://github.com/almaz6380/loonpop (privat)
**Stand:** M2 fertig — Fortschritt auf dem Gerät, Endlos-Modus. Seit 02.10.2026
wird **nur noch nach oben** gespielt: zwölf Hoch-Level (IDs 1, 2, 3, 6, 8, 10, 13–18) und Endlos ↑. Strecken
(Level 4, 5, 7, 9, 11, 12) und Endlos → sind ausgeblendet, nicht gelöscht
(`LEVEL` in `level/index.ts` filtert, `npm test` prüft sie weiter). Siehe README für die Reihenfolge bis zum Store.
**Bedienung:** Josef arbeitet meist vom Handy. Kein Deploy, kein Release, kein
Löschen ohne ausdrückliches „ja" im Chat.
**Testversion im Browser:** https://loonpop.almaz6380.workers.dev (seit 01.10.2026,
vorher `loonpop-rust.vercel.app`, bis Vercel den Account pausiert hat). Cloudflare
Workers baut selbst aus `main` (`wrangler.jsonc`, nur `dist/`). Josef hat am
01.10.2026 auf die Frage im Chat mit „ja" geantwortet: Jede nach `main` übernommene
Änderung darf diese Testversion automatisch veröffentlichen. Für Store-Releases gilt
weiter das ausdrückliche „ja".

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
**Spieltempo:** Die Physik läuft mit `SPIELTEMPO` = 1,4 Spielsekunden je
echter Sekunde (`schleife.ts`). ⚠ Josef fand am 02.10.2026 den Ballon zu träge
und alles zu langsam. Statt einzelne Kräfte zu verdrehen, läuft dieselbe Physik
schneller ab: Wegsuche, Bot und Zeitfenster rechnen in Spielzeit und bleiben
gültig. Angezeigte Zeiten und Zeitlimits sind Spielzeit.
⚠ Nachmessen statt raten: `npm run pruefen` (`steigflug()` in `src/spiel/pruefung.ts`)
simuliert einen Steigflug ohne Browser und sagt, wie viele Pixel der Ballon in der ersten Sekunde steigt.
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

## Wie das Spiel aussehen soll

Freundlich und ruhig: heller Himmel, Wiese, klare Silhouetten. Alles wird im
Canvas gezeichnet (`zeichnen.ts`), nur die Nadel ist ein Bild.

**Tiefe kommt aus Parallaxe.** Wolken (drei Schichten) und Hügel (zwei) wandern
langsamer als das Level. ⚠ Ihr Abstand richtet sich nach dem **sichtbaren
Ausschnitt** — ein fester Abstand von 2500 px ließ auf einem 590 px breiten
Handy-Ausschnitt nie eine Wolke ins Bild, und der Himmel blieb einfach leer.

⚠ **Kein `Math.random()` im Zeichnen.** Jede Streuung (Grashalme, Wolken,
Blätter) kommt aus `streu(n)` — einer reinen Funktion über Index und Zeit.
Sonst flackert das Bild von Bild zu Bild und ein Screenshot ließe sich nie
wiederholen.

⚠ **Nur den sichtbaren Ausschnitt bestücken.** Über eine 3500 px lange Strecke
wären es sonst hunderte Grashalme je Bild, von denen 85 % niemand sieht.

**Der Nachklang** (Fetzen beim Platzen, Funken beim Ankommen) hängt an
`welt.nachher`, einer eigenen Uhr. ⚠ `welt.zeit` taugt dafür nicht: Die steht ab
dem Ende still, weil die Physik nicht weiterrechnet. Das Ende-Fenster erscheint
mit 800 ms Verzögerung — sonst fällt es genau über den Moment, auf den man
gewartet hat.

## Bilder

Himmel, Wolken, Hügel, Wiese, Ballon und Gebläse kommen seit dem 02.10.2026 aus Gemini
(`public/bilder/`, Quellen in `scripts/bild-quellen/`). Freigestellt werden sie
mit `python3 scripts/bilder-freistellen.py` (braucht Pillow und NumPy).

- ⚠ **Bestellt auf EINER glatten Farbe:** Grün #00FF00 für Ballon und Gebläse,
  Magenta #FF00FF für die Natur. Gemini liefert JPG ohne Durchsichtigkeit, und
  ein „durchsichtiger“ Hintergrund kommt als eingebranntes Schachbrett (siehe Nadel).
  Die Durchsichtigkeit wird aus dem Abstand zur Schlüsselfarbe gerechnet, die
  Kantenfarbe zurückgerechnet. Sonst bleibt ein grüner bzw. pinker Saum.
- ⚠ **Kacheln werden gespiegelt, nicht überblendet.** Gemini hält „seamlessly
  tileable“ nicht ein. Ein Überblenden der Ränder gab doppelte, halb
  durchsichtige Hügelkanten. Jede zweite Kachel gespiegelt (`kacheln()` in
  `zeichnen.ts`) passt immer.
- ⚠ **Der Ballon wird so groß gezeichnet, wie er rechnet:** von −r bis zur
  Knotenspitze, Seitenverhältnis `BALLON_BILD_SEITEN`. Neues Bild → neu messen
  (der Test in `ballonform.test.ts` schlägt sonst an).
- Jedes Bild hat seinen gemalten Rückfall, solange es lädt (`bild()` liefert
  dann `null`).
- ⚠ **Das Gebläse muss gedrungen sein.** Die Düse sitzt nur 96 px über dem Boden,
  der Strahl ist dort 68 px breit (`MUND`). Das zweite Gemini-Bild mit langem Rohr
  wäre auf diese Höhe 12 px schmal gewesen. Das dritte (kurzer, breiter Trichter)
  wird mit 48 px Trichterrand gezeichnet (`bildmasse.ts`); mit 56 px ragte es so
  weit unter den Boden, dass vom Motor nichts mehr zu sehen war. Die Öffnung
  sitzt genau an der Düse. Unter dem Boden wird nichts gezeichnet (Clip).

## Nadeln

Gezeichnet werden sie aus **einem Bild**: `public/nadel.png`, senkrecht mit der
Spitze nach unten. `zeichnen.ts` stempelt es gedreht an jede Nadelposition.
Vorher waren es Striche mit rotem Punkt — die Silhouette eines Streichholzes.

⚠ **Das Bild kam als JPG** (mit Gemini erzeugt, 27.09.2026). Der
Schachbrett-Hintergrund, der Durchsichtigkeit andeuten soll, war als graue Karos
**eingebrannt**. `scripts/nadel-freistellen.py` stellt es frei; Quelle liegt als
`scripts/nadel-quelle.jpg` daneben. Die Falle darin: **Helles Silber liegt nah
am hellen Karo-Ton** — 62 % der Nadelfläche treffen ihn. Wer nur nach dem
Karo-Anteil aussortiert, schneidet die Nadel selbst heraus. Deshalb gilt: das
größte eingeschlossene Gebiet ist die Nadel, kleinere mit hohem Karo-Anteil sind
Löcher (das Öhr).

⚠ **Rückfall auf den Strich, solange das Bild lädt** — sonst ist das Level in
den ersten Bildern leer, und das sieht aus wie ein Fehler.

⚠ Die Nadel wird **1,5-fach breiter** als maßstabsgetreu gezeichnet: Bei 1:12
wäre sie auf 60 px Länge fünf Pixel breit und am Handy kaum zu sehen.

Drei Sorten, alle über `Nadel` in `typen.ts`:

| | |
|---|---|
| **fest** | steht still |
| **pendel** | fährt einen Weg hin und her |
| **faellt** | fällt oben herein, verschwindet unten, fängt von vorn an |

⚠ **Bewegte Nadeln werden aus der ZEIT gerechnet, nie fortgeschrieben.**
`nadelJetzt(nadel, zeit, hoehe)` ist eine reine Funktion. Fortgeschriebene
Positionen hingen an der Bildrate, und derselbe Lauf liefe auf zwei Geräten
verschieden — der Endlos-Seed wäre wertlos.

**Nadelfelder statt Balken:** Eine Sperre besteht aus vielen einzelnen Nadeln,
nicht aus einer langen Linie. Erzeugt werden sie mit `npm run nadelfeld`
(`src/spiel/nadelfeld.ts`). Je nach Richtung gilt eine andere Regel:

- **Spalte** (Nadeln hintereinander, Strecken): Die Nadel muss **kürzer sein als
  ihr Abstand** (60 lang, 70 Abstand), sonst verschmelzen sie optisch zu einem
  Balken. Die 10 px Lücke ist für den 52 px breiten Ballon trotzdem dicht.
- **Reihe** (senkrechte Nadeln nebeneinander, Hoch-Level): Der Abstand muss
  **kleiner als der Ballon** sein, höchstens 48 px. ⚠ Bis zum 01.10.2026 standen
  sie auch hier 70 px auseinander. Der Ballon passte mit je 9 px Luft
  dazwischen durch, und die Reihen in Level 1–3 waren gar nicht dicht. Ein Test
  in `pruefung.test.ts` hält das fest.

**Fallende Nadeln gehören in die Durchlasslücken**, nicht in ein Stachelfeld:
Dort, wo der Ballon ohnehin nicht durchkommt, sind sie wirkungslos.

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
    `npm run pruefen` prüft beides; die erste Fassung tat das *nicht*
    und meldete „schaffbar", weil es nur die Nadeln untereinander ansah.
12. **Ein Level prüft man mit einer WEGSUCHE, nicht mit Abstandsregeln.**
    `src/spiel/pruefung.ts` legt ein Gitter über das Level, sperrt
    belegte Zellen und flutet von Start zu Ziel. Zwei Heuristiken davor lagen
    daneben: „Lücke zwischen langen Balken" wurde wertlos, sobald es
    Stachelfelder gab; „Mindestabstand fallender Nadeln" verbot sie in
    Hoch-Leveln ganz, obwohl sie dort passen. Die einzige ehrliche Frage
    lautet: Kommt der Ballon durch? ⚠ Bis zum 01.10.2026 lag das Werkzeug nur im
    Scratchpad einer Sitzung und ging mit ihr verloren. Jetzt prüft `npm test`
    jedes Level damit, und `npm run pruefen` zeigt die Zahlen dazu. Fallende
    Nadeln sperren dabei nicht, sie werden über ihr Zeitfenster geprüft.
13. **Ein Tutorial-Level lehrt EINE Sache nach der anderen.** Level 1: erste
   Lücke mittig über dem Start (halten hebt), zweite seitlich (versetzt lenkt).
   Zwischendurch stand die erste Nadel direkt über dem Start — man platzte,
   bevor man irgendetwas verstanden hatte.
14. **Die Wegsuche sieht nur die Geometrie, nicht die Physik.** Am 01.10.2026
    meldete sie Level 5 als schaffbar, und es war es nicht: Die Aufwindzone
    (Kraft 240) hob den Ballon um rund 100 px, und bis zur nächsten Spalte
    konnte er nicht wieder sinken. Ohne Gebläse sinkt er höchstens ~40 px/s.
    Keiner von 30.000 Zufallsversuchen kam durch. Die Zone stammte aus der
    ersten Fassung mit langen Balken und passte nach dem Umbau auf Nadelfelder
    nicht mehr; jetzt hat sie Kraft 80. Deshalb gilt: Nach jeder Level-Änderung
    auch `npm run bot`. Der Bot wartet nicht auf bewegte Nadeln, „0 von N“
    heißt also: selbst nachspielen.
15. **Zonen zeigen ihre Richtung.** Die Teilchen wandern in Kraftrichtung. Bis
    zum 01.10.2026 stiegen sie immer auf, und eine Fallwind-Zone hätte das
    Gegenteil dessen gezeigt, was sie tut (siehe Falle 7).
16. **Cloudflare hat ZWEI Build-Einstellungen.** Production (`main`) und die
    Vorschauen für alle anderen Branches („Previews Base“) werden getrennt
    eingestellt. Am 01.10.2026 hatte nur Production einen Build-Befehl. Der
    erste Vorschau-Build (PR #2) brach ab: `wrangler preview` verlangt einen
    `"previews": {}`-Block, und ohne Build-Befehl gäbe es kein `dist/` (steht
    nicht im Repo). Seitdem baut `wrangler.jsonc` selbst (`build.command`) und
    hängt an keiner Dashboard-Einstellung mehr.

## Endlos

Zwei Läufe ohne Ende, beide in `src/spiel/endlos.ts`:

| | |
|---|---|
| **↑ Immer weiter rauf** | Nadelreihen übereinander. Das Gebläse steht auf einem Boden, der dem Ballon folgt (höchstens `BODEN_ABSTAND` = 900 px darunter) und nie sinkt. ⚠ Bis zum 02.10.2026 standen dort Nadeln, und er kroch von selbst hoch. Josef wollte das nicht: Gefährlich sind nur die Nadelreihen. |
| **→ Immer weiter nach rechts** | Säulen im Wechsel von unten und oben, Grundwind 230. |

- ⚠ **Abschnitte statt eines wachsenden Arrays.** Abschnitt *i* hängt nur von
  Seed, *i* und Abschnitt *i−1* ab. Die Physik fragt nur die Nadeln um den
  Ballon ab (`nadelnIn`), das Zeichnen nur die im Bild.
- ⚠ **Der Boden gehört zur Welt (`welt.boden`), nicht zum Level und nicht zur
  Kamera.** Die Physik zieht ihn nach, die Kamera hängt an ihm (Falle 10).
- ⚠ **Das Sinktempo begrenzt die Strecke.** Zwischen zwei Säulen springt der
  Korridor höchstens halb so weit nach unten, wie der Ballon ohne Gebläse sinken
  kann (Falle 14). Nach oben geht es leicht.
- ⚠ **Die Lücken zweier Reihen berühren sich** (Lehre aus Level 6, 8, 10). Am
  Anfang überlappen sie 70 px, ab 300 m nur noch 10.
- Schwerer wird es bis 300 m: engere Lücken, kürzere Abstände, ab 100 m
  Pendelnadeln (↑), ab 150/200 m fallende Nadeln. Nie über die Physik.
- **Immer schneller** über `tempo(meter)` = 1 − e^(−m/430): ohne Ende, aber mit
  Obergrenze (bei 300 m halb, bei 1000 m zu 90 %). Auf → wächst der Grundwind
  230 → 420 (`windBei`), auf ↑ rücken die Reihen enger zusammen. ⚠ Bis zum
  02.10.2026 hörte alles bei 300 m auf, und der Bot flog zehn Minuten weiter.
  ⚠ Den erlaubten Sprung nach unten rechnet der Generator mit dem Wind **an
  dieser Stelle**: Mehr Wind heißt weniger Zeit zum Sinken.
- **Engstellen:** Alle 8–14 Abschnitte kommen 3 enge (60 % der üblichen Breite;
  ↑ Lücken höchstens 30 px versetzt, → Korridor gerade), danach 2 ruhigere, und das
  alles ohne bewegte Nadeln. Ihre Nadeln schimmern rot (`Nadel.warnung`), damit
  man sie kommen sieht.
- **50 px = 1 m.** Die Bestweite steht im Fortschritt (`endlos.hoch`/`.strecke`).
- Der Seed jedes Laufs kommt aus der Uhr (`neuerSeed`). Die Uhr wählt nur den
  Seed, der Lauf hängt dann allein an ihm.
- Prüfen: `npm test` steckt Stücke aus 16 Seeds in dieselbe Levelprüfung
  (`endlosStueck`), `npm run bot -- endlos` spielt 12 Seeds je Richtung.

## Fortschritt

`src/lib/fortschritt.ts` speichert die Bestzeit je Level im `localStorage`, ein
Level ist frei, sobald das davor geschafft ist. ⚠ Schlüssel sind die
**Level-IDs**, nicht die Positionen: Wird später ein Level eingeschoben, bleibt
der Fortschritt beim richtigen Level. ⚠ Gespeichert wird im Moment des
Ankommens, nicht erst mit dem Ende-Fenster (800 ms später). Sonst ginge ein
Sieg verloren, wenn jemand sofort zurücktippt.

## Sprachen

Dreizehn Sprachen seit dem 02.10.2026 (für den Store): de, en, es, fr, it, pt
(Brasilien), tr, pl, ru, ja, ko, zh (Kurzzeichen), ar. Die Liste steht in
`src/lib/sprache.ts`. Die Sprache folgt dem Handy, und der Umschalter unten im
Menü überstimmt sie (`localStorage` „sprache“).

- ⚠ **Arabisch liest von rechts.** `<html dir="rtl">` wird gesetzt, deshalb gilt im
  Layout `ps-`/`pe-`/`text-start` statt `pl-`/`pr-`/`text-left`. Das Spielfeld
  (Canvas) spiegelt sich nicht, sonst wären die Level andere.
- ⚠ **Level-Namen stehen in den Sprachdateien** (`levelname.<id>`), das `name`
  im JSON ist nur der Rückfall. Neues Level → Namen in allen 13 Dateien, sonst
  schlägt `sprache.test.ts` an. Dort wird auch geprüft, dass jede Datei alle
  Schlüssel und dieselben Platzhalter hat. Ein fehlender Schlüssel fiele sonst
  stumm auf Englisch zurück.
- Ohne Mehrzahlformen: „{{s}} s“ statt „{{s}} Sekunden“, wo die Sprache
  (ru, pl, ar) die Zahl beugt.

## Konventionen

- Dokumentation und Kommentare auf Deutsch; ein Kommentar sagt, **warum** etwas so
  ist, nicht was der Code tut. Fallen mit ⚠ und Datum.
- Alle Texte über i18n (`src/i18n/locales/`), nie fest im Code.
- Level sind Daten (JSON), nicht Code.
- Änderungen am Spielgefühl gehören mit einem Test abgesichert — „fühlt sich
  besser an" ist nach zwei Wochen nicht mehr nachprüfbar.
- `at.gallab.loonpop` als Bundle-ID (Konvention wie `at.gallab.animequiz`).
