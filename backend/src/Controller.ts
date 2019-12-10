import SocketIO from 'socket.io'
import LAN from './LAN'
import Logger from './Logger'
import electron from 'electron'
import EventRelay from './EventRelay'
import Connection from './Connection'
import CLIInterface from './CLIInterface'
import MuxerInstaller from './MuxerInstaller'
import BinaryInstaller from './BinaryInstaller'
import ConnectdInstaller from './ConnectdInstaller'
import RemoteitInstaller from './RemoteitInstaller'
import DemuxerInstaller from './DemuxerInstaller'
import ConnectionPool from './ConnectionPool'
import ElectronApp from './ElectronApp'
import Installer from './Installer'
import EventBus from './EventBus'
import Server from './Server'
import user from './User'
import debug from 'debug'

const d = debug('r3:backend:Server')

class Controller {
  private cli: CLIInterface
  private lan: LAN
  private server: SocketIO.Server
  private pool: ConnectionPool
  private socket?: SocketIO.Socket

  constructor(server: SocketIO.Server, cli: CLIInterface, lan: LAN, pool: ConnectionPool) {
    this.server = server
    this.lan = lan
    this.cli = cli
    this.pool = pool
    EventBus.on(Server.EVENTS.authenticated, this.openSockets)

    new EventRelay(
      [
        ...Object.values(Installer.EVENTS),
        ...Object.values(Connection.EVENTS),
        ...Object.values(ConnectionPool.EVENTS),
      ],
      EventBus,
      this.server.sockets
    )
  }

  openSockets = (socket: SocketIO.Socket) => {
    socket.on('user/sign-out', user.signOut)
    socket.on('user/quit', electron.app.quit)
    socket.on('service/connect', this.connect)
    socket.on('service/disconnect', this.disconnect)
    socket.on('service/forget', this.forget)
    socket.on('binaries/install', this.installBinaries)
    socket.on('app/open-on-login', this.openOnLogin)
    socket.on('init', this.syncBackend)
    socket.on('pool', this.connections)
    socket.on('connection', this.connection)
    socket.on('targets', this.targets)
    socket.on('device', this.device)
    socket.on('scan', this.scan)
    socket.on('interfaces', this.interfaces)
    socket.on('freePort', this.freePort)

    // things are ready - send the secure data
    this.syncBackend()
  }

  targets = async (result: ITarget[]) => {
    await this.cli.set('targets', result)
    this.server.emit('targets', this.cli.data.targets)
  }

  device = async (result: IDevice) => {
    await this.cli.set('device', result)
    this.server.emit('device', this.cli.data.device)
  }

  interfaces = async () => {
    await this.lan.getInterfaces()
    this.server.emit('interfaces', this.lan.interfaces)
  }

  scan = async (interfaceName: string) => {
    await this.lan.scan(interfaceName)
    this.server.emit('scan', this.lan.data)
  }

  freePort = async () => {
    await this.pool.getFreePort()
    this.server.emit('freePort', this.pool.freePort)
  }

  syncBackend = async () => {
    this.server.emit('targets', this.cli.data.targets)
    this.server.emit('device', this.cli.data.device)
    this.server.emit('scan', this.lan.data)
    this.server.emit('interfaces', this.lan.interfaces)
    this.server.emit('pool', this.pool.toJSON())
    this.server.emit('privateIP', this.lan.privateIP)
    this.server.emit('freePort', this.pool.freePort)
  }

  connections = () => {
    d('List connections')
    this.server.emit('pool', this.pool.toJSON())
  }

  connection = async (connection: IConnection) => {
    d('Connection set:', connection)
    await this.pool.set(connection)
  }

  connect = async (connection: IConnection) => {
    Logger.info('Connect:', { connection })
    d('Connect:', connection)
    await this.pool.start(connection)
  }

  disconnect = async (connection: IConnection) => {
    d('Disconnect Socket:', connection)
    await this.pool.stop(connection, false)
  }

  forget = async (connection: IConnection) => {
    d('Forget:', connection)
    await this.pool.forget(connection)
  }

  installBinaries = async () => {
    const installer = new BinaryInstaller([ConnectdInstaller, MuxerInstaller, DemuxerInstaller, RemoteitInstaller])
    return installer.install().catch(error => EventBus.emit(Installer.EVENTS.error, error))
  }

  openOnLogin = (open: boolean) => {
    d('Open on login:', open)
    EventBus.emit(ElectronApp.EVENTS.openOnLogin, open)
  }
}

export default Controller
