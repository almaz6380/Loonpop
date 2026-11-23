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
