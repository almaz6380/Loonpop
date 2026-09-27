# loonpop

Ein Ballon, ein Windgebläse, Nadeln. Du tippst, wohin der Wind blasen soll —
der Ballon reagiert träge und treibt nach. Das Vorausdenken ist die Aufgabe.

**Arbeitstitel.** „Balloon Popop" und ein Dutzend „Balloon Pop"-Varianten stehen
bereits in den Stores; vor dem ersten Store-Eintrag gehört der Name durch TMview
(Klassen 9 und 41). Eine Websuche ersetzt das nicht — vier verworfene Namen bei
Anigosha waren die Lehre.

## Stand: M1 — spielbar

Drei handgebaute Level, Tippsteuerung, träge Physik. Läuft im Browser.
Noch **nicht** dabei: Endlos-Modus, Konten, Bestenliste, Werbung, Kauf,
Capacitor, Stores. Reihenfolge siehe unten.

```bash
npm install
npm run dev      # entwickeln
npm test         # Physik, Kollision, Determinismus
npm run build    # bauen
```

## Aufbau

| Ordner | Rolle |
|---|---|
| `src/spiel/` | Der Spielkern: **reines TypeScript, kein React**, ohne Browser testbar |
| `src/spiel/level/*.json` | Je Level eine Datei — in zwei Minuten änderbar, ohne Code anzufassen |
| `src/pages/SpielPage.tsx` | Canvas, Finger, Ende-Fenster |
| `src/i18n/` | Alle Texte, DE und EN |

## Die Reihenfolge

- **M1 ✅** Spielbar im Browser
- **M2** 10–15 Level, Endlos-Modus, Fortschritt auf dem Gerät
- **M3** Routing, Einstellungen, Rechtstexte
- **M4** Capacitor (`at.gallab.loonpop`), Icons, Splash
- **M5** Supabase: Konten und Online-Bestenliste
- **M6** AdMob + Kauf „Werbung entfernen"
- **M7** Release-Workflows, Play Console, App Store Connect

Muster für M4–M7 liegen in `almaz6380/anigosha` (`src/lib/ads.ts`,
`src/lib/purchases.ts`, `.github/workflows/`, `docs/release-ci.md`).
