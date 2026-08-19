import os from 'os'
import path from 'path'
import * as dotenv from 'dotenv'
// Load .env BEFORE reading it: index.ts calls dotenv.config() too, but import hoisting
// runs every module body (including this one) first — reading process.env at module load
// saw only the shell env, so .env-only settings (the OAUTH_* block) never landed.
dotenv.config()
const env = process.env

//General
export const ENVIRONMENT = env.NODE_ENV || 'production'
export const DEVELOPER_KEY = env.DEVELOPER_KEY || 'Mjc5REIzQUQtMTQyRC00NTcxLTlGRDktMTVGNzVGNDYxQkE3'

// export const PROTOCOL = env.PROTOCOL || env.NODE_ENV === 'development' ? 'remoteitdev://' : 'remoteit://'
export const PROTOCOL = env.PROTOCOL || 'remoteit://'
export const REDIRECT_URL = env.REDIRECT_URL || PROTOCOL + 'authCallback'
export const SIGNOUT_REDIRECT_URL = PROTOCOL + 'signoutCallback'
export const API_URL = env.API_URL || 'https://api.remote.it/apv/v27'

// OIDC sign-in against Permitteer (docs: permitteer docs/remoteit-desktop-login.md).
// The backend process OWNS the flow — PKCE, code capture, token exchange, rotating
// refresh, keychain persistence; the renderer only ever receives short-lived access
// tokens over the local socket. OAUTH_ISSUER unset = the module refuses to start
// (this branch line has no Cognito fallback — D2, no dual stack).
export const OAUTH_ISSUER = env.OAUTH_ISSUER || ''
export const OAUTH_CLIENT_ID = env.OAUTH_CLIENT_ID || 'remoteit_desktop'
// The API audience tokens are minted for. LESSON (plan Phase 0): `resource` must ride
// the TOKEN/refresh request — the identity lane defaults `aud` to the issuer otherwise.
export const OAUTH_GRAPHQL_RESOURCE = env.OAUTH_GRAPHQL_RESOURCE || 'https://graphql.dev.remote.it/graphql'
// 'loopback' = one-shot 127.0.0.1 listener (the LOCAL DEV lane — an unpackaged Electron
// can't reliably claim the custom scheme); 'scheme' = remoteit://authCallback deep link
// (packaged builds). Both URIs are registered on the client; the AS matches loopback
// ports ephemerally.
export const OAUTH_REDIRECT_MODE = (env.OAUTH_REDIRECT_MODE as 'scheme' | 'loopback') || 'loopback'

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
    path.resolve(PROD_BIN_DIR, os.arch(), 'remoteit.exe'),
    path.resolve('C:/Program Files/remoteit-bin/remoteit.exe'),
    path.resolve('C:/Program Files/remoteit/remoteit.exe'),
    path.resolve('C:/Windows/remoteit.exe'),
  ],
}
