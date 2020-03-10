import {
  UNIX_USER_SETTINGS,
  UNIX_USER_BINARIES,
  UNIX_ADMIN_SETTINGS,
  UNIX_ADMIN_BINARIES,
  WIN_USER_SETTINGS,
  WIN_USER_BINARIES,
  WIN_ADMIN_SETTINGS,
  WIN_ADMIN_BINARIES,
} from './constants'
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
  platform: string
  simpleOS: Ios
  userPath: string
  adminPath: string
  binPath: string

  constructor() {
    this.isWindows = os.platform() === 'win32'
    this.isMac = os.platform() === 'darwin'
    this.isLinux = os.platform() === 'linux'
    this.isArmLinux = this.isLinux && os.arch() === 'arm64'
    this.isPi = detectRPi()
    // @ts-ignore
    this.isPiZero = detectRPi() && process.config.variables.arm_version === '6'
    this.platform = this.isPi ? 'rpi' : os.platform()
    this.userPath = this.isWindows ? WIN_USER_SETTINGS : UNIX_USER_SETTINGS
    this.adminPath = this.isWindows ? WIN_ADMIN_SETTINGS : UNIX_ADMIN_SETTINGS
    this.binPath = this.setBinPath()
    this.simpleOS = this.setSimpleOS()
  }

  setBinPath() {
    const elevated: boolean = true //this.isElevated - always elevated for now
    if (this.isWindows) return elevated ? WIN_ADMIN_BINARIES : WIN_USER_BINARIES
    else return elevated ? UNIX_ADMIN_BINARIES : UNIX_USER_BINARIES
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
      userPath: this.userPath,
      adminPath: this.adminPath,
      binPath: this.binPath,
    }
  }
}

export default new Environment()
