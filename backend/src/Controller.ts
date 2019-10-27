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
    socket.on('connections/list', this.list)
    socket.on('service/connect', this.connect)
    socket.on('service/disconnect', this.disconnect)
    socket.on('service/forget', this.forget)
    socket.on('service/restart', this.restart)
    socket.on('binaries/install', this.installBinaries)
    socket.on('app/open-on-login', this.openOnLogin)
    socket.on('jump/init', this.syncJump)
    socket.on('jump/targets', this.targets)
    socket.on('jump/device', this.device)
    socket.on('jump/scan', this.scan)
    socket.on('jump/interfaces', this.interfaces)
  }

  targets = (result: ITarget[]) => {
    cli.set('targets', result)
    this.server.emit('jump/targets', cli.data.targets)
  }

  device = (result: IDevice) => {
    cli.set('device', result)
    this.server.emit('jump/device', cli.data.device)
  }

  interfaces = async () => {
    await lan.getInterfaces()
    this.server.emit('jump/interfaces', lan.interfaces)
  }

  scan = async (interfaceName: string) => {
    await lan.scan(interfaceName)
    this.server.emit('jump/scan', lan.data)
  }

  syncJump = () => {
    this.server.emit('jump/targets', cli.data.targets)
    this.server.emit('jump/device', cli.data.device)
    this.server.emit('jump/scan', lan.data)
    this.server.emit('jump/interfaces', lan.interfaces)
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

export default Controller
