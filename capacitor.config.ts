import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.remoteit.mobile.ios',
  appName: 'Remote.It',
  webDir: 'frontend/build',
  ios: {
    scheme: 'Remote.It',
  },
  server: {
    androidScheme: 'https',
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
