import { test } from 'node:test';
import assert from 'node:assert/strict';

import { geblaeseKlang } from './ton.ts';

test('das Gebläse ist still, wenn es nicht bläst', () => {
  // Sonst bliebe nach dem Ausklingen ein leises Dauerrauschen.
  assert.equal(geblaeseKlang(0).lautstaerke, 0);
  assert.equal(geblaeseKlang(0.01).lautstaerke, 0);
});

test('stärker blasen klingt lauter und heller', () => {
  let vorher = geblaeseKlang(0.05);
  for (const s of [0.2, 0.5, 0.8, 1]) {
    const k = geblaeseKlang(s);
    assert.ok(k.lautstaerke > vorher.lautstaerke, `lauter bei ${s}`);
    assert.ok(k.frequenz > vorher.frequenz, `heller bei ${s}`);
    vorher = k;
  }
});

test('die Lautstärke bleibt unter der Grenze, auch über 1', () => {
  // Die Stärke kommt aus der Physik; wer sie dort ändert, soll hier nichts übersteuern.
  assert.ok(geblaeseKlang(5).lautstaerke <= 0.25);
});
