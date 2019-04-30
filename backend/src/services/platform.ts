function getCurrentPlatform() {
  // TODO: Fix need to ignore these checks as we can run this
  // code on multiple platforms
  // @ts-ignore
  if (typeof document != 'undefined') return 'broswer'
  // @ts-ignore
  if (typeof navigator != 'undefined' && navigator.product == 'ReactNative')
    return 'react-native'
  return process.platform
}

export const current = getCurrentPlatform()
export const isWindows = current === 'win32'
export const isMac = current === 'darwin'
export const isBSD = current === 'freebsd'
export const isLinux = current === 'linux'
export const isNIX = isLinux || isMac || isBSD
