import os from 'os'
import path from 'path'

export const ENVIRONMENT = process.env.NODE_ENV || 'production'

// Port for the Socket.io websocket server
export const PORT = Number(process.env.PORT || 29999)

// Google Analytics usage tracking
export const GOOGLE_ANALYTICS_CODE = 'UA-76016818-10'

// Airbrake error reporting
export const AIRBRAKE_PROJECT_ID = 223457
export const AIRBRAKE_PROJECT_KEY = process.env.AIRBRAKE_PROJECT_KEY || 'e1376551dbe5b1326f98edd78b6247ba'

// Remote.it API URL
export const API_URL = process.env.API_URL || 'https://api.remot3.it/apv/v27'
export const DEVELOPER_KEY = process.env.DEVELOPER_KEY || 'Mjc5REIzQUQtMTQyRC00NTcxLTlGRDktMTVGNzVGNDYxQkE3'

// CLI
export const CLI_VERSION = '1.1.0-pre.4'
export const IP_OPEN: ipAddress = '0.0.0.0'
export const IP_PRIVATE: ipAddress = '127.0.0.1'

// Web directory
export const WEB_DIR = path.join(__dirname, '../build')

// Install paths
<<<<<<< Updated upstream
export const UNIX_USER_BINARIES = path.join(os.homedir(), '.remoteit/bin')
export const UNIX_USER_SETTINGS = path.join(os.homedir(), '.remoteit')
export const UNIX_ADMIN_BINARIES = '/usr/local/bin'
export const UNIX_ADMIN_SETTINGS = '/etc/remoteit'

export const WIN_USER_BINARIES = path.join(os.homedir(), 'AppData/Local/remoteit/bin')
export const WIN_USER_SETTINGS = path.join(os.homedir(), 'AppData/Local/remoteit')
export const WIN_ADMIN_BINARIES = path.resolve('/Windows')
export const WIN_ADMIN_SETTINGS = path.resolve('/ProgramData/remoteit')

// Temp for migrating v2.4.x to 2.5.x
export const WIN_ADMIN_BINARY_DEPRECATED = path.resolve('/Program Files/remoteit/remoteit.exe')
=======
export const PATHS = {
  UNIX_USER_BINARIES: path.join(os.homedir(), '.remoteit/bin'),
  UNIX_USER_SETTINGS: path.join(os.homedir(), '.remoteit'),
  UNIX_ADMIN_BINARIES: '/usr/bin',
  UNIX_ADMIN_SETTINGS: '/etc/remoteit',

  MAC_USER_BINARIES: path.join(os.homedir(), '.remoteit/bin'),
  MAC_USER_SETTINGS: path.join(os.homedir(), '.remoteit'),
  MAC_ADMIN_BINARIES: '/usr/local/bin',
  MAC_ADMIN_SETTINGS: '/etc/remoteit',

  WIN_USER_BINARIES: path.join(os.homedir(), 'AppData/Local/remoteit/bin'),
  WIN_USER_SETTINGS: path.join(os.homedir(), 'AppData/Local/remoteit'),
  WIN_ADMIN_BINARIES: path.resolve('/Program Files/remoteit-bin'),
  WIN_ADMIN_SETTINGS: path.resolve('/ProgramData/remoteit'),
}

// Temp for migrating v2.4.x to 2.5.x
export const UNIX_DEPRECATED_BINARIES = ['/usr/local/bin/remoteit']
export const WIN_DEPRECATED_BINARIES = [
  path.resolve('/Program Files/remoteit/remoteit.exe'),
  path.resolve('/Windows/remoteit.exe'),
]
>>>>>>> Stashed changes
