import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appName: 'Remote.It',
  webDir: 'frontend/build',
  backgroundColor: '#0096e7',
  ios: {
    scheme: 'Remote.It',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0096e7',
      androidScaleType: 'CENTER_CROP',
    },
  },
}

console.log('\nNode Environment:', process.env.NODE_ENV)

if (process.env.CAPACITOR_DESKTOP_LIVE_RELOAD && process.env.NODE_ENV === 'development') {
  console.log('Using live reload server:', process.env.CAPACITOR_DESKTOP_LIVE_RELOAD, '\n')
  config.server = {
    androidScheme: 'https',
    url: process.env.CAPACITOR_DESKTOP_LIVE_RELOAD,
    cleartext: true,
  }
}

export default config;
