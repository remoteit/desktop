import Installer from './Installer'
import Environment from './Environment'

class RemoteitInstaller extends Installer {
  get downloadFileName() {
    const version = this.version.slice(1)
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
  version: 'v0.37.2',
})
