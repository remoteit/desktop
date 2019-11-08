import ConnectdInstaller from './ConnectdInstaller'
import debug from 'debug'
import EventBus from './EventBus'
import Logger from './Logger'
import Tracker from './Tracker'
import { execFile, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { IP_OPEN, IP_PRIVATE } from './constants'

const d = debug('r3:backend:Connection')

export default class Connection extends EventEmitter {
  params!: IConnection

  private authHash: string
  private username: string
  private process?: ChildProcess

  static EVENTS: { [name: string]: SocketEvent } = {
    started: 'service/started', // save log for 1yr
    connected: 'service/connected', // save log for 1yr
    disconnected: 'service/disconnected', // save log for 1yr
    forgotten: 'service/forgotten', // save log for 1yr
    error: 'service/error', // save log for 1yr
    status: 'service/status',
    uptime: 'service/uptime',
    request: 'service/request',
    tunnelOpened: 'service/tunnel/opened', // save log for 1yr
    tunnelClosed: 'service/tunnel/closed', // save log for 1yr
    throughput: 'service/throughput',
    version: 'service/version',
    unknown: 'service/unknown-event',
  }

  constructor(user: UserCredentials, connection: IConnection) {
    super()
    this.authHash = user.authHash
    this.username = user.username
    connection.createdTime = Date.now()
    this.set(connection)
  }

  set({ autoStart = true, host = IP_PRIVATE, restriction = IP_OPEN, ...connection }: IConnection) {
    this.params = { autoStart, host, restriction, ...connection }
    Logger.info('SET CONNECTION', { params: this.params })
  }

  async start() {
    // If the user indicates they want to start this connection,
    // we assume they want to start it on future sessions
    this.params.autoStart = true

    // Listen to events to synchronize state
    EventBus.emit(Connection.EVENTS.started, { connection: this.toJSON(), raw: 'Connection started' })
    Tracker.pageView(`/connections/${this.params.id}/start`)
    Tracker.event('connection', 'start', `connecting to service: ${this.params.id}`)
    Logger.info('Starting connection: ' + JSON.stringify(this.toJSON()))

    const usernameBase64 = Buffer.from(this.username).toString('base64')
    const params = [
      // TODO: Support password login too?
      '-s',
      '-p',
      usernameBase64,
      this.authHash,
      this.params.id, // Service ID
      `T${this.params.port}`, // Bind port
      '2', // Encryption
      `${this.params.host}`, // Bind address
      `${this.params.restriction}`, // Restricted connection IP
      '12', // Max out
      '0', // Lifetime
      '0', // Grace period
    ]

    this.process = execFile(
      ConnectdInstaller.binaryPath,
      params,
      {
        maxBuffer: Infinity,
      },
      (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
        let message = 'Unknown error'
        if (error) message = error.message
        if (stderr) message = stderr.toString()
        Logger.error(message)
        // EventBus.emit(EVENTS.error, {
        //   error: message,
        //   connection: this.toJSON(),
        // })
      }
    )

    Logger.info('connectd ' + params.join(' '))

    if (!this.process || !this.process.stdout || !this.process.stderr) {
      Logger.error('Could not start connectd process!')
      throw new Error('Could not start connectd process!')
    }

    this.process.stdout.on('data', this.handleStdOut)
    this.process.stderr.on('data', this.handleStdErr)
    this.process.on('error', this.handleError)
    this.process.on('close', this.handleClose)
  }

  async kill() {
    d('Killing service:', this.params.id)
    Logger.info('Killing connection:', this.toJSON())
    Tracker.pageView(`/connections/${this.params.id}/kill`)
    Tracker.event('connection', 'kill', 'kill service')

    if (this.process) this.process.kill()
    this.process = undefined
  }

  async stop(autoStart?: boolean) {
    // If the user manually stops a connection, we assume they
    // don't want it to automatically start on future connections.
    if (autoStart !== undefined) this.params.autoStart = autoStart
    this.params.active = false

    d('Stopping service:', this.params.id)
    Logger.info('Stopping connection:', this.toJSON())
    Tracker.pageView(`/connections/${this.params.id}/stop`)
    Tracker.event('connection', 'stop', 'stopping service')

    // Make sure the process is completely dead.
    await this.kill()

    EventBus.emit(Connection.EVENTS.disconnected, {
      connection: this.toJSON(),
    } as ConnectionMessage)
  }

  async restart() {
    Logger.info('Restarting connection:', this.toJSON())
    Tracker.pageView(`/connections/${this.params.id}/restart`)
    Tracker.event('connection', 'restart', `restarting service: ${this.params.id}`)

    d('Restart - stopping service:', this.params.id)
    if (this.process && this.process.pid) await this.stop()

    d('Restart - starting service:', this.params.id)
    await this.start()
  }

  toJSON = () => {
    return {
      ...this.params,
      pid: this.process ? this.process.pid : undefined,
    } as IConnection
  }

  private handleError = (error: Error) => {
    Logger.error('connectd error: ' + error.message)
    Tracker.event('connection', 'error', `connection error: ${this.params.id}`)
    EventBus.emit('error', { error: error.message })
    this.params.error = error
  }

  private handleClose = async (code: number) => {
    this.params.endTime = Date.now()

    // If we intentionally kill a process, we don't
    // want to go further
    if (code === 15) return

    Logger.error(`Connection closed with code: ${code}`)
    Tracker.event('connection', 'connection-closed', `connection closed`, code)

    // Make sure kill the process.
    // await this.kill()

    EventBus.emit(Connection.EVENTS.disconnected, {
      connection: this.toJSON(),
      raw: 'Connection closed',
    } as ConnectionMessage)

    if (code && code !== 0) {
      const messages: { [code: string]: string } = {
        1: 'process lifetime expired',
        2: 'shutdown packet received',
        3: 'termination from signal',
        4: 'Disabled By User Configuration',
        10: 'bad user specified  (probably not possible at this time)',
        11: 'authentication error (may be multiple because of retry)',
        12: 'auto connect failed (Initiator p2p connect failed)',
        13: 'Initiate session create failed (initiator p2p connect failed !autoconnect)',
        14: 'Connection To remot3.it Service has Timed Out',
        15: 'cannot get UID from service (not a initiator side error)',
        16: 'Cannot Bind UDP Port (UDP P2P port)',
        17: 'Cannot Bind Proxy Port (initiator port)',
        20: 'connection to peer closed or timed out',
        21: 'connection to peer failed (failed p2p connect)',
        25: 'unknown reason (this should not happen)',
        30: 'user console exit',
      }
      const message = messages[String(code)]

      console.error('⚠️  Closing with error code:', code, message)

      if (code === 3) return

      EventBus.emit(Connection.EVENTS.error, {
        code,
        connection: this.toJSON(),
        error: message,
      } as ConnectionErrorMessage)
    }
  }

  private handleStdOut = (buff: Buffer) => {
    // Split incoming lines from stdout so we can parse them
    // individually.
    const lines = buff
      .toString()
      .trim()
      .split(/\r?\n/)

    const events = Connection.EVENTS

    // Parse incoming messages and format messages for
    // emitting.
    for (const line of lines) {
      let event
      let extra: any
      if (line.startsWith('!!connected')) {
        this.params.startTime = Date.now()
        this.params.active = true
        event = events.connected
        Logger.info('connected!', line)
      } else if (line.includes('seconds since startup')) {
        // event = events.uptime
      } else if (line.startsWith('!!status')) {
        event = events.status
      } else if (line.startsWith('!!throughput')) {
        // event = events.throughput
      } else if (line.startsWith('!!request')) {
        event = events.request
      } else if (line.includes('exit - process closed')) {
        event = events.disconnected
      } else if (line.includes('connecttunnel')) {
        event = events.tunnelOpened
      } else if (line.includes('closetunnel')) {
        event = events.tunnelClosed
      } else if (line.includes('Version')) {
        event = events.version
        const match = line.match(/Version ([\d\.]*)/)
        if (match && match.length > 1) extra = { version: match[1] }
        // TODO: return local IP
        // } else if (line.includes('primary local ip')) {
        //   localIP = localIP
        //   connectd.emit(EVENTS.updated, {}) //this.toJSON())
      } else {
        event = events.unknown
      }

      d('connectd std out:', line)
      if (event) {
        EventBus.emit(event, {
          connection: this.toJSON(),
          extra,
          raw: line,
        } as ConnectionMessage)
      }
    }
  }

  private handleStdErr = (buff: Buffer) => {
    const error = buff.toString()
    EventBus.emit(Connection.EVENTS.error, {
      connection: this.toJSON(),
      error,
    } as ConnectionErrorMessage)
    console.error('⚠️  CONNECTD ERROR:', error)
  }
}
