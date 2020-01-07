import RemoteitInstaller from './RemoteitInstaller'
import AirBrake from './AirBrake'
import Logger from './Logger'
import * as sudo from 'sudo-prompt'
import { exec } from 'child_process'
import { promisify } from 'util'

const sudoPromise = promisify(sudo.exec)
const execPromise = promisify(exec)

export default class Command {
  name: string = 'remoteit'
  commands: string[] = []
  admin: boolean = true
  onError: (error: Error) => void = () => {}

  constructor(options: { commands?: string[]; admin?: boolean; onError?: (error: Error) => void }) {
    Object.assign(this, options)
  }

  push(command: string) {
    this.commands.push(command)
  }

  toString() {
    return `${RemoteitInstaller.binaryPath} ${this.commands.join(' && ')}`
  }

  async exec() {
    if (this.commands.length === 0) return

    let result = ''
    Logger.info('EXEC', { exec: this.toString(), admin: this.admin })

    try {
      const { stdout, stderr } = this.admin
        ? await sudoPromise(this.toString(), { name: this.name })
        : await execPromise(this.toString())

      if (stderr) {
        Logger.warn(`EXEC *** ERROR *** ${this.toString()}`, { stderr: stderr.toString() })
        AirBrake.notify({ command: this.toString(), stderr })
        this.onError(stderr.toString())
        result = stderr.toString()
      }

      if (stdout) {
        Logger.info(`EXEC SUCCESS ${this.toString()}`, { stdout: stdout.toString() })
        result = stdout.toString()
      }
    } catch (error) {
      AirBrake.notify({ command: this.toString(), error })
      Logger.warn(`EXEC ERROR CAUGHT ${this.toString()}`, { error, errorMessage: error.message })
      this.onError(error)
      result = error.toString()
    }

    Logger.info(`EXEC COMPLETE ${this.toString()}`, { result })
    return result
  }
}
