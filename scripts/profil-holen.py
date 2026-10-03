#!/usr/bin/env python3
"""Das App-Store-Profil fuer loonpop ueber die App-Store-Connect-API holen (03.10.2026).

    python3 scripts/profil-holen.py "loonpop AppStore" ziel.mobileprovision

⚠ Josef war nicht am Mac, als die Schluessel eingetragen wurden — die Profil-Datei
lag nur dort. Apple liefert den Inhalt aber auch ueber die API (profileContent),
mit demselben Schluessel, der ohnehin hochlaedt.
⚠ Der erste Lauf fand kein Profil unter genau diesem Namen. Projekt und
ExportOptions verlangen ihn aber genau so (PROVISIONING_PROFILE_SPECIFIER). Deshalb:
gibt es ihn nicht, wird ein App-Store-Profil dieses Namens fuer die Bundle-ID mit
dem gueltigen Distributionszertifikat angelegt. Ein zweites Profil fuer dieselbe
App stoert Apple nicht.
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


def zertifikat(tok):
    """Das neueste gueltige Distributionszertifikat (dasselbe wie bei Anigosha)."""
    for typ in ('DISTRIBUTION', 'IOS_DISTRIBUTION'):
        res = asc.api(tok, f'certificates?filter[certificateType]={typ}&limit=50', fatal=False)
        gueltig = [c for c in res.get('data', []) if c['attributes'].get('activated', True)]
        if gueltig:
            gueltig.sort(key=lambda c: c['attributes'].get('expirationDate') or '', reverse=True)
            return gueltig[0]['id']
    sys.exit('Kein Distributionszertifikat im Konto gefunden.')


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    name, ziel = sys.argv[1], sys.argv[2]
    tok = asc.token()
    bid = bundle_id(tok)
    profile = asc.api(tok, f'bundleIds/{bid}/profiles?limit=50').get('data', [])
    for p in profile:
        a = p['attributes']
        print(f'  vorhanden: „{a.get("name")}“ {a.get("profileType")} {a.get("profileState")}')
    treffer = [p for p in profile if p['attributes'].get('name') == name
               and p['attributes'].get('profileState') == 'ACTIVE']
    if treffer:
        p = treffer[0]
    else:
        print(f'  kein aktives Profil „{name}“ — wird angelegt')
        res = asc.api(tok, 'profiles', 'POST', {
            'data': {'type': 'profiles',
                     'attributes': {'name': name, 'profileType': 'IOS_APP_STORE'},
                     'relationships': {
                         'bundleId': {'data': {'type': 'bundleIds', 'id': bid}},
                         'certificates': {'data': [{'type': 'certificates', 'id': zertifikat(tok)}]}}},
        }, fatal=False)
        if res.get('_fehler'):
            sys.exit(f'Profil nicht anlegbar: {asc.fehler_text(res)}')
        p = res['data']
    a = p['attributes']
    with open(ziel, 'wb') as f:
        f.write(base64.b64decode(a['profileContent']))
    print(f'Profil „{name}“ bereit, gueltig bis {a.get("expirationDate")}')


if __name__ == '__main__':
    main()
