import { PATHS, MANUFACTURE_ID_HEADLESS, MANUFACTURE_ID_STANDARD } from './constants'
import isElevated from 'is-elevated'
import detectRPi from 'detect-rpi'
import os from 'os'

export class Environment {
  isElevated: boolean = false
  isHeadless: boolean = true
  isWindows: boolean
  isMac: boolean
  isLinux: boolean
  isArmLinux: boolean
  isPi: boolean
  isPiZero: boolean
  simpleOS: Ios
  manufactureId: number
  privateIP: ipAddress = ''
  adminUsername: string = ''
  userPath: string
  adminPath: string
  binPath: string
  deprecatedBinaries: string[]

  EVENTS = { send: 'environment' }

  constructor() {
    const elevated: boolean = true //this.isElevated - always elevated for now

    // @ts-ignore
    this.isPiZero = detectRPi() && process.config.variables.arm_version === '6'
    this.isPi = detectRPi()
    this.isWindows = os.platform() === 'win32'
    this.isMac = os.platform() === 'darwin'
    this.isLinux = os.platform() === 'linux'
    this.isArmLinux = this.isLinux && os.arch() === 'arm64'
    this.simpleOS = this.setSimpleOS()
    this.manufactureId = this.isHeadless ? MANUFACTURE_ID_HEADLESS : MANUFACTURE_ID_STANDARD

    if (this.isWindows) {
      this.userPath = PATHS.WIN_USER_SETTINGS
      this.adminPath = PATHS.WIN_ADMIN_SETTINGS
      this.binPath = elevated ? PATHS.WIN_ADMIN_BINARIES : PATHS.WIN_USER_BINARIES
      this.deprecatedBinaries = PATHS.WIN_DEPRECATED_BINARIES
    } else if (this.isMac) {
      this.userPath = PATHS.MAC_USER_SETTINGS
      this.adminPath = PATHS.MAC_ADMIN_SETTINGS
      this.binPath = elevated ? PATHS.MAC_ADMIN_BINARIES : PATHS.MAC_USER_BINARIES
      this.deprecatedBinaries = PATHS.MAC_DEPRECATED_BINARIES
    } else {
      this.userPath = PATHS.LINUX_USER_SETTINGS
      this.adminPath = PATHS.LINUX_ADMIN_SETTINGS
      this.binPath = elevated ? PATHS.LINUX_ADMIN_BINARIES : PATHS.LINUX_USER_BINARIES
      this.deprecatedBinaries = PATHS.LINUX_DEPRECATED_BINARIES
    }
  }

  setSimpleOS() {
    if (this.isMac) return 'mac'
    if (this.isWindows) return 'windows'
    if (this.isPi) return 'rpi'
    else return 'linux'
  }

  async setElevatedState() {
    this.isElevated = await isElevated()
  }

  get frontend() {
    return {
      os: this.simpleOS,
      adminUsername: this.adminUsername,
      isElevated: this.isElevated,
      privateIP: this.privateIP,
      hostname: os.hostname(),
    }
  }

  toJSON() {
    return {
      isPiZero: this.isPiZero,
      isPi: this.isPi,
      isWindows: this.isWindows,
      isMac: this.isMac,
      isLinux: this.isLinux,
      isArmLinux: this.isArmLinux,
      simpleOS: this.simpleOS,
      userPath: this.userPath,
      adminPath: this.adminPath,
      binPath: this.binPath,
      deprecatedBinaries: this.deprecatedBinaries,
    }
  }
}

export default new Environment()
