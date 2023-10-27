import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'it.remote.app',
  appName: 'Remote.It',
  webDir: 'frontend/build',
  server: {
    androidScheme: 'https'
  }
};

console.log('\nNode Environment:', process.env.NODE_ENV, '\n')

if (process.env.CAPACITOR_DESKTOP_LIVE_RELOAD) {
  console.log('Using live reload server:', process.env.CAPACITOR_DESKTOP_LIVE_RELOAD)
  config.server = {
    androidScheme: 'https',
    url: process.env.CAPACITOR_DESKTOP_LIVE_RELOAD,
    cleartext: true,
  }
}

export default config;
