import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.framers.openstrand',
  appName: 'OpenStrand',
  webDir: 'out',

  // iOS Configuration
  ios: {
    preferredContentMode: 'mobile',
    backgroundColor: '#ffffff',
    limitsNavigationsToAppBoundDomains: false
  },

  // Android Configuration
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },

  // Plugin configurations
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_openstrand',
      iconColor: '#488AFF',
      sound: 'beep.wav',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },

  // Server configuration for development
  server: {
    // Use Next.js dev server in development
    url: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined,
    cleartext: true,
    allowNavigation: ['*']
  }
};

export default config;
