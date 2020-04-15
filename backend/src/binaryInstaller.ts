import tmp from 'tmp'
import rimraf from 'rimraf'
import cli from './cliInterface'
import EventBus from './EventBus'
import environment from './environment'
import Logger from './Logger'
import remoteitInstaller from './remoteitInstaller'
import Installer from './Installer'
import Command from './Command'
import { existsSync, lstatSync } from 'fs'

tmp.setGracefulCleanup()

class BinaryInstaller {
  options = { name: 'remoteit' }
  inProgress = false

  async install() {
    if (this.inProgress) return Logger.info('INSTALL IN PROGRESS', { error: 'Can not install while in progress' })
    this.inProgress = true
    await this.installBinary(remoteitInstaller).catch(error => EventBus.emit(Installer.EVENTS.error, error))
    this.inProgress = false
  }

  async installBinary(installer: Installer) {
    return new Promise(async (resolve, reject) => {
      var tmpDir = tmp.dirSync({ unsafeCleanup: true, keep: true })
      var isInstalled: boolean = !(await cli.isNotInstalled())

      // Stop and remove old binaries
      await this.migrateBinaries(installer.binaryPath())

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

      commands.push(`"${installer.binaryPath()}" -j tools install --update`)
      if (isInstalled) commands.push(`"${installer.binaryPath()}" service start`)
      // else commands.push(`"${installer.binaryPath()}" service install`) // Validate with Nicolae if this is correct

      await commands.exec()

      EventBus.emit(Installer.EVENTS.afterInstall, installer)
      EventBus.emit(Installer.EVENTS.installed, installer.toJSON())

      tmpDir.removeCallback()
      resolve()
    })
  }

  async migrateBinaries(installerPath?: string) {
    const commands = new Command({ admin: true })
    let files = environment.deprecatedBinaries
    let toDelete: string[] = []

    if (installerPath) files.push(installerPath)

    files.forEach(file => {
      // Too small to be the desktop app -> must be cli
      if (existsSync(file) && lstatSync(file).size < 30000000) {
        Logger.info('MIGRATING DEPRECATED BINARY', { file })
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
