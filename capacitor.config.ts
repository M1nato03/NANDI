import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.nandi.personal',
  appName: 'NANDI',
  webDir: 'dist',
  // NEVER CHANGE: IndexedDB is tied to this origin.
  server: { androidScheme: 'https', hostname: 'nandi.local' },
};

export default config;
