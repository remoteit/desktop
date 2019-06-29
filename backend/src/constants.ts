import path from 'path'
import os from 'os'
import * as Platform from './services/Platform'

const arch = os.arch()

export const ENVIRONMENT = process.env.NODE_ENV || 'development'

export const LATEST_CONNECTD_RELEASE =
  process.env.LATEST_CONNECTD_RELEASE || 'v4.5'

// Paths
export const REMOTEIT_ROOT_DIR = Platform.isWindows
  ? '/remoteit'
  : path.join(os.homedir(), '.remoteit')
export const REMOTEIT_BINARY_DIR = Platform.isWindows
  ? '/remoteit/bin/'
  : '/usr/local/bin/'

/**
 * Return the binary name of connectd based on the current
 * platform and architecture. This name is what we use for
 * the name of the release on Github.
 *
 * Options:
 * - Arch: 'arm' 'arm64' 'ia32' 'mips' 'mipsel' 'ppc' 'ppc64' 's390' 's390x' 'x32' 'x64'.
 * - Platform: 'aix' 'darwin' 'freebsd' 'linux' 'openbsd' 'sunos' 'win32'
 */
export const REMOTEIT_BINARY_NAME = Platform.isWindows
  ? 'connectd.exe'
  : arch === 'x64'
  ? 'connectd.x86_64-osx'
  : 'connectd.x86-osx'

export const REMOTEIT_BINARY_PATH = path.join(
  REMOTEIT_BINARY_DIR,
  Platform.isWindows ? 'connectd.exe' : 'connectd'
)
/**
 * NOTE: On Mac, os.tmpdir() returns a generated temp path but we want
 * users to check a standard location (eg "/tmp").
 */
export const TEMP_DIR = path.join(REMOTEIT_ROOT_DIR, 'tmp')
export const LOG_DIR = path.join(REMOTEIT_ROOT_DIR, 'logs')

// Port for the Socket.io websocket server
export const PORT = process.env.PORT || 29999

// Google Analytics usage tracking
export const GOOGLE_ANALYTICS_CODE =
  process.env.GOOGLE_ANALYTICS_CODE || 'UA-76016818-10'

// Airbrake error reporting
export const AIRBRAKE_PROJECT_ID = process.env.AIRBRAKE_PROJECT_ID
  ? Number(process.env.AIRBRAKE_PROJECT_ID)
  : 223457
export const AIRBRAKE_PROJECT_KEY =
  process.env.AIRBRAKE_PROJECT_KEY || 'e1376551dbe5b1326f98edd78b6247ba'

export const PEER_PORT_RANGE = [33000, 42999]
export const LOCAL_PROXY_PORT_RANGE = [43000, 52999]

// Remote.it API URL
export const API_URL = process.env.API_URL || 'https://api.remot3.it/apv/v27'

export const USERNAME_COOKIE = 'remoteit.username'
export const AUTH_HASH_COOKIE = 'remoteit.authhash'
