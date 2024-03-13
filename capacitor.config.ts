import { CapacitorConfig } from '@capacitor/cli';
import { version } from './package.json'

const config: CapacitorConfig = {
  appName: 'Remote.It',
  webDir: 'frontend/build',
  backgroundColor: '#034b9d',
  ios: {
    scheme: 'Remote.It',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#034b9d',
      androidScaleType: 'CENTER_CROP',
    },
  },
  appendUserAgent: ` remoteit/${version}`,
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
