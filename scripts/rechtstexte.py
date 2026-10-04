"""Erzeugt public/datenschutz.html und public/impressum.html (02.10.2026).

Aufruf:  python3 scripts/rechtstexte.py

Eigene, statische Seiten statt einer Seite in der App: Beide Stores verlangen
eine Datenschutz-URL, die OHNE App erreichbar ist. Dieselben Dateien liegen im
App-Paket, das Menue verlinkt sie also auch offline.

⚠ Entwurf nach bestem Wissen, keine Rechtsberatung. Betreiberdaten und die
Abschnitte zu AdMob und RevenueCat wie in Anigosha
(src/pages/legal/legalContent.ts). Kommt eine Datenverarbeitung dazu (Konten,
Bestenliste), MUSS die Datenschutzerklaerung mit, sonst stimmt sie nicht mehr,
und die Store-Angaben zum Datenschutz auch nicht.
⚠ Seit 1.1 (04.10.2026) mit Werbung und Kauf. Erst nach `main` uebernehmen, wenn
1.1 eingereicht wird: Solange 1.0 (ohne Werbung) im Store steht, beschreibt die
alte Fassung die App richtig.
"""
from html import escape
from pathlib import Path

BETREIBER = {
    'name': 'Josef Gallab (Einzelunternehmen)',
    'adresse': 'Oberhofenweg 21b',
    'ort': '6380 St. Johann in Tirol, Österreich',
    # ⚠ Noch die Adresse von Anigosha. Eigene Adresse fuer LoonPop? Hier aendern
    # und neu erzeugen — sie steht auch in den Store-Eintraegen (docs/store.md).
    'mail': 'anigosha@wellbooked.at',
}
STAND = '04.10.2026'

B = BETREIBER
BETR_DE = f"{B['name']}<br>{B['adresse']}<br>{B['ort']}<br>E-Mail: <a href=\"mailto:{B['mail']}\">{B['mail']}</a>"
BETR_EN = BETR_DE.replace('E-Mail:', 'Email:').replace('Österreich', 'Austria')

DATENSCHUTZ = {
 'de': ('Datenschutzerklärung', [
  ('Kurz gesagt', 'LoonPop hat kein Konto, und dein Spielstand bleibt auf deinem Gerät. In der App für iPhone und Android zeigen wir Werbung von Google AdMob. Personalisiert ist sie nur, wenn du zustimmst. Mit einem einmaligen Kauf entfernst du die Werbung. Den Kauf wickeln Apple bzw. Google ab, RevenueCat verwaltet ihn für uns.'),
  ('Verantwortlich', BETR_DE),
  ('Was auf deinem Gerät gespeichert wird', 'Damit du beim nächsten Start weiterspielen kannst, speichert LoonPop im lokalen Speicher deines Geräts: welche Level du geschafft hast und in welcher Bestzeit, deine Bestweite im Endlos-Modus und die gewählte Sprache. Diese Daten verlassen dein Gerät nicht, wir haben keinen Zugriff darauf. Du löschst sie, indem du die App deinstallierst oder ihre Daten in den Einstellungen deines Geräts löschst.'),
  ('Werbung (Google AdMob)', 'In der App zeigen wir Anzeigen über Google AdMob (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Dafür verarbeitet Google Geräte- und Nutzungsdaten, etwa die Werbe-ID deines Geräts (IDFA bzw. Android-Werbe-ID), die IP-Adresse, Gerätetyp und Betriebssystem sowie Interaktionen mit Anzeigen, um Anzeigen auszuliefern, ihre Häufigkeit zu begrenzen, Betrug zu verhindern und die Leistung zu messen. Beim ersten Start fragen wir dich im Europäischen Wirtschaftsraum, in Großbritannien und der Schweiz mit dem Einwilligungsdialog von Google (UMP), ob du personalisierter Werbung zustimmst. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 165 Abs. 3 TKG 2021). Ohne Einwilligung siehst du nur nicht personalisierte Werbung. Deine Wahl änderst du jederzeit im Menü unter „Werbe-Einstellungen“. Auf dem iPhone fragt zusätzlich iOS, ob LoonPop dein Verhalten über Apps anderer Firmen hinweg verfolgen darf (App Tracking Transparency). Lehnst du ab, erhält Google keine IDFA. Google kann Daten in die USA übermitteln und ist nach dem EU-US Data Privacy Framework zertifiziert. Mehr: policies.google.com/privacy.'),
  ('Werbung entfernen (In-App-Kauf)', 'Kaufst du „Werbung entfernen“, wickeln Apple (App Store) bzw. Google (Google Play) die Zahlung ab. Wir erhalten keine Zahlungsdaten. Damit die App weiß, dass du gekauft hast, und den Kauf nach einer Neuinstallation wiederherstellen kann, nutzen wir RevenueCat (RevenueCat, Inc., USA) als Auftragsverarbeiter. RevenueCat erhält eine zufällige App-Kennung ohne Namen oder E-Mail-Adresse sowie den Kaufbeleg des Stores. Rechtsgrundlage ist die Erfüllung des Kaufvertrags (Art. 6 Abs. 1 lit. b DSGVO). Die Übermittlung in die USA stützt sich auf Standardvertragsklauseln. Ohne Kauf werden keine Daten an RevenueCat übertragen, außer der zufälligen Kennung beim Start, mit der geprüft wird, ob ein Kauf besteht.'),
  ('Browser-Version', 'Spielst du LoonPop im Browser, gibt es weder Werbung noch Käufe. Die Seite wird über Cloudflare (Cloudflare, Inc., USA) ausgeliefert. Dabei verarbeitet Cloudflare technisch notwendige Verbindungsdaten wie die IP-Adresse, um die Seite auszuliefern und vor Angriffen zu schützen. Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Cloudflare ist nach dem EU-US Data Privacy Framework zertifiziert. Wir selbst werten diese Daten nicht aus.'),
  ('Kinder', 'LoonPop richtet sich an Spielerinnen und Spieler ab 13 Jahren. Personalisierte Werbung zeigen wir nur mit Einwilligung.'),
  ('Deine Rechte', 'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht, eine Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen. Wir selbst speichern keine Daten über dich. Fragen beantworten wir gern per E-Mail. Du kannst dich außerdem bei der Österreichischen Datenschutzbehörde beschweren (dsb.gv.at).'),
  ('Änderungen', 'Kommt eine neue Funktion dazu, die Daten verarbeitet, passen wir diese Erklärung vorher an.'),
 ]),
 'en': ('Privacy Policy', [
  ('In short', 'LoonPop has no account, and your progress stays on your device. In the iPhone and Android app we show ads from Google AdMob, personalised only if you agree. A one-time purchase removes the ads. Apple or Google handle the purchase, and RevenueCat manages it for us.'),
  ('Controller', BETR_EN),
  ('What is stored on your device', 'So that you can continue where you left off, LoonPop stores in your device’s local storage: which levels you have completed and your best times, your best distance in endless mode, and your chosen language. This data never leaves your device and we have no access to it. You can delete it by uninstalling the app or clearing its data in your device settings.'),
  ('Advertising (Google AdMob)', 'In the app we show ads via Google AdMob (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland). For this, Google processes device and usage data such as your device’s advertising ID (IDFA or Android advertising ID), IP address, device type and operating system, and interactions with ads, in order to serve ads, limit their frequency, prevent fraud and measure performance. On first launch in the European Economic Area, the UK and Switzerland, Google’s consent dialog (UMP) asks whether you agree to personalised ads. The legal basis is your consent (Art. 6(1)(a) GDPR). Without consent you only see non-personalised ads. You can change your choice at any time in the menu under “Ad settings”. On iPhone, iOS additionally asks whether LoonPop may track your activity across other companies’ apps (App Tracking Transparency). If you decline, Google does not receive the IDFA. Google may transfer data to the USA and is certified under the EU-US Data Privacy Framework. More: policies.google.com/privacy.'),
  ('Remove ads (in-app purchase)', 'If you buy “Remove ads”, Apple (App Store) or Google (Google Play) handle the payment. We do not receive any payment data. So that the app knows you have purchased and can restore the purchase after reinstalling, we use RevenueCat (RevenueCat, Inc., USA) as a processor. RevenueCat receives a random app identifier without name or email address and the store’s purchase receipt. The legal basis is the performance of the purchase contract (Art. 6(1)(b) GDPR). Transfers to the USA rely on standard contractual clauses. Without a purchase, no data is sent to RevenueCat except the random identifier at launch, used to check whether a purchase exists.'),
  ('Browser version', 'If you play LoonPop in a web browser, there are no ads and no purchases. The page is delivered via Cloudflare (Cloudflare, Inc., USA). Cloudflare processes technically necessary connection data such as your IP address to deliver the page and protect it from attacks. The legal basis is our legitimate interest in secure operation (Art. 6(1)(f) GDPR). Cloudflare is certified under the EU-US Data Privacy Framework. We do not analyse this data ourselves.'),
  ('Children', 'LoonPop is intended for players aged 13 and over. We only show personalised ads with consent.'),
  ('Your rights', 'You have the right to access, rectification, erasure, restriction of processing, data portability and objection (Art. 15–21 GDPR), and the right to withdraw consent at any time with effect for the future. We do not store any data about you ourselves. We are happy to answer questions by email. You can also lodge a complaint with the Austrian Data Protection Authority (dsb.gv.at).'),
  ('Changes', 'If a new feature that processes data is added, we will update this policy beforehand.'),
 ]),
}

IMPRESSUM = {
 'de': ('Impressum', [
  ('Angaben gemäß § 5 ECG und § 25 MedienG', BETR_DE),
  ('Unternehmensgegenstand', 'Entwicklung und Betrieb von Software und mobilen Anwendungen.'),
  ('Gewerbe und berufsrechtliche Angaben', 'Freies Gewerbe: „Dienstleistungen in der automatischen Datenverarbeitung und Informationstechnik“<br>GISA-Zahl: 39801937<br>Mitglied der Wirtschaftskammer Tirol (Bezirksstelle Kitzbühel)<br>Aufsichts- und Gewerbebehörde: Bezirkshauptmannschaft Kitzbühel<br>Anwendbare Rechtsvorschrift: Gewerbeordnung (GewO), abrufbar unter ris.bka.gv.at<br>Umsatzsteuer: Kleinunternehmer gemäß § 6 Abs. 1 Z 27 UStG'),
  ('Anwendbares Recht', 'Es gilt österreichisches Recht.'),
  ('Verbraucherstreitbeilegung', 'Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.'),
 ]),
 'en': ('Legal notice', [
  ('Information pursuant to § 5 ECG and § 25 MedienG (Austria)', BETR_EN),
  ('Business purpose', 'Development and operation of software and mobile applications.'),
  ('Trade information', 'Trade licence: “Services in automatic data processing and information technology”<br>GISA number: 39801937<br>Member of the Tyrolean Chamber of Commerce (Kitzbühel district office)<br>Supervisory authority: Bezirkshauptmannschaft Kitzbühel<br>Applicable law: Austrian Trade Regulation Act (GewO), available at ris.bka.gv.at<br>VAT: small business exemption pursuant to § 6(1)(27) UStG'),
  ('Applicable law', 'Austrian law applies.'),
  ('Consumer dispute resolution', 'We are neither obliged nor willing to participate in dispute resolution proceedings before a consumer arbitration board.'),
 ]),
}

SEITE = """<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LoonPop · {titel}</title>
<style>
  :root {{ color-scheme: light dark; --grund: #f4f8fc; --text: #13203f; --leise: #5a6787; --karte: #fff; --akzent: #2f5cb4; }}
  @media (prefers-color-scheme: dark) {{ :root {{ --grund: #0d1330; --text: #e8eefc; --leise: #9aa8cc; --karte: #152364; --akzent: #8fb4ff; }} }}
  body {{ margin: 0; background: var(--grund); color: var(--text); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }}
  main {{ max-width: 680px; margin: 0 auto; padding: 32px 16px 64px; }}
  nav {{ display: flex; gap: 12px; flex-wrap: wrap; font-size: 14px; margin-bottom: 24px; }}
  a {{ color: var(--akzent); }}
  section {{ background: var(--karte); border-radius: 16px; padding: 8px 20px 16px; margin-bottom: 24px; }}
  h1 {{ font-size: 26px; margin: 16px 0 4px; }}
  h2 {{ font-size: 17px; margin: 20px 0 4px; }}
  p {{ margin: 0; }}
  .stand {{ color: var(--leise); font-size: 14px; }}
</style>
</head>
<body><main>
<nav><a href="./">← LoonPop</a><a href="#de">Deutsch</a><a href="#en">English</a><a href="{andere_url}">{andere}</a></nav>
{inhalt}
</main></body>
</html>
"""


def seite(texte: dict, datei: str, andere: tuple[str, str]) -> None:
    teile = []
    for code, (titel, abschnitte) in texte.items():
        stand = ('Stand' if code == 'de' else 'Last updated') + ': ' + STAND
        koerper = ''.join(f'<h2>{escape(k)}</h2><p>{v}</p>' for k, v in abschnitte)
        teile.append(f'<section id="{code}" lang="{code}"><h1>{escape(titel)}</h1>'
                     f'<p class="stand">{stand}</p>{koerper}</section>')
    titel = texte['de'][0] + ' / ' + texte['en'][0]
    Path('public', datei).write_text(SEITE.format(titel=titel, inhalt='\n'.join(teile),
                                                  andere_url=andere[0], andere=andere[1]))


seite(DATENSCHUTZ, 'datenschutz.html', ('impressum.html', 'Impressum / Legal notice'))
seite(IMPRESSUM, 'impressum.html', ('datenschutz.html', 'Datenschutz / Privacy'))
print('public/datenschutz.html, public/impressum.html')
