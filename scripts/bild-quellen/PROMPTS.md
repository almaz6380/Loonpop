# Gemini-Aufträge für die Neugestaltung (23.11.2026)

Josef erzeugt die Bilder in Gemini und schickt sie im Chat. Claude legt sie hier
ab (Dateiname wie unten), stellt sie mit `python3 scripts/bilder-freistellen.py`
frei und baut sie ein.

**Für jedes Bild gilt (immer mitkopieren):**
> Stil: hochwertiges 2.5D-Mobile-Game, weiche 3D-Optik wie gerendert, Licht von
> oben links, sanfte Schatten, kräftige aber freundliche Farben, keine Schrift,
> kein Wasserzeichen, keine Umrandung.

Hintergrundfarbe ist entscheidend fürs Freistellen:
- **Grün `#00FF00`** (reines, glattes Grün, kein Verlauf, kein Schatten auf dem Grund) für Ballon, Gebläse, Münze, Stern.
- **Magenta `#FF00FF`** für Hügel, Vordergrund, Wolken.
- Himmel: ganzes Bild, kein Freistellen.

## Figuren (je 1 Bild, quadratisch, 1024×1024)

| Datei | Auftrag |
|---|---|
| `ballon-rot.jpg` | Ein einzelner glänzender roter Luftballon mit kleinem Knoten unten und kurzer weißer Schnur, mittig, aufrecht, füllt ~70 % der Bildhöhe. Auf reinem Grün #00FF00. |
| `ballon-blau.jpg`, `-gelb`, `-gruen`*, `-lila` | wie oben, nur Farbe tauschen. *Grün: bitte **Magenta #FF00FF** als Hintergrund. |
| `ballon-stern.jpg` | wie oben, gelber Ballon mit weißen Sternen bedruckt. |
| `ballon-herz.jpg` | ein herzförmiger pinker Folienballon, glänzend. |
| `ballon-heissluft.jpg` | ein kleiner bunter Heißluftballon mit Korb, gleiche Größe. |
| `ballon-gold.jpg` | ein goldener Chrom-Ballon, stark spiegelnd. |
| `geblaese.jpg` | Ein kompaktes orangefarbenes Laubgebläse von schräg vorne, **Düse zeigt gerade nach oben**, kurzer breiter Trichter oben, Motorgehäuse unten mit Lüftungsschlitzen. Mittig, füllt ~75 % der Höhe. Auf Grün #00FF00. |
| `muenze.jpg` | Eine goldene Münze mit einem kleinen Ballon-Symbol, leicht schräg, glänzend. Auf Grün #00FF00. |
| `stern.jpg` | Ein dicker goldener 3D-Stern mit runden Spitzen. Auf Grün #00FF00. |

## Welten (je 4 Bilder)

Welten: **wiese** (sonniger Frühlingstag), **stadt** (bunte Dächer, Abendsonne),
**wueste** (Sanddünen, Kakteen, heißes Orange), **nacht** (Mondnacht, Sterne,
blau-violett, Glühwürmchen).

| Datei | Auftrag |
|---|---|
| `<welt>-himmel.jpg` | Hochformat 1080×1920. Nur Himmel der Welt, oben dunkler, unten heller, ein paar weiche Wolken, **keine** Landschaft im unteren Drittel. |
| `<welt>-fern.jpg` | Querformat 2048×1024. Ferne Hügel- bzw. Silhouettenkette der Welt (blasser, bläulich durch Dunst) im unteren Drittel, darüber reines Magenta #FF00FF. |
| `<welt>-nah.jpg` | Querformat 2048×1024. Nähere, kräftigere Hügel bzw. Gebäude/Dünen der Welt, unteres Drittel, darüber Magenta #FF00FF. |
| `<welt>-boden.jpg` | Querformat 2048×512. Vordergrund-Boden der Welt von der Seite (Gras mit Blumen / Pflaster / Sand / dunkles Gras mit Pilzen), oben unregelmäßige Kante, darüber Magenta #FF00FF. |

## Menü und Symbol

| Datei | Auftrag |
|---|---|
| `logo.jpg` | Schriftzug „LoonPop“ in dicken, runden, glänzenden 3D-Buchstaben, Farbverlauf Rot→Orange, das „o“ als Ballon. Auf Magenta #FF00FF. (Hier ausnahmsweise **mit** Schrift.) |

Reihenfolge, wenn wenig Zeit: Gebläse, rote Ballon, Wiese (4 Bilder), Münze, Stern —
damit ist Welt 1 komplett. Der Rest kann später kommen.
