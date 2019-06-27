import os from 'os'

export const current = os.platform()
export const isWindows = current === 'win32'
export const isMac = current === 'darwin'
// export const isBSD = current === 'freebsd'
// export const isLinux = current === 'linux'
// export const isNIX = isLinux || isMac || isBSD

export const homeDir = os.homedir()
