import SocketIO from 'socket.io'
import cli from './CLIInterface'
import lan from './LAN'
import BinaryInstaller from './BinaryInstaller'
import ConnectdInstaller from './ConnectdInstaller'
import electron from 'electron'
import MuxerInstaller from './MuxerInstaller'
import DemuxerInstaller from './DemuxerInstaller'
import ElectronApp from './ElectronApp'
import Installer from './Installer'
import ConnectionPool from './ConnectionPool'
import Server from './Server'
import EventBus from './EventBus'
import User from './User'
import debug from 'debug'

const d = debug('r3:backend:Server')

class Controller {
  private server: SocketIO.Server
  private pool: ConnectionPool
  private user?: UserCredentials

  constructor(server: SocketIO.Server, pool: ConnectionPool, user?: UserCredentials) {
    this.server = server
    this.pool = pool
    this.user = user
    EventBus.on(Server.EVENTS.connection, this.bindSockets)
  }

  bindSockets = (socket: SocketIO.Socket) => {
    socket.on('user/check-sign-in', this.checkSignIn)
    socket.on('user/sign-in', this.signIn)
    socket.on('user/sign-out', this.signOut)
    socket.on('user/quit', electron.app.quit)
    socket.on('service/connect', this.connect)
    socket.on('service/disconnect', this.disconnect)
    socket.on('service/forget', this.forget)
    socket.on('binaries/install', this.installBinaries)
    socket.on('app/open-on-login', this.openOnLogin)
    socket.on('init', this.syncJump)
    socket.on('pool', this.connections)
    socket.on('connection', this.connection)
    socket.on('targets', this.targets)
    socket.on('device', this.device)
    socket.on('scan', this.scan)
    socket.on('interfaces', this.interfaces)
  }

  targets = (result: ITarget[]) => {
    cli.set('targets', result)
    this.server.emit('targets', cli.data.targets)
  }

  device = (result: IDevice) => {
    cli.set('device', result)
    this.server.emit('device', cli.data.device)
  }

  interfaces = async () => {
    await lan.getInterfaces()
    this.server.emit('interfaces', lan.interfaces)
  }

  scan = async (interfaceName: string) => {
    await lan.scan(interfaceName)
    this.server.emit('scan', lan.data)
  }

  // privateIP = () => this.server.emit('privateIP', lan.privateIP)

  syncJump = () => {
    this.server.emit('targets', cli.data.targets)
    this.server.emit('device', cli.data.device)
    this.server.emit('scan', lan.data)
    this.server.emit('interfaces', lan.interfaces)
    this.server.emit('pool', this.pool.toJSON())
    this.server.emit('privateIP', lan.privateIP)
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

  connections = (connections: IConnection[]) => {
    if (connections.length) this.pool.set(connections)
    d('List connections')
    this.server.emit('pool', this.pool.toJSON())
  }

  connection = async (connection: IConnection) => {
    d('Connection set:', connection)
    await this.pool.set([connection])
  }

  connect = async (id: string) => {
    d('Connect:', id)
    await this.pool.start(id)
  }

  disconnect = async (id: string) => {
    d('Disconnect:', id)
    await this.pool.stop(id, false)
  }

  forget = async (id: string) => {
    await this.pool.forget(id)
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

export default Controller
