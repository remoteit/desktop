import tmp from 'tmp'
import rimraf from 'rimraf'
import debug from 'debug'
import cli from './cliInterface'
import EventBus from './EventBus'
import environment from './environment'
import Logger from './Logger'
import remoteitInstaller from './remoteitInstaller'
import Installer from './Installer'
import Command from './Command'
import { existsSync, lstatSync } from 'fs'
import { WIN_DEPRECATED_BINARIES } from './constants'

tmp.setGracefulCleanup()
const d = debug('r3:backend:BinaryInstaller')

class BinaryInstaller {
  options = { name: 'remoteit' }
  inProgress = false

  async install() {
    if (this.inProgress) return Logger.info('INSTALL IN PROGRESS', { error: 'Can not install while in progress' })
    this.inProgress = true
    await this.installBinary(remoteitInstaller).catch(error => EventBus.emit(Installer.EVENTS.error, error))
    this.inProgress = false
  }
  //change

  async installBinary(installer: Installer) {
    return new Promise(async (resolve, reject) => {
      var tmpDir = tmp.dirSync({ unsafeCleanup: true, keep: true })
      var isInstalled: boolean = !(await cli.isNotInstalled())

      // Migrate v2.4.x bin location to v2.5.x
      if (environment.isWindows) await this.migrateBinaries()

      // Service needs to stop in before a new version - done independently since it will fail if there isn't a service running and stop the rest of the commands
      if (isInstalled) await new Command({ admin: true, command: `"${installer.binaryPath()}" service stop` }).exec()

      // Download and install binaries
      await this.download(installer, tmpDir)

      const commands = new Command({ onError: reject, admin: true })

      if (environment.isWindows) {
        if (!existsSync(environment.binPath)) commands.push(`md "${environment.binPath}"`)
        commands.push(`move /y "${installer.tempFile}" "${installer.binaryPath()}"`)
        commands.push(`icacls "${installer.binaryPath()}" /T /C /Q /grant "*S-1-5-32-545:RX"`) // Grant all group "Users" read and execute permissions
      } else {
        if (!existsSync(environment.binPath)) commands.push(`mkdir -p ${environment.binPath}`)
        commands.push(`mv ${installer.tempFile} ${installer.binaryPath()}`)
        commands.push(`chmod 755 ${installer.binaryPath()}`) // @TODO if this is going in the user folder must have user permissions
      }

      commands.push(`"${installer.binaryPath()}" tools install --update -j`)
      if (isInstalled) commands.push(`"${installer.binaryPath()}" service start`)

      await commands.exec()

      EventBus.emit(Installer.EVENTS.afterInstall, installer)
      EventBus.emit(Installer.EVENTS.installed, installer.toJSON())

      tmpDir.removeCallback()
      resolve()
    })
  }

  async migrateBinaries() {
    const files = WIN_DEPRECATED_BINARIES
    const commands = new Command({ admin: true })
    let toDelete: string[] = []

    files.forEach(file => {
      // Too small to be the desktop app -> must be cli
      if (existsSync(file) && lstatSync(file).size < 30000000) {
        Logger.info('STOPPING DEPRECATED BINARY', { file })
        commands.push(`"${file}" service stop`)
        commands.push(`"${file}" tools uninstall`)
        toDelete.push(file)
      } else {
        Logger.info('DEPRECATED BINARY DOES NOT EXIST', { file })
      }
    })

    await commands.exec()

    toDelete.forEach(file => {
      try {
        rimraf.sync(file, { disableGlob: true })
      } catch (e) {
        Logger.warn('FILE REMOVAL FAILED', { file })
      }
    })
  }

  async download(installer: Installer, tmpDir: tmp.DirResult) {
    return installer
      .install(tmpDir.name, (progress: number) => EventBus.emit(Installer.EVENTS.progress, { progress, installer }))
      .catch(error =>
        EventBus.emit(Installer.EVENTS.error, {
          error: error.message,
          installer,
        })
      )
  }

  async uninstall() {
    if (this.inProgress) return Logger.info('UNINSTALL IN PROGRESS', { error: 'Can not uninstall while in progress' })
    this.inProgress = true
    await this.uninstallBinary(remoteitInstaller).catch(error => EventBus.emit(Installer.EVENTS.error, error))
    this.inProgress = false
  }

  async uninstallBinary(installer: Installer) {
    return new Promise(async (resolve, reject) => {
      const options = { disableGlob: true }

      try {
        rimraf.sync(installer.binaryPath(), options)
        rimraf.sync(environment.userPath, options)
      } catch (e) {
        reject(e)
      }

      resolve()
    })
  }
}

export default new BinaryInstaller()
