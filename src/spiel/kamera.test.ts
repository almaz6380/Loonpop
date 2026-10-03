import { test } from 'node:test';
import assert from 'node:assert/strict';

import { glaetten, KAMERA_TEMPO } from './kamera.ts';

test('die Kamera zieht unabhaengig von der Bildrate nach', () => {
  // ⚠ Je Bild nachgezogen haette ein 120-Hz-Geraet die Kamera doppelt so
  // schnell gefuehrt wie eines mit 60 Hz, und jedes Stocken liess sie springen.
  const zweiKurze = glaetten(glaetten(0, 100, 1 / 120, KAMERA_TEMPO.hoch), 100, 1 / 120, KAMERA_TEMPO.hoch);
  const einLanger = glaetten(0, 100, 1 / 60, KAMERA_TEMPO.hoch);
  assert.ok(Math.abs(zweiKurze - einLanger) < 1e-9);
});

test('bei 60 Hz zieht sie so weit nach wie vorher je Bild', () => {
  assert.ok(Math.abs(glaetten(0, 100, 1 / 60, KAMERA_TEMPO.hoch) - 25) < 1e-9);
  assert.ok(Math.abs(glaetten(0, 100, 1 / 60, KAMERA_TEMPO.strecke) - 12) < 1e-9);
});

test('ein langes Stocken laesst sie nicht ueber das Ziel hinausschiessen', () => {
  assert.ok(glaetten(0, 100, 5, KAMERA_TEMPO.hoch) <= 100);
  assert.equal(glaetten(40, 100, -1, KAMERA_TEMPO.hoch), 40);
});
