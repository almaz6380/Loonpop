# loonpop in die Stores bringen

Stand 02.10.2026. Alles, was ohne Konto geht, liegt im Repo: App-Projekte für
Android und iOS, Icon, Startbilder, Texte und Screenshots in 13 Sprachen,
Datenschutz und Impressum sowie die Workflows zum Bauen und Hochladen. Was hier
steht, kann nur Josef selbst tun, weil es sein Konto, seine Unterschrift oder
seinen Schlüssel braucht.

**App:** `at.gallab.loonpop` · Name `LoonPop` · Version 1.0 (Android
versionCode 1, iOS Build 1) · nur Hochformat · nur iPhone (kein iPad)

## Was im Repo liegt

| Was | Wo | neu erzeugen |
|---|---|---|
| Android-Projekt | `android/` | `npx cap sync android` |
| iOS-Projekt | `ios/` | `npx cap sync ios` |
| Icon, adaptive Android-Symbole, Startbilder | `store-assets/icon/`, `android/…/res/`, `ios/…/Assets.xcassets/` | `python3 scripts/app-bilder.py` |
| Store-Texte, 13 Sprachen, beide Stores | `store-assets/texte/<code>.json` | `python3 scripts/store-texte.py` |
| Screenshots Play (1080×2160) | `store-assets/play/<code>/` | `node scripts/store-bilder.mjs` |
| Screenshots iPhone 6,9" (1320×2868) | `store-assets/ios/<code>/` | ebenso |
| Vorstellungsgrafik Play (1024×500) | `store-assets/play/feature.png` | ebenso |
| Datenschutz, Impressum | `public/datenschutz.html`, `public/impressum.html` | `python3 scripts/rechtstexte.py` |

Öffentliche Adressen (für beide Konsolen):

- Datenschutz: https://loonpop.almaz6380.workers.dev/datenschutz.html
- Support / Impressum: https://loonpop.almaz6380.workers.dev/impressum.html
- Website: https://loonpop.almaz6380.workers.dev

⚠ Die Seiten sind erst erreichbar, wenn dieser Stand in `main` ist.

⚠ **Kontakt-E-Mail:** In den Rechtstexten steht vorerst `anigosha@wellbooked.at`
(die Adresse aus Anigosha). Soll loonpop eine eigene bekommen, ändere sie in
`scripts/rechtstexte.py` und erzeuge die Seiten neu. Dieselbe Adresse gehört
in beide Konsolen.

## Einmal einrichten

### 1. Google Play Console

1. **App erstellen**: Name `loonpop`, Standardsprache Deutsch, **Spiel**,
   **kostenlos**.
2. **Nutzer und Berechtigungen** → Dienstkonto
   `play-upload@wellbooked-501311.iam.gserviceaccount.com` für loonpop
   freischalten (Admin). Sonst antwortet die API mit `403 PERMISSION_DENIED`.
3. **Store-Eintrag → Übersetzungen**: die Sprachen anlegen (de-DE, en-US,
   en-GB, es-ES, es-419, fr-FR, it-IT, pt-BR, pt-PT, tr-TR, pl-PL, ru-RU, ja-JP,
   ko-KR, zh-CN, ar). Danach füllt der Workflow alle Texte und Bilder aus.
4. **App-Inhalte** (die Antworten stehen unten):
   Datenschutzerklärung (URL), Werbung: **nein**, Zugriff für Prüfer: **alles
   ohne Anmeldung**, Inhaltsbewertung, Zielgruppe, Datensicherheit,
   Behörden-Apps: nein, Finanzen: nein, Gesundheit: nein.

### 2. Apple

1. **developer.apple.com → Identifiers**: App ID `at.gallab.loonpop`
   (keine besonderen Fähigkeiten).
2. **Profiles**: App-Store-Profil für `at.gallab.loonpop` mit dem vorhandenen
   Distributionszertifikat, **Name genau `loonpop AppStore`**. Der Workflow
   sucht es unter diesem Namen.
3. **App Store Connect → Apps → +**: Neue App, iOS, Name `loonpop`,
   Hauptsprache Deutsch, Bundle-ID `at.gallab.loonpop`, SKU `loonpop`.
4. **App-Datenschutz**: „Keine Daten erfasst“ (siehe unten).
5. **Preis**: kostenlos, alle Länder.

### 3. Secrets ins Repo

**Vom Handy (ohne Mac, 03.10.2026):** Die Schlüssel liegen schon im Repo
`anigosha`. Dessen Workflow **„Schluessel nach loonpop“** trägt sie hier ein.
Dafür braucht er einmal ein Token:
1. https://github.com/settings/personal-access-tokens/new: Name `loonpop-schluessel`,
   Ablauf 7 Tage, *Only select repositories* → `Loonpop`, unter *Repository
   permissions* → **Secrets: Read and write** → *Generate token* → kopieren.
2. https://github.com/almaz6380/anigosha/settings/secrets/actions/new: Name
   `LOONPOP_TOKEN`, Wert einfügen → *Add secret*.
3. Den Workflow „Schluessel nach loonpop“ in anigosha starten.

Das Provisioning-Profil wird nicht kopiert. `ios-release.yml` holt
„loonpop AppStore“ selbst über die ASC-API (`scripts/profil-holen.py`).

**Am Mac** geht es weiterhin so:

Am Mac im Repo-Ordner: `bash scripts/setup-release-secrets.sh`. Es fragt
nach denselben Dateien wie bei Anigosha (Keystore, Play-Dienstkonto, .p12,
.p8) und zusätzlich nach dem neuen Profil `loonpop AppStore`.

**Android-Keystore**: Den von Anigosha weiterverwenden oder einen neuen
anlegen. Mit „Play App Signing“ (Standard) ist er nur der Upload-Schlüssel und
lässt sich bei Verlust bei Google zurücksetzen. Ein neuer:

```bash
keytool -genkey -v -keystore ~/AppSigningKeys/loonpop-upload.jks -keyalg RSA \
  -keysize 2048 -validity 10000 -alias upload
```

## Ein Release

Alles läuft unter GitHub → **Actions** → Workflow wählen → **Run workflow**. Das
geht auch vom Handy. Jeder Workflow startet zuerst als Trockenlauf.

**Android**
1. `Android Release`, upload **an**, Track `internal` → das AAB landet im
   internen Test. Zum ersten Mal: In der Play Console einmal selbst die
   Testversion an dich freigeben und am Handy ausprobieren.
2. `Play-Eintrag`: `texte`, dann `screenshots`, dann `grafiken`, jeweils mit
   Sprache `alle`, erst mit Trockenlauf, dann ohne.
3. `Play-Eintrag` mit `produktion`: legt versionCode 1 als Produktions-Release an.
   ⚠ Solange die App nie veröffentlicht war, nimmt Google nur einen **Entwurf**
   an. Abgeschickt wird er einmal in der Play Console (Produktion → Release
   überprüfen → Roll-out starten → zur Überprüfung senden).

⚠ Google verlangt bei **neuen privaten Entwicklerkonten** vor der Produktion
einen geschlossenen Test mit mindestens 12 Testern über 14 Tage. Josefs Konto
hat schon Apps im Store (MyPeak, WELLbooked). Gilt die Regel trotzdem, meldet
die Konsole es beim Hochstufen.

**iOS**
1. `iOS Release`, upload **an** → der Build erscheint nach ~15 min in App Store
   Connect (TestFlight). ⚠ Ohne das Profil `loonpop AppStore` bricht der
   Export ab.
2. `App Store`: `texte` → `screenshots` → `build` (Nummer 1) → `pflicht` →
   `status`, jeweils erst als Trockenlauf. `pflicht` setzt auch Copyright,
   Kategorie (Spiele/Gelegenheit), Prüf-Kontakt (aus Josefs anderer App), Preis
   „kostenlos“ und alle Länder.
3. ⚠ **App-Datenschutz** geht nicht über die API: einmal in ASC „Keine Daten
   erfasst“ wählen und **veröffentlichen**. Sonst lehnt Apple das Einreichen ab
   (`APP_DATA_USAGES_REQUIRED`).
4. `App Store`: `einreichen`.

⚠ Das Profil muss das Zertifikat aus `IOS_CERT_P12_BASE64` enthalten.
`ios-release.yml` gibt dessen Seriennummer an `profil-holen.py`, das ein
passendes Profil sucht oder anlegt (03.10.2026: das erste angelegte Profil hatte
das neueste Zertifikat des Kontos, nicht das aus dem .p12).

**Vor jedem weiteren Release**: `versionCode` in `android/app/build.gradle` und
`CURRENT_PROJECT_VERSION` (2 Stellen) in `ios/App/App.xcodeproj/project.pbxproj`
um eins erhöhen, dazu `versionName` bzw. `MARKETING_VERSION`.

## Version 1.1: Werbung und „Werbung entfernen“ (ab 04.10.2026)

Im Code ist alles drin (`src/lib/werbung.ts`, `src/lib/kauf.ts`, Menü, ATT in
`SceneDelegate.swift`). Es laufen noch **Googles Testanzeigen**. `ios-release.yml`
und `android-release.yml` brechen beim Upload ab, bis alles unten erledigt ist
(`scripts/werbung-bereit.mjs`). ⚠ Erst einreichen, wenn 1.0 freigegeben ist.

**A. AdMob** (admob.google.com, dasselbe Konto wie Anigosha, `pub-8860791993288062`)
1. Apps → App hinzufügen → iOS → „Ist die App in einem Store?“ Nein → Name
   `LoonPop` → App-ID kopieren (`ca-app-pub-…~…`).
2. In dieser App zwei Anzeigenblöcke: **Banner** und **Interstitial**, je die ID
   kopieren (`ca-app-pub-…/…`).
3. Dasselbe für **Android**.
4. Die sechs IDs an Claude schicken. Sie gehören nach `LIVE` in `werbung.ts`, in
   `Info.plist` (`GADApplicationIdentifier`) und `AndroidManifest.xml`; dann
   `MIT_TESTANZEIGEN = false`.
5. Datenschutz & Mitteilungen → DSGVO-Nachricht für LoonPop (beide Apps)
   anlegen und **veröffentlichen**. ⚠ Ohne sie erscheint kein Einwilligungsdialog.
6. `app-ads.txt` liegt in `public/` und ist unter der Website erreichbar, sobald
   der Stand in `main` ist.

**Stand 04.10.2026:** AdMob-IDs, DSGVO-Nachricht, RevenueCat (Apps, Schlüssel,
Produkt) erledigt. Apple-Kauf eingerichtet (`app-store.yml` `kauf`: Preis,
Texte, Länder, Prüfungsbild). Google-Kauf wartet, siehe unten.

⚠ **Google legt den Kauf erst an, wenn ein Build mit Kauf-Berechtigung
hochgeladen ist** („Can't create product. To fix, request billing permission“).
Und dieser Build enthält die Werbe-ID (`AD_ID`), was Google nur annimmt, wenn
unter App-Inhalte → **Werbe-ID: Ja** steht. Das geht erst nach der Freigabe von
1.0, sonst passt die Angabe nicht zur Version in der Prüfung. Reihenfolge danach:
1. App-Inhalte: Werbe-ID **Ja**, Werbung **Ja**, Datensicherheit neu (Teil D).
2. `Android Release`, Track `internal`, upload an (Testanzeigen sind dort erlaubt).
3. `Play-Eintrag` → `kauf` (neue `onetimeproducts`-Schnittstelle; die alte
   `inappproducts` antwortet mit 403 „Please migrate to the new publishing API“).

**B. Produkt „Werbung entfernen“ in beiden Stores**
- Apple: App Store Connect → LoonPop → Monetarisierung → In-App-Käufe → **Nicht
  verbrauchbar**, Referenzname `Werbung entfernen`, Produkt-ID `loonpop_no_ads`,
  Preis 2,99 €. ⚠ Der Vertrag für kostenpflichtige Apps muss aktiv sein. Das
  Produkt wird MIT Version 1.1 eingereicht.
- Google: Play Console → LoonPop → Monetarisieren → In-App-Produkte → Produkt-ID
  `loonpop_no_ads`, Preis 2,49 € netto (= 2,99 € brutto, Google rechnet netto).

**C. RevenueCat** (app.revenuecat.com)
1. Projekt `LoonPop` anlegen, Apps hinzufügen: App Store (`at.gallab.loonpop`)
   und Play Store (`at.gallab.loonpop`, mit dem Dienstkonto wie bei Anigosha).
2. Entitlement `no_ads`, Produkt `loonpop_no_ads` (beide Stores) daran hängen.
3. Offering `default` (aktuell), Paket **Lifetime** mit beiden Produkten.
   ⚠ Fehlt das Android-Produkt im Offering, meldet die App `CONFIGURATION_ERROR`.
4. Die beiden öffentlichen SDK-Schlüssel (`appl_…`, `goog_…`) als Repo-Secrets
   `REVENUECAT_IOS_KEY` und `REVENUECAT_ANDROID_KEY` anlegen.

**D. Formulare (neu, weil jetzt Werbung)**
- Apple App-Datenschutz: Tracking **ja**. Erfasst: Kennungen → Geräte-ID
  (Werbung von Drittanbietern, Tracking), Nutzungsdaten → Werbedaten und
  Produktinteraktion (Werbung von Drittanbietern), Standort → Ungefährer Standort
  (Werbung von Drittanbietern), Käufe → Kaufverlauf (App-Funktionalität, nicht
  verknüpft). ⚠ Muss zum Build passen, sonst lehnt Apple ab (2.1, Anigosha).
- Google Play: App-Inhalte → Werbung **ja**; Werbe-ID **ja** (Werbung oder
  Marketing); Datensicherheit: erhebt Daten → Geräte-IDs, App-Interaktionen,
  ungefährer Standort (Werbung, geteilt mit Google), Kaufverlauf
  (App-Funktionalität); verschlüsselt übertragen ja; Löschung anfordern: nein
  (keine Konten).

## Antworten für die Formulare (Version 1.0, ohne Werbung)

loonpop hat kein Konto, keine Werbung, keine Käufe und keine Analyse, und es
baut keine Internetverbindung auf. Der Fortschritt liegt nur im Speicher des
Geräts.

**Play → Datensicherheit**
- Erhebt oder teilt die App Nutzerdaten? **Nein**
- (Damit entfallen alle weiteren Fragen.)

**Apple → App-Datenschutz**
- Datenerhebung: **„Nein, wir erfassen keine Daten von dieser App“**

**Play → Inhaltsbewertung (IARC)**
- Kategorie: Spiel (Geschicklichkeit/Arcade)
- Gewalt, Angst, Sex, Drogen, Glücksspiel, Schimpfwörter: alles **nein**
- Nutzer interagieren / teilen Inhalte / Standort: **nein**
- Digitale Käufe: **nein**
- Erwartet: PEGI 3 / USK 0 / ESRB Everyone

**Play → Zielgruppe**
- Altersgruppen: **13 und älter** empfohlen. Wer „unter 13“ ankreuzt, landet
  in Googles Familienprogramm mit zusätzlichen Pflichten. Für ein Spiel
  ohne Daten wäre das machbar, ist für den Start aber unnötig.

**Apple → Alterseinstufung**
- Der Workflow `App Store` mit `pflicht` beantwortet alles mit „keine“ bzw.
  „nein“ → 4+. Was er nicht kennt, nennt er, dann bitte von Hand.

**Apple → Exportbestimmungen**
- Keine Verschlüsselung (`ITSAppUsesNonExemptEncryption = false` steht in
  `Info.plist`, Apple fragt deshalb gar nicht).

**Apple → Hinweise für die Prüfung** (Vorschlag zum Einfügen)
> loonpop is a single-player skill game. No account, no login, no network
> access, no in-app purchases and no ads. Touch and hold to blow the leaf
> blower; slide to move it. All levels are reachable by playing; the endless
> mode is available from the start.

## Was noch nicht drin ist (bewusst)

- **M5 Konten und Online-Bestenliste** und **M6 Werbung/Kauf**: Kommt eins davon,
  ändern sich die Datenschutzerklärung, beide Datenschutz-Formulare und die
  Store-Texte („ohne Werbung, ohne Konto“) mit.
- **iPad**: Die App ist auf iPhone beschränkt. Für iPad bräuchte es eigene
  Screenshots (2048×2732) und ein Querformat-Konzept.
- **Ton und Vibration**.
