import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'it.remote.app',
  appName: 'Remote.It',
  webDir: 'frontend/build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
