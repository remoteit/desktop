export class Platform {
  static ELECTRON = 'electron'
  static BROWSER = 'browser'

  static get environment() {
    if (this.isElectron) return this.ELECTRON
    return this.BROWSER
  }

  static get isElectron() {
    const userAgent = navigator.userAgent.toLowerCase()
    return userAgent.includes(' electron/')
  }
}
