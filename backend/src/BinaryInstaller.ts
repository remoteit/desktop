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

export default class BinaryInstaller {
  installers: Installer[]
  options = { name: 'remoteit' }

  constructor(installers: Installer[]) {
    this.installers = installers
  }

  async install() {
    return new Promise(async (resolve, reject) => {
      // Download and install binaries
      var tmpDir = tmp.dirSync({ unsafeCleanup: true, keep: true })

      await Promise.all(
        this.installers.map(installer =>
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
          await new Command({ commands: [`md "${Environment.binPath}"`], admin: true, onError: reject }).exec()
        }
        this.installers.map(installer => moveCommand.push(`move /y "${installer.tempFile}" "${installer.binaryPath}"`))
        this.installers.map(installer => setCommand.push(`icacls "${installer.binaryPath}" /T /Q /grant "Users":RX`))
      } else {
        this.installers.map(installer =>
          moveCommand.push(
            `mkdir -p ${installer.targetDirectory} && mv ${installer.tempFile} ${installer.binaryPath} && chmod 755 ${installer.binaryPath}`
          )
        )
      }

      await moveCommand.exec()
      await setCommand.exec()

      this.installers.map(installer => EventBus.emit(Installer.EVENTS.afterInstall, installer))
      this.installers.map(installer => EventBus.emit(Installer.EVENTS.installed, installer))

      tmpDir.removeCallback()
      resolve()
    })
  }
}
