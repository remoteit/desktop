import AirBrake from './AirBrake'
import user from './User'
import Logger from './Logger'
import environment from './environment'
import { promisify } from 'util'
import { exec } from 'child_process'
import { sudoPromise } from './sudoPromise'
import cli from './cliInterface'

const execPromise = promisify(exec)

export default class Command {
  commands: string[] = []
  admin: boolean = false
  quiet: boolean = false

  onError: (error: Error) => void = () => {}

  constructor(options: { command?: string; admin?: boolean; onError?: ErrorCallback; quiet?: boolean }) {
    if (options.command) this.commands = [options.command]
    options.command = undefined
    Object.assign(this, options)
  }

  push(command: string) {
    if (command) this.commands.push(command)
  }

  toString() {
    return this.commands.join(' && ')
  }

  log(message: string, params: ILookup<string | boolean>, type: 'info' | 'warn' | 'error' = 'info') {
    if (this.quiet) return
    Logger[type](message, this.sanitize(params))
  }

  sanitize(params: ILookup<string | boolean>) {
    if (user.authHash) {
      Object.keys(params).forEach(key => {
        if (typeof params[key] === 'string' && params[key].toString().includes(user.authHash))
          params[key] = params[key].toString().replace(new RegExp(user.authHash, 'g'), '[CLEARED]')
      })
    }
    return params
  }

  toSafeString() {
    return this.sanitize({ string: this.commands.join(' && ') }).string.toString()
  }

  parseJSONError(error: string) {
    const jsonError = error.match(/{.*}/)
    if (jsonError) {
      const { message }: CliStderr = JSON.parse(jsonError[0])
      return message
    }
    return error
  }

  async exec() {
    if (this.commands.length === 0) return ''

    let result = ''

    try {
      this.log('EXEC', {
        quiet: !this.onError,
        exec: this.toString(),
        admin: this.admin,
        elevated: environment.isElevated,
      })

      const { stdout, stderr } =
        this.admin && !environment.isHeadless && !environment.isElevated
          ? await sudoPromise(this.toString())
          : await execPromise(this.toString())

      if (stderr) {
        this.log(`EXEC *** ERROR ***`, this.sanitize({ stderr: stderr.toString().trim() }), 'error')
        if (this.isErrorReportable(stderr)) {
          AirBrake.notify({
            params: { type: 'COMMAND STDERR', exec: this.toString() },
            context: { version: environment.version },
            error: stderr.toString(),
          })
        }
        result = this.parseJSONError(stderr)
        this.onError(new Error(result))
      }

      if (stdout) {
        this.log(`EXEC SUCCESS`, { stdout: stdout.toString().trim() })
        result = stdout.toString()
      }
    } catch (error) {
      if (this.isErrorReportable(error, error.code)) {
        AirBrake.notify({
          params: { type: 'COMMAND ERROR', exec: this.toString() },
          context: { version: environment.version },
          error,
        })
        cli.data.errorCodes.push(error.code)
      }
      this.log(
        `EXEC CAUGHT *** ERROR ***`,
        { error, errorMessage: error.message, errorCode: error.code, errorStack: error.stack },
        'error'
      )
      result = this.parseJSONError(error.message)
      this.onError(new Error(result))
    }

    return result
  }

  isErrorReportable(stderr: string, code?: number) {
    const isErrorCode = code ? !cli.data.errorCodes.includes(code) : true
    return !stderr.toString().includes('read-only file system') && isErrorCode
  }
}
