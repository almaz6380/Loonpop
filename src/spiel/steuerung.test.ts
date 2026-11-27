import { test } from 'node:test';
import assert from 'node:assert/strict';
import { steuern, istWisch, FAHRT_MAX, NEIGUNG_MAX } from './steuerung.ts';
import { strahlKraft, schritt } from './physik.ts';
import { neueWelt } from './welt.ts';
import type { Geblaese, Level } from './typen.ts';

const g = (x: number, ziel?: number): Geblaese => ({ x, an: true, staerke: 1, ziel, neigung: 0 });

test('ohne Finger bleibt das Geblaese stehen und richtet sich auf', () => {
  const b = g(300); b.neigung = 0.5;
  for (let i = 0; i < 240; i++) steuern(b, 1 / 120, 720);
  assert.equal(b.x, 300);
  assert.ok(Math.abs(b.neigung!) < 0.01);
});

test('faehrt hoechstens FAHRT_MAX und kippt Richtung Finger', () => {
  const b = g(360, 60);
  for (let i = 0; i < 60; i++) steuern(b, 1 / 120, 720);
  assert.ok(Math.abs(360 - b.x - FAHRT_MAX * 0.5) < 1e-6);
  assert.ok(b.neigung! < -NEIGUNG_MAX * 0.5, 'kippt nach links');
});

test('eingeholt → wieder senkrecht', () => {
  const b = g(360, 380);
  for (let i = 0; i < 240; i++) steuern(b, 1 / 120, 720);
  assert.ok(Math.abs(b.x - 380) < 1e-6);
  assert.ok(Math.abs(b.neigung!) < 0.01);
});

test('gekippter Strahl schiebt seitlich, senkrechter wie frueher', () => {
  const ballon = { x: 360, y: 900 };
  const gerade = strahlKraft(360, 1184, ballon, 700, 1, 1280, 0);
  assert.equal(gerade.x, 0);
  // Ballon genau auf der gekippten Achse.
  const rechts = strahlKraft(360, 1184, { x: 360 + 284 * Math.tan(0.5), y: 900 }, 700, 1, 1280, 0.5);
  assert.ok(rechts.x > 200, `Seitenschub ${rechts.x}`);
  assert.ok(rechts.y < 0, 'traegt weiter nach oben');
});

test('Wisch: nur kurz und schnell', () => {
  assert.equal(istWisch(120, 100), 1);
  assert.equal(istWisch(-120, 100), -1);
  assert.equal(istWisch(120, 400), 0);
  assert.equal(istWisch(20, 50), 0);
});

test('Windstoss wirkt einmal, dann Abklingzeit', () => {
  const lvl: Level = {
    id: 99, name: 't', art: 'hoch', groesse: { breite: 720, hoehe: 1280 },
    start: { x: 360, y: 900 }, geblaeseStart: 360, ziel: { pos: { x: 360, y: 100 }, radius: 40 },
    nadeln: [], zonen: [], tempo: { blaskraft: 700, daempfung: 1.5, zeitlimit: 0 },
  } as Level;
  const w = neueWelt(lvl);
  w.geblaese.stoss = 1; schritt(w);
  const v1 = w.ballon.geschw.x;
  assert.ok(v1 > 250);
  w.geblaese.stoss = 1; schritt(w);
  assert.ok(w.ballon.geschw.x <= v1, 'zweiter Stoss gesperrt');
});

// Seit 27.11.2026: Der Ballon folgt dem Finger, das Geblaese schiebt ihn hin.
const leer = (): Level => ({
  id: 98, name: 't', art: 'hoch', groesse: { breite: 720, hoehe: 1280 },
  start: { x: 520, y: 800 }, geblaeseStart: 520, ziel: { pos: { x: 360, y: 40 }, radius: 40 },
  nadeln: [], zonen: [], tempo: { blaskraft: 620, daempfung: 1.6, zeitlimit: 0 },
} as Level);

test('Ballon folgt dem Finger schnell und ohne grosses Pendeln', () => {
  const w = neueWelt(leer());
  w.geblaese.an = true;
  w.geblaese.ziel = 220; // 300 px nach links
  let minX = Infinity, hinter = 0, schritte = 0, spitze = 0;
  for (let i = 0; i < 120 * 1.5; i++) {
    schritt(w);
    if (w.ausgang !== 'laeuft') break;
    minX = Math.min(minX, w.ballon.pos.x);
    spitze = Math.max(spitze, Math.abs(w.ballon.geschw.x));
    if (i < 48) { schritte++; if (w.geblaese.x > w.ballon.pos.x) hinter++; }
    if (i === 96) assert.ok(Math.abs(w.ballon.pos.x - 220) < 20, `nach 0,8 s bei ${w.ballon.pos.x.toFixed(0)}`);
  }
  assert.ok(220 - minX < 40, `ueberschwingt ${(220 - minX).toFixed(0)} px`);
  assert.ok(spitze > 450, `Spitzentempo ${spitze.toFixed(0)} px/s`);
  assert.ok(hinter / schritte > 0.8, 'Geblaese steht auf der Gegenseite und schiebt');
});

test('ohne Blasen kein Seitenzug', () => {
  const w = neueWelt(leer());
  w.geblaese.an = false; w.geblaese.staerke = 0;
  w.geblaese.ziel = 220;
  for (let i = 0; i < 30; i++) schritt(w);
  assert.ok(Math.abs(w.ballon.pos.x - 520) < 2, `bewegt ${w.ballon.pos.x}`);
});

test('mit Ballon: Geblaese faehrt hinter ihn und kippt zum Ziel', () => {
  const b = g(520, 220);
  for (let i = 0; i < 30; i++) steuern(b, 1 / 120, 720, { x: 520, dy: 400 });
  assert.ok(b.x > 520, 'steht rechts vom Ballon, wenn er nach links soll');
  assert.ok(b.neigung! < 0, 'kippt nach links');
});
