import debug from 'debug'
import EventBus from './EventBus'
import express from 'express'
import path from 'path'
import user from './User'
import Logger from './Logger'
import SocketIO from 'socket.io'
import socketioAuth from 'socketio-auth'
import { createServer } from 'http'
import { PORT } from './constants'

const d = debug('r3:backend:Server')

export default class Server {
  public io: SocketIO.Server

  static EVENTS = {
    ready: 'server/ready',
    connection: 'server/connection',
    authenticated: 'server/authenticated',
  }

  constructor() {
    const dir = path.join(__dirname, '../build')
    const app = express().use(express.static(dir))
    const server = createServer(app).listen(PORT, () => {
      d(`Listening on port ${PORT}`)
      Logger.info('SERVER STARTED', { port: PORT, directory: dir })
      EventBus.emit(Server.EVENTS.ready)
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
    Logger.info('AUTHENTICATE CLIENT', { user: credentials })

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
    socket.emit('authenticated', socket.id)
  }

  disconnect = (socket: SocketIO.Socket) => {
    d('server disconnect', socket.id)
  }
}
