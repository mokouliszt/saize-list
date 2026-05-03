import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.saizelist',
  appName: 'サイゼリスト',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#1B8B3B',   // サイゼリヤグリーン
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
