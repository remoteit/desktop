import debug from 'debug'
import Environment from './Environment'
import EventBus from './EventBus'
import Installer from './Installer'
import * as sudo from 'sudo-prompt'

const d = debug('r3:backend:BinaryInstaller')

export default class BinaryInstaller {
  installers: Installer[]

  constructor(installers: Installer[]) {
    this.installers = installers
  }

  async install() {
    return new Promise(async (resolve, reject) => {
      // Download and install binaries
      await Promise.all(
        this.installers.map(installer =>
          installer
            .install((progress: number) =>
              EventBus.emit(Installer.EVENTS.progress, { progress, installer })
            )
            .then(() => {
              // For Windows, we don't need admin permissions:
              if (Environment.isWindows) {
                EventBus.emit(Installer.EVENTS.installed, installer)
              }
            })
            .catch(error =>
              EventBus.emit(Installer.EVENTS.error, {
                error: error.message,
                installer,
              })
            )
        )
      )

      // TODO: only require this on inital install
      if (!Environment.isWindows) {
        const options = { name: 'remoteit' }
        const cmds = this.installers.map(
          installer =>
            `mv ${installer.downloadPath} ${
              installer.binaryPath
            } && chmod 755 ${installer.binaryPath}`
        )
        const cmd = cmds.join(' && ')
        d('Running command:', cmd)
        sudo.exec(cmd, options, (error: Error, stdout: any, stderr: any) => {
          d('Command error:', error)
          d('Command stderr:', stderr)
          d('Command stdout:', stdout)

          if (error) return reject(error.message)
          if (stderr) return reject(stderr)
          resolve(stdout)
          this.installers.map(installer =>
            EventBus.emit(Installer.EVENTS.installed, installer)
          )

          // if (error) return failure(error)
          // if (stderr) return failure(stderr)
          // success(stdout)
        })
      }
    })
  }
}
