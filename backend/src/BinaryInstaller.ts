import tmp from 'tmp'
import debug from 'debug'
import Logger from './Logger'
import AirBrake from './AirBrake'
import Environment from './Environment'
import EventBus from './EventBus'
import Installer from './Installer'
import Command from './Command'
import { existsSync } from 'fs'
import { promisify } from 'util'
import * as sudo from 'sudo-prompt'

tmp.setGracefulCleanup()
const sudoPromise = promisify(sudo.exec)
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

      const moveCommand = new Command({ admin: true, onError: reject })
      const setCommand = new Command({ admin: true, onError: reject })

      if (Environment.isWindows) {
        if (!existsSync(Environment.binPath)) {
          await new Command({ command: `md "${Environment.binPath}"`, admin: true, onError: reject }).exec()
        }
        installers.map(installer => moveCommand.push(`move /y "${installer.tempFile}" "${installer.binaryPath}"`))
        installers.map(installer => setCommand.push(`icacls "${installer.binaryPath}" /T /Q /grant "Users":RX`))
      } else {
        installers.map(installer =>
          moveCommand.push(
            `mkdir -p ${installer.targetDirectory} && mv ${installer.tempFile} ${installer.binaryPath} && chmod 755 ${installer.binaryPath}`
          )
        )
      }

      await moveCommand.exec()
      await setCommand.exec()

      installers.map(installer => EventBus.emit(Installer.EVENTS.afterInstall, installer))
      installers.map(installer => EventBus.emit(Installer.EVENTS.installed, installer))

      tmpDir.removeCallback()
      resolve()
    })
  }

  async uninstall() {
    return new Promise(async (resolve, reject) => {
      const removeCommand = new Command({ admin: true, onError: reject })

      if (Environment.isWindows) {
        if (existsSync(Environment.userPath)) removeCommand.push(`rmdir /Q /S "${Environment.userPath}"`)
        if (existsSync(Environment.adminPath)) removeCommand.push(`rmdir /Q /S "${Environment.adminPath}"`)
        if (existsSync(Environment.binPath)) removeCommand.push(`rmdir /Q /S "${Environment.binPath}"`)
      } else {
        if (existsSync(Environment.userPath)) removeCommand.push(`rm -rf ${Environment.userPath}`)
        if (existsSync(Environment.adminPath)) removeCommand.push(`rm -rf ${Environment.adminPath}`)
        if (existsSync(Environment.binPath)) removeCommand.push(`rm -rf ${Environment.binPath}`)
      }

      await removeCommand.exec()
      // installers.map(installer => EventBus.emit(Installer.EVENTS.uninstalled, installer))
      resolve()
    })
  }
}

export default new BinaryInstaller()
