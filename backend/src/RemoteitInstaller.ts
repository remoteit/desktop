import Installer from './Installer'
import Environment from './Environment'
import os from 'os'

class RemoteitInstaller extends Installer {
  get downloadFileName() {
    const version = this.version.slice(1)
    const name = `${this.name}_${version}_`
    return Environment.isWindows
      ? `${name}windows_x86_64.exe`
      : Environment.isMac
      ? `${name}mac-osx_x86_64`
      : `${name}linux_x86_64`
  }
}

export default new RemoteitInstaller({
  name: 'remoteit',
  repoName: 'remoteit/cli',
  version: 'v0.31.1',
})
