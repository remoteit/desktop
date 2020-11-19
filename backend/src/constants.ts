import os from 'os'
import path from 'path'

//General
export const ENVIRONMENT = process.env.NODE_ENV || 'production'
export const PRODUCT_NAME = 'Desktop'
export const MANUFACTURER_NAME = 'remote.it'
export const REMOTEIT_PI_WIFI = 'remote.itPi'

// Airbrake error reporting
export const AIRBRAKE_PROJECT_ID = 223457
export const AIRBRAKE_PROJECT_KEY = process.env.AIRBRAKE_PROJECT_KEY || 'e1376551dbe5b1326f98edd78b6247ba'

// CLI
export const CLI_DOWNLOAD: 'DEV' | 'PROD' = 'PROD' // development or production download url

// CLI product tracking codes
export const MANUFACTURE_ID_STANDARD = 33280
export const MANUFACTURE_ID_HEADLESS = 33536
// connectd Package = 32768
// remote.it CLI = 33024
// remote.it Desktop = 33280
// remote.it Headless Desktop = 33536
// remote.it Mobile = 33792
// remote.it Proxy Server = 34048

// CONNECTD (initiator) platform tracking codes
export const PLATFORM_CODES = {
  AWS: 1185, // AWS linux ubuntu
  LINUX_ARM: 1200,
  LINUX_DEBIAN: 1120, // Might not be able to detect
  LINUX: 769,
  MAC: 256,
  RASPBERRY_PI: 1072,
  REMOTEIT_PI_LITE: 1076,
  REMOTEIT_PI: 1075, // This will come in out of the manufacture.json
  UNIX: 768, // Might not be able to detect
  UNKNOWN: 65535,
  WINDOWS_DESKTOP: 5,
  WINDOWS_SERVER: 10, // Might not be able to detect
  WINDOWS: 0,
}

// Web directory
export const WEB_DIR = path.join(__dirname, '../build')
export const SSL_DIR = path.join(__dirname, '../ssl')

// Port for the Socket.io websocket server
export const WEB_PORT = Number(process.env.PORT || 29999)
export const SSL_PORT = WEB_PORT - 1

// Install paths
export const PATHS = {
  HEADLESS_BINARIES: '/usr/bin',

  LINUX_USER_SETTINGS: path.join(os.homedir(), '.remoteit'),
  LINUX_BINARIES: path.join(__dirname, '../../../../'),
  LINUX_ADMIN_SETTINGS: '/etc/remoteit',
  LINUX_DEPRECATED_BINARIES: ['/usr/local/bin/remoteit'],
  LINUX_SYMLINKS: '/usr/bin',

  MAC_USER_SETTINGS: path.join(os.homedir(), '.remoteit'),
  MAC_BINARIES: path.join(__dirname, '../../../../'),
  MAC_BINARIES_DEV: path.resolve('./bin'),
  MAC_ADMIN_SETTINGS: '/etc/remoteit',
  MAC_DEPRECATED_BINARIES: [],
  MAC_SYMLINKS: '/usr/local/bin',

  WIN_USER_SETTINGS: path.join(os.homedir(), 'AppData/Local/remoteit'),
  WIN_BINARIES: path.resolve('./resources/x64'),
  WIN_BINARIES_32: path.resolve('./resources/x86'),
  WIN_BINARIES_DEV: path.resolve('./bin/x64'),
  WIN_ADMIN_SETTINGS: path.resolve('C:/ProgramData/remoteit'),
  WIN_DEPRECATED_BINARIES: [
    path.resolve('C:/Program Files/remoteit-bin/remoteit.exe'),
    path.resolve('C:/Program Files/remoteit/remoteit.exe'),
    path.resolve('C:/Windows/remoteit.exe'),
  ],
}
