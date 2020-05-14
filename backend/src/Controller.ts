import SocketIO from 'socket.io'
import app from '.'
import lan from './LAN'
import cli from './cliInterface'
import Logger from './Logger'
import EventRelay from './EventRelay'
import Connection from './Connection'
import preferences from './preferences'
import binaryInstaller from './binaryInstaller'
import electronInterface from './electronInterface'
import ConnectionPool from './ConnectionPool'
import environment from './environment'
import Installer from './Installer'
import EventBus from './EventBus'
import server from './server'
import user, { User } from './User'
import debug from 'debug'

const d = debug('r3:backend:Server')

class Controller {
  private io: SocketIO.Server
  private pool: ConnectionPool
  private uninstallInitiated = false

  constructor(io: SocketIO.Server, pool: ConnectionPool) {
    this.io = io
    this.pool = pool
    EventBus.on(server.EVENTS.authenticated, this.openSockets)
    EventBus.on(electronInterface.EVENTS.recapitate, this.recapitate)

    let eventNames = [
      ...Object.values(User.EVENTS),
      ...Object.values(Installer.EVENTS),
      ...Object.values(Connection.EVENTS),
      ...Object.values(ConnectionPool.EVENTS),
      ...Object.values(lan.EVENTS),
      ...Object.values(cli.EVENTS),
      ...Object.values(server.EVENTS),
      ...Object.values(environment.EVENTS),
      ...Object.values(electronInterface.EVENTS),
      ...Object.values(preferences.EVENTS),
    ]

    new EventRelay(eventNames, EventBus, this.io.sockets)
  }

  openSockets = () => {
    const socket = server.socket

    if (!socket) throw new Error('Socket.io server failed to start.')
    Logger.info('OPEN SOCKETS', { existing: socket.eventNames() })
    if (socket.eventNames().includes('init')) socket.removeAllListeners()

    socket.on('user/sign-out', user.signOut)
    socket.on('user/sign-out-complete', this.signOutComplete)
    socket.on('user/clear-all', user.clearAll)
    socket.on('user/quit', this.quit)
    socket.on('service/connect', this.connect)
    socket.on('service/disconnect', this.disconnect)
    socket.on('service/forget', this.forget)
    socket.on('binaries/install', this.installBinaries)
    socket.on('init', this.syncBackend)
    socket.on('pool', this.connections)
    socket.on('connection', this.connection)
    socket.on('targets', this.targets)
    socket.on('device', this.device)
    socket.on('registration', this.registration)
    socket.on('scan', this.scan)
    socket.on('oobCheck', this.oobCheck)
    socket.on('interfaces', this.interfaces)
    socket.on('freePort', this.freePort)
    socket.on('preferences', this.preferences)
    socket.on('restart', this.restart)
    socket.on('uninstall', this.uninstall)

    // things are ready - send the secure data
    this.syncBackend()
  }

  recapitate = () => {
    // environment changes after recapitation
    this.io.emit(environment.EVENTS.send, environment.frontend)
  }

  signOutComplete = () => {
    Logger.info('FRONTEND SIGN OUT COMPLETE')
    if (this.uninstallInitiated) {
      this.quit()
    }
  }

  targets = async (result: ITarget[]) => {
    await cli.set('targets', result)
    this.io.emit('targets', cli.data.targets)
  }

  device = async (result: ITargetDevice) => {
    await cli.set('device', result)
    this.io.emit('device', cli.data.device)
    this.io.emit('targets', cli.data.targets)
  }

  registration = async (result: IRegistration) => {
    await cli.set('registration', result)
    this.io.emit('device', cli.data.device)
    this.io.emit('targets', cli.data.targets)
  }

  oobCheck = async () => {
    await lan.checkOob()
    this.io.emit(lan.EVENTS.oob, { oobAvailable: lan.oobAvailable, oobActive: lan.oobActive })
  }

  interfaces = async () => {
    await lan.getInterfaces()
    this.io.emit('interfaces', lan.interfaces)
  }

  scan = async (interfaceName: string) => {
    await lan.scan(interfaceName)
    this.io.emit('scan', lan.data)
  }

  freePort = async () => {
    await this.pool.nextFreePort()
    this.io.emit('nextFreePort', this.pool.freePort)
  }

  preferences = preferences.set

  syncBackend = async () => {
    this.io.emit('oob', { oobAvailable: lan.oobAvailable, oobActive: lan.oobActive })
    this.io.emit('targets', cli.data.targets)
    this.io.emit('device', cli.data.device)
    this.io.emit('scan', lan.data)
    this.io.emit('interfaces', lan.interfaces)
    this.io.emit(ConnectionPool.EVENTS.updated, this.pool.toJSON())
    this.io.emit(ConnectionPool.EVENTS.freePort, this.pool.freePort)
    this.io.emit(environment.EVENTS.send, environment.frontend)
    this.io.emit('preferences', preferences.data)
    this.io.emit('dataReady', true)
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

  quit = () => {
    Logger.info('WEB UI QUIT')
    app.quit()
  }

  restart = () => {
    Logger.info('WEB UI AUTOUPDATE RESTART')
    app.restart()
  }

  uninstall = async () => {
    Logger.info('UNINSTALL INITIATED')
    this.uninstallInitiated = true
    await this.pool.reset()
    await cli.delete()
    await cli.unInstall()
    await binaryInstaller.uninstall()
    user.signOut()
    //frontend will emit user/sign-out-complete and then we will call exit
  }

  installBinaries = async () => {
    await binaryInstaller.install()
  }
}

export default Controller
