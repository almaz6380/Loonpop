# loonpop

Ein Ballon, ein **Laubgebläse**, Nadeln. Das Gebläse ist deine Figur am unteren
Rand: Du schiebst es mit dem Finger seitwärts und hältst gedrückt, damit es bläst.

**Der Trick:** Der Strahl geht senkrecht nach oben und wird mit der Entfernung
breiter und schwächer. Drehen lässt sich das Gebläse nicht — **seitlich lenkst
du, indem du dich versetzt hinstellst.** Trifft der Strahl den Ballon am Rand,
drückt er ihn zur Seite; mittig getroffen steigt er gerade. Nah am Boden fein,
weiter oben grob.

Der Ballon sinkt von allein langsam und treibt nach dem Loslassen weiter. Das
Vorausdenken ist die Aufgabe.

**Arbeitstitel.** „Balloon Popop" und ein Dutzend „Balloon Pop"-Varianten stehen
bereits in den Stores; vor dem ersten Store-Eintrag gehört der Name durch TMview
(Klassen 9 und 41). Eine Websuche ersetzt das nicht — vier verworfene Namen bei
Anigosha waren die Lehre.

## Stand: M2 — spielbar, mit Endlos-Modus

Zwölf handgebaute Level und ein Endlos-Lauf, alles nach oben (seit 02.10.2026;
die Strecken nach rechts sind ausgeblendet, nicht gelöscht). Gebläsesteuerung,
träge Physik. Läuft im Browser, in 13 Sprachen.
Der Fortschritt bleibt auf dem Gerät: Jedes Level schaltet das nächste frei,
und das Menü zeigt die Bestzeit.

- **Hoch-Level (1–3, 6, 8, 10):** Der Ballon muss nach oben, alles ist auf
  einem Schirm.
- **Strecken (4, 5, 7, 9, 11, 12):** Der Ballon treibt nach rechts, die Kamera
  läuft mit. Du gehst mit dem Gebläse neben ihm her.

Hindernisse sind **Nadelfelder** aus vielen kurzen Stacheln; dazu **fallende**
und **pendelnde Nadeln**, **Windzonen** (Aufwind, Fallwind) und Zeitlimits.
Noch **nicht** dabei: Konten, Bestenliste, Werbung, Kauf,
Capacitor, Stores. Reihenfolge siehe unten.

```bash
npm install
npm run dev      # entwickeln
npm test         # Physik, Kollision, Determinismus, Wegsuche über jedes Level
npm run pruefen  # Zahlen je Level: Steigflug, Vorlauf, Zeitfenster
npm run bot      # ein Bot spielt jedes Level mit der echten Physik (~2 min)
npm run bot -- endlos   # derselbe Bot im Endlos-Lauf: wie viele Meter?
npm run nadelfeld -- reihe 600 0 300   # Nadelfeld als JSON für ein Level
npm run build    # bauen
```

## Aufbau

| Ordner | Rolle |
|---|---|
| `src/spiel/` | Der Spielkern: **reines TypeScript, kein React**, ohne Browser testbar |
| `src/spiel/level/*.json` | Je Level eine Datei — in zwei Minuten änderbar, ohne Code anzufassen |
| `src/pages/SpielPage.tsx` | Canvas, Finger, Ende-Fenster |
| `src/lib/fortschritt.ts` | Freigeschaltete Level und Bestzeiten, im `localStorage` |
| `src/i18n/` | Alle Texte, DE und EN |

## Die Reihenfolge

- **M1 ✅** Spielbar im Browser
- **M2 ✅** 12 Level, Fortschritt auf dem Gerät, Endlos-Modus (↑ und →)
- **M3** Routing, Einstellungen, Rechtstexte
- **M4** Capacitor (`at.gallab.loonpop`), Icons, Splash
- **M5** Supabase: Konten und Online-Bestenliste
- **M6** AdMob + Kauf „Werbung entfernen"
- **M7** Release-Workflows, Play Console, App Store Connect

Muster für M4–M7 liegen in `almaz6380/anigosha` (`src/lib/ads.ts`,
`src/lib/purchases.ts`, `.github/workflows/`, `docs/release-ci.md`).

<!-- Prueft die Git-Anbindung: dieser Push muss von allein deployen. -->
