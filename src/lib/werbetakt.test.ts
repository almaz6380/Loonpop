// Die Werbung darf das schnelle „Nochmal“ nicht kaputtmachen: nur jedes dritte
// Platzen, nie oefter als alle 90 Sekunden, nie fuer werbefreie Spieler.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { geplatzt, neuerTakt, weiter, JEDER_WIEVIELTE, MINDESTABSTAND_MS } from './werbetakt.ts';

test('erst beim dritten Platzen ist eine Anzeige faellig', () => {
  let t = neuerTakt();
  for (let i = 1; i < JEDER_WIEVIELTE; i += 1) {
    t = geplatzt(t, i * 1000);
    assert.equal(t.faellig, false, `nach ${i} Platzern`);
  }
  t = geplatzt(t, 5000);
  assert.equal(t.faellig, true);
});

test('gezeigt wird beim Weitertippen, danach ist die Faelligkeit verbraucht', () => {
  let t = neuerTakt();
  for (let i = 0; i < JEDER_WIEVIELTE; i += 1) t = geplatzt(t, 1000);
  const a = weiter(t, 2000, false);
  assert.equal(a.zeigen, true);
  assert.equal(a.takt.zuletzt, 2000);
  assert.equal(weiter(a.takt, 3000, false).zeigen, false);
});

test('Mindestabstand: drei schnelle Platzer kurz nach einer Anzeige zeigen nichts', () => {
  let t = { ...neuerTakt(), platzer: JEDER_WIEVIELTE, zuletzt: 10_000 };
  for (let i = 0; i < JEDER_WIEVIELTE; i += 1) t = geplatzt(t, 10_000 + 30_000);
  assert.equal(t.faellig, false);
  for (let i = 0; i < JEDER_WIEVIELTE; i += 1) t = geplatzt(t, 10_000 + MINDESTABSTAND_MS);
  assert.equal(t.faellig, true);
});

test('werbefrei: nie eine Anzeige, die Faelligkeit verfaellt trotzdem', () => {
  let t = neuerTakt();
  for (let i = 0; i < JEDER_WIEVIELTE; i += 1) t = geplatzt(t, 1000);
  const a = weiter(t, 2000, true);
  assert.equal(a.zeigen, false);
  assert.equal(a.takt.faellig, false);
});
