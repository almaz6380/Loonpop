// Store-Screenshots und Vorstellungsgrafik aus der laufenden App (02.10.2026).
//
//   npm run build && npx vite preview --port 4173 &
//   node scripts/store-bilder.mjs                 alle 13 Sprachen
//   SPRACHEN=de,en node scripts/store-bilder.mjs  nur diese
//
// Ergebnis:
//   store-assets/play/<code>/1-menue.jpg …   1080×2160 (Google Play, ≤ 2:1)
//   store-assets/ios/<code>/1-menue.jpg …    1320×2868 (iPhone 6,9", deckt die kleineren ab)
//   store-assets/play/feature.png            1024×500  (Vorstellungsgrafik)
//
// Fotografiert wird das ECHTE Spiel: echte Level, echte Physik, der Finger
// drueckt wirklich. Nur der Fortschritt ist gesetzt (acht Level geschafft,
// 137 m Bestweite), damit das Menue nicht leer wirkt.
// ⚠ Wolken ziehen, und der Endlos-Seed kommt aus der Uhr: Zwei Laeufe ergeben
// nie exakt dieselben Bilder. Das ist hier egal, solange jedes Bild stimmt.
// ⚠ Nur iPhone-Bilder: Die App ist auf iPhone beschraenkt
// (TARGETED_DEVICE_FAMILY = 1), sonst verlangte Apple auch iPad-Bilder.

import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const URL_APP = process.env.URL_APP ?? 'http://localhost:4173';
const ALLE = ['de', 'en', 'es', 'fr', 'it', 'pt', 'tr', 'pl', 'ru', 'ja', 'ko', 'zh', 'ar'];
const SPRACHEN = process.env.SPRACHEN ? process.env.SPRACHEN.split(',') : ALLE;

// Bildschirm des fotografierten Geraets (CSS-Pixel) und Zielformat.
const FORMATE = {
  play: { breite: 1080, hoehe: 2160, geraet: { width: 360, height: 640 } },
  ios: { breite: 1320, hoehe: 2868, geraet: { width: 402, height: 744 } },
};

// ⚠ 30.10.2026 (Apple 4.3(a)): Die ersten beiden Bilder nennen, was es so nur
// hier gibt. „Fünfzehn Level“ und „durch die Nadeln“ sagen viele Spiele.
const UEBERSCHRIFT = {
  de: ['Ein Gebläse, das nur nach oben bläst', 'Lenke mit dem Rand des Luftstrahls', 'Wie hoch kommst du?', 'Nadelreihen, die wandern'],
  en: ['A blower that only blows straight up', 'Steer with the edge of the air stream', 'How high can you go?', 'Rows of needles on the move'],
  es: ['Un soplador que solo sopla hacia arriba', 'Dirige con el borde del chorro de aire', '¿Hasta dónde llegarás?', 'Filas de agujas en movimiento'],
  fr: ['Un souffleur qui ne souffle que vers le haut', 'Dirige avec le bord du jet d’air', 'Jusqu’où monteras-tu ?', 'Des rangées d’aiguilles qui bougent'],
  it: ['Un soffiatore che soffia solo verso l’alto', 'Guida con il bordo del getto d’aria', 'Fin dove arriverai?', 'File di aghi in movimento'],
  pt: ['Um soprador que só sopra para cima', 'Guie com a borda do jato de ar', 'Até onde você consegue subir?', 'Fileiras de agulhas em movimento'],
  tr: ['Sadece yukarı üfleyen bir üfleyici', 'Hava akımının kenarıyla yön ver', 'Ne kadar yükseğe çıkabilirsin?', 'Hareket eden iğne sıraları'],
  pl: ['Dmuchawa, która dmucha tylko w górę', 'Steruj krawędzią strumienia powietrza', 'Jak wysoko dolecisz?', 'Ruchome rzędy igieł'],
  ru: ['Воздуходувка дует только вверх', 'Управляй краем воздушной струи', 'Как высоко ты поднимешься?', 'Движущиеся ряды игл'],
  ja: ['真上にしか吹かないブロワー', '風の端で風船を操ろう', 'どこまで高く行ける？', '動く針の列'],
  ko: ['위로만 부는 송풍기', '바람의 가장자리로 조종하세요', '얼마나 높이 갈 수 있을까요?', '움직이는 바늘 줄'],
  zh: ['只能向上吹的吹叶机', '用气流的边缘来引导', '你能飞多高？', '移动的针排'],
  ar: ['منفاخ لا ينفخ إلا إلى الأعلى', 'وجّه بحافة تيار الهواء', 'إلى أي ارتفاع ستصل؟', 'صفوف إبر متحركة'],
};

// ⚠ Die Nummer vorn legt die Reihenfolge im Store fest, und play-upload.py
// nimmt nur Dateien der Form 1-name.jpg (Nummer, Trenner, Name).
const NAMEN = ['menue', 'level', 'endlos', 'reihen'];

const FORTSCHRITT = {
  v: 1,
  bestzeit: { 1: 6.2, 2: 9.8, 3: 11.4, 6: 14.1, 8: 12.7, 10: 13.9, 13: 10.3, 14: 8.8, 15: 12.1, 16: 19.4, 17: 30.2, 18: 33.5 },
  endlos: { hoch: 137 },
};

/**
 * Wo der Ballon gerade ist, in CSS-Pixeln: die roten Pixel im Canvas.
 * ⚠ Nicht aus den Leveldaten gerechnet — die Sicht haengt am Geraet, und eine
 * eigene Rechnung lag beim ersten Versuch daneben: Das Geblaese stand neben
 * dem Ballon, und er stieg nie.
 */
async function ballonAufSchirm(seite) {
  return seite.evaluate(() => {
    const c = document.querySelector('canvas');
    const ctx = c.getContext('2d');
    const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
    let sx = 0, sy = 0, n = 0;
    for (let y = 0; y < height; y += 3) {
      for (let x = 0; x < width; x += 3) {
        const i = (y * width + x) * 4;
        if (data[i] > 200 && data[i + 1] < 110 && data[i + 2] < 110) { sx += x; sy += y; n++; }
      }
    }
    if (!n) return null;
    const r = c.getBoundingClientRect();
    return { x: r.left + (sx / n) * r.width / width, y: r.top + (sy / n) * r.height / height };
  });
}

/**
 * Finger unter den Ballon und mitfuehren; fotografiert wird im Flug.
 * ⚠ Ist er vor dem Foto geplatzt, wird es verworfen — beim ersten Lauf zeigten
 * vier Endlos-Bilder nur noch Fetzen. Erkannt wird das am Ende-Fenster: Es
 * erscheint genau 800 ms nach dem Platzen (SpielPage). Steht es 750 ms nach
 * dem Foto schon da, war der Ballon beim Foto bereits kaputt.
 */
async function fliegen(seite, geraet, dauer, versatz = 0) {
  let b = await ballonAufSchirm(seite);
  const x = () => (b ? b.x : geraet.width / 2) + versatz;
  await seite.mouse.move(x(), geraet.height - 40);
  await seite.mouse.down();
  for (let t = 0; t < dauer; t += 150) {
    await seite.waitForTimeout(150);
    b = (await ballonAufSchirm(seite)) ?? b;
    await seite.mouse.move(x(), geraet.height - 40);
  }
  const bild = await seite.screenshot({ type: 'png' });
  await seite.waitForTimeout(750);
  const geplatzt = await seite.locator('h2').count() > 0;
  await seite.mouse.up();
  return geplatzt ? null : bild;
}

/** Bis zu fuenf Versuche, jeder etwas kuerzer. */
async function versuche(lauf, dauer) {
  for (let i = 0; i < 5; i++) {
    const bild = await lauf(Math.round(dauer * (1 - i * 0.15)));
    if (bild) return bild;
  }
  throw new Error('Ballon platzt in jedem Versuch');
}

async function imFlug(seite, geraet, menuePos, dauer, versatz = 0) {
  return versuche(async (d) => {
    await seite.goto(URL_APP);
    await seite.waitForTimeout(400);
    // Die Levelkacheln im Raster des Menues (MenuePage). menuePos zaehlt ab 1.
    await seite.locator('section button').nth(menuePos - 1).click();
    await seite.waitForTimeout(700);
    return fliegen(seite, geraet, d, versatz);
  }, dauer);
}

async function endlos(seite, geraet) {
  return versuche(async (d) => {
    await seite.goto(URL_APP);
    await seite.waitForTimeout(400);
    // Im Menue: erst „Spielen“, dann „Endlos“.
    await seite.locator('main > button').nth(1).click();
    await seite.waitForTimeout(700);
    return fliegen(seite, geraet, d);
  }, 1350);
}

/** Ueberschrift auf Himmel, darunter der Bildschirm mit runden Ecken. */
async function rahmen(browser, format, text, png, code) {
  const { breite, hoehe } = format;
  const seite = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  const dir = code === 'ar' ? 'rtl' : 'ltr';
  // Franzoesisch setzt vor ? ! : ; ein Leerzeichen — ungeschuetzt rutscht das
  // Zeichen allein in die naechste Zeile.
  const satz = text.replace(/ ([?!:;])/g, '\u00a0$1');
  await seite.setContent(`<!doctype html><html dir="${dir}"><body style="margin:0">
    <div style="width:${breite}px;height:${hoehe}px;box-sizing:border-box;overflow:hidden;
      background:linear-gradient(#152364,#2f5cb4 55%,#bfe2f2);display:flex;flex-direction:column;
      align-items:center;font-family:'DejaVu Sans','WenQuanYi Zen Hei','IPAGothic',sans-serif">
      <h1 style="color:#fff;font-weight:800;font-size:${Math.round(breite * 0.068)}px;line-height:1.2;
        text-align:center;margin:${Math.round(hoehe * 0.05)}px ${Math.round(breite * 0.08)}px ${Math.round(hoehe * 0.035)}px;
        text-shadow:0 4px 18px rgba(0,0,0,.3)">${satz}</h1>
      <img src="data:image/png;base64,${png.toString('base64')}"
        style="width:${Math.round(breite * 0.8)}px;border-radius:${Math.round(breite * 0.05)}px;
        box-shadow:0 30px 80px rgba(0,0,0,.35);border:${Math.round(breite * 0.012)}px solid rgba(255,255,255,.85)">
    </div></body></html>`);
  await seite.waitForTimeout(150);
  const bild = await seite.screenshot({ type: 'jpeg', quality: 90 });
  await seite.close();
  return bild;
}

async function vorstellung(browser) {
  const seite = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  const b64 = (p) => readFileSync(new URL(`../public/bilder/${p}`, import.meta.url)).toString('base64');
  await seite.setContent(`<!doctype html><body style="margin:0">
    <div style="position:relative;width:1024px;height:500px;overflow:hidden;
      background:linear-gradient(#152364,#2f5cb4 60%,#bfe2f2);font-family:'DejaVu Sans',sans-serif">
      <div style="position:absolute;right:120px;top:-160px;width:520px;height:520px;border-radius:50%;
        background:radial-gradient(circle,rgba(255,240,200,.45),rgba(255,220,150,0) 65%)"></div>
      <img src="data:image/png;base64,${b64('wolke1.png')}" style="position:absolute;left:60px;top:40px;width:200px;opacity:.9">
      <img src="data:image/png;base64,${b64('wolke3.png')}" style="position:absolute;right:40px;top:90px;width:170px;opacity:.85">
      <img src="data:image/png;base64,${b64('huegel-fern.png')}" style="position:absolute;left:0;bottom:30px;width:1024px">
      <img src="data:image/png;base64,${b64('wiese.png')}" style="position:absolute;left:0;bottom:-40px;width:1024px">
      <img src="data:image/png;base64,${b64('ballon.png')}" style="position:absolute;left:760px;top:70px;width:170px;
        filter:drop-shadow(0 14px 24px rgba(0,0,0,.35))">
      <div style="position:absolute;left:70px;top:150px;color:#fff;font-weight:800;font-size:112px;
        letter-spacing:-3px;text-shadow:0 6px 24px rgba(0,0,0,.3)">LoonPop</div>
    </div></body>`);
  await seite.waitForTimeout(200);
  mkdirSync(new URL('../store-assets/play/', import.meta.url), { recursive: true });
  await seite.screenshot({ path: new URL('../store-assets/play/feature.png', import.meta.url).pathname });
  await seite.close();
}

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
await vorstellung(browser);
for (const [name, format] of Object.entries(FORMATE)) {
  for (const code of SPRACHEN) {
    const ctx = await browser.newContext({
      viewport: format.geraet,
      deviceScaleFactor: format.breite * 0.8 / format.geraet.width,
      locale: code, hasTouch: false,
    });
    await ctx.addInitScript(([f, c]) => {
      localStorage.setItem('loonpop.fortschritt', JSON.stringify(f));
      localStorage.setItem('sprache', c);
    }, [FORTSCHRITT, code]);
    const seite = await ctx.newPage();
    await seite.goto(URL_APP);
    await seite.waitForTimeout(800);
    const bilder = [
      await seite.screenshot({ type: 'png' }),
      await imFlug(seite, format.geraet, 8, 1500, 6),     // 9  Zickzack
      await endlos(seite, format.geraet),
      await imFlug(seite, format.geraet, 13, 1500),       // Schiebetür (Index 0 ist der Endlos-Knopf)
    ];
    const ordner = new URL(`../store-assets/${name}/${code}/`, import.meta.url);
    mkdirSync(ordner, { recursive: true });
    for (let i = 0; i < bilder.length; i++) {
      const jpg = await rahmen(browser, format, UEBERSCHRIFT[code][i], bilder[i], code);
      const { writeFileSync } = await import('node:fs');
      writeFileSync(new URL(`${i + 1}-${NAMEN[i]}.jpg`, ordner), jpg);
    }
    await ctx.close();
    console.log(name, code);
  }
}
await browser.close();
