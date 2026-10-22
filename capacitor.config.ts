
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eacharya.app',
  appName: 'eAcharya',
  webDir: 'out',
  server: {
    url: 'https://eacharya.netlify.app',
    cleartext: false,
  },
};

export default config;
