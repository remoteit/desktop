import AirBrake from './AirBrake'
import user from './User'
import Logger from './Logger'
import environment from './environment'
import { promisify } from 'util'
import { exec } from 'child_process'
import { sudoPromise } from './sudoPromise'

const execPromise = promisify(exec)

export default class Command {
  commands: string[] = []
  admin: boolean = false
  quiet: boolean = false

  onError: ErrorCallback = () => {}

  constructor(options: { command?: string; admin?: boolean; onError?: ErrorCallback; quiet?: boolean }) {
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

  log(message: string, params: ILookup<string>, type: 'info' | 'warn' | 'error' = 'info') {
    if (this.quiet) return
    if (user.authHash) {
      Object.keys(params).forEach(key => {
        if (typeof params[key] === 'string' && params[key].includes(user.authHash))
          params[key] = params[key].replace(new RegExp(user.authHash, 'g'), '[CLEARED]')
      })
    }
    Logger[type](message, params)
  }

  parseCliErrors(error: string) {
    const jsonError = error.match(/{.*}/)
    if (jsonError) {
      const { details }: CliStderr = JSON.parse(jsonError[0])
      return details.join('\n')
    }
    return error
  }

  async exec() {
    if (this.commands.length === 0) return ''

    let result = ''
    this.log('EXEC', {
      quiet: !this.onError,
      exec: this.toString(),
      admin: this.admin,
      headless: environment.isHeadless,
      elevated: environment.isElevated,
    })

    try {
      const { stdout, stderr } =
        this.admin && !environment.isHeadless && !environment.isElevated
          ? await sudoPromise(this.toString())
          : await execPromise(this.toString())

      if (stderr) {
        this.log(`EXEC *** ERROR ***`, { stderr: stderr.toString().trim() }, 'error')
        AirBrake.notify({
          params: { type: 'COMMAND STDERR', exec: this.toString() },
          error: stderr.toString(),
        })
        result = this.parseCliErrors(stderr)
        this.onError(new Error(result))
      }

      if (stdout) {
        this.log(`EXEC SUCCESS`, { stdout: stdout.toString().trim() })
        result = stdout.toString()
      }
    } catch (error) {
      AirBrake.notify({
        params: { type: 'COMMAND ERROR', exec: this.toString() },
        error,
      })
      this.log(`EXEC CAUGHT *** ERROR ***`, { error, errorMessage: error.message }, 'error')
      result = this.parseCliErrors(error.message)
      this.onError(new Error(result))
    }

    return result
  }
}
