#!/usr/bin/env bash
# Legt die Signier-Secrets für die Release-Workflows in GitHub ab.
#
# Warum als Skript und nicht von Hand im Browser: Es sind elf Werte, drei davon
# müssen base64-kodiert werden. Beim Kopieren langer Base64-Blöcke ins
# Web-Formular rutschen leicht Zeilenumbrüche mit hinein — der Build scheitert
# dann mit einer Meldung, die nach einem kaputten Zertifikat aussieht.
#
# Passwörter werden verdeckt eingelesen und tauchen weder im Verlauf noch in
# der Prozessliste auf. Was du hier eingibst, geht direkt an GitHub.
#
# Aufruf:  bash scripts/setup-release-secrets.sh   (am eigenen Rechner, braucht gh)
#
# Kopie aus almaz6380/anigosha (02.10.2026). Die Werte sind dieselben wie dort:
# Zertifikat, Play-Dienstkonto und ASC-Schluessel gelten fuer alle Apps des
# Kontos. NEU fuer loonpop ist nur das Provisioning-Profil (at.gallab.loonpop).
# GitHub laesst Secrets nicht zwischen Repos kopieren, deshalb noch einmal.
set -euo pipefail

REPO="almaz6380/loonpop"

command -v gh >/dev/null || { echo "FEHLER: gh (GitHub CLI) fehlt."; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "FEHLER: nicht angemeldet — 'gh auth login' ausführen."; exit 1; }

echo "Secrets für $REPO"
echo "Leer lassen und Enter = diesen Wert überspringen."
echo

setze() {           # setze <NAME> <WERT>
  [ -n "${2:-}" ] || { echo "  übersprungen: $1"; return; }
  printf '%s' "$2" | gh secret set "$1" -R "$REPO" >/dev/null
  echo "  gesetzt: $1"
}

setze_datei_b64() { # setze_datei_b64 <NAME> <PFAD>
  [ -n "${2:-}" ] || { echo "  übersprungen: $1"; return; }
  if [ ! -f "$2" ]; then echo "  FEHLER: Datei nicht gefunden: $2"; return; fi
  base64 < "$2" | tr -d '\n' | gh secret set "$1" -R "$REPO" >/dev/null
  echo "  gesetzt: $1  (aus $(basename "$2"))"
}

setze_datei() {     # setze_datei <NAME> <PFAD>  — roher Inhalt, nicht kodiert
  [ -n "${2:-}" ] || { echo "  übersprungen: $1"; return; }
  if [ ! -f "$2" ]; then echo "  FEHLER: Datei nicht gefunden: $2"; return; fi
  gh secret set "$1" -R "$REPO" < "$2" >/dev/null
  echo "  gesetzt: $1  (aus $(basename "$2"))"
}

# ---------------------------------------------------------------------------
echo "── Android ──────────────────────────────────────────"
read -r -p "Pfad zum Keystore (.jks), z. B. ~/AppSigningKeys/upload-keystore.jks: " KS
KS="${KS/#\~/$HOME}"
setze_datei_b64 ANDROID_KEYSTORE_BASE64 "$KS"

if [ -n "${KS:-}" ] && [ -f "$KS" ]; then
  read -r -s -p "Keystore-Passwort: " P1; echo
  setze ANDROID_KEYSTORE_PASSWORD "$P1"; unset P1
  read -r -p "Key-Alias (bei MyPeak: upload): " ALIAS
  setze ANDROID_KEY_ALIAS "$ALIAS"
  read -r -s -p "Key-Passwort (oft dasselbe wie oben): " P2; echo
  setze ANDROID_KEY_PASSWORD "$P2"; unset P2
fi

read -r -p "Pfad zum Play-Dienstkonto (.json), leer = später: " PLAY
PLAY="${PLAY/#\~/$HOME}"
setze_datei PLAY_SERVICE_ACCOUNT_JSON "$PLAY"

# ---------------------------------------------------------------------------
echo
echo "── iOS ──────────────────────────────────────────────"
read -r -p "Pfad zum Distributionszertifikat (.p12), leer = später: " P12
P12="${P12/#\~/$HOME}"
setze_datei_b64 IOS_CERT_P12_BASE64 "$P12"

if [ -n "${P12:-}" ] && [ -f "$P12" ]; then
  read -r -s -p "Passwort des .p12: " P3; echo
  setze IOS_CERT_PASSWORD "$P3"; unset P3
fi

read -r -p "Pfad zum Provisioning-Profil „loonpop AppStore“ (.mobileprovision), leer = später: " PROF
PROF="${PROF/#\~/$HOME}"
setze_datei_b64 IOS_PROVISIONING_PROFILE_BASE64 "$PROF"

read -r -p "Pfad zum ASC-API-Schlüssel (.p8), leer = später: " P8
P8="${P8/#\~/$HOME}"
setze_datei_b64 ASC_KEY_P8_BASE64 "$P8"

read -r -p "ASC Key ID (10 Zeichen, steht im Dateinamen AuthKey_XXXXXXXXXX.p8): " KID
setze ASC_KEY_ID "$KID"
read -r -p "ASC Issuer ID (UUID von der App-Store-Connect-API-Seite): " ISS
setze ASC_ISSUER_ID "$ISS"

# ---------------------------------------------------------------------------
echo
echo "── Stand ────────────────────────────────────────────"
gh secret list -R "$REPO" | awk '{printf "  %s\n", $1}'
echo
echo "Fehlt noch etwas, das Skript einfach erneut laufen lassen —"
echo "bereits gesetzte Werte bleiben unverändert, wenn du das Feld leer lässt."
