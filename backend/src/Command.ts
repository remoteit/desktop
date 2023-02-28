import cli from './cliInterface'
import user from './User'
import AirBrake from './AirBrake'
import Logger from './Logger'
import environment from './environment'
import { promisify } from 'util'
import { exec, ExecException } from 'child_process'
import { sudoPromise } from './sudoPromise'

type StdExecException = ExecException & { stderr: string; stdout: string }

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

  log(
    message: string,
    params: ILookup<object | string | boolean | undefined>,
    type: 'info' | 'warn' | 'error' = 'info',
    force?: boolean
  ) {
    if (this.quiet && !force) return
    Logger[type](message, this.sanitize(params))
  }

  sanitize(params: ILookup<object | string | boolean | undefined>) {
    if (user.authHash) {
      Object.keys(params).forEach(key => {
        if (typeof params[key] === 'string' && params[key]?.toString().includes(user.authHash))
          params[key] = params[key]?.toString().replace(new RegExp(user.authHash, 'g'), '[CLEARED]')
      })
    }
    return params
  }

  toSafeString() {
    return this.sanitize({ string: this.commands.join(' && ') }).string?.toString() || ''
  }

  parseStdError(error: string): CliStderr {
    const cliError = error.match(/{.*}/)
    if (cliError) {
      return toJson(cliError[0])
    }
    return { message: error, code: -1 }
  }

  async exec() {
    if (this.commands.length === 0) return ''

    let result = ''

    try {
      this.log('EXEC', {
        displayed: !!this.onError,
        exec: this.toString(),
        admin: this.admin,
        elevated: environment.isElevated,
      })

      const { stdout, stderr } =
        this.admin && !environment.isHeadless && !environment.isElevated
          ? await sudoPromise(this.toString())
          : await execPromise(this.toString())

      if (stderr) {
        this.log(`EXEC *** STD ERROR ***`, this.sanitize({ stderr: stderr.toString().trim() }), 'error', true)
        const cliError = this.parseStdError(stderr)
        this.airbrake(cliError, stderr.toString(), 'COMMAND STDERR')
        this.onError(new Error(cliError.message))
      }

      if (stdout) {
        result = toJson(stdout)
      }
    } catch (error) {
      if (isStdExecException(error)) {
        const cliError = this.parseStdError(error.stderr || error.stdout || error.message)
        this.airbrake(cliError, error, 'COMMAND ERROR')
        this.log(`EXEC CAUGHT *** STD ERROR ***`, { error, errorStack: error.stack }, 'error', true)
        this.onError(new Error(cliError.message))
      } else if (error instanceof Error) {
        this.log(`EXEC CAUGHT *** ERROR ***`, { error, errorStack: error.stack }, 'error', true)
      } else {
        Logger.error(`EXEC CAUGHT *** UNKNOWN ERROR ***`, { error }, 'error', true)
      }
    }

    return result
  }

  airbrake(cliError: CliStderr, error: string | StdExecException, type: string) {
    if (isErrorReportable(cliError)) {
      AirBrake.notify({
        params: { type, exec: this.toString() },
        context: { version: environment.version },
        error,
      })
    }
  }
}

// isStdExecException Type Guard
function isStdExecException(error: any): error is StdExecException {
  return !!error.stdout || !!error.stderr
}

function isErrorReportable(error: CliStderr) {
  const newError = error.code > 0 ? !cli.data.errorCodes.includes(error.code) : true
  const reportable = !error.message.includes('read-only file system') && newError
  if (newError) cli.data.errorCodes.push(error.code)
  return reportable
}

function toJson(string: string) {
  let result
  try {
    result = JSON.parse(string)
  } catch (error) {
    return string
  }
  return result
}
