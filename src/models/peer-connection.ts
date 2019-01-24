import debug from 'debug'
import path from 'path'
import Platform from './platform'
import { execFile, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'

const d = debug('desktop:models:peer-connection')

const CONNECT_TIMEOUT = 20000

type Options = {
  port: number
  serviceID: string
}

export class PeerConnection extends EventEmitter {
  public port: number
  public serviceID: string
  public version?: string
  public localIP?: string
  private connection?: ChildProcess
  public static EVENTS = {
    error: 'service:error',
    uptime: 'service:uptime',
    status: 'service:status',
    throughput: 'service:throughput',
    updated: 'service:updated',
    request: 'service:request',
    connecting: 'service:connecting',
    connected: 'service:connected',
    tunnelOpened: 'service:tunnel:opened',
    tunnelClosed: 'service:tunnel:closed',
    disconnected: 'service:disconnected',
    unknown: 'service:unknown-event',
  }

  constructor(opts: Options) {
    super()
    d('Creating PeerConnection: %o', opts)

    this.port = opts.port
    this.serviceID = opts.serviceID
  }

  public async connect() {
    this.connection = this.startConnectd()

    d('connectd process created:', {
      pid: this.connection.pid,
      port: this.port,
      serviceID: this.serviceID,
    })

    this.processOutput(this.connection)

    return new Promise((success, failure) => {
      const timeout = setTimeout(() => {
        // TODO: Better error handling!!!!!!!!!
        failure(
          new Error('Could not connect to connectd peer-to-peer connection')
        )
      }, CONNECT_TIMEOUT)

      this.on(PeerConnection.EVENTS.connected, () => {
        clearTimeout(timeout)
        success()
      })
    })
  }

  public async disconnect() {
    // TODO: How to handle error disconnecting?
    if (!this.connection) return
    d('Disconnect from service:', this.serviceID)

    if (Platform.isWindows) {
      execFile('(taskkill /pid ' + this.connection.pid + ' /T /F')
    } else {
      this.connection.kill('SIGINT')
    }
  }

  public toObject() {
    return { port: this.port, serviceID: this.serviceID }
  }

  public toJSON() {
    return this.toObject()
  }

  public valueOf() {
    return this.toObject()
  }

  private startConnectd() {
    this.emit(PeerConnection.EVENTS.connecting, this.toJSON())

    // TODO: Get these details from the portal
    const username = 'dana@remote.it'
    const password = 'asdfasdf'
    const usernameBase64 = Buffer.from(username).toString('base64')
    const passwordBase64 = Buffer.from(password).toString('base64')
    // const authHash = 'E0F1772E575D74755B8BBE236C470550E7A9FB36'

    const cmd = 'connectd'
    const args = [
      '-s',
      '-c',
      usernameBase64,
      passwordBase64,
      this.serviceID.trim(), // Service ID
      `T${this.port}`, // Bind port
      '1', // Encryption
      '127.0.0.1', // Bind address
      '12', // Max out
      '0', // Lifetime
      '0', // Grace period
    ]

    //$EXE -s -c $base_username $base_password $DEVICE_ADDRESS T$port 2 127.0.0.1 15 > $CONNECTION_LOG 2>&1 &

    return execFile(
      path.join(__dirname, cmd),
      args,
      {},
      (
        error: Error | null,
        stdout: string | Buffer,
        stderr: string | Buffer
      ) => {
        if (error) {
          this.emit(PeerConnection.EVENTS.error, error.message)
        }
        if (stderr) {
          console.log(stderr.toString())
          this.emit(PeerConnection.EVENTS.error, stderr.toString())
        }
        console.log(stdout.toString())
      }
    )
  }

  private processOutput(connectd: ChildProcess) {
    if (!connectd) return
    connectd.stdout.on('data', this.processStandardOut)
    connectd.stderr.on('data', this.processStandardError)
    connectd.on('close', this.handleClose)
  }

  private processStandardOut = (buff: Buffer) => {
    const lines = buff
      .toString()
      .trim()
      .split(/\r?\n/)

    const uptime = 'seconds since startup'
    const status = '!!status'
    const throughput = '!!throughput'
    const request = '!!request'
    const connected = '!!connected'
    const disconnected = 'exit - process closed'
    const tunnelOpened = 'connecttunnel'
    const tunnelClosed = 'closetunnel'
    const version = 'Version'
    const localIP = 'primary local ip'

    // Parse incoming messages and format messages for
    // emitting.
    for (const line of lines) {
      let type
      if (line.includes(uptime)) {
        type = PeerConnection.EVENTS.uptime
      } else if (line.startsWith(status)) {
        type = PeerConnection.EVENTS.status
      } else if (line.startsWith(throughput)) {
        type = PeerConnection.EVENTS.throughput
      } else if (line.startsWith(request)) {
        type = PeerConnection.EVENTS.request
      } else if (line.startsWith(connected)) {
        type = PeerConnection.EVENTS.connected
      } else if (line.includes(tunnelOpened)) {
        type = PeerConnection.EVENTS.tunnelOpened
      } else if (line.includes(tunnelClosed)) {
        type = PeerConnection.EVENTS.tunnelClosed
      } else if (line.includes(disconnected)) {
        type = PeerConnection.EVENTS.disconnected
      } else {
        type = PeerConnection.EVENTS.unknown
      }

      if (line.includes(version)) {
        // TODO: parse version number
        this.version = line
        this.emit(PeerConnection.EVENTS.updated, this.toJSON())
      } else if (line.includes(localIP)) {
        this.localIP = localIP
        this.emit(PeerConnection.EVENTS.updated, this.toJSON())
      } else {
        const message = { type, raw: line, serviceID: this.serviceID }
        d(`connectd message: %o`, message)
        this.emit(type, message)
      }
    }
  }

  private processStandardError = (buff: Buffer) => {
    const error = buff.toString()
    this.emit(PeerConnection.EVENTS.error, error)
    console.error('⚠️  ERROR:', error)
  }

  private handleClose = (code: number) => {
    this.emit('closed')
    if (code !== 0) {
      console.error('⚠️  CLOSE:', code)
    }
  }
}
