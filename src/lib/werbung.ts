// Werbung ueber AdMob (Version 1.1, 04.10.2026). Vorlage: almaz6380/anigosha
// src/lib/ads.ts, dort seit August 2026 im Store erprobt.
//
// Drei Formate, alle nie im laufenden Spiel:
//   • Banner unten im MENUE. Im Spielfeld laege er unter dem Finger, der das
//     Geblaese schiebt.
//   • Vollbild-Anzeige nach jedem dritten Platzen, beim Tippen auf
//     „Nochmal“/„Level“ (Regel in werbetakt.ts).
//   • Freiwilliges Video „Weiterfliegen“ im Ende-Fenster nach dem Platzen
//     (22.11.2026, siehe src/spiel/weiterfliegen.ts). Bleibt auch nach dem Kauf
//     „Werbung entfernen“, weil es nur auf Wunsch laeuft.
//
// ⚠ Seit 22.11.2026 steht MIT_TESTANZEIGEN auf false: Es laufen die ECHTEN
// Anzeigen. Die eigenen Live-Anzeigen niemals ansehen oder anklicken: Google
// wertet das als Betrug und sperrt im Zweifel das ganze Konto
// (pub-8860791993288062). Daran haengen auch Anigosha, MyPeak und WELLbooked.
// Zum Ausprobieren auf dem eigenen Geraet MIT_TESTANZEIGEN voruebergehend auf
// true setzen (die Release-Workflows brechen dann ab).
//
// ⚠ iOS: Die Tracking-Abfrage (ATT) kommt NATIV aus dem AppDelegate, nie ueber
// das Plugin. Anigosha wurde am 12.08.2026 deswegen abgelehnt (Richtlinie 2.1):
// Der Plugin-Aufruf laeuft im Hintergrund, und iOS zeigt dort nichts. Hier
// wird nur auf die Antwort gewartet, weil Google sie VOR dem SDK-Start will.
//
// Im Browser (Testversion) passiert nichts: Das Plugin wird gar nicht geladen.

import { Capacitor } from '@capacitor/core';

import { geplatzt, neuerTakt, videoGesehen, weiter, type Takt } from './werbetakt.ts';

const MIT_TESTANZEIGEN = false;

// Offizielle Test-Anzeigenbloecke von Google (oeffentlich dokumentiert).
const TEST = {
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    vollbild: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    vollbild: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
};

// Die echten LoonPop-Bloecke traegt Josef nach dem Anlegen in AdMob ein
// (docs/store.md, „Werbung einrichten“).
//
// ⚠ `rewarded` (Weiterfliegen) ist noch leer: Josef legt die beiden Bloecke
// „Belohnt“ in AdMob an. Solange die ID fehlt, zeigt das Ende-Fenster den
// Knopf einfach nicht (weiterfliegenMoeglich).
const LIVE = {
  // iOS-App ca-app-pub-8860791993288062~7035556835 (angelegt 04.10.2026)
  ios: {
    banner: 'ca-app-pub-8860791993288062/2004833844',
    vollbild: 'ca-app-pub-8860791993288062/7863665182',
    rewarded: '',
  },
  // Android-App ca-app-pub-8860791993288062~5237501849 (angelegt 04.10.2026)
  android: {
    banner: 'ca-app-pub-8860791993288062/3122474399',
    vollbild: 'ca-app-pub-8860791993288062/8157066812',
    // Belohnt „Weiterfliegen“, angelegt 23.11.2026.
    rewarded: 'ca-app-pub-8860791993288062/3111035912',
  },
};

const nativ = Capacitor.isNativePlatform();

function bloecke() {
  const p = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  return (MIT_TESTANZEIGEN ? TEST : LIVE)[p];
}

type AdMobPlugin = typeof import('@capacitor-community/admob')['AdMob'];
/**
 * ⚠ Das Plugin nur in dieser Huelle weiterreichen, nie aus einer async-Funktion
 * zurueckgeben oder direkt `await`en. Capacitor-Plugins sind Proxys, deren
 * `.then` nie aufloest (Anigosha, „Kauf haengt“, Build 1–10).
 */
let zugang: { AdMob: AdMobPlugin } | null = null;
let bereit = false;
let werbefrei = false;
let initLauf: Promise<void> | null = null;
let datenschutzOptionen: string | null = null;
let takt: Takt = neuerTakt();

/** Soll der Banner gerade stehen? (Menue sichtbar, nicht werbefrei) */
let bannerGewuenscht = false;
let bannerSteht = false;
let bannerHoehe = 0;
const hoehenHoerer = new Set<(px: number) => void>();

export function setzeWerbefrei(frei: boolean) {
  werbefrei = frei;
  if (frei) void bannerWeg();
}

async function warteAufTrackingAntwort(AdMob: AdMobPlugin) {
  if (Capacitor.getPlatform() !== 'ios') return;
  // Hoechstens ~6 s: Eine haengende Abfrage darf die Werbung nicht blockieren.
  for (let i = 0; i < 20; i += 1) {
    try {
      const { status } = await AdMob.trackingAuthorizationStatus();
      if (status !== 'notDetermined') return;
    } catch {
      return;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

export function starteWerbung(): Promise<void> {
  if (!nativ) return Promise.resolve();
  initLauf ??= (async () => {
    try {
      const { AdMob, BannerAdPluginEvents } = await import('@capacitor-community/admob');
      zugang = { AdMob };
      await warteAufTrackingAntwort(AdMob);
      await AdMob.initialize({ initializeForTesting: MIT_TESTANZEIGEN });
      // DSGVO-Einwilligung (UMP). ⚠ Der Dialog erscheint nur, wenn in AdMob
      // unter „Datenschutz & Mitteilungen“ eine Nachricht VEROEFFENTLICHT ist.
      try {
        const info = await AdMob.requestConsentInfo();
        datenschutzOptionen = info.privacyOptionsRequirementStatus ?? null;
        if (info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob.showConsentForm();
      } catch (e) {
        console.warn('Einwilligung fehlgeschlagen:', e);
      }
      await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (g) => {
        bannerHoehe = g.height;
        hoehenHoerer.forEach((f) => f(bannerHoehe));
      });
      bereit = true;
      if (bannerGewuenscht) await bannerHin();
    } catch (e) {
      console.warn('AdMob-Start fehlgeschlagen:', e);
    }
  })();
  return initLauf;
}

async function bannerHin() {
  if (!bereit || !zugang || werbefrei || bannerSteht) return;
  const { BannerAdPosition, BannerAdSize } = await import('@capacitor-community/admob');
  try {
    await zugang.AdMob.showBanner({
      adId: bloecke().banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    });
    bannerSteht = true;
  } catch (e) {
    console.warn('Banner fehlgeschlagen:', e);
  }
}

async function bannerWeg() {
  if (!zugang || !bannerSteht) return;
  bannerSteht = false;
  bannerHoehe = 0;
  hoehenHoerer.forEach((f) => f(0));
  try {
    await zugang.AdMob.removeBanner();
  } catch {
    /* schon weg */
  }
}

/** Das Menue ist zu sehen (true) oder nicht mehr (false). */
export function menueSichtbar(sichtbar: boolean) {
  bannerGewuenscht = sichtbar;
  void (sichtbar ? bannerHin() : bannerWeg());
}

/** Wie hoch der Banner gerade ist (px), damit das Menue nichts darunter versteckt. */
export function aufBannerHoehe(f: (px: number) => void): () => void {
  hoehenHoerer.add(f);
  f(bannerHoehe);
  return () => { hoehenHoerer.delete(f); };
}

/** Der Ballon ist geplatzt. */
export function platzerGezaehlt() {
  takt = geplatzt(takt, Date.now());
}

/**
 * Der Spieler tippt im Ende-Fenster weiter. Zeigt bei Bedarf eine Vollbild-
 * Anzeige und gibt SOFORT zurueck, ob eine kommt (die Anzeige selbst laeuft
 * im Hintergrund). Die Bewertungsbitte richtet sich danach (bewertung.ts).
 */
export function vielleichtVollbild(): boolean {
  const r = weiter(takt, Date.now(), werbefrei || !bereit);
  takt = r.takt;
  if (!r.zeigen || !zugang) return false;
  const { AdMob } = zugang;
  void (async () => {
    try {
      await AdMob.prepareInterstitial({ adId: bloecke().vollbild });
      await AdMob.showInterstitial();
    } catch (e) {
      console.warn('Vollbild-Anzeige fehlgeschlagen:', e);
    }
  })();
  return true;
}

// --- Video „Weiterfliegen“ ----------------------------------------------------

export type VideoErgebnis = 'earned' | 'aborted' | 'unavailable';

/** Notbremse, falls das Video haengt oder offen bleibt. */
const VIDEO_NOTBREMSE_MS = 180_000;
/** Belohnung ist sicher, „Dismissed“ kommt aber nicht: nicht ewig warten. */
const NACH_BELOHNUNG_MS = 15_000;
/** Kurze Nachfrist nach dem Schliessen fuer ein spaetes „Rewarded“. */
const NACH_SCHLIESSEN_MS = 400;

let videoLaeuft = false;

/**
 * Gibt es das Video ueberhaupt? Nur in der App, und nur mit einer
 * Anzeigen-ID. ⚠ Mit „Werbung entfernen“ bleibt es verfuegbar: Es laeuft nur,
 * wenn der Spieler es will.
 */
export function weiterfliegenMoeglich(): boolean {
  return nativ && bloecke().rewarded !== '';
}

/**
 * Zeigt das Video und wartet, bis es vorbei ist.
 *
 * ⚠ `showRewardVideoAd()` loest im Plugin NUR auf, wenn die Belohnung verdient
 * ist (iOS `userDidEarnRewardHandler`, Android `onUserEarnedReward`). Bricht
 * der Spieler ab, kommt nie eine Antwort — ein blankes `await` haengt fuer
 * immer (Mahjong Royale, 31.07.2026). Deshalb hoeren wir zusaetzlich auf
 * Showed/Dismissed/FailedToShow und begrenzen hart auf Zeit. Eine zweite
 * gleichzeitige Anfrage (Doppeltipp) wird verworfen.
 */
export async function zeigeBelohnungsvideo(): Promise<VideoErgebnis> {
  if (!weiterfliegenMoeglich()) return 'unavailable';
  if (videoLaeuft) return 'unavailable';
  videoLaeuft = true;
  const griffe: Array<{ remove: () => Promise<void> }> = [];
  let verdient = false;
  let gezeigt = false;
  let fertig!: () => void;
  const vorbei = new Promise<void>((r) => { fertig = r; });
  let uhr = setTimeout(() => fertig(), VIDEO_NOTBREMSE_MS);
  const neuStellen = (ms: number) => { clearTimeout(uhr); uhr = setTimeout(() => fertig(), ms); };

  try {
    await starteWerbung();
    if (!bereit || !zugang) return 'unavailable';
    const { AdMob } = zugang;
    const { RewardAdPluginEvents } = await import('@capacitor-community/admob');
    griffe.push(await AdMob.addListener(RewardAdPluginEvents.Showed, () => { gezeigt = true; }));
    griffe.push(await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      verdient = true;
      neuStellen(NACH_BELOHNUNG_MS);
    }));
    griffe.push(await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => neuStellen(NACH_SCHLIESSEN_MS)));
    griffe.push(await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => fertig()));

    try {
      await AdMob.prepareRewardVideoAd({ adId: bloecke().rewarded });
    } catch (e) {
      console.warn('Video konnte nicht geladen werden:', e);
      return 'unavailable';
    }
    // Bewusst ohne await (siehe oben): Die Promise kann ewig offen bleiben.
    AdMob.showRewardVideoAd()
      .then(() => { verdient = true; neuStellen(NACH_BELOHNUNG_MS); })
      .catch((e: unknown) => { console.warn('Video fehlgeschlagen:', e); fertig(); });

    await vorbei;
    if (verdient) takt = videoGesehen(takt, Date.now());
    return verdient ? 'earned' : gezeigt ? 'aborted' : 'unavailable';
  } catch (e) {
    console.warn('Video fehlgeschlagen:', e);
    return 'unavailable';
  } finally {
    videoLaeuft = false;
    clearTimeout(uhr);
    for (const g of griffe) {
      try { await g.remove(); } catch { /* schon weg */ }
    }
  }
}

/** Gibt es fuer dieses Land ein Formular, um die Einwilligung zu aendern (EWR, UK)? */
export async function einwilligungAenderbar(): Promise<boolean> {
  if (initLauf) await initLauf;
  return bereit && datenschutzOptionen === 'REQUIRED';
}

export async function einwilligungAendern() {
  if (!zugang) return;
  try {
    await zugang.AdMob.showPrivacyOptionsForm();
  } catch (e) {
    console.warn('Datenschutz-Optionen fehlgeschlagen:', e);
  }
}
