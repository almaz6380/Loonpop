// Gibt die Einzelnadeln eines Feldes als JSON aus — zum Einfuegen in ein Level.
//
//   npm run nadelfeld -- reihe  <y> <vonX> <bisX>
//   npm run nadelfeld -- spalte <x> <vonY> <bisY>
//
// Die Regeln (Abstand, Laenge) stehen in src/spiel/nadelfeld.ts.

import { reihe, spalte } from '../src/spiel/nadelfeld.ts';

const [art, a, b, c] = process.argv.slice(2);
const zahlen = [a, b, c].map(Number);
if ((art !== 'reihe' && art !== 'spalte') || zahlen.some((z) => !Number.isFinite(z))) {
  console.error('Aufruf: npm run nadelfeld -- reihe <y> <vonX> <bisX> | spalte <x> <vonY> <bisY>');
  process.exit(1);
}
const nadeln = art === 'reihe' ? reihe(zahlen[0], zahlen[1], zahlen[2]) : spalte(zahlen[0], zahlen[1], zahlen[2]);
console.log(nadeln.map((n) => '    ' + JSON.stringify(n)).join(',\n'));
