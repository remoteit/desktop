import tmp from 'tmp'
import debug from 'debug'
import Logger from './Logger'
import Environment from './Environment'
import EventBus from './EventBus'
import Installer from './Installer'
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

      let mv: string[] = []
      if (Environment.isWindows) {
        await this.createWindowsTargetDir()
        mv = mv.concat(
          this.installers.map(
            installer =>
              `move /y "${installer.tempFile}" "${installer.binaryPath}" && icacls "${installer.binaryPath}" /T /Q /grant Users:RX`
          )
        )
      } else {
        mv = mv.concat(
          this.installers.map(
            installer =>
              `mkdir -p ${installer.targetDirectory} && mv ${installer.tempFile} ${installer.binaryPath} && chmod 755 ${installer.binaryPath}`
          )
        )
      }

      d('Running command:', mv.join(' && '))
      Logger.info('Running command', { command: mv.join(' && ') })

      sudo.exec(mv.join(' && '), this.options, (error: Error, stdout: any, stderr: any) => {
        d('Command error:', error)
        d('Command stderr:', stderr)
        d('Command stdout:', stdout)

        if (error) return reject(error.message)
        if (stderr) return reject(stderr)
        resolve(stdout)
        this.installers.map(installer => EventBus.emit(Installer.EVENTS.afterInstall, installer))
        this.installers.map(installer => EventBus.emit(Installer.EVENTS.installed, installer))
        tmpDir.removeCallback()
      })
    })
  }

  async createWindowsTargetDir() {
    try {
      if (!existsSync(Environment.binPath)) {
        const { stdout, stderr } = await sudoPromise(`md "${Environment.binPath}"`, this.options)
        if (stderr) Logger.info('Make directory stderr:', stderr)
        if (stdout) Logger.info('Make directory stdout:', stdout)
      }
    } catch (error) {
      // eat directory already exists errors
      Logger.info('Make directory error:', error)
    }
  }
}
