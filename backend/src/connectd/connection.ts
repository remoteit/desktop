import debug from 'debug'
import { IService } from 'remote.it'
import { execFile } from 'child_process'
import { targetPath } from './host'

const d = debug('r3:desktop:connectd:connection')

interface ConnectdMessage {
  type: string
  raw: string
  serviceID: string
  port: number
}

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
  connection: Connection
  user: User
}

export async function connect({
  connection,
  user,
}: ConnectProps): Promise<ConnectdProcess> {
  d('Connecting to connectd process: %O', {
    connection,
    username: user.username,
  })

  // Start the connectd process and handle any errors that occur
  // on initialization.
  const connectd = startConnectd(
    { connection, user },
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
  // connectd.serviceID = serviceID
  // connectd.serviceName = name
  // connectd.deviceID = deviceID
  // connectd.type = type
  // connectd.port = port

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
  { connection, user }: ConnectProps,
  callback: (
    error: Error | null,
    stdout: string | Buffer,
    stderr: string | Buffer
  ) => void
): ConnectdProcess {
  const usernameBase64 = Buffer.from(user.username).toString('base64')

  d('Creating connection:', {
    connection,
    username: user.username,
  })

  const connectd = execFile(
    targetPath(),
    [
      '-s',
      '-p',
      usernameBase64,
      user.authHash,
      connection.serviceID.trim(), // Service ID
      `T${connection.port}`, // Bind port
      '1', // Encryption
      '127.0.0.1', // Bind address
      '0.0.0.0', // Restricted connection IP
      '12', // Max out
      '0', // Lifetime
      '0', // Grace period
    ],
    {
      maxBuffer: Infinity,
    },
    callback
  ) as ConnectdProcess

  // TODO: Deal with this better
  if (!connectd || !connectd.stderr || !connectd.stdout) {
    throw new Error('connectd process could not be called')
  }

  return Object.assign(connectd, connection)
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
    if (code !== 0) {
      console.error('⚠️  Closing with error code:', code)
      // TODO: Show code message:
      // !!exit [001] : process lifetime expired
      // !!exit [002] : shutdown packet received
      // !!exit [003] : termination from windows signal
      // !!exit [003] : termination from signal (all platforms except windows)
      // !!exit [004] : Disabled By User Configuration
      // !!exit [010] : bad user specified  (probably not possible at this time)
      // !!exit [011] : authentication error (may be multiple because of retry)
      // !!exit [012] : auto connect failed (Initiator p2p connect failed)
      // !!exit [013] : Initiate session create failed (initiator p2p connect failed !autoconnect)
      // !!exit [014] : Connection To remot3.it Service has Timed Out
      // !!exit [015] : cannot get UID from service (not a initiator side error)
      // !!exit [016] : Cannot Bind UDP Port (UDP P2P port)
      // !!exit [017] : Cannot Bind Proxy Port (initiator port)
      // !!exit [020] : connection to peer closed or timed out
      // !!exit [021] : connection to peer failed (failed p2p connect)
      // !!exit [025] : unknown reason (this should not happen)
      // !!exit [030] : user console exit
    }
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
      } else if (line.startsWith('!!status')) {
        type = EVENTS.status
      } else if (line.startsWith('!!throughput')) {
        type = EVENTS.throughput
      } else if (line.startsWith('!!request')) {
        type = EVENTS.request
      } else if (line.startsWith('!!connected')) {
        type = EVENTS.connected
      } else if (line.includes('exit - process closed')) {
        type = EVENTS.disconnected
      } else if (line.includes('connecttunnel')) {
        type = EVENTS.tunnelOpened
      } else if (line.includes('closetunnel')) {
        type = EVENTS.tunnelClosed
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
        const message: ConnectdMessage = {
          type,
          raw: line,
          serviceID: connectd.serviceID,
          port: connectd.port,
        } // service.id }
        d('Received message from connectd: %O', message)
        connectd.emit(type, message)
      }
    }
  }
}
