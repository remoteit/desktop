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
import electron from 'electron'
import detectRPi from 'detect-rpi'
import Logger from './Logger'
import lan from './LAN'
import os from 'os'

class environment {
  isElevated = false

  get isHeadless() {
    return !electron.app
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

  get userPath() {
    return this.isWindows ? WIN_USER_SETTINGS : UNIX_USER_SETTINGS
  }

  get adminPath() {
    return this.isWindows ? WIN_ADMIN_SETTINGS : UNIX_ADMIN_SETTINGS
  }

  get binPath() {
    if (this.isWindows) return this.isElevated ? WIN_ADMIN_BINARIES : WIN_USER_BINARIES
    else return this.isElevated ? UNIX_ADMIN_BINARIES : UNIX_USER_BINARIES
  }

  async setElevatedState() {
    this.isElevated = await isElevated()
    Logger.info('ELEVATED STATE', { isElevated: this.isElevated })
  }

  async getSystemInfo() {
    await lan.getInterfaces()
    return {
      arch: os.arch(),
      platform: this.platform,
      interfaces: lan.interfaces,
      privateIP: lan.privateIP,
    }
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

export default new environment()
