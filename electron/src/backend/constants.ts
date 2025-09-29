import os from 'os'
import path from 'path'
const env = process.env

//General
export const ENVIRONMENT = env.NODE_ENV || 'production'
export const DEVELOPER_KEY = env.DEVELOPER_KEY || 'Mjc5REIzQUQtMTQyRC00NTcxLTlGRDktMTVGNzVGNDYxQkE3'

// export const PROTOCOL = env.PROTOCOL || env.NODE_ENV === 'development' ? 'remoteitdev://' : 'remoteit://'
export const PROTOCOL = env.PROTOCOL || 'remoteit://'
export const REDIRECT_URL = env.REDIRECT_URL || PROTOCOL + 'authCallback'
export const SIGNOUT_REDIRECT_URL = PROTOCOL + 'signoutCallback'
export const API_URL = env.API_URL || 'https://api.remote.it/apv/v27'

// Airbrake error reporting
export const AIRBRAKE_PROJECT_ID = 223457
export const AIRBRAKE_PROJECT_KEY = 'e1376551dbe5b1326f98edd78b6247ba'

// CLI
export const CLI_DOWNLOAD: 'DEV' | 'PROD' = 'PROD' // development or production download url

// CLI product tracking codes
export const MANUFACTURE_ID_STANDARD = 33280
export const MANUFACTURE_ID_HEADLESS = 33536

// CONNECTD initiator platform tracking codes
export const PLATFORM_CODES = {
  AWS: 1185, // AWS linux ubuntu
  LINUX_ARM: 1200,
  LINUX_DEBIAN: 1120, // Might not be able to detect
  LINUX: 769,
  MAC: 256,
  RASPBERRY_PI: 1072,
  REMOTEIT_PI: 1075, // This will come in out of the manufacture.json
  REMOTEIT_PI_LITE: 1076,
  REMOTEIT_PI_ARM64: 1077,
  UNIX: 768, // Might not be able to detect
  UNKNOWN: 65535,
  WINDOWS_DESKTOP: 5,
  WINDOWS_SERVER: 10, // Might not be able to detect
  WINDOWS: 0,
}

// Asset directories
export const WEB_DIR = path.resolve(__dirname)
export const SSL_DIR = path.resolve(__dirname, 'ssl')

const APP_ROOT = path.resolve(__dirname, '../..')
const DEV_BIN_DIR = path.resolve(APP_ROOT, 'bin', os.arch())
const PROD_BIN_DIR = path.resolve(process.resourcesPath || APP_ROOT)

// Port for the Socket.io websocket server
export const WEB_PORT = Number(process.env.PORT || 29999)
export const SSL_PORT = WEB_PORT - 1

// Install paths
export const PATHS = {
  SSH_CONFIG: path.resolve(os.homedir(), '.ssh/config'),

  LINUX_USER_SETTINGS: path.resolve(os.homedir(), '.remoteit'),
  LINUX_BINARIES: PROD_BIN_DIR,
  LINUX_BINARIES_DEV: DEV_BIN_DIR,
  LINUX_ADMIN_SETTINGS: '/etc/remoteit',
  LINUX_DEPRECATED_BINARIES: [],
  LINUX_SYMLINKS: '/usr/bin/',

  MAC_USER_SETTINGS: path.resolve(os.homedir(), '.remoteit'),
  MAC_BINARIES: PROD_BIN_DIR,
  MAC_BINARIES_DEV: DEV_BIN_DIR,
  MAC_ADMIN_SETTINGS: '/etc/remoteit',
  MAC_DEPRECATED_BINARIES: [],
  MAC_SYMLINKS: '/usr/local/bin/',

  WIN_USER_SETTINGS: path.resolve(os.homedir(), 'AppData/Local/remoteit'),
  WIN_BINARIES: PROD_BIN_DIR,
  WIN_BINARIES_DEV: DEV_BIN_DIR,
  WIN_ADMIN_SETTINGS: path.resolve('C:/ProgramData/remoteit'),
  WIN_DEPRECATED_BINARIES: [
    path.resolve(PROD_BIN_DIR, 'remoteit.exe'),
    path.resolve('C:/Program Files/remoteit-bin/remoteit.exe'),
    path.resolve('C:/Program Files/remoteit/remoteit.exe'),
    path.resolve('C:/Windows/remoteit.exe'),
  ],
}
