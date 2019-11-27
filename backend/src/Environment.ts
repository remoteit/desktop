import Logger from './Logger'
import os from 'os'
import path from 'path'
import { BIN_PATH } from './constants'

export default class Environment {
  static get isWindows() {
    return os.platform() === 'win32'
  }

  static get isMac() {
    return os.platform() === 'darwin'
  }

  static get remoteitDirectory() {
    return this.isWindows ? '/remoteit' : path.join(os.homedir(), '.remoteit')
  }

  static get execPath() {
    let exec = 'Linux_arm64/remoteit'

    if (this.isWindows) exec = 'Windows_x86_64/remoteit.exe'
    if (this.isMac) exec = 'Darwin_x86_64/remoteit'

    return path.join(BIN_PATH, exec)
  }

  static toJSON() {
    return {
      isWindows: this.isWindows,
      isMac: this.isMac,
      remoteitDirectory: this.remoteitDirectory,
    }
  }
}
