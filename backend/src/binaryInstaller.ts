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
import { WIN_ADMIN_BINARY_DEPRECATED } from './constants'

tmp.setGracefulCleanup()
const d = debug('r3:backend:BinaryInstaller')

class BinaryInstaller {
  options = { name: 'remoteit' }

  async install() {
    await this.installBinary(remoteitInstaller).catch(error => EventBus.emit(Installer.EVENTS.error, error))
  }
  //change

  async installBinary(installer: Installer) {
    return new Promise(async (resolve, reject) => {
      var tmpDir = tmp.dirSync({ unsafeCleanup: true, keep: true })
      var isInstalled: boolean = !(await cli.isNotInstalled())

      // Migrate v2.4.x bin location to v2.5.x
      if (environment.isWindows) await this.stopDeprecatedBinary()

      // Service needs to stop in before a new version - done independently since it will fail if there isn't a service running and stop the rest of the commands
      if (isInstalled) await new Command({ admin: true, command: `"${installer.binaryPath()}" service stop` }).exec()

      // Download and install binaries
      await this.download(installer, tmpDir)

      const commands = new Command({ onError: reject, admin: true })

      if (environment.isWindows) {
        if (!existsSync(environment.binPath)) commands.push(`md "${environment.binPath}"`)
        commands.push(`move /y "${installer.tempFile}" "${installer.binaryPath()}"`)
        commands.push(`icacls "${installer.binaryPath()}" /T /Q /grant "*S-1-5-32-545:RX"`) // Grant all group "Users" read and execute permissions
      } else {
        if (!existsSync(environment.binPath)) commands.push(`mkdir -p ${environment.binPath}`)
        commands.push(`mv ${installer.tempFile} ${installer.binaryPath()}`)
        commands.push(`chmod 755 ${installer.binaryPath()}`) // @TODO if this is going in the user folder must have user permissions
      }

      commands.push(`"${installer.binaryPath()}" tools install -j`)
      if (isInstalled) commands.push(`"${installer.binaryPath()}" service start`)

      await commands.exec()

      EventBus.emit(Installer.EVENTS.afterInstall, installer)
      EventBus.emit(Installer.EVENTS.installed, installer.toJSON())

      tmpDir.removeCallback()
      resolve()
    })
  }

  async stopDeprecatedBinary() {
    // Too small to be the desktop app -> must be cli
    if (existsSync(WIN_ADMIN_BINARY_DEPRECATED) && lstatSync(WIN_ADMIN_BINARY_DEPRECATED).size < 30000000) {
      Logger.info('STOPPING DEPRECATED BINARY', { path: WIN_ADMIN_BINARY_DEPRECATED })
      await new Command({ admin: true, command: `"${WIN_ADMIN_BINARY_DEPRECATED}" service stop -j` }).exec()
    } else {
      Logger.info('DEPRECATED BINARY DOES NOT EXIST', { path: WIN_ADMIN_BINARY_DEPRECATED })
    }
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
    await this.uninstallBinary(remoteitInstaller).catch(error => EventBus.emit(Installer.EVENTS.error, error))
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
