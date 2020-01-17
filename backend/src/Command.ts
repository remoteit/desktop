import AirBrake from './AirBrake'
import Logger from './Logger'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as sudo from 'sudo-prompt'

const sudoPromise = promisify(sudo.exec)
const execPromise = promisify(exec)

export default class Command {
  name: string = 'remoteit'
  commands: string[] = []
  admin: boolean = true
  onError: (error: Error) => void = () => {}

  constructor(options: { command?: string; admin?: boolean; onError?: (error: Error) => void }) {
    if (options.command) this.commands = [options.command]
    options.command = undefined
    Object.assign(this, options)
  }

  push(command: string) {
    this.commands.push(command)
  }

  toString() {
    return this.commands.join(' && ')
  }

  async exec() {
    if (this.commands.length === 0) return ''

    let result = ''
    Logger.info('EXEC', { exec: this.toString(), admin: this.admin })

    try {
      const { stdout, stderr } = this.admin
        ? await sudoPromise(this.toString(), { name: this.name })
        : await execPromise(this.toString())

      if (stderr) {
        Logger.warn(`EXEC *** ERROR *** ${this.toString()}`, { stderr: stderr.toString() })
        AirBrake.notify({ message: 'COMMAND STDERR', command: this.toString(), stderr: stderr.toString() })
        this.onError(stderr.toString())
        result = stderr.toString()
      }

      if (stdout) {
        Logger.info(`EXEC SUCCESS ${this.toString()}`, { stdout: stdout.toString() })
        result = stdout.toString()
      }
    } catch (error) {
      AirBrake.notify({ message: 'COMMAND ERROR', command: this.toString(), error })
      Logger.warn(`EXEC ERROR CAUGHT ${this.toString()}`, { error, errorMessage: error.message })
      this.onError(error)
      result = error.toString()
    }

    Logger.info(`EXEC COMPLETE ${this.toString()}`, { result })
    return result
  }
}
