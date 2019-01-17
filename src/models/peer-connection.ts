import debug from 'debug'
import { execFile } from 'child_process'
import { EventEmitter } from 'events'

const d = debug('desktop:models:peer-connection')

const CONNECT_TIMEOUT = 30000

type Options = {
  port: number
  serviceID: string
}

export default class PeerConnection extends EventEmitter {
  public port: number
  public serviceID: string

  constructor(opts: Options) {
    super()
    d('[PeerConnection.constructor] Creating PeerConnection:', opts)

    // TODO: auto generate available port
    this.port = opts.port
    this.serviceID = opts.serviceID
  }

  public start = () => {
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

    const connectd = execFile(cmd, args)
    // TODO: enable kill process behavior
    d('[Connectd.connect] connectd process created:', {
      pid: connectd.pid,
      port: this.port,
      serviceID: this.serviceID,
    })
    // pid, kill
    connectd.stdout.on('data', this.handleLog)
    connectd.stderr.on('data', this.handleError)
    connectd.on('close', this.handleClose)

    return new Promise((success, failure) => {
      const timeout = setTimeout(() => {
        // TODO: Better error handling!!!!!!!!!
        failure(
          new Error('Could not connect to connectd peer-to-peer connection')
        )
      }, CONNECT_TIMEOUT)

      this.on('connected', () => {
        clearTimeout(timeout)
        success()
      })
    })
  }

  private handleLog = (buff: Buffer) => {
    const lines = buff
      .toString()
      .trim()
      .split(/\r?\n/)

    const status = '!!status'
    const throughput = '!!throughput'
    const request = '!!request'
    const connected = '!!connected'

    for (const line of lines) {
      let message
      let type
      if (line.startsWith(status)) {
        message = line.replace(status, '')
        type = 'status'
      } else if (line.startsWith(throughput)) {
        message = line.replace(throughput, '')
        type = 'throughput'
      } else if (line.startsWith(request)) {
        type = 'request'
        message = line.replace(request, '')
      } else if (line.startsWith(connected)) {
        type = 'connected'
        message = line.replace(connected, '')
        this.emit('connected')
      } else if (line.includes('connecttunnel')) {
        type = 'open-tunnel'
        message = 'Connection to service opened'
      } else if (line.includes('closetunnel')) {
        type = 'close-tunnel'
        message = 'Connection to service closed'
      } else {
        type = 'unknown'
        message = line
      }

      // d(`[${type}] ${message}`)
      this.emit('log', { message, type, serviceID: this.serviceID })
    }
  }

  private handleError = (buff: Buffer) => {
    console.error('⚠️  ERROR\t', buff.toString())
  }

  private handleClose = (code: number) => {
    if (code !== 0) {
      console.error('⚠️  connectd closed with code:', code)
    }
  }
}
