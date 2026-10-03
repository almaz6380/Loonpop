#!/usr/bin/env python3
"""Das App-Store-Profil fuer loonpop ueber die App-Store-Connect-API holen (03.10.2026).

    python3 scripts/profil-holen.py "loonpop AppStore" ziel.mobileprovision [SERIENNUMMER]

⚠ Josef war nicht am Mac, als die Schluessel eingetragen wurden — die Profil-Datei
lag nur dort. Apple liefert den Inhalt aber auch ueber die API (profileContent),
mit demselben Schluessel, der ohnehin hochlaedt.
⚠ Der erste Lauf fand kein Profil unter genau diesem Namen. Projekt und
ExportOptions verlangen ihn aber genau so (PROVISIONING_PROFILE_SPECIFIER). Deshalb:
gibt es ihn nicht, wird ein App-Store-Profil dieses Namens fuer die Bundle-ID mit
dem gueltigen Distributionszertifikat angelegt. Ein zweites Profil fuer dieselbe
App stoert Apple nicht.
⚠ Das angelegte Profil enthielt das NEUESTE Distributionszertifikat, das .p12 aus
Anigosha ist aber ein anderes. xcodebuild brach ab („doesn't include signing
certificate“). Deshalb nimmt das Skript die Seriennummer des .p12 entgegen und
waehlt ein aktives App-Store-Profil, das genau dieses Zertifikat enthaelt. Passt
keins, legt es eines an (ggf. unter einem freien Namen). Der tatsaechliche Name
steht danach in ziel + ".name", der Workflow traegt ihn ins Projekt ein.
Zugang wie scripts/asc.py: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8.
"""
import base64
import importlib.util
import os
import sys
import urllib.parse

spec = importlib.util.spec_from_file_location('asc', os.path.join(os.path.dirname(__file__), 'asc.py'))
asc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(asc)


def bundle_id(tok):
    res = asc.api(tok, f'bundleIds?filter[identifier]={urllib.parse.quote(asc.BUNDLE)}&limit=5')
    treffer = [b for b in res.get('data', []) if b['attributes'].get('identifier') == asc.BUNDLE]
    if not treffer:
        sys.exit(f'Keine App-ID {asc.BUNDLE} — in developer.apple.com unter Identifiers anlegen.')
    return treffer[0]['id']


def seriell(x):
    return (x or '').upper().replace(':', '').lstrip('0')


def zertifikat(tok, serie=None):
    """Mit Seriennummer genau dieses Zertifikat, sonst das neueste gueltige."""
    for typ in ('DISTRIBUTION', 'IOS_DISTRIBUTION'):
        res = asc.api(tok, f'certificates?filter[certificateType]={typ}&limit=50', fatal=False)
        gueltig = [c for c in res.get('data', []) if c['attributes'].get('activated', True)]
        if serie:
            gueltig = [c for c in gueltig if seriell(c['attributes'].get('serialNumber')) == seriell(serie)]
        if gueltig:
            gueltig.sort(key=lambda c: c['attributes'].get('expirationDate') or '', reverse=True)
            return gueltig[0]['id']
    if serie:
        sys.exit(f'Kein Distributionszertifikat mit Seriennummer {serie} im Konto — das .p12 passt nicht zum Konto.')
    sys.exit('Kein Distributionszertifikat im Konto gefunden.')


def zertifikate_von(tok, pid):
    res = asc.api(tok, f'profiles/{pid}/certificates?limit=50', fatal=False)
    return {c['id'] for c in res.get('data', [])}


def main() -> None:
    if len(sys.argv) not in (3, 4):
        sys.exit(__doc__)
    name, ziel = sys.argv[1], sys.argv[2]
    serie = sys.argv[3] if len(sys.argv) == 4 else None
    tok = asc.token()
    bid = bundle_id(tok)
    cid = zertifikat(tok, serie)
    profile = asc.api(tok, f'bundleIds/{bid}/profiles?limit=50').get('data', [])
    namen = set()
    passend = []
    for p in profile:
        a = p['attributes']
        namen.add(a.get('name'))
        drin = cid in zertifikate_von(tok, p['id'])
        print(f'  vorhanden: „{a.get("name")}“ {a.get("profileType")} {a.get("profileState")}'
              f'{" · mit dem Zertifikat" if drin else ""}')
        if drin and a.get('profileState') == 'ACTIVE' and a.get('profileType') == 'IOS_APP_STORE':
            passend.append(p)
    # Der gewuenschte Name zuerst, sonst irgendein passendes Profil.
    passend.sort(key=lambda p: p['attributes'].get('name') != name)
    if passend:
        p = passend[0]
    else:
        neu = name
        n = 2
        while neu in namen:
            neu = f'{name} {n}'
            n += 1
        print(f'  kein aktives Profil mit diesem Zertifikat — lege „{neu}“ an')
        res = asc.api(tok, 'profiles', 'POST', {
            'data': {'type': 'profiles',
                     'attributes': {'name': neu, 'profileType': 'IOS_APP_STORE'},
                     'relationships': {
                         'bundleId': {'data': {'type': 'bundleIds', 'id': bid}},
                         'certificates': {'data': [{'type': 'certificates', 'id': cid}]}}},
        }, fatal=False)
        if res.get('_fehler'):
            sys.exit(f'Profil nicht anlegbar: {asc.fehler_text(res)}')
        p = res['data']
    a = p['attributes']
    if not a.get('profileContent'):
        a = asc.api(tok, f'profiles/{p["id"]}')['data']['attributes']
    with open(ziel, 'wb') as f:
        f.write(base64.b64decode(a['profileContent']))
    with open(ziel + '.name', 'w') as f:
        f.write(a['name'])
    print(f'Profil „{a["name"]}“ bereit, gueltig bis {a.get("expirationDate")}')


if __name__ == '__main__':
    main()
