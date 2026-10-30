"""App-Icon, Android-Symbole und Startbilder aus dem Gemini-Ballon (02.10.2026).

Aufruf:  python3 scripts/app-bilder.py      (braucht Pillow und NumPy)

Alles entsteht aus scripts/bild-quellen/ballon.jpg und demselben Himmel wie
im Menue — nichts davon wird von Hand gemalt, damit ein neues Ballonbild mit
einem Aufruf ueberall ankommt.

⚠ public/bilder/ballon.png ist nur 200 px breit (fuers Spiel genug). Fuer ein
1024er-Icon wird die Quelle hier neu freigestellt, sonst waere es verwaschen.
⚠ Der App Store lehnt Icons mit Alphakanal ab: Icon und Startbilder sind RGB.
⚠ Android schneidet adaptive Icons auf einen Kreis von 66 % zu. Der Ballon im
Vordergrund bleibt deshalb innerhalb dieser Zone.
"""
import importlib.util
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

spec = importlib.util.spec_from_file_location('fs', Path(__file__).with_name('bilder-freistellen.py'))
fs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fs)

RES = Path('android/app/src/main/res')
IOS = Path('ios/App/App/Assets.xcassets')
STORE = Path('store-assets/icon')

# Derselbe Verlauf wie im Menue (App.tsx): from-[#152364] via-[#2f5cb4] to-[#bfe2f2]
VERLAUF = [(0.0, (0x15, 0x23, 0x64)), (0.5, (0x2f, 0x5c, 0xb4)), (1.0, (0xbf, 0xe2, 0xf2))]


def himmel(b: int, h: int, oben=0.0, unten=1.0) -> Image.Image:
    t = np.linspace(oben, unten, h)[:, None]
    kanal = []
    for k in range(3):
        xs = [p for p, _ in VERLAUF]
        ys = [c[k] for _, c in VERLAUF]
        kanal.append(np.interp(t, xs, ys) * np.ones((1, b)))
    return Image.fromarray(np.dstack(kanal).astype(np.uint8), 'RGB')


def sonne(bild: Image.Image, x: float, y: float, r: float) -> Image.Image:
    """Weicher Sonnenschein wie oben rechts im Menue."""
    w, h = bild.size
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot(xx - x * w, yy - y * h) / (r * w)
    a = np.clip(1 - d, 0, 1) ** 2 * 0.45
    hell = np.array([255, 240, 200], np.float32)
    arr = np.asarray(bild).astype(np.float32)
    arr = arr * (1 - a[..., None]) + hell * a[..., None]
    return Image.fromarray(arr.astype(np.uint8), 'RGB')


def ballon(hoehe: int) -> Image.Image:
    roh = fs.zuschneiden(fs.freistellen(Image.open('scripts/bild-quellen/ballon.jpg'), 'gruen'))
    breite = round(roh.width * hoehe / roh.height)
    return roh.resize((breite, hoehe), Image.LANCZOS)


def schnur(bild: Image.Image, x: int, y: int, laenge: int, staerke: int) -> None:
    """Die gemalte Schnur wie im Menue, vierfach gerechnet gegen Treppen."""
    s = 4
    lage = Image.new('L', (bild.width * s, bild.height * s), 0)
    d = ImageDraw.Draw(lage)
    punkte = []
    for i in range(41):
        t = i / 40
        punkte.append(((x + np.sin(t * np.pi * 1.6) * laenge * 0.09) * s, (y + t * laenge) * s))
    d.line(punkte, fill=150, width=staerke * s, joint='curve')
    lage = lage.resize(bild.size, Image.LANCZOS)
    weiss = Image.new('RGBA', bild.size, (255, 255, 255, 255))
    weiss.putalpha(lage)
    bild.alpha_composite(weiss)


def motiv(b: int, h: int, ballon_hoehe: float, mitte_y: float, mit_schnur=True) -> Image.Image:
    """Himmel + Ballon (+ Schnur), RGB ohne Alpha."""
    grund = sonne(himmel(b, h), 0.82, 0.12, 0.7).convert('RGBA')
    bh = round(min(b, h) * ballon_hoehe)
    bl = ballon(bh)
    # ⚠ Mit Rand: Auf der Groesse des Ballons gerechnet, wird der weiche
    # Schatten an dessen Kanten abgeschnitten, und um den Ballon steht ein Kasten.
    rand = round(bh * 0.15)
    maske = Image.new('L', (bl.width + 2 * rand, bl.height + 2 * rand), 0)
    maske.paste(bl.getchannel('A').point(lambda v: v * 0.35), (rand, rand))
    schatten = Image.new('RGBA', maske.size, (0, 0, 0, 0))
    schatten.putalpha(maske.filter(ImageFilter.GaussianBlur(bh * 0.04)))
    x = (b - bl.width) // 2
    y = round(h * mitte_y - bh / 2)
    if mit_schnur:
        schnur(grund, b // 2, y + bh - 2, round(bh * 0.32), max(2, round(bh * 0.012)))
    grund.alpha_composite(schatten, (x - rand, y - rand + round(bh * 0.04)))
    grund.alpha_composite(bl, (x, y))
    return grund.convert('RGB')


def startbild(b: int, h: int) -> Image.Image:
    """Das Startbild wie das Menue (30.10.2026): Landschaft, Schriftzug, darunter
    der Ballon im Strahl des Geblaeses.

    ⚠ Vorher stand nur ein Ballon auf blauem Verlauf. Das sah aus wie jedes
    andere Ballon-Spiel, und das Erste, was man sah, war nicht das Geblaese.
    ⚠ iOS fuellt das 2732er-Quadrat seitenfuellend (scaleAspectFill): Auf dem
    iPhone bleibt nur die mittlere Spalte von gut 45 % der Breite stehen. Alles
    Wichtige richtet sich deshalb nach `spalte`, nicht nach der Bildbreite.
    """
    land = Image.open('scripts/bild-quellen/menue-himmel.jpg').convert('RGB')
    # Seitenfuellend, unten verankert wie im Menue (object-bottom)
    f = max(b / land.width, h / land.height)
    land = land.resize((round(land.width * f), round(land.height * f)), Image.LANCZOS)
    grund = land.crop(((land.width - b) // 2, land.height - h,
                       (land.width - b) // 2 + b, land.height)).convert('RGBA')

    spalte = min(b, round(h * 0.45))
    mitte = b // 2

    logo = fs.zuschneiden(fs.freistellen(Image.open('scripts/bild-quellen/logo.jpg'), 'gruen'))
    lb = round(spalte * 0.86)
    logo = logo.resize((lb, round(logo.height * lb / logo.width)), Image.LANCZOS)
    schatten = Image.new('RGBA', (logo.width + 80, logo.height + 80), (0, 0, 0, 0))
    m = Image.new('L', schatten.size, 0)
    m.paste(logo.getchannel('A').point(lambda v: v * 0.35), (40, 40))
    schatten.putalpha(m.filter(ImageFilter.GaussianBlur(lb * 0.02)))
    oben = round(h * 0.17)
    grund.alpha_composite(schatten, (mitte - logo.width // 2 - 40, oben - 40 + round(lb * 0.015)))
    grund.alpha_composite(logo, (mitte - logo.width // 2, oben))

    geb = fs.zuschneiden(fs.freistellen(Image.open('scripts/bild-quellen/geblaese.jpg'), 'gruen'))
    gb = round(spalte * 0.2)
    geb = geb.resize((gb, round(geb.height * gb / geb.width)), Image.LANCZOS)
    # Das Geblaese steht auf der Wiese, nicht in den Huegeln.
    geb_y = round(h * 0.885) - geb.height

    # Der Luftstrahl: unten schmal an der Duese, nach oben breiter und blasser,
    # wie im Spiel (Regel 1a) — vierfach gerechnet gegen Treppen.
    s = 4
    strahl_oben = round(h * 0.5)
    lage = Image.new('L', (b * s, h * s), 0)
    d = ImageDraw.Draw(lage)
    unten_b, oben_b = gb * 0.38, spalte * 0.34
    for i in range(60):
        t = i / 59
        y0 = geb_y + 6 - (geb_y + 6 - strahl_oben) * t
        halb = unten_b + (oben_b - unten_b) * t
        d.rectangle(((mitte - halb) * s, (y0 - (geb_y - strahl_oben) / 59 - 1) * s,
                     (mitte + halb) * s, y0 * s), fill=round(115 * (1 - t) ** 1.3))
    lage = lage.resize((b, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(spalte * 0.01))
    weiss = Image.new('RGBA', (b, h), (255, 255, 255, 255))
    weiss.putalpha(lage)
    grund.alpha_composite(weiss)

    bh = round(spalte * 0.3)
    bl = ballon(bh)
    by = round(h * 0.46)
    schnur(grund, mitte, by + bh - 2, round(bh * 0.3), max(2, round(bh * 0.012)))
    grund.alpha_composite(bl, (mitte - bl.width // 2, by))
    grund.alpha_composite(geb, (mitte - geb.width // 2, geb_y))
    return grund.convert('RGB')


def runde_maske(bild: Image.Image, kreis: bool) -> Image.Image:
    s = bild.width
    m = Image.new('L', (s * 4, s * 4), 0)
    d = ImageDraw.Draw(m)
    if kreis:
        d.ellipse((0, 0, s * 4 - 1, s * 4 - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, s * 4 - 1, s * 4 - 1), radius=s * 4 * 0.18, fill=255)
    aus = bild.convert('RGBA')
    aus.putalpha(m.resize((s, s), Image.LANCZOS))
    return aus


def main() -> None:
    STORE.mkdir(parents=True, exist_ok=True)
    icon = motiv(1024, 1024, 0.62, 0.42)
    icon.save(STORE / 'icon-1024.png')
    icon.resize((512, 512), Image.LANCZOS).save(STORE / 'icon-512.png')
    icon.save(IOS / 'AppIcon.appiconset' / 'AppIcon-512@2x.png')

    # Android: adaptiver Vordergrund (nur Ballon) + Himmel als Hintergrund.
    for ordner, legacy in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
        z = RES / f'mipmap-{ordner}'
        adaptiv = round(legacy * 108 / 48)
        bh = round(adaptiv * 0.5)
        vorne = Image.new('RGBA', (adaptiv, adaptiv), (0, 0, 0, 0))
        bl = ballon(bh)
        vorne.alpha_composite(bl, ((adaptiv - bl.width) // 2, round(adaptiv * 0.47 - bh / 2)))
        vorne.save(z / 'ic_launcher_foreground.png')
        sonne(himmel(adaptiv, adaptiv, 0.1, 0.9), 0.82, 0.12, 0.7).save(z / 'ic_launcher_background.png')
        klein = icon.resize((legacy, legacy), Image.LANCZOS)
        runde_maske(klein, False).save(z / 'ic_launcher.png')
        runde_maske(klein, True).save(z / 'ic_launcher_round.png')
    for name in ['ic_launcher.xml', 'ic_launcher_round.xml']:
        (RES / 'mipmap-anydpi-v26' / name).write_text(
            '<?xml version="1.0" encoding="utf-8"?>\n'
            '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
            '    <background android:drawable="@mipmap/ic_launcher_background"/>\n'
            '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
            '</adaptive-icon>\n')

    # Startbilder: jede vorhandene Datei in ihrer Groesse neu.
    starts = list(RES.glob('drawable*/splash.png')) + list((IOS / 'Splash.imageset').glob('*.png'))
    for p in starts:
        b, h = Image.open(p).size
        startbild(b, h).save(p)
    print('Icon, Android-Symbole und', len(starts), 'Startbilder geschrieben')


if __name__ == '__main__':
    main()
