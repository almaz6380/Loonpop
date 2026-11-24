/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** RevenueCat, oeffentlicher SDK-Schluessel (appl_…), kommt in der CI aus den Secrets. */
  readonly VITE_REVENUECAT_IOS_KEY?: string;
  /** RevenueCat, oeffentlicher SDK-Schluessel (goog_…). */
  readonly VITE_REVENUECAT_ANDROID_KEY?: string;
}
