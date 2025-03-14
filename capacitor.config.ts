import { CapacitorConfig } from '@capacitor/cli';
import { version } from './package.json'
import brand from './common/src/brand/config.json'

const config: CapacitorConfig = {
  appName: brand.colors.appName,
  webDir: 'frontend/build',
  backgroundColor: brand.colors.light.primary,
  ios: {
    scheme: brand.appName,
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: brand.colors.light.primary,
      androidScaleType: 'CENTER_CROP',
    },
    BluetoothLe: {
      displayStrings: {
        scanning: 'Scanning...',
        cancel: 'Cancel',
        availableDevices: 'Available devices',
        noDeviceFound: 'No device found',
      },
    },
  },
  appendUserAgent: ` remoteit/${version}`,
}

console.log('\nNode Environment:', process.env.NODE_ENV || 'production')

if (process.env.CAPACITOR_DESKTOP_LIVE_RELOAD && process.env.NODE_ENV === 'development') {
  console.log('Using live reload server:', process.env.CAPACITOR_DESKTOP_LIVE_RELOAD, '\n')
  config.server = {
    androidScheme: 'https',
    url: process.env.CAPACITOR_DESKTOP_LIVE_RELOAD,
    cleartext: true,
  }
}

export default config
