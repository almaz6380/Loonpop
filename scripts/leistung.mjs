// Misst, wie fluessig der Endlos-Lauf laeuft (03.10.2026).
//
//   npm run build && npx vite preview --port 4173 &
//   npm run leistung              Endlos ↑, 4-fach gedrosselt, 15 s
//   DROSSEL=6 SEKUNDEN=20 npm run leistung
//
// ⚠ Josef meldete am 03.10.2026 im Browser: Das Bild stockt, der Ballon springt,
// die Steuerung hakt. Am schnellen Rechner sieht man davon nichts. Deshalb wird
// die CPU gedrosselt (CDP), ungefaehr auf ein Mittelklasse-Handy, und der Finger
// fuehrt das Geblaese wie ein Mensch unter dem Ballon her.
// Gezaehlt werden die Abstaende der Bilder (requestAnimationFrame). Ueber 50 ms
// verwirft die Schleife Spielzeit (8 Schritte × DT / SPIELTEMPO) — das ist das
// Springen.

import { chromium } from 'playwright';

const URL_APP = process.env.URL_APP ?? 'http://localhost:4173';
const DROSSEL = Number(process.env.DROSSEL ?? 4);
const SEKUNDEN = Number(process.env.SEKUNDEN ?? 15);
const GERAET = { width: 390, height: 844 };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: GERAET, deviceScaleFactor: 2, locale: 'de' });
await ctx.addInitScript(() => {
  window.__bilder = [];
  const mess = (t) => { window.__bilder.push(t); requestAnimationFrame(mess); };
  requestAnimationFrame(mess);
});
const seite = await ctx.newPage();
await seite.goto(URL_APP);
await seite.waitForTimeout(800);
// Im Menue: erst „Spielen“, dann „Endlos“.
await seite.locator('main > button').nth(1).click();
await seite.waitForTimeout(800);

const cdp = await ctx.newCDPSession(seite);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: DROSSEL });

/** Wo der Ballon ist: die roten Pixel im Canvas (wie in store-bilder.mjs). */
const ballon = () => seite.evaluate(() => {
  const c = document.querySelector('canvas');
  const { data, width, height } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
  let sx = 0, n = 0;
  for (let y = 0; y < height; y += 6) {
    for (let x = 0; x < width; x += 6) {
      const i = (y * width + x) * 4;
      if (data[i] > 200 && data[i + 1] < 110 && data[i + 2] < 110) { sx += x; n++; }
    }
  }
  if (!n) return null;
  const r = c.getBoundingClientRect();
  return r.left + (sx / n) * r.width / width;
});

await seite.evaluate(() => { window.__bilder.length = 0; });
let x = GERAET.width / 2;
await seite.mouse.move(x, GERAET.height - 40);
await seite.mouse.down();
const ende = Date.now() + SEKUNDEN * 1000;
let neustarts = 0;
while (Date.now() < ende) {
  // Geplatzt? Neu starten und weiter messen — gemessen wird das Spielen.
  if (await seite.locator('h2').count()) {
    await seite.mouse.up();
    await seite.getByRole('button').nth(1).click().catch(() => {});
    neustarts++;
    await seite.waitForTimeout(300);
    await seite.mouse.down();
  }
  // ⚠ Den Ballon nur selten suchen: getImageData liest das Canvas zurueck und
  // bremst selbst — bei jedem Bild gemessen, misst man vor allem sich selbst.
  x = (await ballon()) ?? x;
  for (let k = 0; k < 6; k++) {
    await seite.mouse.move(x + Math.sin(Date.now() / 300) * 6, GERAET.height - 40);
    await seite.waitForTimeout(100);
  }
}
await seite.mouse.up();

const t = await seite.evaluate(() => window.__bilder);
const d = t.slice(1).map((v, i) => v - t[i]).sort((a, b) => a - b);
const q = (p) => d[Math.min(d.length - 1, Math.floor(d.length * p))];
console.log(`Drossel ${DROSSEL}×, ${SEKUNDEN} s, ${d.length} Bilder, ${neustarts} Neustarts`);
const mittel = d.reduce((a, b) => a + b, 0) / d.length;
console.log(`  Mittel ${mittel.toFixed(1)} ms · Median ${q(0.5).toFixed(1)} ms · 95 % ${q(0.95).toFixed(1)} ms · Max ${d[d.length - 1].toFixed(1)} ms`);
console.log(`  ueber 50 ms: ${d.filter((v) => v > 50).length}   ueber 33 ms: ${d.filter((v) => v > 33).length}`);
await browser.close();
