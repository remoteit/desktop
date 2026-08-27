import user from './User'
import AirBrake from './AirBrake'
import Logger from './Logger'
import environment from './environment'
import { promisify } from 'util'
import { exec, ExecException } from 'child_process'
import { sudoPromise } from './sudoPromise'

type StdExecException = ExecException & { stderr: string; stdout: string }

const execPromise = promisify(exec)
const reportedErrors = new Set<string>()

// Auth hashes are credentials and appear in nearly every CLI invocation. Scrub
// them from anything that leaves the machine -- not only the hash of the user
// we happen to have loaded, since a command can carry another account's.
const AUTH_HASH_PATTERN = /(--authhash[=\s]+)([A-Fa-f0-9]{8,})/g

// CLI exit codes that report an expected state rather than a defect. Each is
// already surfaced in the UI, so reporting them only buries real failures.
const EXPECTED_CLI_CODES = [
  '12', // config - you must be signed in
  '101', // agent not reachable
  '101001', // agent version mismatch
  '7003', // cmd - you must run this command with elevated privileges
]

export default class Command {
  commands: string[] = []
  admin: boolean = false
  quiet: boolean = false
  report: boolean = true
  onError: (error: Error) => void = () => {}

  constructor(options: {
    command?: string
    admin?: boolean
    onError?: ErrorCallback
    quiet?: boolean
    report?: boolean
  }) {
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
    Object.keys(params).forEach(key => {
      if (typeof params[key] === 'string') params[key] = scrub(params[key] as string)
    })
    return params
  }

  toSafeString() {
    return this.sanitize({ string: this.commands.join(' && ') }).string?.toString() || ''
  }

  parseStdError(error: string): Error {
    const cliError = error.match(/{.*}/)
    if (cliError) {
      const json: CliStderr = toJson(cliError[0])
      const newError = new Error()
      newError.message = json.message
      newError.name = json.code.toString()
      return newError
    }
    return new Error(error)
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
        // Output on stderr with a zero exit code is not a failure -- plenty of
        // the tools we shell out to write banners, warnings and progress there.
        // Log it and tell the UI, but don't report it as an error.
        this.log(`EXEC *** STD ERROR ***`, this.sanitize({ stderr: stderr.toString().trim() }), 'error', true)
        this.onError(this.parseStdError(stderr))
      }

      if (stdout) {
        result = toJson(stdout)
      }
    } catch (error) {
      if (isStdExecException(error)) {
        const cliError = this.parseStdError(error.stderr || error.stdout || error.message)
        this.airbrake(cliError, error, 'COMMAND ERROR')
        this.log(`EXEC CAUGHT *** STD ERROR ***`, { cliError, errorStack: error.stack }, 'error', true)
        this.onError(cliError)
      } else if (error instanceof Error) {
        this.log(`EXEC CAUGHT *** ERROR ***`, { error, errorStack: error.stack }, 'error', true)
      } else {
        Logger.error(`EXEC CAUGHT *** UNKNOWN ERROR ***`, { error }, 'error', true)
      }
    }

    return result
  }

  airbrake(cliError: Error, error: string | StdExecException, type: string) {
    if (!this.report || !isErrorReportable(cliError)) return
    AirBrake.notify({
      params: { type, exec: this.toSafeString() },
      context: { version: environment.version },
      error: scrubError(error),
    })
  }
}

// isStdExecException Type Guard
function isStdExecException(error: any): error is StdExecException {
  return !!error.stdout || !!error.stderr
}

function isErrorReportable(error: Error) {
  if (EXPECTED_CLI_CODES.includes(error.name)) return false
  if (error.message.includes('read-only file system')) return false

  // error.name is the CLI exit code, but every non-JSON stderr shares the name
  // "Error" -- keying on it alone collapses all of them into a single slot.
  const key = `${error.name}:${fingerprint(error.message)}`
  if (reportedErrors.has(key)) return false

  reportedErrors.add(key)
  return true
}

// Collapse the parts of a message that vary per run -- ids, ports, paths and
// versions -- so one failure isn't reported once per device or connection.
function fingerprint(message: string) {
  return message
    .toLowerCase()
    .replace(/\b[0-9a-f]{2}(:[0-9a-f]{2})+\b/g, '#') // device and service ids
    .replace(/\d+/g, '#')
    .slice(0, 200)
}

function scrub(text: string) {
  let result = text.replace(AUTH_HASH_PATTERN, '$1[CLEARED]')
  if (user.authHash) result = result.replace(new RegExp(user.authHash, 'g'), '[CLEARED]')
  return result
}

function scrubError(error: string | StdExecException): Error {
  const source = typeof error === 'string' ? new Error(error) : error
  const scrubbed = new Error(scrub(source.message))
  scrubbed.name = source.name
  if (source.stack) scrubbed.stack = scrub(source.stack)
  return scrubbed
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
