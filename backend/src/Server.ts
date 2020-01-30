import debug from 'debug'
import EventBus from './EventBus'
import express from 'express'
import user from './User'
import cors from 'cors'
import Logger from './Logger'
import SocketIO from 'socket.io'
import socketioAuth from 'socketio-auth'
import Environment from './Environment'
import { createServer } from 'http'
import { PORT, WEB_DIR } from './constants'

const d = debug('r3:backend:Server')

export default class Server {
  public io: SocketIO.Server

  static EVENTS = {
    connection: 'server/connection',
    authenticated: 'server/authenticated',
  }

  constructor() {
    const app = express()
    const router = express.Router()

    app.use(cors())
    app.use(express.static(WEB_DIR))
    app.use('/', router)

    const server = createServer(app).listen(PORT, () => {
      d(`Listening on port ${PORT}`)
      Logger.info('SERVER STARTED', { port: PORT, directory: WEB_DIR })
    })

    router.get('/system', async (request, response) => {
      const system = await Environment.getSystemInfo()
      Logger.info('SEND SYSTEM INFO', { system })
      response.send(system)
    })

    this.io = SocketIO(server)

    socketioAuth(this.io, {
      authenticate: this.authenticate,
      postAuthenticate: this.postAuthenticate,
      disconnect: this.disconnect,
    })
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
      d(`User authenticated.`)
      user.authenticated()
      return callback(null, true)

      // Sign in
    } else if (credentials.username && credentials.authHash) {
      d(`User signing in.`)
      if (user.signedIn) user.signOut()
      return callback(null, await !!user.checkSignIn(credentials))

      // Deny
    } else {
      d('Authentication failed')
      return callback(new Error('Authentication failed'))
    }
  }

  postAuthenticate = (socket: SocketIO.Socket) => {
    EventBus.emit(Server.EVENTS.authenticated, socket)
    socket.emit('server/authenticated', socket.id)
  }

  disconnect = (socket: SocketIO.Socket) => {
    d('server disconnect', socket.id)
  }
}
