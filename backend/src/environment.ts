import app from '.'
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

class environment {
  isElevated: boolean = false

  get isHeadless() {
    return !app.electron
  }

  get isWindows() {
    return os.platform() === 'win32'
  }

  get isMac() {
    return os.platform() === 'darwin'
  }

  get isLinux() {
    return os.platform() === 'linux'
  }

  get platform() {
    if (this.isPi) return 'RPi'
    else return os.platform()
  }

  get isArmLinux() {
    return this.isLinux && os.arch() === 'arm64'
  }

  get isPi() {
    return detectRPi()
  }

  get isPiZero() {
    // @ts-ignore
    return detectRPi() && process.config.variables.arm_version === '6'
  }

  get userPath() {
    return this.isWindows ? WIN_USER_SETTINGS : UNIX_USER_SETTINGS
  }

  get adminPath() {
    return this.isWindows ? WIN_ADMIN_SETTINGS : UNIX_ADMIN_SETTINGS
  }

  binPath(elevated: boolean = this.isElevated) {
    if (this.isWindows) return elevated ? WIN_ADMIN_BINARIES : WIN_USER_BINARIES
    else return elevated ? UNIX_ADMIN_BINARIES : UNIX_USER_BINARIES
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
      binPath: this.binPath(),
    }
  }
}

export default new environment()
