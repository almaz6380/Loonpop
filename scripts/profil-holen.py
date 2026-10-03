#!/usr/bin/env python3
"""Das App-Store-Profil fuer loonpop ueber die App-Store-Connect-API holen (03.10.2026).

    python3 scripts/profil-holen.py "loonpop AppStore" ziel.mobileprovision

⚠ Josef war nicht am Mac, als die Schluessel eingetragen wurden — die Profil-Datei
lag nur dort in „Downloads“. Apple liefert den Inhalt aber auch ueber die API
(profileContent, base64), mit demselben Schluessel, der ohnehin hochlaedt.
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


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    name, ziel = sys.argv[1], sys.argv[2]
    tok = asc.token()
    res = asc.api(tok, f'profiles?filter[name]={urllib.parse.quote(name)}&limit=5')
    treffer = [p for p in res.get('data', []) if p['attributes'].get('name') == name]
    if not treffer:
        sys.exit(f'Kein Profil namens „{name}“ — in developer.apple.com unter Profiles anlegen.')
    p = treffer[0]['attributes']
    if p.get('profileState') != 'ACTIVE':
        sys.exit(f'Profil „{name}“ ist {p.get("profileState")} — neu erzeugen.')
    with open(ziel, 'wb') as f:
        f.write(base64.b64decode(p['profileContent']))
    print(f'Profil „{name}“ geholt, gueltig bis {p.get("expirationDate")}')


if __name__ == '__main__':
    main()
