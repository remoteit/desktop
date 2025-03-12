import { CapacitorConfig } from '@capacitor/cli';
import { version } from './package.json'
import theme from './common/src/brand/theme'

const config: CapacitorConfig = {
  appName: 'Remote.It',
  webDir: 'frontend/build',
  backgroundColor: theme.colors.light.primary,
  ios: {
    scheme: 'Remote.It',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: theme.colors.light.primary,
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
