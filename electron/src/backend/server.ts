import app from '.'
import cli from './cliInterface'
import debug from 'debug'
import EventBus from './EventBus'
import express, { Express } from 'express'
import fs from 'fs'
import os from 'os'
import path from 'path'
import https from 'https'
import user from './User'
import cors from 'cors'
import Logger from './Logger'
import SocketIO from 'socket.io'
import systemInfo from './systemInfo'
import socketioAuth from 'socketio-auth'
import Preferences from './preferences'
import environment from './environment'
import { createServer } from 'http'
import { WEB_PORT, SSL_PORT, WEB_DIR, SSL_DIR, START_ORIGIN } from './constants'
import { IP_PRIVATE, IP_OPEN } from '@common/constants'
import { agentOwnedMessage } from '@common/agentOwner'

const d = debug('Server')

// socketio-auth 0.1.1 hides unauthenticated sockets from broadcasts through socket.io 2 internals that
// socket.io 4 removed, so broadcasts go to this room, which a socket joins only once it authenticates.
export const AUTHENTICATED = 'authenticated'

const APP_PORTS: Record<string, number> = { 'http:': WEB_PORT, 'https:': SSL_PORT }
const LOOPBACK = ['localhost', IP_PRIVATE, '[::1]']

// os.networkInterfaces() throws a SystemError on some platforms; that must refuse the origin, not escape allowRequest.
const interfaceAddresses = () => {
  try {
    return Object.values(os.networkInterfaces())
      .flatMap(list => list ?? [])
      .map(({ address }) => (address.includes(':') ? `[${address}]` : address))
  } catch (error) {
    Logger.warn('NETWORK INTERFACES UNAVAILABLE', { error })
    return []
  }
}

// Allowlisted by hostname, not matched to the Host header: a DNS-rebound name that resolves here still sends
// its own name as the Origin. This machine's own names resolve through mDNS or LAN DNS, which a site can't steer.
const ownHostnames = () => {
  const name = os.hostname().toLowerCase()
  return [...LOOPBACK, ...interfaceAddresses(), name, `${name.split('.')[0]}.local`]
}

export const isSocketOrigin = (origin?: string, host?: string) => {
  let url: URL
  try {
    url = new URL(origin ?? '')
  } catch {
    return false
  }
  if (url.origin === START_ORIGIN) return true
  // Remote.It connections and port forwards serve the app on another loopback port; DNS rebinding never yields one.
  if (LOOPBACK.includes(url.hostname) && url.host === host?.toLowerCase()) return true
  const port = Number(url.port) || (url.protocol === 'https:' ? 443 : 80)
  return port === APP_PORTS[url.protocol] && ownHostnames().includes(url.hostname)
}

class Server {
  public io?: SocketIO.Server
  public socket?: SocketIO.Socket
  private app: Express

  EVENTS = {
    ready: 'ready',
  }

  constructor() {
    this.app = express()
    const router = express.Router()

    // ipAddress detection disabled until needed
    // this.app.use((req, res, next) => {
    //   const ipAddress = (req.ip || req.connection?.remoteAddress || undefined)?.replace(/.*:/g, '')
    //   Logger.info('REQUEST IP_ADDRESS', { ipAddress })
    //   next()
    // })

    this.app.use(cors())
    this.app.use(express.static(WEB_DIR))
    this.app.use('/v1/callback', express.static(WEB_DIR))
    this.app.use('/authCallback', express.static(WEB_DIR))
    this.app.use('/', router)

    router.get('/system', async (request, response) => {
      const system = await systemInfo()
      Logger.info('SEND SYSTEM INFO', { system })
      response.send(system)
    })
  }

  async start() {
    const preferences = Preferences.get()
    const HOST = preferences.disableLocalNetwork ? IP_PRIVATE : IP_OPEN
    const server = createServer(this.app)
      .on('error', error => {
        Logger.warn('SERVER START FAILED', { error, details: error.toString(), directory: WEB_DIR })
        app.quitDuplicateInstance()
      })
      .listen(WEB_PORT, HOST, () => {
        d(`Listening on port ${WEB_PORT}`)
        Logger.info('SERVER STARTED', { port: WEB_PORT, directory: WEB_DIR })
      })

    const key = fs.readFileSync(path.join(SSL_DIR, 'key.pem'))
    const cert = fs.readFileSync(path.join(SSL_DIR, 'cert.pem'))
    const secureServer = https
      .createServer({ key, cert }, this.app)
      .on('error', error => {
        Logger.warn('HTTPS SERVER START FAILED', { error, details: error.toString(), directory: WEB_DIR })
        app.quitDuplicateInstance()
      })
      .listen(SSL_PORT, HOST, () => {
        Logger.info('HTTPS SERVER STARTED', { port: SSL_PORT, directory: WEB_DIR })
      })

    this.io = new SocketIO.Server({ allowRequest: this.allowRequest })
    this.io.attach(server)
    this.io.attach(secureServer)

    const authOptions = {
      authenticate: this.authenticate,
      postAuthenticate: this.postAuthenticate,
      disconnect: this.disconnect,
      timeout: 20000,
    }

    socketioAuth(this.io, authOptions)
  }

  allowRequest: SocketIO.ServerOptions['allowRequest'] = (request, callback) => {
    const { origin, host } = request.headers
    if (isSocketOrigin(origin, host)) return callback(null, true)
    Logger.warn('SOCKET ORIGIN REFUSED', { origin, host })
    callback('Origin not allowed', false)
  }

  authenticate = async (
    socket: SocketIO.Socket,
    credentials: UserCredentials,
    callback: (error: Error | null, success?: boolean) => void
  ) => {
    cli.readUser()
    const { admin } = cli.data
    d(`Authenticate`, credentials)

    Logger.info('AUTHENTICATE CLIENT', {
      userId: user.id,
      userUsername: user.username,
      adminGuid: admin?.guid,
      adminUsername: admin?.username,
      credentialsGuid: credentials.guid || 'undefined',
      credentialsUsername: credentials.username,
    })

    // Signed in
    if (user.is(credentials)) {
      Logger.info('USER AUTHENTICATED')
      user.authenticated()
      return callback(null, true)
    }
    // Update credentials
    else if (user.id === credentials.guid) {
      Logger.info('UPDATE CREDENTIALS')
      return callback(null, !!(await user.checkSignIn(credentials)))
    }
    // Sign in
    else if (credentials.guid && credentials.authHash) {
      Logger.info('USER SIGNING IN', { admin: admin?.username })

      // Not registered or signed in matches cli user
      if (!admin || !admin.guid || credentials.guid === admin.guid) {
        return callback(null, !!(await user.checkSignIn(credentials)))
      }
      // User not allowed
      else {
        Logger.warn('USER ALREADY SIGNED IN', {
          attempting: credentials.username,
          signedIn: admin.username,
          attemptingID: credentials.guid,
          signedInID: admin.guid,
        })

        const command = environment.isWindows ? 'remoteit signout' : 'sudo remoteit signout'
        return callback(new Error(agentOwnedMessage({ username: admin.username, command })), false)
      }
    }
    // No user
    else {
      Logger.info('AUTHENTICATION FAILED')
      return callback(new Error('Server authentication failed.'), false)
    }
  }

  postAuthenticate = (socket: SocketIO.Socket) => {
    socket.join(AUTHENTICATED)
    this.socket = socket
    Logger.info('POST AUTHENTICATE')
    EventBus.emit(this.EVENTS.ready)
  }

  disconnect = (socket: SocketIO.Socket) => {
    Logger.info('SERVER DISCONNECT')
    d('SOCKET.LISTENERCOUNT', {
      count: socket.eventNames().map(event => ({ event, number: socket.listenerCount(event.toString()) })),
    })
    socket.removeAllListeners()
  }
}

export default new Server()
