"""Stellt die Gemini-Bilder frei (02.10.2026) und legt sie nach public/bilder/.

Aufruf:  python3 scripts/bilder-freistellen.py      (braucht Pillow und NumPy)

Quellen liegen in scripts/bild-quellen/. Gemini liefert JPG, also ohne echte
Durchsichtigkeit. Deshalb wurde jedes Bild auf EINER glatten Farbe bestellt:

  Gruen  #00FF00  Ballon (er ist rot — Magenta laege zu nah dran)
  Magenta #FF00FF Wolken, Huegel, Wiese (dort ist viel Gruen)

⚠ Bei der Nadel (27.09.2026) war ein Schachbrett eingebrannt. Eine glatte
Farbe laesst sich dagegen sauber herausrechnen:

  1. Durchsichtigkeit aus dem ABSTAND zur Schluesselfarbe, nicht als Ja/Nein.
     So bleiben die weichen Kanten weich.
  2. Die Farbe der Kantenpixel zurueckrechnen: Ein halb durchsichtiges Pixel
     ist eine Mischung aus Vordergrund und Schluesselfarbe — ohne diesen Schritt
     bliebe ein gruener bzw. pinker Saum.
  3. Kacheln (Huegel, Wiese) werden NICHT hier nahtlos gemacht, sondern beim
     Zeichnen: Jede zweite Kachel wird gespiegelt (zeichnen.ts). Gemini haelt
     "seamlessly tileable" nicht genau ein. ⚠ Ein Ueberblenden der Raender war
     der erste Versuch — zwei verschiedene Huegelumrisse uebereinander ergaben
     doppelte, halb durchsichtige Kanten.
"""
from pathlib import Path

import numpy as np
from PIL import Image

QUELLEN = Path('scripts/bild-quellen')
ZIEL = Path('public/bilder')


def freistellen(bild: Image.Image, art: str) -> Image.Image:
    a = np.asarray(bild.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if art == 'gruen':
        abstand = g - np.maximum(r, b)
        schluessel = np.array([0, 255, 0], np.float32)
    else:
        abstand = np.minimum(r, b) - g
        schluessel = np.array([255, 0, 255], np.float32)
    # Ab 30 Abstand beginnt der Hintergrund, ab 120 ist es nur noch Hintergrund.
    alpha = 1 - np.clip((abstand - 30) / 90, 0, 1)
    # Vordergrund zurueckrechnen: beobachtet = a·vorne + (1−a)·schluessel.
    sicher = np.maximum(alpha, 0.05)[..., None]
    vorne = (a - (1 - alpha)[..., None] * schluessel) / sicher
    vorne = np.clip(vorne, 0, 255)
    # Rest-Stich wegnehmen, der durch JPEG-Rauschen noch bleibt.
    if art == 'gruen':
        vorne[..., 1] = np.minimum(vorne[..., 1], np.maximum(vorne[..., 0], vorne[..., 2]))
    else:
        stich = np.clip(np.minimum(vorne[..., 0], vorne[..., 2]) - vorne[..., 1], 0, None)
        vorne[..., 0] -= stich
        vorne[..., 2] -= stich
    alpha[alpha < 0.04] = 0
    raus = np.dstack([vorne, alpha * 255]).astype(np.uint8)
    return Image.fromarray(raus, 'RGBA')


def zuschneiden(bild: Image.Image) -> Image.Image:
    box = bild.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    return bild.crop(box)


def auf_breite(bild: Image.Image, breite: int) -> Image.Image:
    hoehe = round(bild.height * breite / bild.width)
    return bild.resize((breite, hoehe), Image.LANCZOS)


def main() -> None:
    ZIEL.mkdir(parents=True, exist_ok=True)

    ballon = zuschneiden(freistellen(Image.open(QUELLEN / 'ballon.jpg'), 'gruen'))
    auf_breite(ballon, 200).save(ZIEL / 'ballon.png', optimize=True)
    print('ballon', ballon.size, 'Seitenverhaeltnis', round(ballon.width / ballon.height, 4))

    wolken = freistellen(Image.open(QUELLEN / 'wolken.jpg'), 'magenta')
    h = wolken.height // 2
    w = wolken.width // 2
    for i, (x, y) in enumerate([(0, 0), (w, 0), (0, h), (w, h)]):
        teil = zuschneiden(wolken.crop((x, y, x + w, y + h)))
        auf_breite(teil, 220).save(ZIEL / f'wolke{i + 1}.png', optimize=True)

    for name, breite in [('huegel-fern', 1200), ('huegel-nah', 1200), ('wiese', 1200)]:
        roh = freistellen(Image.open(QUELLEN / f'{name}.jpg'), 'magenta')
        # Nur oben zuschneiden: Unten muss die Kachel bis zum Bildrand reichen.
        oben = roh.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()[1]
        roh = roh.crop((0, oben, roh.width, roh.height))
        auf_breite(roh, breite).save(ZIEL / f'{name}.png', optimize=True)

    himmel = Image.open(QUELLEN / 'himmel.jpg').convert('RGB')
    himmel.resize((360, 728), Image.LANCZOS).save(ZIEL / 'himmel.jpg', quality=88)

    for p in sorted(ZIEL.iterdir()):
        print(p.name, Image.open(p).size, p.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
