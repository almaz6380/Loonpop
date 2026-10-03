import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Reverse-Domain nach Betreiber Josef Gallab (Konvention wie at.gallab.animequiz)
  appId: 'at.gallab.loonpop',
  appName: 'loonpop',
  webDir: 'dist',
  // Der Himmel oben im Menue — sonst blitzt beim Start kurz Weiss auf.
  backgroundColor: '#152364',
};

export default config;
