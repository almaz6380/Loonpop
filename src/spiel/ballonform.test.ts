import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ballonform, NEIGUNG_MAX, KNOTEN } from './ballonform.ts';

const pos = { x: 300, y: 500 };
const R = 26;

test('der Knoten bleibt immer unter dem Ballon — auch beim Sinken', () => {
  // ⚠ Vorher drehte er sich voll in Flugrichtung: Beim Sinken stand er auf
  // dem Kopf, der Knoten zeigte nach oben, die Schnur hing unten.
  for (const geschw of [{ x: 0, y: 120 }, { x: 0, y: -160 }, { x: 400, y: 200 }, { x: -400, y: -50 }]) {
    const f = ballonform(pos, geschw, R);
    assert.ok(f.knoten.y > pos.y + R, `Knoten bei ${JSON.stringify(geschw)} nicht unten`);
    assert.ok(Math.abs(f.neigung) <= NEIGUNG_MAX);
  }
});

test('der Knoten haengt der Bewegung hinterher', () => {
  assert.ok(ballonform(pos, { x: 150, y: 0 }, R).knoten.x < pos.x, 'nach rechts: Knoten nicht links');
  assert.ok(ballonform(pos, { x: -150, y: 0 }, R).knoten.x > pos.x, 'nach links: Knoten nicht rechts');
  assert.equal(ballonform(pos, { x: 0, y: -150 }, R).knoten.x, pos.x);
});

test('die Schnur beginnt dort, wo der gezeichnete Knoten sitzt', () => {
  // Gezeichnet wird der Knoten bei (0, R + KNOTEN) im gedrehten und
  // gestreckten Ballonbild. Genau diesen Punkt muss `knoten` treffen.
  const geschw = { x: 90, y: -60 };
  const f = ballonform(pos, geschw, R);
  const lokal = { x: 0, y: (R + KNOTEN) * f.dehnung };
  const welt = {
    x: pos.x + lokal.x * Math.cos(f.neigung) - lokal.y * Math.sin(f.neigung),
    y: pos.y + lokal.x * Math.sin(f.neigung) + lokal.y * Math.cos(f.neigung),
  };
  assert.ok(Math.abs(welt.x - f.knoten.x) < 1e-9);
  assert.ok(Math.abs(welt.y - f.knoten.y) < 1e-9);
});
