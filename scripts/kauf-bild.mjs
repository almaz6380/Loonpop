#!/usr/bin/env node
// Pruefungsbild fuer den Kauf „Werbung entfernen“ (04.10.2026).
//
// Apple verlangt zu jedem In-App-Kauf einen Screenshot, der zeigt, wo man ihn
// in der App findet. Die Kauf-Karte gibt es nur in der nativen App; mit
// `?kaufvorschau` zeigt der Browser sie mit festem Preis (src/lib/kauf.ts).
//
//   npm run build && npx vite preview --port 4173 &
//   node scripts/kauf-bild.mjs   → store-assets/ios/kauf-pruefung.png (1320×2868)
import { chromium } from 'playwright';

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, locale: 'de-DE' });
await seite.addInitScript(() => localStorage.setItem('sprache', 'de'));
await seite.goto('http://localhost:4173/?kaufvorschau');
await seite.waitForLoadState('networkidle');
const knopf = seite.getByText('Werbung entfernen').first();
await knopf.scrollIntoViewIfNeeded();
await seite.evaluate(() => window.scrollBy(0, 200));
await seite.waitForTimeout(500);
await seite.screenshot({ path: 'store-assets/ios/kauf-pruefung.png' });
await browser.close();
console.log('store-assets/ios/kauf-pruefung.png');
