import {
  MAC_USER_SETTINGS,
  WIN_USER_SETTINGS,
  WIN_ADMIN_SETTINGS,
  MAC_ADMIN_SETTINGS,
  WIN_BINARIES,
  MAC_BINARIES,
} from './constants'
import os from 'os'

export default class Environment {
  static get isWindows() {
    return os.platform() === 'win32'
  }

  static get isMac() {
    return os.platform() === 'darwin'
  }

  static get userPath() {
    return this.isWindows ? WIN_USER_SETTINGS : MAC_USER_SETTINGS
  }

  static get adminPath() {
    return this.isWindows ? WIN_ADMIN_SETTINGS : MAC_ADMIN_SETTINGS
  }

  static get binPath() {
    return this.isWindows ? WIN_BINARIES : MAC_BINARIES
  }

  static toJSON() {
    return {
      isWindows: this.isWindows,
      isMac: this.isMac,
      userPath: this.userPath,
      adminPath: this.adminPath,
      binPath: this.binPath,
    }
  }
}
