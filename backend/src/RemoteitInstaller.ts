import Logger from './Logger'
import Installer from './Installer'
import Environment from './Environment'
import semverCompare from 'semver-compare'

class RemoteitInstaller extends Installer {
  isCurrent(version?: string) {
    Logger.info('INSTALLER', { name: this.name, checkVersion: version, version: this.version })
    return semverCompare(version || '0', this.version) === 0
  }

  get downloadFileName() {
    const version = this.version
    const name = `${this.name}_${version}_`
    if (Environment.isWindows) return `${name}windows_x86_64.exe`
    else if (Environment.isMac) return `${name}mac-osx_x86_64`
    else if (Environment.isPi) return `${name}linux_armv7`
    else if (Environment.isLinux) return `${name}linux_x86_64`
    else return `${name}linux_arm64`
  }
}

export default new RemoteitInstaller({
  name: 'remoteit',
  repoName: 'remoteit/cli',
  version: '0.37.2',
})
