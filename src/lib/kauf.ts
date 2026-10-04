// „Werbung entfernen“ ueber RevenueCat (Version 1.1, 04.10.2026). Vorlage:
// almaz6380/anigosha src/lib/purchases.ts, ohne Konto und ohne Diagnose-Tabelle.
//
// LoonPop hat kein Konto. RevenueCat vergibt eine anonyme Kennung, und der Kauf
// haengt am Store-Konto des Handys: Nach einer Neuinstallation holt
// „Kaeufe wiederherstellen“ ihn zurueck (Apple verlangt den Knopf, 3.1.1).
//
// Ohne Schluessel im Build (VITE_REVENUECAT_*_KEY) bleibt alles stumm: kein
// Knopf, kein Absturz. Im Browser gibt es keinen Store, also auch keinen Kauf.

import { Capacitor } from '@capacitor/core';

import { setzeWerbefrei } from './werbung.ts';

/** Name des Anspruchs in RevenueCat. */
export const WERBEFREI = 'no_ads';
/** Kennung des Produkts in beiden Stores (einmaliger Kauf). */
export const PRODUKT_ID = 'loonpop_no_ads';

const IOS_KEY = (import.meta.env.VITE_REVENUECAT_IOS_KEY as string | undefined) ?? '';
const ANDROID_KEY = (import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string | undefined) ?? '';

export type KaufGrund = 'abgebrochen' | 'kein_angebot' | 'fehler';
export type KaufErgebnis = { ok: true; werbefrei: boolean } | { ok: false; grund: KaufGrund };

function schluessel(): string {
  const p = Capacitor.getPlatform();
  return p === 'ios' ? IOS_KEY : p === 'android' ? ANDROID_KEY : '';
}

export function kaufMoeglich(): boolean {
  return Capacitor.isNativePlatform() && Boolean(schluessel());
}

type PurchasesPlugin = typeof import('@revenuecat/purchases-capacitor')['Purchases'];
/**
 * ⚠ `Purchases` ist ein Capacitor-Proxy: Auch `.then` wird zum Plugin-Aufruf,
 * der nie antwortet. Aus einer async-Funktion zurueckgegeben oder `await`et,
 * haengt die Promise fuer immer. Genau das war bei Anigosha „Kauf haengt auf
 * iOS“ (Build 1–10). Deshalb nur in dieser Huelle.
 */
type Zugang = { Purchases: PurchasesPlugin };
let initLauf: Promise<Zugang> | null = null;

function bereitmachen(): Promise<Zugang> | null {
  if (!kaufMoeglich()) return null;
  initLauf ??= (async () => {
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
    await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
    await Purchases.configure({ apiKey: schluessel() });
    return { Purchases };
  })().catch((e) => {
    initLauf = null; // naechster Versuch darf es neu probieren
    throw e;
  });
  return initLauf;
}

type MitAnspruch = { customerInfo?: { entitlements?: { active?: Record<string, unknown> } } };
const hatAnspruch = (i: MitAnspruch) => Boolean(i?.customerInfo?.entitlements?.active?.[WERBEFREI]);

/** Beim Start: Ist dieses Handy schon werbefrei? Wirft nie. */
export async function werbefreiPruefen(): Promise<boolean> {
  try {
    const z = await bereitmachen();
    if (!z) return false;
    const frei = hatAnspruch(await z.Purchases.getCustomerInfo());
    setzeWerbefrei(frei);
    return frei;
  } catch {
    return false;
  }
}

/** Preis in der Waehrung des Spielers fuer die Beschriftung, z. B. „2,99 €“. */
export async function preisHolen(): Promise<string | null> {
  try {
    const z = await bereitmachen();
    if (!z) return null;
    const angebote = await z.Purchases.getOfferings();
    return angebote.current?.availablePackages?.[0]?.product?.priceString ?? null;
  } catch {
    return null;
  }
}

export async function werbungEntfernen(): Promise<KaufErgebnis> {
  try {
    const z = await bereitmachen();
    if (!z) return { ok: false, grund: 'fehler' };
    const angebote = await z.Purchases.getOfferings();
    const paket = angebote.current?.availablePackages?.[0];
    if (!paket) return { ok: false, grund: 'kein_angebot' };
    const frei = hatAnspruch(await z.Purchases.purchasePackage({ aPackage: paket }));
    setzeWerbefrei(frei);
    return { ok: true, werbefrei: frei };
  } catch (e) {
    const f = e as { userCancelled?: boolean; code?: string };
    // StoreKit meldet manche echten Fehler ebenfalls als Code 1 (Anigosha).
    if (f?.userCancelled || f?.code === '1') return { ok: false, grund: 'abgebrochen' };
    return { ok: false, grund: 'fehler' };
  }
}

export async function kaeufeWiederherstellen(): Promise<KaufErgebnis> {
  try {
    const z = await bereitmachen();
    if (!z) return { ok: false, grund: 'fehler' };
    const frei = hatAnspruch(await z.Purchases.restorePurchases());
    setzeWerbefrei(frei);
    return { ok: true, werbefrei: frei };
  } catch {
    return { ok: false, grund: 'fehler' };
  }
}
