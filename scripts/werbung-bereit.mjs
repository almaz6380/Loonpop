#!/usr/bin/env node
// Prueft vor einem Store-Upload, ob Werbung und Kauf scharf geschaltet sind
// (Version 1.1, 04.10.2026).
//
//   node scripts/werbung-bereit.mjs android|ios
//
// ⚠ Ein Build mit Googles Test-IDs im Store zeigt allen Spielern Testanzeigen
// und verdient nichts. Ohne RevenueCat-Schluessel fehlt der Knopf
// „Werbung entfernen“, obwohl die Store-Texte ihn versprechen. Beides faellt
// erst auf, wenn die Version schon live ist, deshalb bricht der Workflow ab.
import { readFileSync } from 'node:fs';

const plattform = process.argv[2];
if (!['android', 'ios'].includes(plattform)) {
  console.error('Aufruf: node scripts/werbung-bereit.mjs android|ios');
  process.exit(2);
}

const TEST_KONTO = 'ca-app-pub-3940256099942544';
const fehler = [];
const werbung = readFileSync('src/lib/werbung.ts', 'utf8');

if (/const MIT_TESTANZEIGEN = true/.test(werbung)) {
  fehler.push('src/lib/werbung.ts: MIT_TESTANZEIGEN steht noch auf true');
}
const live = werbung.match(/const LIVE = \{[\s\S]*?\n\};/)?.[0] ?? '';
const block = live.match(new RegExp(`${plattform}: \\{([^}]*)\\}`))?.[1] ?? '';
for (const art of ['banner', 'vollbild']) {
  const id = block.match(new RegExp(`${art}: '([^']*)'`))?.[1] ?? '';
  if (!/^ca-app-pub-\d+\/\d+$/.test(id)) fehler.push(`src/lib/werbung.ts: LIVE.${plattform}.${art} fehlt`);
}

const nativ = plattform === 'android'
  ? readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8')
  : readFileSync('ios/App/App/Info.plist', 'utf8');
if (nativ.includes(TEST_KONTO)) {
  fehler.push(plattform === 'android'
    ? 'AndroidManifest.xml: AdMob-App-ID ist noch Googles Test-ID'
    : 'Info.plist: GADApplicationIdentifier ist noch Googles Test-ID');
}

const schluessel = process.env[plattform === 'android' ? 'VITE_REVENUECAT_ANDROID_KEY' : 'VITE_REVENUECAT_IOS_KEY'] ?? '';
const praefix = plattform === 'android' ? 'goog_' : 'appl_';
if (!schluessel.startsWith(praefix)) {
  fehler.push(`RevenueCat-Schluessel fuer ${plattform} fehlt oder beginnt nicht mit ${praefix} ` +
    `(Secret REVENUECAT_${plattform.toUpperCase()}_KEY)`);
}

if (fehler.length) {
  console.error('Werbung/Kauf nicht bereit fuer den Store:\n  - ' + fehler.join('\n  - '));
  process.exit(1);
}
console.log(`Werbung und Kauf fuer ${plattform} bereit.`);
