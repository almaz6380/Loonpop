"""Stellt die Nadel aus dem Gemini-Bild frei (einmalig gelaufen, 27.09.2026).

Ergebnis: public/nadel.png — 61x729, Oehr durchsichtig.

⚠ Warum es dieses Skript gibt: Gemini liefert die Nadel als JPG. Der
Schachbrett-Hintergrund, der Durchsichtigkeit andeuten SOLL, ist dort als graue
Karos eingebrannt — ohne Freistellen laege ein Karomuster ueber dem Himmel.

Aufruf:  python3 scripts/nadel-freistellen.py <bild.jpg>

Verfahren in drei Schritten:
  1. Flutung von allen vier Raendern ueber alles Helle und Farblose. Die dunkle
     Umrisslinie der Nadel sperrt die Flut.
  2. Die eingeschlossenen Gebiete bewerten. ⚠ Hier ist die Falle: Helles Silber
     liegt NAH AM HELLEN KARO-TON (62 % der Nadelflaeche treffen ihn). Wer nur
     nach dem Karo-Anteil geht, schneidet die Nadel selbst heraus — genau das
     ist beim ersten Versuch passiert. Deshalb gilt: Das GROESSTE eingeschlossene
     Gebiet ist die Nadel und bleibt; kleinere mit hohem Karo-Anteil sind
     Loecher (das Oehr) und fliegen raus.
  3. Maske um einen Pixel wachsen lassen — JPEG weicht Kanten auf, sonst bleibt
     ein grauer Saum um die Nadel.
"""
import sys
from collections import deque
from PIL import Image

QUELLE = sys.argv[1] if len(sys.argv) > 1 else 'nadel-quelle.jpg'
ZIEL = 'public/nadel.png'
KARO = (209, 162)          # die beiden Grautoene des Schachbretts

im = Image.open(QUELLE).convert('RGB')
b, h = im.size
px = im.load()

def hell_grau(x, y):
    """Grosszuegig — faengt auch die JPEG-Zwischentoene an den Karo-Kanten."""
    r, g, bl = px[x, y]
    return min(r, g, bl) > 150 and max(r, g, bl) - min(r, g, bl) < 26

def exakt_karo(x, y):
    r, g, bl = px[x, y]
    return max(r, g, bl) - min(r, g, bl) < 14 and any(abs(r - k) <= 12 for k in KARO)

weg = bytearray(b * h)
sch = deque()

def saen(x, y):
    if not weg[y * b + x] and hell_grau(x, y):
        weg[y * b + x] = 1
        sch.append((x, y))

for x in range(b):
    saen(x, 0); saen(x, h - 1)
for y in range(h):
    saen(0, y); saen(b - 1, y)
while sch:
    x, y = sch.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < b and 0 <= ny < h:
            saen(nx, ny)

gesehen = bytearray(weg)
gebiete = []
for sy in range(h):
    for sx in range(b):
        if gesehen[sy * b + sx] or not hell_grau(sx, sy):
            continue
        feld, q = [], deque([(sx, sy)])
        gesehen[sy * b + sx] = 1
        while q:
            x, y = q.popleft()
            feld.append((x, y))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < b and 0 <= ny < h and not gesehen[ny * b + nx] and hell_grau(nx, ny):
                    gesehen[ny * b + nx] = 1
                    q.append((nx, ny))
        gebiete.append(feld)

gebiete.sort(key=len, reverse=True)
for i, feld in enumerate(gebiete):
    if i == 0 or len(feld) < 80:
        continue
    if sum(1 for x, y in feld if exakt_karo(x, y)) / len(feld) > 0.55:
        for x, y in feld:
            weg[y * b + x] = 1

gewachsen = bytearray(weg)
for y in range(h):
    for x in range(b):
        if weg[y * b + x]:
            continue
        if any(0 <= x + dx < b and 0 <= y + dy < h and weg[(y + dy) * b + (x + dx)]
               for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            gewachsen[y * b + x] = 1

aus = im.convert('RGBA')
ap = aus.load()
for y in range(h):
    for x in range(b):
        if gewachsen[y * b + x]:
            ap[x, y] = (0, 0, 0, 0)
aus = aus.crop(aus.getbbox())
aus.save(ZIEL)
print(f'{ZIEL}: {aus.size[0]}x{aus.size[1]} px')
