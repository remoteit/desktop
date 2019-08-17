import ConnectdInstaller from './ConnectdInstaller'
import debug from 'debug'
import EventBus from './EventBus'
import Logger from './Logger'
import Tracker from './Tracker'
import { execFile, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'

const d = debug('r3:backend:Connection')

export default class Connection extends EventEmitter {
  private authHash: string
  public id: string
  public host: string
  public name?: string
  public pid?: number
  public port: number
  private username: string
  // private password?: string
  private process?: ChildProcess

  static EVENTS: { [name: string]: SocketEvent } = {
    started: 'service/connect/started',
    connected: 'service/connected',
    disconnected: 'service/disconnected',
    forgotten: 'service/forgotten',
    error: 'service/error',
    status: 'service/status',
    uptime: 'service/uptime',
    request: 'service/request',
    tunnelOpened: 'service/tunnel/opened',
    tunnelClosed: 'service/tunnel/closed',
    throughput: 'service/throughput',
    version: 'service/version',
    unknown: 'service/unknown-event',
  }

  constructor(args: {
    id: string
    port: number
    username: string
    authHash: string
    host?: string
    name?: string
  }) {
    super()
    this.authHash = args.authHash
    this.id = args.id
    this.host = args.host || '127.0.0.1'
    this.port = args.port
    this.name = args.name || `${this.host}:${this.port}`
    this.username = args.username
  }

  async start() {
    EventBus.emit(Connection.EVENTS.started, this.toJSON())
    Tracker.pageView(`/connections/${this.id}/start`)
    Tracker.event('connection', 'start', `connecting to service: ${this.id}`)
    Logger.info('Starting connection:', this.toJSON())
    const usernameBase64 = Buffer.from(this.username).toString('base64')
    this.process = execFile(
      ConnectdInstaller.binaryPath,
      [
        // TODO: Support password login too?
        '-s',
        '-p',
        usernameBase64,
        this.authHash,
        this.id, // Service ID
        `T${this.port}`, // Bind port
        '2', // Encryption
        this.host, // Bind address
        '0.0.0.0', // Restricted connection IP
        '12', // Max out
        '0', // Lifetime
        '0', // Grace period
      ],
      {
        maxBuffer: Infinity,
      },
      (
        error: Error | null,
        stdout: string | Buffer,
        stderr: string | Buffer
      ) => {
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
    Logger.info('Killing connection:', this.toJSON())
    Tracker.pageView(`/connections/${this.id}/kill`)
    Tracker.event('connection', 'kill', 'kill service')
    if (this.process) this.process.kill()
    this.process = undefined
  }

  async stop() {
    Logger.info('Stopping connection:', this.toJSON())
    Tracker.pageView(`/connections/${this.id}/stop`)
    Tracker.event('connection', 'stop', 'stopping service')
    await this.kill()
    EventBus.emit(Connection.EVENTS.disconnected, {
      connection: this.toJSON(),
    } as ConnectdMessage)
  }

  async restart() {
    Logger.info('Restarting connection:', this.toJSON())
    Tracker.pageView(`/connections/${this.id}/restart`)
    Tracker.event('connection', 'restart', `restarting service: ${this.id}`)
    if (this.process && this.process.pid) await this.stop()
    await this.start()
  }

  toJSON = (): ConnectionData => {
    return {
      id: this.id,
      pid: this.process ? this.process.pid : undefined,
      port: this.port,
      name: this.name,
    }
  }

  private handleError = (error: Error) => {
    Logger.error('connectd error: ' + error.message)
    Tracker.event('connection', 'error', `connection error: ${this.id}`)
    EventBus.emit('error', { error: error.message })
  }

  private handleClose = async (code: number) => {
    Logger.error(`Connection closed with code: ${code}`)
    Tracker.event('connection', 'connection-closed', `connection closed`, code)

    // Make sure kill the process.
    await this.kill()

    EventBus.emit(Connection.EVENTS.disconnected, {
      connection: this.toJSON(),
      raw: `Connection closed`,
    } as ConnectdMessage)

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
      let name
      let extra: any
      if (line.includes('seconds since startup')) {
        name = events.uptime
      } else if (line.startsWith('!!status')) {
        name = events.status
      } else if (line.startsWith('!!throughput')) {
        name = events.throughput
      } else if (line.startsWith('!!request')) {
        name = events.request
      } else if (line.startsWith('!!connected')) {
        EventBus.emit(events.connected, this.toJSON())
        return
      } else if (line.includes('exit - process closed')) {
        name = events.disconnected
      } else if (line.includes('connecttunnel')) {
        name = events.tunnelOpened
      } else if (line.includes('closetunnel')) {
        name = events.tunnelClosed
      } else if (line.includes('Version')) {
        name = events.version
        const match = line.match(/Version ([\d\.]*)/)
        if (match && match.length > 1) extra = { version: match[1] }
        // TODO: return local IP
        // } else if (line.includes('primary local ip')) {
        //   localIP = localIP
        //   connectd.emit(EVENTS.updated, {}) //this.toJSON())
      } else {
        name = events.unknown
      }

      EventBus.emit(name, {
        connection: this.toJSON(),
        extra,
        raw: line,
      } as ConnectdMessage)
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
