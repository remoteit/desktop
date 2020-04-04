import { PATHS } from './constants'
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
  userPath: string
  adminPath: string
  binPath: string

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

    if (this.isWindows) {
      this.userPath = PATHS.WIN_USER_SETTINGS
      this.adminPath = PATHS.WIN_ADMIN_SETTINGS
      this.binPath = elevated ? PATHS.WIN_ADMIN_BINARIES : PATHS.WIN_USER_BINARIES
    } else if (this.isMac) {
      this.userPath = PATHS.MAC_USER_SETTINGS
      this.adminPath = PATHS.MAC_ADMIN_SETTINGS
      this.binPath = elevated ? PATHS.MAC_ADMIN_BINARIES : PATHS.MAC_USER_BINARIES
    } else {
      this.userPath = PATHS.UNIX_USER_SETTINGS
      this.adminPath = PATHS.UNIX_ADMIN_SETTINGS
      this.binPath = elevated ? PATHS.UNIX_ADMIN_BINARIES : PATHS.UNIX_USER_BINARIES
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

  toJSON() {
    return {
      isWindows: this.isWindows,
      isMac: this.isMac,
      isLinux: this.isLinux,
      isArmLinux: this.isArmLinux,
      isPi: this.isPi,
      isPiZero: this.isPiZero,
      platform: this.platform,
      userPath: this.userPath,
      adminPath: this.adminPath,
      binPath: this.binPath,
      simpleOS: this.simpleOS,
    }
  }
}

export default new Environment()
