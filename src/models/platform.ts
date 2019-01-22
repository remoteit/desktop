export default class Platform {
  static WINDOWS = 'win32'
  static MAC = 'darwin'
  static BSD = 'freebsd'
  static LINUX = 'linux'
  static ANDROID = 'android'
  // Other unsupported platforms: aix, sunos

  // public static get isElectron(): boolean {
  //   return navigator.userAgent.toLowerCase().includes('electron')
  // }

  public static get current() {
    if (typeof document != 'undefined') return 'broswer'
    if (typeof navigator != 'undefined' && navigator.product == 'ReactNative')
      return 'react-native'
    return process.platform
  }

  public static get isWindows() {
    return this.current === this.WINDOWS
  }

  public static get isMac() {
    return this.current === this.MAC
  }

  public static get isBSD() {
    return this.current === this.BSD
  }

  public static get isLinux() {
    return this.current === this.LINUX
  }

  public static get isNIX() {
    return (
      this.current === this.LINUX ||
      this.current === this.MAC ||
      this.current === this.BSD
    )
  }
}
