import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.pistingyawa.lottery',
  appName: 'Pisting Yawa Lottery',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    cleartext: true,  // Allow HTTP requests
    allowNavigation: [
      'lottery-backend-l1k7.onrender.com',
      'lottery-system-gamma.vercel.app'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0ea5e9',
      androidSplashResourceName: 'splash',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0ea5e9'
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark
    }
  }
};

export default config;
