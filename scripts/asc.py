#!/usr/bin/env python3
"""App Store Connect ueber die API steuern — Fassung fuer loonpop (02.10.2026).

Schlanke Kopie von almaz6380/anigosha scripts/asc.py: dieselben, dort am echten
Endpunkt erprobten Bausteine (Token, Upload, Bildtausch, Einreichen), aber ohne
Kaeufe, Abos und fremde Texte. Nur Standardbibliothek + pyjwt/cryptography.

Zugang ueber drei Umgebungsvariablen (in der CI aus den Repo-Secrets):
  ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8 (Inhalt der .p8, nicht base64)

    python3 scripts/asc.py --status
    python3 scripts/asc.py --texte          # Name, Untertitel, Beschreibung … in allen Sprachen
    python3 scripts/asc.py --screenshots    # iPhone-Bilder je Sprache ersetzen
    python3 scripts/asc.py --build 1        # Build der offenen Version zuweisen
    python3 scripts/asc.py --exportfrage    # Verschluesselung: nur HTTPS → false
    python3 scripts/asc.py --inhaberrechte  # keine Inhalte Dritter
    python3 scripts/asc.py --alter-setzen   # Alterseinstufung: alles „keine“
    python3 scripts/asc.py --vervollstaendigen  # Copyright, Kategorie, Pruef-Kontakt, Preis, Laender
    python3 scripts/asc.py --kauf           # „Werbung entfernen“: Preis, Texte, Laender, Pruefungsbild
    python3 scripts/asc.py --einreichen
    python3 scripts/asc.py --aufraeumen     # festhaengende Einreichung zurueckziehen

Schreibende Befehle nehmen --dry-run.

⚠ Die App selbst (Bundle-ID at.gallab.loonpop, Name, Hauptsprache) muss einmal
von Hand in App Store Connect angelegt werden — das geht nicht ueber die API.
"""
import argparse
import glob
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API = 'https://api.appstoreconnect.apple.com/v1'
BUNDLE = os.environ.get('ASC_BUNDLE_ID') or 'at.gallab.loonpop'
WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEITE = 'https://loonpop.almaz6380.workers.dev'
DATENSCHUTZ_URL = f'{SEITE}/datenschutz.html'
SUPPORT_URL = f'{SEITE}/impressum.html'

# Nur iPhone: TARGETED_DEVICE_FAMILY = 1, also verlangt Apple keine iPad-Bilder.
BILD_TYP = 'APP_IPHONE_67'
MAX_BILDER = 10
IN_PRUEFUNG = {'WAITING_FOR_REVIEW', 'IN_REVIEW', 'PENDING_APPLE_RELEASE',
               'PENDING_DEVELOPER_RELEASE', 'PROCESSING_FOR_APP_STORE'}
BLOCKIERT = {'UNRESOLVED_ISSUES', 'READY_FOR_REVIEW'}

TROCKEN = False


def token() -> str:
    try:
        import jwt  # pyjwt
    except ImportError:
        sys.exit('Fehlt: pip3 install pyjwt cryptography')
    werte = {n: os.environ.get(n) for n in ('ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8')}
    fehlt = [n for n, v in werte.items() if not v]
    if fehlt:
        sys.exit(f'Fehlende Umgebungsvariablen: {", ".join(fehlt)}')
    jetzt = int(time.time())
    # Apple laesst hoechstens 20 Minuten Laufzeit zu.
    return jwt.encode({'iss': werte['ASC_ISSUER_ID'], 'iat': jetzt, 'exp': jetzt + 15 * 60,
                       'aud': 'appstoreconnect-v1'},
                      werte['ASC_KEY_P8'], algorithm='ES256',
                      headers={'kid': werte['ASC_KEY_ID'], 'typ': 'JWT'})


def api(tok, pfad, method='GET', body=None, fatal=True):
    url = pfad if pfad.startswith('http') else f'{API}/{pfad.lstrip("/")}'
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Authorization', f'Bearer {tok}')
    if data is not None:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as r:
            roh = r.read()
            return json.loads(roh) if roh else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors='replace')
        if not fatal:
            return {'_fehler': e.code, '_detail': detail}
        sys.exit(f'\nFEHLER {e.code} bei {method} {url}\n{detail}\n')


def fehler_text(res):
    try:
        d = json.loads(res.get('_detail') or '{}')
        teile = []
        for e in d.get('errors', []):
            teile.append(f'{e.get("title")}: {e.get("detail")}')
            # ⚠ Warum eine Version nicht einreichbar ist, steht NICHT im Text,
            # sondern in meta.associatedErrors (03.10.2026: nur „not in valid state“).
            for pfad, liste in ((e.get('meta') or {}).get('associatedErrors') or {}).items():
                for f in liste:
                    teile.append(f'\n    - {f.get("code")}: {f.get("detail") or f.get("title")}')
        return '; '.join(teile)
    except (ValueError, AttributeError):
        return res.get('_detail', '')


def app_id(tok):
    res = api(tok, f'apps?filter[bundleId]={urllib.parse.quote(BUNDLE)}')
    if not res.get('data'):
        sys.exit(f'Keine App mit Bundle-ID {BUNDLE} gefunden — erst in App Store Connect anlegen.')
    app = res['data'][0]
    print(f'App: {app["attributes"]["name"]}  ({BUNDLE}, id {app["id"]})')
    return app['id']


def offene_version(tok, aid):
    fertig = {'READY_FOR_SALE', 'REPLACED_BY_NEW_VERSION', 'REMOVED_FROM_SALE',
              'DEVELOPER_REMOVED_FROM_SALE'}
    for v in api(tok, f'apps/{aid}/appStoreVersions?limit=10').get('data', []):
        if v['attributes'].get('appStoreState') not in fertig:
            return v
    sys.exit('Keine offene Version gefunden — in ASC eine neue Version anlegen.')


def bearbeitbares_app_info(tok, aid):
    """Das appInfo, an dem man schreiben darf (bei einer neuen App gibt es nur eins)."""
    infos = api(tok, f'apps/{aid}/appInfos').get('data', [])
    gesperrt = {'READY_FOR_DISTRIBUTION', 'READY_FOR_SALE', 'REPLACED_WITH_NEW_INFO'}
    for info in infos:
        zustand = info['attributes'].get('state') or info['attributes'].get('appStoreState')
        if zustand not in gesperrt:
            return info
    return infos[0]


# ── Texte ──────────────────────────────────────────────────────────────────

def store_texte():
    """{ASC-Sprachcode: appstore-Felder} aus store-assets/texte/*.json."""
    aus = {}
    for pfad in sorted(glob.glob(os.path.join(WURZEL, 'store-assets', 'texte', '*.json'))):
        with open(pfad, encoding='utf-8') as f:
            t = json.load(f)
        for lc in t['storeCodes']['appstore']:
            aus[lc] = t['appstore']
    return aus


def _abgleichen(tok, art, vorhanden, soll, beziehung, label):
    """Eine Lokalisierung anlegen oder nur die abweichenden Felder schreiben."""
    if vorhanden is None:
        print(f'  {label}: neu anlegen')
        if TROCKEN:
            return
        res = api(tok, art, 'POST', {'data': {'type': art, 'attributes': soll,
                                              'relationships': beziehung}}, fatal=False)
    else:
        aendern = {k: v for k, v in soll.items() if k != 'locale' and vorhanden['attributes'].get(k) != v}
        if not aendern:
            print(f'  {label}: steht schon richtig')
            return
        print(f'  {label}: {", ".join(sorted(aendern))}')
        if TROCKEN:
            return
        res = api(tok, f'{art}/{vorhanden["id"]}', 'PATCH', {
            'data': {'type': art, 'id': vorhanden['id'], 'attributes': aendern}}, fatal=False)
    print(f'    FEHLER: {fehler_text(res)}' if res.get('_fehler') else '    ok')


def setze_texte(tok):
    """Name, Untertitel und Datenschutz-URL (gehoeren zur APP) sowie Beschreibung,
    Stichworte, Werbetext und Support-URL (gehoeren zur VERSION).

    ⚠ Apple trennt die beiden Seiten: Wer den Namen auf der Versionsseite sucht,
    findet ihn nie (Lehre aus Anigosha, store-assets/README.md dort).
    """
    texte = store_texte()
    aid = app_id(tok)
    info = bearbeitbares_app_info(tok, aid)
    v = offene_version(tok, aid)
    zustand = v['attributes'].get('appStoreState')
    print(f'  Version {v["attributes"]["versionString"]}  Zustand {zustand}')
    if zustand in IN_PRUEFUNG and not TROCKEN:
        sys.exit('  Die Version ist in Pruefung — Apple sperrt dann die Texte.')

    print('\n── App-Informationen ──')
    da = {l['attributes']['locale']: l for l in
          api(tok, f'appInfos/{info["id"]}/appInfoLocalizations').get('data', [])}
    for lc, t in texte.items():
        _abgleichen(tok, 'appInfoLocalizations', da.get(lc),
                    {'locale': lc, 'name': t['name'], 'subtitle': t['subtitle'],
                     'privacyPolicyUrl': DATENSCHUTZ_URL},
                    {'appInfo': {'data': {'type': 'appInfos', 'id': info['id']}}}, lc)

    print('\n── Version ──')
    da = {l['attributes']['locale']: l for l in
          api(tok, f'appStoreVersions/{v["id"]}/appStoreVersionLocalizations').get('data', [])}
    for lc, t in texte.items():
        _abgleichen(tok, 'appStoreVersionLocalizations', da.get(lc),
                    {'locale': lc, 'description': t['description'], 'keywords': t['keywords'],
                     'promotionalText': t['promotionalText'], 'supportUrl': SUPPORT_URL,
                     'marketingUrl': SEITE},
                    {'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': v['id']}}}, lc)


# ── Screenshots ────────────────────────────────────────────────────────────

def _hochladen(tok, res, pfad, art):
    daten = open(pfad, 'rb').read()
    for op in res['data']['attributes']['uploadOperations']:
        stueck = daten[op['offset']:op['offset'] + op['length']]
        req = urllib.request.Request(op['url'], data=stueck, method=op['method'])
        for h in op.get('requestHeaders', []):
            req.add_header(h['name'], h['value'])
        with urllib.request.urlopen(req) as r:
            r.read()
    return api(tok, f'{art}/{res["data"]["id"]}', 'PATCH', {
        'data': {'type': art, 'id': res['data']['id'],
                 'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(daten).hexdigest()}},
    }, fatal=False)


def bild_hoch(tok, sid, pfad):
    name, groesse = os.path.basename(pfad), os.path.getsize(pfad)
    res = api(tok, 'appScreenshots', 'POST', {
        'data': {'type': 'appScreenshots', 'attributes': {'fileSize': groesse, 'fileName': name},
                 'relationships': {'appScreenshotSet': {'data': {'type': 'appScreenshotSets', 'id': sid}}}},
    }, fatal=False)
    if res.get('_fehler'):
        print(f'    FEHLER beim Reservieren von {name}: {fehler_text(res)}')
        return False
    fertig = _hochladen(tok, res, pfad, 'appScreenshots')
    if fertig.get('_fehler'):
        print(f'    FEHLER beim Bestaetigen von {name}: {fehler_text(fertig)}')
        return False
    print(f'    {name} hochgeladen')
    return True


def tausche_bilder(tok, sid, alt_ids, pfade):
    """Erst so viele neue hoch, wie neben die alten passen, dann die alten weg,
    dann der Rest. So steht der Satz nie leer (aus Anigosha, 02.09.2026)."""
    platz = max(0, MAX_BILDER - len(alt_ids))
    zuerst, danach = pfade[:platz], pfade[platz:]
    if TROCKEN:
        print(f'    [trocken] {len(zuerst)} hoch, {len(alt_ids)} alte weg, {len(danach)} hoch')
        return
    geschafft = sum(1 for p in zuerst if bild_hoch(tok, sid, p))
    if zuerst and geschafft == 0:
        print('    Kein einziges neues Bild angenommen — alte bleiben stehen.')
        return
    for i in alt_ids:
        res = api(tok, f'appScreenshots/{i}', 'DELETE', fatal=False)
        if isinstance(res, dict) and res.get('_fehler'):
            print(f'    FEHLER beim Loeschen von {i}: {fehler_text(res)}')
    for p in danach:
        bild_hoch(tok, sid, p)


def setze_screenshots(tok):
    aid = app_id(tok)
    v = offene_version(tok, aid)
    zustand = v['attributes'].get('appStoreState')
    print(f'  Version {v["attributes"]["versionString"]}  Zustand {zustand}')
    # ⚠ Harte Sperre: In Pruefung erlaubt Apple Loeschen, aber kein Anlegen —
    # ein Lauf wuerde die Bildstrecke leeren (Anigosha, 02.09.2026).
    if zustand in IN_PRUEFUNG and not TROCKEN:
        sys.exit('  Version ist in Pruefung — erst --aufraeumen, dann Bilder, dann --einreichen.')
    for loc in api(tok, f'appStoreVersions/{v["id"]}/appStoreVersionLocalizations').get('data', []):
        lc = loc['attributes']['locale']
        code = lc.split('-')[0].lower()
        ordner = os.path.join(WURZEL, 'store-assets', 'ios', code)
        if not os.path.isdir(ordner):
            ordner = os.path.join(WURZEL, 'store-assets', 'ios', 'en')
        pfade = sorted(glob.glob(os.path.join(ordner, '[0-9]*.jpg')) + glob.glob(os.path.join(ordner, '[0-9]*.png')))
        print(f'\n  {lc}: {len(pfade)} Bilder aus {os.path.relpath(ordner, WURZEL)}')
        if not pfade:
            continue
        sets = api(tok, f'appStoreVersionLocalizations/{loc["id"]}/appScreenshotSets').get('data', [])
        sid = next((s['id'] for s in sets if s['attributes']['screenshotDisplayType'] == BILD_TYP), None)
        alt_ids = []
        if sid:
            alt_ids = [s['id'] for s in api(tok, f'appScreenshotSets/{sid}/appScreenshots').get('data', [])]
        elif TROCKEN:
            print(f'    [trocken] Satz {BILD_TYP} anlegen')
            sid = 'TROCKEN'
        else:
            neu = api(tok, 'appScreenshotSets', 'POST', {
                'data': {'type': 'appScreenshotSets', 'attributes': {'screenshotDisplayType': BILD_TYP},
                         'relationships': {'appStoreVersionLocalization': {
                             'data': {'type': 'appStoreVersionLocalizations', 'id': loc['id']}}}},
            }, fatal=False)
            if neu.get('_fehler'):
                print(f'    Satz nicht anlegbar: {fehler_text(neu)}')
                continue
            sid = neu['data']['id']
        tausche_bilder(tok, sid, alt_ids, pfade)


# ── Pflichtangaben ─────────────────────────────────────────────────────────

def setze_build(tok, nummer):
    aid = app_id(tok)
    v = offene_version(tok, aid)
    builds = api(tok, f'builds?filter[app]={aid}&limit=20&sort=-version')
    treffer = [b for b in builds.get('data', []) if b['attributes'].get('version') == str(nummer)]
    if not treffer:
        sys.exit(f'  Build {nummer} nicht gefunden.')
    b = treffer[0]
    if b['attributes'].get('processingState') != 'VALID':
        sys.exit(f'  Build {nummer} ist {b["attributes"].get("processingState")} — Apple verarbeitet ihn noch.')
    if TROCKEN:
        print(f'  [trocken] Build {nummer} wuerde zugewiesen')
        return
    res = api(tok, f'appStoreVersions/{v["id"]}/relationships/build', 'PATCH',
              {'data': {'type': 'builds', 'id': b['id']}}, fatal=False)
    print(f'  FEHLER: {fehler_text(res)}' if res.get('_fehler') else f'  Build {nummer} zugewiesen')


def exportfrage(tok):
    """loonpop verschluesselt nichts selbst und baut nicht einmal eine Verbindung
    auf → usesNonExemptEncryption = false. Steht auch in Info.plist
    (ITSAppUsesNonExemptEncryption), dann fragt Apple gar nicht erst."""
    aid = app_id(tok)
    v = offene_version(tok, aid)
    b = api(tok, f'appStoreVersions/{v["id"]}/build', fatal=False)
    if not b.get('data'):
        sys.exit('  Kein Build zugewiesen.')
    jetzt = b['data']['attributes'].get('usesNonExemptEncryption')
    print(f'  usesNonExemptEncryption {jetzt!r} -> False')
    if jetzt is False or TROCKEN:
        return
    res = api(tok, f'builds/{b["data"]["id"]}', 'PATCH', {
        'data': {'type': 'builds', 'id': b['data']['id'], 'attributes': {'usesNonExemptEncryption': False}},
    }, fatal=False)
    print(f'  FEHLER: {fehler_text(res)}' if res.get('_fehler') else '  gesetzt')


def inhaberrechte(tok):
    """Alle Bilder stammen aus eigener Erzeugung (Gemini, scripts/bild-quellen/)."""
    aid = app_id(tok)
    soll = 'DOES_NOT_USE_THIRD_PARTY_CONTENT'
    jetzt = api(tok, f'apps/{aid}')['data']['attributes'].get('contentRightsDeclaration')
    print(f'  contentRightsDeclaration: {jetzt!r} -> {soll}')
    if jetzt == soll or TROCKEN:
        return
    res = api(tok, f'apps/{aid}', 'PATCH', {
        'data': {'type': 'apps', 'id': aid, 'attributes': {'contentRightsDeclaration': soll}}}, fatal=False)
    print(f'  FEHLER: {fehler_text(res)}' if res.get('_fehler') else '  gesetzt')


# Alterseinstufung: loonpop zeigt nichts davon. Aufzaehlungen bekommen 'NONE',
# Ja/Nein-Fragen False. Geschrieben wird nur, was noch offen (None) ist.
# Felder, die hier nicht stehen, bleiben offen und werden gemeldet.
ALTER_STUFEN = [
    'alcoholTobaccoOrDrugUseOrReferences', 'contests', 'gamblingSimulated', 'gunsOrOtherWeapons',
    'horrorOrFearThemes', 'matureOrSuggestiveThemes', 'medicalOrTreatmentInformation',
    'profanityOrCrudeHumor', 'sexualContentGraphicAndNudity', 'sexualContentOrNudity',
    'violenceCartoonOrFantasy', 'violenceRealistic', 'violenceRealisticProlongedGraphicOrSadistic',
]
ALTER_NEIN = [
    'gambling', 'unrestrictedWebAccess', 'lootBox', 'messagingAndChat', 'parentalControls',
    'ageAssurance', 'userGeneratedContent', 'advertising', 'healthOrWellnessTopics',
    'socialMedia', 'socialMediaAgeRestricted',
]


def alter_setzen(tok):
    aid = app_id(tok)
    info = bearbeitbares_app_info(tok, aid)
    ar = api(tok, f'appInfos/{info["id"]}/ageRatingDeclaration', fatal=False)
    if not ar.get('data'):
        sys.exit('  Keine Alterseinstufung gefunden.')
    attr = ar['data']['attributes']
    setzen = {k: 'NONE' for k in ALTER_STUFEN if k in attr and attr[k] is None}
    setzen.update({k: False for k in ALTER_NEIN if k in attr and attr[k] is None})
    unbekannt = [k for k, w in attr.items() if w is None and k not in setzen]
    for k, w in setzen.items():
        print(f'    {k}: None -> {w!r}')
    if unbekannt:
        print(f'    offen und hier nicht bekannt (in ASC von Hand): {", ".join(unbekannt)}')
    if not setzen or TROCKEN:
        return
    res = api(tok, f'ageRatingDeclarations/{ar["data"]["id"]}', 'PATCH', {
        'data': {'type': 'ageRatingDeclarations', 'id': ar['data']['id'], 'attributes': setzen}}, fatal=False)
    print(f'    FEHLER: {fehler_text(res)}' if res.get('_fehler') else f'    {len(setzen)} Felder gesetzt')


# ── Einreichen ─────────────────────────────────────────────────────────────

# ── Was Apple vor dem Einreichen verlangt (03.10.2026) ──────────────────────
# Die erste Einreichung scheiterte an fuenf Punkten. Vier gehen ueber die API,
# die App-Datenschutz-Angaben („Keine Daten“) NICHT: die muessen einmal in ASC
# geklickt werden.
COPYRIGHT = '2026 Josef Gallab'
KATEGORIE, UNTERKATEGORIE = 'GAMES', 'GAMES_CASUAL'
PRUEF_NOTIZ = ('LoonPop is a single-player skill game. No account, no login, no network '
               'access, no in-app purchases and no ads. Touch and hold to blow the leaf '
               'blower; slide to move it. All levels are reachable by playing; the endless '
               'mode is available from the start.')
V2 = 'https://api.appstoreconnect.apple.com/v2'


def _verdeckt(x):
    x = x or ''
    return x[:3] + '…' + x[-2:] if len(x) > 6 else '…'


def setze_copyright(tok, aid):
    v = offene_version(tok, aid)
    if v['attributes'].get('copyright'):
        print(f'  Copyright steht: {v["attributes"]["copyright"]}')
        return
    print(f'  Copyright -> {COPYRIGHT}')
    if TROCKEN:
        return
    res = api(tok, f'appStoreVersions/{v["id"]}', 'PATCH', {'data': {
        'type': 'appStoreVersions', 'id': v['id'], 'attributes': {'copyright': COPYRIGHT}}}, fatal=False)
    print(f'    FEHLER: {fehler_text(res)}' if res.get('_fehler') else '    ok')


def setze_kategorie(tok, aid):
    info = bearbeitbares_app_info(tok, aid)
    print(f'  Kategorie -> {KATEGORIE} / {UNTERKATEGORIE}')
    if TROCKEN:
        return
    res = api(tok, f'appInfos/{info["id"]}', 'PATCH', {'data': {
        'type': 'appInfos', 'id': info['id'], 'relationships': {
            'primaryCategory': {'data': {'type': 'appCategories', 'id': KATEGORIE}},
            'primarySubcategoryOne': {'data': {'type': 'appCategories', 'id': UNTERKATEGORIE}}}}},
        fatal=False)
    print(f'    FEHLER: {fehler_text(res)}' if res.get('_fehler') else '    ok')


def _kontakt_von_anderer_app(tok, aid):
    """Den Pruef-Kontakt aus Josefs anderen Apps (Anigosha …) uebernehmen.

    ⚠ Josef war nicht am Rechner; Telefonnummer und Name stehen dort laengst."""
    for app in api(tok, 'apps?limit=50').get('data', []):
        if app['id'] == aid:
            continue
        for v in api(tok, f'apps/{app["id"]}/appStoreVersions?limit=5', fatal=False).get('data', []):
            d = api(tok, f'appStoreVersions/{v["id"]}/appStoreReviewDetail', fatal=False).get('data')
            if d and d['attributes'].get('contactPhone'):
                print(f'  Kontakt aus „{app["attributes"]["name"]}“ uebernommen')
                return {k: d['attributes'].get(k) for k in
                        ('contactFirstName', 'contactLastName', 'contactPhone', 'contactEmail')}
    return None


def setze_pruefkontakt(tok, aid):
    v = offene_version(tok, aid)
    da = api(tok, f'appStoreVersions/{v["id"]}/appStoreReviewDetail', fatal=False).get('data')
    if da and da['attributes'].get('contactPhone'):
        print('  Pruef-Kontakt steht schon')
        return
    k = _kontakt_von_anderer_app(tok, aid)
    if not k:
        print('  KEIN Pruef-Kontakt gefunden — in ASC unter der Version „App-Pruefung“ von Hand.')
        return
    print(f'  Kontakt: {k["contactFirstName"]} {k["contactLastName"]}, '
          f'Tel. {_verdeckt(k["contactPhone"])}, {_verdeckt(k["contactEmail"])}')
    if TROCKEN:
        return
    attr = dict(k, demoAccountRequired=False, notes=PRUEF_NOTIZ)
    if da:
        res = api(tok, f'appStoreReviewDetails/{da["id"]}', 'PATCH', {'data': {
            'type': 'appStoreReviewDetails', 'id': da['id'], 'attributes': attr}}, fatal=False)
    else:
        res = api(tok, 'appStoreReviewDetails', 'POST', {'data': {
            'type': 'appStoreReviewDetails', 'attributes': attr, 'relationships': {
                'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': v['id']}}}}}, fatal=False)
    print(f'    FEHLER: {fehler_text(res)}' if res.get('_fehler') else '    ok')


def setze_preis(tok, aid):
    """Kostenlos, Basis USA."""
    punkte = api(tok, f'apps/{aid}/appPricePoints?filter[territory]=USA&limit=200').get('data', [])
    frei = [p for p in punkte if float(p['attributes'].get('customerPrice') or 1) == 0]
    if not frei:
        print('  KEIN kostenloser Preispunkt gefunden — Preis in ASC von Hand auf 0.')
        return
    print('  Preis -> kostenlos')
    if TROCKEN:
        return
    res = api(tok, 'appPriceSchedules', 'POST', {
        'data': {'type': 'appPriceSchedules', 'relationships': {
            'app': {'data': {'type': 'apps', 'id': aid}},
            'baseTerritory': {'data': {'type': 'territories', 'id': 'USA'}},
            'manualPrices': {'data': [{'type': 'appPrices', 'id': '${preis}'}]}}},
        'included': [{'type': 'appPrices', 'id': '${preis}', 'attributes': {'startDate': None},
                      'relationships': {'appPricePoint': {'data': {
                          'type': 'appPricePoints', 'id': frei[0]['id']}}}}]}, fatal=False)
    print(f'    FEHLER: {fehler_text(res)}' if res.get('_fehler') else '    ok')


def setze_verfuegbarkeit(tok, aid):
    """In allen Laendern, auch in kuenftigen."""
    da = api(tok, f'apps/{aid}/appAvailabilityV2', fatal=False)
    if da.get('data'):
        print('  Verfuegbarkeit steht schon')
        return
    laender = []
    url = 'territories?limit=200'
    while url:
        res = api(tok, url)
        laender += [t['id'] for t in res.get('data', [])]
        url = (res.get('links') or {}).get('next')
    print(f'  Verfuegbarkeit -> alle {len(laender)} Laender')
    if TROCKEN:
        return
    res = api(tok, f'{V2}/appAvailabilities', 'POST', {
        'data': {'type': 'appAvailabilities', 'attributes': {'availableInNewTerritories': True},
                 'relationships': {
                     'app': {'data': {'type': 'apps', 'id': aid}},
                     'territoryAvailabilities': {'data': [
                         {'type': 'territoryAvailabilities', 'id': f'${{{t}}}'} for t in laender]}}},
        'included': [{'type': 'territoryAvailabilities', 'id': f'${{{t}}}',
                      'attributes': {'available': True},
                      'relationships': {'territory': {'data': {'type': 'territories', 'id': t}}}}
                     for t in laender]}, fatal=False)
    print(f'    FEHLER: {fehler_text(res)}' if res.get('_fehler') else '    ok')


# ── Kauf „Werbung entfernen“ (Version 1.1, 04.10.2026) ──────────────────────
# RevenueCat hat das Produkt in ASC angelegt, aber nur mit ID und Typ. Apple
# braucht dazu Preis, Namen je Sprache, Laender und ein Pruefungsbild, sonst
# steht es auf „Missing Metadata“ und kann nicht mit 1.1 eingereicht werden.
KAUF_ID = 'loonpop_no_ads'
KAUF_PREIS = '2.99'
KAUF_BASIS = 'AUT'
KAUF_BILD = os.path.join(WURZEL, 'store-assets', 'ios', 'kauf-pruefung.png')
KAUF_NOTIZ = ('Non-consumable "Remove ads". It is in the main menu below the level grid '
              '("Werbung entfernen" / "Remove ads"); "Restore purchases" is right below it. '
              'After purchase, banner and interstitial ads no longer appear.')
# Apple erlaubt beim Kauf 30 Zeichen Name und 45 Zeichen Beschreibung.
KAUF_KURZ = {'pt': 'Compre uma vez, sem anúncios para sempre.',
             'it': 'Un solo acquisto, senza pubblicità per sempre.'}


def _kauf_texte():
    """{ASC-Sprachcode: (Name, Beschreibung)} aus den Sprachdateien der App."""
    aus = {}
    for pfad in sorted(glob.glob(os.path.join(WURZEL, 'store-assets', 'texte', '*.json'))):
        code = os.path.basename(pfad)[:-5]
        with open(pfad, encoding='utf-8') as f:
            codes = json.load(f)['storeCodes']['appstore']
        with open(os.path.join(WURZEL, 'src', 'i18n', 'locales', f'{code}.json'), encoding='utf-8') as f:
            w = json.load(f)['werbung']
        text = KAUF_KURZ.get(code, w['entfernenText'])
        if len(text) > 45:
            text = text[:44].rstrip() + '…'
        for lc in codes:
            aus[lc] = (w['entfernen'][:30], text)
    return aus


def kauf_einrichten(tok):
    aid = app_id(tok)
    treffer = [k for k in api(tok, f'apps/{aid}/inAppPurchasesV2?limit=50').get('data', [])
               if k['attributes'].get('productId') == KAUF_ID]
    if not treffer:
        sys.exit(f'  Kein Kauf {KAUF_ID} in ASC — erst in RevenueCat „Create new product“.')
    kid = treffer[0]['id']
    a = treffer[0]['attributes']
    print(f'  Kauf {KAUF_ID}: {a.get("name")} · {a.get("inAppPurchaseType")} · {a.get("state")}')

    # Name und Hinweis fuer die Pruefung
    if not TROCKEN:
        res = api(tok, f'{V2}/inAppPurchases/{kid}', 'PATCH', {'data': {
            'type': 'inAppPurchases', 'id': kid,
            'attributes': {'name': 'Werbung entfernen', 'reviewNote': KAUF_NOTIZ}}}, fatal=False)
        print(f'    Pruefhinweis: {"FEHLER " + fehler_text(res) if res.get("_fehler") else "ok"}')

    # Texte je Sprache
    da = {l['attributes']['locale']: l for l in
          api(tok, f'{V2}/inAppPurchases/{kid}/inAppPurchaseLocalizations?limit=50').get('data', [])}
    for lc, (name, text) in _kauf_texte().items():
        alt = da.get(lc)
        if alt and alt['attributes'].get('name') == name and alt['attributes'].get('description') == text:
            continue
        print(f'    {lc}: {name} / {text}')
        if TROCKEN:
            continue
        if alt:
            res = api(tok, f'inAppPurchaseLocalizations/{alt["id"]}', 'PATCH', {'data': {
                'type': 'inAppPurchaseLocalizations', 'id': alt['id'],
                'attributes': {'name': name, 'description': text}}}, fatal=False)
        else:
            res = api(tok, 'inAppPurchaseLocalizations', 'POST', {'data': {
                'type': 'inAppPurchaseLocalizations',
                'attributes': {'locale': lc, 'name': name, 'description': text},
                'relationships': {'inAppPurchaseV2': {'data': {'type': 'inAppPurchases', 'id': kid}}}}},
                fatal=False)
        if res.get('_fehler'):
            print(f'      FEHLER: {fehler_text(res)}')

    # Preis
    punkte, url = [], f'{V2}/inAppPurchases/{kid}/pricePoints?filter[territory]={KAUF_BASIS}&limit=200'
    while url:
        r = api(tok, url)
        punkte += r.get('data', [])
        url = (r.get('links') or {}).get('next')
    passend = [p for p in punkte if p['attributes'].get('customerPrice') in (KAUF_PREIS, KAUF_PREIS + '0')]
    if not passend:
        print(f'    KEIN Preispunkt {KAUF_PREIS} in {KAUF_BASIS} — Preis in ASC von Hand setzen.')
    else:
        print(f'    Preis -> {KAUF_PREIS} € (Basis {KAUF_BASIS}, andere Laender rechnet Apple um)')
        if not TROCKEN:
            res = api(tok, 'inAppPurchasePriceSchedules', 'POST', {
                'data': {'type': 'inAppPurchasePriceSchedules', 'relationships': {
                    'inAppPurchase': {'data': {'type': 'inAppPurchases', 'id': kid}},
                    'baseTerritory': {'data': {'type': 'territories', 'id': KAUF_BASIS}},
                    'manualPrices': {'data': [{'type': 'inAppPurchasePrices', 'id': '${preis}'}]}}},
                'included': [{'type': 'inAppPurchasePrices', 'id': '${preis}', 'attributes': {'startDate': None},
                              'relationships': {'inAppPurchasePricePoint': {'data': {
                                  'type': 'inAppPurchasePricePoints', 'id': passend[0]['id']}}}}]}, fatal=False)
            print(f'      {"FEHLER " + fehler_text(res) if res.get("_fehler") else "ok"}')

    # Laender
    laender, url = [], 'territories?limit=200'
    while url:
        r = api(tok, url)
        laender += [t['id'] for t in r.get('data', [])]
        url = (r.get('links') or {}).get('next')
    print(f'    Verfuegbar in allen {len(laender)} Laendern')
    if not TROCKEN:
        res = api(tok, 'inAppPurchaseAvailabilities', 'POST', {'data': {
            'type': 'inAppPurchaseAvailabilities', 'attributes': {'availableInNewTerritories': True},
            'relationships': {
                'inAppPurchase': {'data': {'type': 'inAppPurchases', 'id': kid}},
                'availableTerritories': {'data': [{'type': 'territories', 'id': t} for t in laender]}}}},
            fatal=False)
        print(f'      {"FEHLER " + fehler_text(res) if res.get("_fehler") else "ok"}')

    # Pruefungsbild
    vorhanden = api(tok, f'{V2}/inAppPurchases/{kid}/appStoreReviewScreenshot', fatal=False).get('data')
    if vorhanden:
        print('    Pruefungsbild steht schon')
    elif not os.path.exists(KAUF_BILD):
        print(f'    KEIN Bild {KAUF_BILD} — node scripts/kauf-bild.mjs')
    else:
        print(f'    Pruefungsbild -> {os.path.basename(KAUF_BILD)}')
        if not TROCKEN:
            res = api(tok, 'inAppPurchaseAppStoreReviewScreenshots', 'POST', {'data': {
                'type': 'inAppPurchaseAppStoreReviewScreenshots',
                'attributes': {'fileName': os.path.basename(KAUF_BILD), 'fileSize': os.path.getsize(KAUF_BILD)},
                'relationships': {'inAppPurchaseV2': {'data': {'type': 'inAppPurchases', 'id': kid}}}}},
                fatal=False)
            if res.get('_fehler'):
                print(f'      FEHLER: {fehler_text(res)}')
            else:
                fertig = _hochladen(tok, res, KAUF_BILD, 'inAppPurchaseAppStoreReviewScreenshots')
                print(f'      {"FEHLER " + fehler_text(fertig) if fertig.get("_fehler") else "ok"}')
    neu = api(tok, f'{V2}/inAppPurchases/{kid}')['data']['attributes'].get('state')
    print(f'  Zustand jetzt: {neu} (READY_TO_SUBMIT = fertig, wird mit 1.1 eingereicht)')


def vervollstaendigen(tok):
    aid = app_id(tok)
    setze_copyright(tok, aid)
    setze_kategorie(tok, aid)
    setze_pruefkontakt(tok, aid)
    setze_preis(tok, aid)
    setze_verfuegbarkeit(tok, aid)
    print('  App-Datenschutz („Keine Daten“) geht nicht ueber die API — in ASC von Hand.')


def einreichen(tok):
    aid = app_id(tok)
    v = offene_version(tok, aid)
    print(f'  Version {v["attributes"]["versionString"]} ({v["attributes"].get("appStoreState")})')
    alle = api(tok, f'apps/{aid}/reviewSubmissions?limit=20', fatal=False).get('data', [])
    if any(s['attributes'].get('state') in ('WAITING_FOR_REVIEW', 'IN_REVIEW') for s in alle):
        print('  Es laeuft schon eine Einreichung — nichts zu tun.')
        return
    if any(s['attributes'].get('state') == 'UNRESOLVED_ISSUES' for s in alle):
        sys.exit('  Eine Einreichung steht auf UNRESOLVED_ISSUES — erst --aufraeumen.')
    entwurf = [s for s in alle if s['attributes'].get('state') == 'READY_FOR_REVIEW']
    if TROCKEN:
        print('  [trocken] Version wuerde eingereicht')
        return
    if entwurf:
        sub = entwurf[0]
    else:
        res = api(tok, 'reviewSubmissions', 'POST', {
            'data': {'type': 'reviewSubmissions', 'attributes': {'platform': 'IOS'},
                     'relationships': {'app': {'data': {'type': 'apps', 'id': aid}}}}}, fatal=False)
        if res.get('_fehler'):
            sys.exit(f'  Einreichung nicht anlegbar: {fehler_text(res)}')
        sub = res['data']
    drin = api(tok, f'reviewSubmissions/{sub["id"]}/items', fatal=False).get('data', [])
    if not drin:
        # Beziehung im Singular, Typ im Plural — sonst „unknown relationship“.
        res = api(tok, 'reviewSubmissionItems', 'POST', {
            'data': {'type': 'reviewSubmissionItems', 'relationships': {
                'reviewSubmission': {'data': {'type': 'reviewSubmissions', 'id': sub['id']}},
                'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': v['id']}}}}}, fatal=False)
        if res.get('_fehler'):
            sys.exit(f'  Version nicht angenommen: {fehler_text(res)}')
    res = api(tok, f'reviewSubmissions/{sub["id"]}', 'PATCH', {
        'data': {'type': 'reviewSubmissions', 'id': sub['id'], 'attributes': {'submitted': True}}}, fatal=False)
    print(f'  ABSENDEN FEHLGESCHLAGEN: {fehler_text(res)}' if res.get('_fehler')
          else f'  abgesendet — Zustand {res["data"]["attributes"].get("state")}')


def aufraeumen(tok):
    aid = app_id(tok)
    for s in api(tok, f'apps/{aid}/reviewSubmissions?limit=20').get('data', []):
        if s['attributes'].get('state') not in BLOCKIERT:
            continue
        print(f'  {s["id"]}  {s["attributes"].get("state")} -> zurueckziehen')
        if TROCKEN:
            continue
        res = api(tok, f'reviewSubmissions/{s["id"]}', 'PATCH', {
            'data': {'type': 'reviewSubmissions', 'id': s['id'], 'attributes': {'canceled': True}}}, fatal=False)
        print(f'    FEHLER: {fehler_text(res)}' if res.get('_fehler') else '    zurueckgezogen')


def zeige_status(tok):
    aid = app_id(tok)
    info = bearbeitbares_app_info(tok, aid)
    print('\n── Name je Sprache ──')
    for loc in api(tok, f'appInfos/{info["id"]}/appInfoLocalizations').get('data', []):
        a = loc['attributes']
        print(f'  {a["locale"]:8} {a.get("name")!r}  {a.get("subtitle")!r}')
    print('\n── Versionen ──')
    for v in api(tok, f'apps/{aid}/appStoreVersions?limit=5').get('data', []):
        a = v['attributes']
        b = api(tok, f'appStoreVersions/{v["id"]}/build', fatal=False)
        build = b['data']['attributes'].get('version') if b.get('data') else 'keiner'
        print(f'  {a["versionString"]:8} {a.get("appStoreState")}  Build {build}')
    print('\n── Builds ──')
    for b in api(tok, f'builds?filter[app]={aid}&limit=5&sort=-version').get('data', []):
        a = b['attributes']
        print(f'  Build {a.get("version"):4} {a.get("processingState")}  {a.get("uploadedDate")}')
    print('\n── Einreichungen ──')
    for s in api(tok, f'apps/{aid}/reviewSubmissions?limit=5', fatal=False).get('data', []):
        print(f'  {s["attributes"].get("state")}  id={s["id"]}')


def main():
    global TROCKEN
    p = argparse.ArgumentParser()
    for name in ('status', 'texte', 'screenshots', 'exportfrage', 'inhaberrechte',
                 'alter-setzen', 'vervollstaendigen', 'kauf', 'einreichen', 'aufraeumen'):
        p.add_argument(f'--{name}', action='store_true')
    p.add_argument('--build', metavar='NUMMER')
    p.add_argument('--dry-run', action='store_true')
    a = p.parse_args()
    TROCKEN = a.dry_run
    if TROCKEN:
        print('Trockenlauf — es geht nichts zu Apple.\n')
    tok = token()
    if a.status:
        zeige_status(tok)
    if a.texte:
        setze_texte(tok)
    if a.screenshots:
        setze_screenshots(tok)
    if a.build:
        setze_build(tok, a.build)
    if a.exportfrage:
        exportfrage(tok)
    if a.inhaberrechte:
        inhaberrechte(tok)
    if a.alter_setzen:
        alter_setzen(tok)
    if a.vervollstaendigen:
        vervollstaendigen(tok)
    if a.kauf:
        kauf_einrichten(tok)
    if a.einreichen:
        einreichen(tok)
    if a.aufraeumen:
        aufraeumen(tok)


if __name__ == '__main__':
    main()
