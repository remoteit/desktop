import app from '.'
import debug from 'debug'
import EventBus from './EventBus'
import express, { Express } from 'express'
import fs from 'fs'
import path from 'path'
import https from 'https'
import user from './User'
import cors from 'cors'
import Logger from './Logger'
import SocketIO from 'socket.io'
import systemInfo from './systemInfo'
import socketioAuth from 'socketio-auth'
import { createServer } from 'http'
import { WEB_PORT, SSL_PORT, WEB_DIR, SSL_DIR } from './constants'

const d = debug('r3:backend:Server')

class Server {
  public io?: SocketIO.Server
  public ioSSL?: SocketIO.Server
  public socket?: SocketIO.Socket
  private app: Express

  EVENTS = {
    connection: 'server/connection',
    authenticated: 'server/authenticated',
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
    this.app.use('/', router)

    router.get('/system', async (request, response) => {
      const system = await systemInfo()
      Logger.info('SEND SYSTEM INFO', { system })
      response.send(system)
    })
  }

  async start() {
    const server = createServer(this.app)
      .on('error', error => {
        Logger.warn('SERVER START FAILED', { error, details: error.toString(), directory: WEB_DIR })
        app.quit()
      })
      .listen(WEB_PORT, () => {
        d(`Listening on port ${WEB_PORT}`)
        Logger.info('SERVER STARTED', { port: WEB_PORT, directory: WEB_DIR })
      })

    const key = fs.readFileSync(path.join(SSL_DIR, 'key.pem'))
    const cert = fs.readFileSync(path.join(SSL_DIR, 'cert.pem'))
    const secureServer = https
      .createServer({ key, cert }, this.app)
      .on('error', error => {
        Logger.warn('HTTPS SERVER START FAILED', { error, details: error.toString(), directory: WEB_DIR })
        app.quit()
      })
      .listen(SSL_PORT, () => {
        Logger.info('HTTPS SERVER STARTED', { port: WEB_PORT, directory: WEB_DIR })
      })

    this.io = SocketIO(server)
    this.ioSSL = SocketIO(secureServer)

    const authOptions = {
      authenticate: this.authenticate,
      postAuthenticate: this.postAuthenticate,
      disconnect: this.disconnect,
    }

    socketioAuth(this.io, authOptions)
    socketioAuth(this.ioSSL, authOptions)
  }

  authenticate = async (
    socket: SocketIO.Socket,
    credentials: UserCredentials,
    callback: (error: Error | null, success?: boolean) => void
  ) => {
    d(`Authenticate`, credentials)
    Logger.info('AUTHENTICATE CLIENT', { username: credentials.username })

    // Signed in
    if (user.is(credentials)) {
      d('User authenticated.')
      user.authenticated()
      return callback(null, true)
    }
    // Update credentials
    else if (user.username === credentials.username) {
      d('Update credentials', user.username)
      return callback(null, await !!user.checkSignIn(credentials))
    }
    // Sign in
    else if (credentials.username && credentials.authHash) {
      d('User signing in!')
      if (user.signedIn) {
        // Allow device owner to kick out others
        if (user.isDeviceOwner(credentials)) user.signOut()
        else return callback(new Error(`${user.username} is already logged in.`), false)
      }
      return callback(null, await !!user.checkSignIn(credentials))
    }
    // Deny
    else {
      d('Authentication failed')
      return callback(new Error('Server authentication failed.'), false)
    }
  }

  postAuthenticate = (socket: SocketIO.Socket) => {
    this.socket = socket
    Logger.info('POST AUTHENTICATE', { event: this.EVENTS.authenticated })
    EventBus.emit(this.EVENTS.authenticated)
  }

  disconnect = (socket: SocketIO.Socket) => {
    socket.removeAllListeners()
    d('server disconnect', socket.id)
  }
}

export default new Server()
