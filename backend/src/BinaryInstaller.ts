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
          commands.push(`chmod 755 ${installer.binaryPath}`)
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
      const commands = new Command({ admin: true, onError: reject })

      if (environment.isWindows) {
        installers.map(installer => commands.push(`del /Q /F "${installer.binaryPath}"`))
        if (existsSync(environment.userPath)) commands.push(`rmdir /Q /S "${environment.userPath}"`)
        if (existsSync(environment.adminPath)) commands.push(`rmdir /Q /S "${environment.adminPath}"`)
        if (existsSync(environment.binPath)) commands.push(`rmdir /Q /S "${environment.binPath}"`)
      } else {
        if (existsSync(environment.userPath)) commands.push(`rm -rf ${environment.userPath}`)
        if (existsSync(environment.adminPath)) commands.push(`rm -rf ${environment.adminPath}`)
        installers.map(installer => {
          const files = installer.dependencyNames.concat(installer.binaryName)
          files.map(
            file => installer.fileExists(file) && commands.push(`rm -f ${path.join(environment.binPath, file)}`)
          )
        })
      }

      await commands.exec()
      resolve()
    })
  }
}

export default new BinaryInstaller()
