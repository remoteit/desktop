import tmp from 'tmp'
import path from 'path'
import debug from 'debug'
import environment from './environment'
import EventBus from './EventBus'
import Installer from './Installer'
import Command from './Command'
import { existsSync } from 'fs'

tmp.setGracefulCleanup()
const d = debug('r3:backend:BinaryInstaller')

class BinaryInstaller {
  options = { name: 'remoteit' }

  async install(installers: Installer[]) {
    return new Promise(async (resolve, reject) => {
      // Download and install binaries
      var tmpDir = tmp.dirSync({ unsafeCleanup: true, keep: true })

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
        if (!existsSync(environment.binPath)) commands.push(`md "${environment.binPath}"`)
        installers.map(installer => {
          commands.push(`move /y "${installer.tempFile}" "${installer.binaryPath}"`)
          commands.push(`icacls "${installer.binaryPath}" /T /Q /grant "*S-1-5-32-545:RX"`) // Grant all group "Users" read and execute permissions
        })
      } else {
        if (!existsSync(environment.binPath)) commands.push(`mkdir -p ${environment.binPath}`)
        installers.map(installer => {
          commands.push(`mv ${installer.tempFile} ${installer.binaryPath}`)
          commands.push(`chmod 755 ${installer.binaryPath}`) // @TODO if this is going in the user folder must have user permissions
        })
      }

      await commands.exec()

      installers.map(installer => {
        EventBus.emit(Installer.EVENTS.afterInstall, installer)
        EventBus.emit(Installer.EVENTS.installed, installer)
      })

      tmpDir.removeCallback()
      resolve()
    })
  }

  async uninstall(installers: Installer[]) {
    return new Promise(async (resolve, reject) => {
      let commands

      // USER FILES
      commands = new Command({ onError: reject })
      if (environment.isWindows) {
        installers.map(i => i.fileExists(i.binaryPath) && commands.push(`del /Q /F "${i.binaryPath}"`))
        if (existsSync(environment.userPath)) commands.push(`rmdir /Q /S "${environment.userPath}"`)
        if (existsSync(environment.binPath)) commands.push(`rmdir /Q /S "${environment.binPath}"`)
      } else {
        installers.map(i => i.fileExists(i.binaryPath) && commands.push(`rm -f ${i.binaryPath}`))
        if (existsSync(environment.userPath)) commands.push(`rm -rf ${environment.userPath}`)
      }
      await commands.exec()

      // ADMIN FILES - Should only be here if installed target by entering password
      commands = new Command({ admin: true, onError: reject })
      if (environment.isWindows) {
        if (existsSync(environment.adminPath)) commands.push(`rmdir /Q /S "${environment.adminPath}"`)
      } else {
        if (existsSync(environment.adminPath)) commands.push(`rm -rf ${environment.adminPath}`)
      }
      await commands.exec()

      resolve()
    })
  }
}

export default new BinaryInstaller()
