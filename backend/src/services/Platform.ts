import os from 'os'
import path from 'path'
import logger from '../utils/logger'

export const current = os.platform()
export const isWindows = current === 'win32'
export const isMac = current === 'darwin'
export const isBSD = current === 'freebsd'
export const isLinux = current === 'linux'
export const isNIX = isLinux || isMac || isBSD

export const homeDir = os.homedir()

/**
 * NOTE: On Mac, os.tmpdir() returns a generated temp path but we want
 * users to check a standard location (eg "/tmp").
 */

export const remoteitDir = isWindows
  ? '/remoteit'
  : path.join(os.homedir(), '.remoteit')

export const tmpDir = path.join(remoteitDir, 'tmp')

export const logDir = path.join(remoteitDir, 'logs')

export const pathDir = isWindows ? '/remoteit/bin/' : '/usr/local/bin/'

// function getCurrentPlatform() {
//   // TODO: Fix need to ignore these checks as we can run this
//   // code on multiple platforms
//   // @ts-ignore
//   if (typeof document !== 'undefined') return 'broswer'
//   // @ts-ignore
//   if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative')
//     return 'react-native'
//   return process.platform
// }
