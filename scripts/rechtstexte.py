"""Erzeugt public/datenschutz.html und public/impressum.html (02.10.2026).

Aufruf:  python3 scripts/rechtstexte.py

Eigene, statische Seiten statt einer Seite in der App: Beide Stores verlangen
eine Datenschutz-URL, die OHNE App erreichbar ist. Dieselben Dateien liegen im
App-Paket, das Menue verlinkt sie also auch offline.

⚠ Entwurf nach bestem Wissen, keine Rechtsberatung. Betreiberdaten wie in
Anigosha (src/pages/legal/legalContent.ts). Kommt eine Datenverarbeitung dazu
(Konten, Bestenliste, Werbung, Kaeufe), MUSS die Datenschutzerklaerung mit —
sonst stimmt sie nicht mehr, und die Store-Angaben zum Datenschutz auch nicht.
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
STAND = '02.10.2026'

B = BETREIBER
BETR_DE = f"{B['name']}<br>{B['adresse']}<br>{B['ort']}<br>E-Mail: <a href=\"mailto:{B['mail']}\">{B['mail']}</a>"
BETR_EN = BETR_DE.replace('E-Mail:', 'Email:').replace('Österreich', 'Austria')

DATENSCHUTZ = {
 'de': ('Datenschutzerklärung', [
  ('Kurz gesagt', 'LoonPop sammelt keine personenbezogenen Daten. Es gibt kein Konto, keine Werbung, keine Analyse und kein Tracking. Dein Spielstand bleibt auf deinem Gerät.'),
  ('Verantwortlich', BETR_DE),
  ('Was auf deinem Gerät gespeichert wird', 'Damit du beim nächsten Start weiterspielen kannst, speichert LoonPop im lokalen Speicher deines Geräts: welche Level du geschafft hast und in welcher Bestzeit, deine Bestweite im Endlos-Modus und die gewählte Sprache. Diese Daten verlassen dein Gerät nicht, wir haben keinen Zugriff darauf. Du löschst sie, indem du die App deinstallierst oder ihre Daten in den Einstellungen deines Geräts löschst.'),
  ('Keine Übermittlung', 'Die App braucht keine Internetverbindung und sendet keine Daten an uns oder an Dritte. Sie enthält keine Werbung, keine Analyse- oder Absturzdienste und keine Social-Media-Funktionen. Es werden keine Cookies gesetzt.'),
  ('Browser-Version', 'Spielst du LoonPop im Browser, wird die Seite über Cloudflare (Cloudflare, Inc., USA) ausgeliefert. Dabei verarbeitet Cloudflare technisch notwendige Verbindungsdaten wie die IP-Adresse, um die Seite auszuliefern und vor Angriffen zu schützen. Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Cloudflare ist nach dem EU-US Data Privacy Framework zertifiziert. Wir selbst werten diese Daten nicht aus.'),
  ('Kinder', 'LoonPop eignet sich für alle Altersgruppen. Da wir keine personenbezogenen Daten erheben, erheben wir auch keine von Kindern.'),
  ('Deine Rechte', 'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO). Da wir keine Daten über dich speichern, gibt es in der Regel nichts herauszugeben. Fragen beantworten wir gern per E-Mail. Du kannst dich außerdem bei der Österreichischen Datenschutzbehörde beschweren (dsb.gv.at).'),
  ('Änderungen', 'Kommt eine neue Funktion dazu, die Daten verarbeitet, passen wir diese Erklärung vorher an.'),
 ]),
 'en': ('Privacy Policy', [
  ('In short', 'LoonPop does not collect any personal data. There is no account, no advertising, no analytics and no tracking. Your progress stays on your device.'),
  ('Controller', BETR_EN),
  ('What is stored on your device', 'So that you can continue where you left off, LoonPop stores in your device’s local storage: which levels you have completed and your best times, your best distance in endless mode, and your chosen language. This data never leaves your device and we have no access to it. You can delete it by uninstalling the app or clearing its data in your device settings.'),
  ('No data transfer', 'The app does not need an internet connection and sends no data to us or to third parties. It contains no advertising, no analytics or crash reporting services and no social media features. No cookies are set.'),
  ('Browser version', 'If you play LoonPop in a web browser, the page is delivered via Cloudflare (Cloudflare, Inc., USA). Cloudflare processes technically necessary connection data such as your IP address to deliver the page and protect it from attacks. The legal basis is our legitimate interest in secure operation (Art. 6(1)(f) GDPR). Cloudflare is certified under the EU-US Data Privacy Framework. We do not analyse this data ourselves.'),
  ('Children', 'LoonPop is suitable for all ages. As we do not collect any personal data, we do not collect any from children either.'),
  ('Your rights', 'You have the right to access, rectification, erasure, restriction of processing, data portability and objection (Art. 15–21 GDPR). As we do not store any data about you, there is usually nothing to disclose. We are happy to answer questions by email. You can also lodge a complaint with the Austrian Data Protection Authority (dsb.gv.at).'),
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
