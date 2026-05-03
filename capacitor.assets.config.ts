// capacitor.assets.config.ts
// @capacitor/assets によるアイコン・スプラッシュ自動生成の設定

import type { AssetsConfig } from '@capacitor/assets';

const config: AssetsConfig = {
  // --- アプリアイコン ---
  // resources/icon.png (1024x1024) をベースに全サイズを自動生成
  iconBackgroundColor: '#1B8B3B',          // アダプティブアイコン背景色（緑）
  iconBackgroundColorDark: '#1B8B3B',
  splashBackgroundColor: '#1B8B3B',        // スプラッシュ背景色
  splashBackgroundColorDark: '#1B8B3B',

  assets: {
    // Androidアダプティブアイコン
    android: {
      icon: {
        source: 'resources/icon.png',
        foregroundSource: 'resources/icon-foreground.png',
      },
      splash: {
        source: 'resources/splash.png',
      },
    },
    // iOS
    ios: {
      icon: {
        source: 'resources/icon.png',
      },
      splash: {
        source: 'resources/splash.png',
      },
    },
  },
};

export default config;
