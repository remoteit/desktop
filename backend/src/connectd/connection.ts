import debug from 'debug'
import { IService } from 'remote.it'
import { execFile } from 'child_process'
import { targetPath } from './host'

const d = debug('r3:desktop:connectd:connection')

export const EVENTS = {
  error: 'service/error',
  uptime: 'service/uptime',
  status: 'service/status',
  throughput: 'service/throughput',
  updated: 'service/updated',
  request: 'service/request',
  connecting: 'service/connecting',
  connected: 'service/connected',
  tunnelOpened: 'service/tunnel/opened',
  tunnelClosed: 'service/tunnel/closed',
  disconnected: 'service/disconnected',
  unknown: 'service/unknown-event',
}

export interface ConnectProps {
  port: number
  service: IService
  user: { authHash: string; username: string }
}

export async function connect({
  port,
  service,
  user,
}: ConnectProps): Promise<ConnectdProcess> {
  d('Connecting to connectd process: %O', {
    port,
    serviceID: service.id,
    username: user.username,
  })

  // Start the connectd process and handle any errors that occur
  // on initialization.
  const connectd = startConnectd(
    { port, service, user },
    (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
      if (error) {
        connectd.emit(EVENTS.error, { error: error.message })
      }
      if (stderr) {
        console.error(stderr.toString())
        connectd.emit(EVENTS.error, { error: stderr.toString() })
      }
    }
  )

  // Add meta data about the connectd process so it can
  // be retrieved later.
  connectd.service = service
  connectd.port = port

  // Handle connectd messages and pass them along to any
  // consumer.
  processConnectdLogs(connectd)

  return connectd
}

// export function disconnect() {
//   if (!connection) return
//   d('Disconnect from service:', this.serviceID)
//   if (Platform.isWindows) {
//     execFile('(taskkill /pid ' + this.connection.pid + ' /T /F')
//   } else {
//     this.connection.kill('SIGINT')
//   }
// }

function startConnectd(
  { port, service, user }: ConnectProps,
  callback: (
    error: Error | null,
    stdout: string | Buffer,
    stderr: string | Buffer
  ) => void
) {
  const usernameBase64 = Buffer.from(user.username).toString('base64')

  d('Creating connection:', {
    port,
    serviceID: service.id,
    username: user.username,
  })

  const connectd = execFile(
    targetPath(),
    [
      '-s',
      '-p',
      usernameBase64,
      user.authHash,
      service.id.trim(), // Service ID
      `T${port}`, // Bind port
      '1', // Encryption
      '127.0.0.1', // Bind address
      '0.0.0.0', // Restricted connection IP
      '12', // Max out
      '0', // Lifetime
      '0', // Grace period
    ],
    {},
    callback
  ) as ConnectdProcess

  // TODO: Deal with this better
  if (!connectd || !connectd.stderr || !connectd.stdout) {
    throw new Error('connectd process could not be called')
  }

  return connectd
}

function processConnectdLogs(connectd: ConnectdProcess) {
  if (!connectd || !connectd.stderr || !connectd.stdout) {
    throw new Error('connectd process could not be called')
  }

  connectd.stdout.on('data', handleStdOut(connectd))
  connectd.stderr.on('data', (buff: Buffer) => {
    const error = buff.toString()
    connectd.emit(EVENTS.error, error)
    console.error('⚠️  ERROR:', error)
  })

  connectd.on('error', error => connectd.emit('error', error))
  connectd.on('close', (code: number) => {
    connectd.emit('closed')
    if (code !== 0) console.error('⚠️  CLOSE:', code)
  })
}

function handleStdOut(connectd: ConnectdProcess) {
  return (buff: Buffer) => {
    // Split incoming lines from stdout so we can parse them
    // individually.
    const lines = buff
      .toString()
      .trim()
      .split(/\r?\n/)

    // Parse incoming messages and format messages for
    // emitting.
    for (const line of lines) {
      let type
      if (line.includes('seconds since startup')) {
        type = EVENTS.uptime
        // } else if (line.startsWith('!!status')) {
        //   type = EVENTS.status
      } else if (line.startsWith('!!throughput')) {
        type = EVENTS.throughput
      } else if (line.startsWith('!!request')) {
        type = EVENTS.request
      } else if (line.startsWith('!!connected')) {
        type = EVENTS.connected
      } else if (line.includes('exit - process closed')) {
        type = EVENTS.tunnelOpened
      } else if (line.includes('connecttunnel')) {
        type = EVENTS.tunnelClosed
      } else if (line.includes('closetunnel')) {
        type = EVENTS.disconnected
      } else {
        type = EVENTS.unknown
      }

      if (line.includes('Version')) {
        const match = line.match(/Version ([\d\.]*)/)
        if (match && match.length > 1) {
          // version = match[1]
        }
        // connection.emit(EVENTS.updated, this.toJSON())
      } else if (line.includes('primary local ip')) {
        // TODO: return local IP
        // localIP = localIP
        // connectd.emit(EVENTS.updated, {}) //this.toJSON())
      } else {
        const message = {
          type,
          raw: line,
          serviceID: connectd.service.id,
          port: connectd.port,
        } // service.id }
        d('Received message from connectd: %O', message)
        connectd.emit(type, message)
      }
    }
  }
}
