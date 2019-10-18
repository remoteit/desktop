import BinaryInstaller from './BinaryInstaller'
import Connection from './Connection'
import ConnectionPool from './ConnectionPool'
import ConnectdInstaller from './ConnectdInstaller'
import debug from 'debug'
import electron from 'electron'
import EventBus from './EventBus'
import EventRelay from './EventRelay'
import express from 'express'
import path from 'path'
import Installer from './Installer'
import MuxerInstaller from './MuxerInstaller'
import DemuxerInstaller from './DemuxerInstaller'
import Logger from './Logger'
import SocketIO from 'socket.io'
import User from './User'
import ElectronApp from './ElectronApp'
import { createServer } from 'http'
import { PORT } from './constants'

const d = debug('r3:backend:Server')

export default class Server {
  public io: SocketIO.Server
  private pool: ConnectionPool
  private user?: UserCredentials

  static EVENTS = {
    ready: 'server/ready',
    connection: 'server/connection',
  }

  constructor(pool: ConnectionPool, user?: UserCredentials) {
    Logger.info('Setting user:', { user })

    this.pool = pool
    this.user = user

    const dir = path.join(__dirname, '../build')
    const app = express().use(express.static(dir))
    const server = createServer(app).listen(PORT, () => {
      d(`Listening on port ${PORT}`)
      console.log('---------------------------------------------\n\n')
      console.log('serving: ' + dir)
      console.log(`Listening on localhost:${PORT}`)
      console.log('\n\n---------------------------------------------')
      EventBus.emit(Server.EVENTS.ready)
    })

    this.io = SocketIO(server)

    new EventRelay(
      [
        ...Object.values(Connection.EVENTS),
        ...Object.values(ConnectionPool.EVENTS),
        ...Object.values(Installer.EVENTS),
        ...Object.values(User.EVENTS),
      ],
      EventBus,
      this.io.sockets
    )

    this.io.on('connection', socket => {
      Logger.info('New connection')

      EventBus.emit(Server.EVENTS.connection)

      socket.on('user/check-sign-in', this.checkSignIn)
      socket.on('user/sign-in', this.signIn)
      socket.on('user/sign-out', this.signOut)
      socket.on('user/quit', electron.app.quit)
      socket.on('connections/list', this.list)
      socket.on('service/connect', this.connect)
      socket.on('service/disconnect', this.disconnect)
      socket.on('service/forget', this.forget)
      socket.on('service/restart', this.restart)
      socket.on('binaries/install', this.installBinaries)
      socket.on('app/open-on-login', this.openOnLogin)
    })
  }

  checkSignIn = async () => {
    const user = await User.checkSignIn(this.user)
    if (user) this.user = user
  }

  signIn = async ({ username, password }: { username: string; password: string }) => {
    d('Sign in:', username)
    this.user = await User.signIn(username, password)
  }

  signOut = () => {
    d('Sign out')
    User.signOut()
    this.user = undefined
  }

  list = (cb: (pool: ConnectionData[]) => void) => {
    d('List connections')
    cb(this.pool.toJSON())
  }

  connect = async (args: ConnectionArgs) => {
    d('Connect:', args)
    Logger.info('Connect to service:', args)
    return this.pool.connect(args)
  }

  disconnect = async (id: string) => {
    d('Disconnect service:', id)
    await this.pool.stop(id)
  }

  forget = async (id: string) => {
    await this.pool.forget(id)
  }

  restart = async (id: string) => {
    d('Restarting service:', id)
    await this.pool.restart(id)
  }

  installBinaries = async () => {
    const installer = new BinaryInstaller([ConnectdInstaller, MuxerInstaller, DemuxerInstaller])
    return installer.install().catch(error => EventBus.emit(Installer.EVENTS.error, error))
  }

  openOnLogin = (open: boolean) => {
    d('Open on login:', open)
    EventBus.emit(ElectronApp.EVENTS.openOnLogin, open)
  }
}
