import AirBrake from './AirBrake'
import Logger from './Logger'
import environment from './environment'
import { promisify } from 'util'
import { exec } from 'child_process'
import * as sudo from 'sudo-prompt'

const sudoPromise = promisify(sudo.exec)
const execPromise = promisify(exec)

export default class Command {
  name: string = 'remoteit'
  commands: string[] = []
  admin: boolean = false
  quiet: boolean = false

  onError: (error: Error) => void = () => {}

  constructor(options: { command?: string; admin?: boolean; onError?: (error: Error) => void; quiet?: boolean }) {
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

  log(message: string, params: object, type: 'info' | 'warn' | 'error' = 'info') {
    if (!this.quiet) Logger[type](message, params)
  }

  async exec() {
    if (this.commands.length === 0) return ''

    let result = ''
    this.log('EXEC', {
      exec: this.toString(),
      admin: this.admin,
      headless: environment.isHeadless,
      elevated: environment.isElevated,
    })

    try {
      const { stdout, stderr } =
        this.admin && !environment.isHeadless && !environment.isElevated
          ? await sudoPromise(this.toString(), { name: this.name })
          : await execPromise(this.toString())

      if (stderr) {
        this.log(`EXEC *** ERROR *** ${this.toString()}`, { stderr: stderr.toString() }, 'error')
        AirBrake.notify({
          params: { type: 'COMMAND STDERR', command: this.toString() },
          error: stderr.toString(),
        })
        // Hiding these errors for now because successful CLI commands are in stderr
        this.onError(stderr.toString())
        result = stderr.toString()
      }

      if (stdout) {
        this.log(`EXEC SUCCESS ${this.toString()}`, { stdout: stdout.toString() })
        result = stdout.toString()
      }
    } catch (error) {
      AirBrake.notify({
        params: { type: 'COMMAND ERROR', command: this.toString() },
        error,
      })
      this.log(`EXEC ERROR CAUGHT ${this.toString()}`, { error, errorMessage: error.message }, 'error')
      this.onError(error)
      result = error.toString()
    }

    return result
  }
}
