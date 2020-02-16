import tmp from 'tmp'
import path from 'path'
import rimraf from 'rimraf'
import debug from 'debug'
import cli from './cliInterface'
import EventBus from './EventBus'
import environment from './environment'
import Installer from './Installer'
import Command from './Command'
import { existsSync } from 'fs'

tmp.setGracefulCleanup()
const d = debug('r3:backend:BinaryInstaller')

class BinaryInstaller {
  options = { name: 'remoteit' }

  async install(installers: Installer[]) {
    return new Promise(async (resolve, reject) => {
      var tmpDir = tmp.dirSync({ unsafeCleanup: true, keep: true })
      var isInstalled: boolean = !(await cli.isNotInstalled())

      // Service needs to stop in install a new version
      if (isInstalled) await cli.stopService()

      // Download and install binaries
      await Promise.all(
        installers.map(installer =>
          installer
            .install(tmpDir.name, (progress: number) =>
              EventBus.emit(Installer.EVENTS.progress, { progress, installer })
            )
            .catch(error =>
              EventBus.emit(Installer.EVENTS.error, {
                error: error.message,
                installer,
              })
            )
        )
      )

      const commands = new Command({ onError: reject })

      if (environment.isWindows) {
        if (!existsSync(environment.binPath())) commands.push(`md "${environment.binPath()}"`)
        installers.map(installer => {
          commands.push(`move /y "${installer.tempFile}" "${installer.binaryPath()}"`)
          commands.push(`icacls "${installer.binaryPath()}" /T /Q /grant "*S-1-5-32-545:RX"`) // Grant all group "Users" read and execute permissions
        })
      } else {
        if (!existsSync(environment.binPath())) commands.push(`mkdir -p ${environment.binPath()}`)
        installers.map(installer => {
          commands.push(`mv ${installer.tempFile} ${installer.binaryPath()}`)
          commands.push(`chmod 755 ${installer.binaryPath()}`) // @TODO if this is going in the user folder must have user permissions
        })
      }

      await commands.exec()

      installers.map(installer => {
        EventBus.emit(Installer.EVENTS.afterInstall, installer)
        EventBus.emit(Installer.EVENTS.installed, installer.toJSON())
      })

      if (isInstalled) await cli.startService()
      tmpDir.removeCallback()
      resolve()
    })
  }

  async uninstall(installers: Installer[]) {
    return new Promise(async (resolve, reject) => {
      const options = { disableGlob: true }

      try {
        installers.map(i => rimraf.sync(i.binaryPath(), options))
        rimraf.sync(environment.userPath, options)
      } catch (e) {
        reject(e)
      }

      resolve()
    })
  }
}

export default new BinaryInstaller()
