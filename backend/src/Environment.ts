import Logger from './Logger'
import os from 'os'
import path from 'path'

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
    let exec = '/bin/remoteit'
    if (this.isWindows) exec = '/bin/remoteit.exe'
    return path.join(this.remoteitDirectory, exec)
  }

  static toJSON() {
    return {
      isWindows: this.isWindows,
      isMac: this.isMac,
      remoteitDirectory: this.remoteitDirectory,
    }
  }
}
