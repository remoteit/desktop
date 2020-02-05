import SocketIO from 'socket.io'
import lan from './LAN'
import CLI from './CLI'
import Logger from './Logger'
import electron from 'electron'
import EventRelay from './EventRelay'
import Connection from './Connection'
import CLIInterface from './CLIInterface'
import BinaryInstaller from './BinaryInstaller'
import RemoteitInstaller from './RemoteitInstaller'
import ConnectionPool from './ConnectionPool'
import ElectronApp from './ElectronApp'
import AutoUpdater from './AutoUpdater'
import Installer from './Installer'
import EventBus from './EventBus'
import server from './Server'
import user from './User'
import debug from 'debug'

const d = debug('r3:backend:Server')

class Controller {
  private cli: CLIInterface
  private io: SocketIO.Server
  private pool: ConnectionPool

  constructor(io: SocketIO.Server, cli: CLIInterface, pool: ConnectionPool) {
    this.io = io
    this.cli = cli
    this.pool = pool
    EventBus.on(server.EVENTS.authenticated, this.openSockets)

    new EventRelay(
      [
        ...Object.values(user.EVENTS),
        ...Object.values(Installer.EVENTS),
        ...Object.values(Connection.EVENTS),
        ...Object.values(ConnectionPool.EVENTS),
        ...Object.values(AutoUpdater.EVENTS),
        ...Object.values(lan.EVENTS),
        ...Object.values(CLI.EVENTS),
      ],
      EventBus,
      this.io.sockets
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
    socket.on('restart', this.restart)
    socket.on('uninstall', this.uninstall)

    // things are ready - send the secure data
    this.syncBackend()
  }

  targets = async (result: ITarget[]) => {
    await this.cli.set('targets', result)
    this.io.emit('targets', this.cli.data.targets)
  }

  device = async (result: IDevice) => {
    await this.cli.set('device', result)
    this.io.emit('device', this.cli.data.device)
    this.io.emit('targets', this.cli.data.targets)
  }

  interfaces = async () => {
    await lan.getInterfaces()
    this.io.emit('interfaces', lan.interfaces)
  }

  scan = async (interfaceName: string) => {
    await lan.scan(interfaceName, this.cli)
    this.io.emit('scan', lan.data)
  }

  freePort = async () => {
    await this.pool.nextFreePort()
    this.io.emit('nextFreePort', this.pool.freePort)
  }

  syncBackend = async () => {
    this.io.emit('targets', this.cli.data.targets)
    this.io.emit('device', this.cli.data.device)
    this.io.emit('scan', lan.data)
    this.io.emit('interfaces', lan.interfaces)
    this.io.emit('admin', (this.cli.data.admin && this.cli.data.admin.username) || '')
    this.io.emit(ConnectionPool.EVENTS.updated, this.pool.toJSON())
    this.io.emit(ConnectionPool.EVENTS.freePort, this.pool.freePort)
    this.io.emit(lan.EVENTS.privateIP, lan.privateIP)
  }

  connections = () => {
    d('List connections')
    this.io.emit('pool', this.pool.toJSON())
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

  restart = () => {
    d('Restart')
    AutoUpdater.restart()
  }

  uninstall = async () => {
    Logger.info('UNINSTALL INITIATED')
    user.signOut()
    await this.pool.reset()
    await this.cli.unInstall()
    await BinaryInstaller.uninstall([RemoteitInstaller]).catch(error => EventBus.emit(Installer.EVENTS.error, error))
  }

  installBinaries = async () => {
    BinaryInstaller.install([RemoteitInstaller]).catch(error => EventBus.emit(Installer.EVENTS.error, error))
  }

  openOnLogin = (open: boolean) => {
    d('Open on login:', open)
    EventBus.emit(ElectronApp.EVENTS.openOnLogin, open)
  }
}

export default Controller
