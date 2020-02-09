import tmp from 'tmp'
import path from 'path'
import debug from 'debug'
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
        EventBus.emit(Installer.EVENTS.installed, installer)
      })

      tmpDir.removeCallback()
      resolve()
    })
  }

  async uninstall(installers: Installer[]) {
    return new Promise(async (resolve, reject) => {
      const admin: boolean = true

      // USER FILES
      let commands = new Command({ onError: reject })
      installers.map(i => this.removeFile(commands, i.binaryPath()))
      this.removeDir(commands, environment.userPath)
      await commands.exec()

      // ADMIN FILES - Should only be here if installed target by entering password
      let adminCommands = new Command({ admin, onError: reject })
      installers.map(i => this.removeFile(adminCommands, i.binaryPath(admin)))
      this.removeDir(adminCommands, environment.adminPath)
      if (environment.isWindows) this.removeDir(adminCommands, environment.binPath(admin))
      await adminCommands.exec()

      resolve()
    })
  }

  removeFile(commands: Command, path: string) {
    if (!existsSync(path)) return
    commands.push(environment.isWindows ? `del /Q /F "${path}"` : `rm -f ${path}`)
  }

  removeDir(commands: Command, path: string) {
    if (!existsSync(path)) return
    commands.push(environment.isWindows ? `rmdir /Q /S "${path}"` : `rm -rf ${path}`)
  }
}

export default new BinaryInstaller()
