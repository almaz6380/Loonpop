// Werbung ueber AdMob (Version 1.1, 04.10.2026). Vorlage: almaz6380/anigosha
// src/lib/ads.ts, dort seit August 2026 im Store erprobt.
//
// Zwei Formate, beide nie im laufenden Spiel:
//   • Banner unten im MENUE. Im Spielfeld laege er unter dem Finger, der das
//     Geblaese schiebt.
//   • Vollbild-Anzeige nach jedem dritten Platzen, beim Tippen auf
//     „Nochmal“/„Level“ (Regel in werbetakt.ts).
//
// ⚠ Solange MIT_TESTANZEIGEN = true, laufen nur Googles Testanzeigen. Die
// eigenen Live-Anzeigen niemals ansehen oder anklicken: Google wertet das als
// Betrug und sperrt im Zweifel das ganze Konto (pub-8860791993288062). Daran
// haengen auch Anigosha, MyPeak und WELLbooked. Die Release-Workflows brechen
// ab, solange hier `true` steht oder eine Live-ID fehlt.
//
// ⚠ iOS: Die Tracking-Abfrage (ATT) kommt NATIV aus dem AppDelegate, nie ueber
// das Plugin. Anigosha wurde am 12.08.2026 deswegen abgelehnt (Richtlinie 2.1):
// Der Plugin-Aufruf laeuft im Hintergrund, und iOS zeigt dort nichts. Hier
// wird nur auf die Antwort gewartet, weil Google sie VOR dem SDK-Start will.
//
// Im Browser (Testversion) passiert nichts: Das Plugin wird gar nicht geladen.

import { Capacitor } from '@capacitor/core';

import { geplatzt, neuerTakt, weiter, type Takt } from './werbetakt.ts';

const MIT_TESTANZEIGEN = true;

// Offizielle Test-Anzeigenbloecke von Google (oeffentlich dokumentiert).
const TEST = {
  ios: { banner: 'ca-app-pub-3940256099942544/2934735716', vollbild: 'ca-app-pub-3940256099942544/4411468910' },
  android: { banner: 'ca-app-pub-3940256099942544/6300978111', vollbild: 'ca-app-pub-3940256099942544/1033173712' },
};

// Die echten LoonPop-Bloecke traegt Josef nach dem Anlegen in AdMob ein
// (docs/store.md, „Werbung einrichten“).
const LIVE = {
  ios: { banner: '', vollbild: '' },
  android: { banner: '', vollbild: '' },
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

/** Der Spieler tippt im Ende-Fenster weiter. Zeigt bei Bedarf eine Vollbild-Anzeige. */
export async function vielleichtVollbild() {
  const r = weiter(takt, Date.now(), werbefrei || !bereit);
  takt = r.takt;
  if (!r.zeigen || !zugang) return;
  try {
    await zugang.AdMob.prepareInterstitial({ adId: bloecke().vollbild });
    await zugang.AdMob.showInterstitial();
  } catch (e) {
    console.warn('Vollbild-Anzeige fehlgeschlagen:', e);
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
