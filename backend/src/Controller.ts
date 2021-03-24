import SocketIO from 'socket.io'
import app from '.'
import lan from './LAN'
import cli from './cliInterface'
import rimraf from 'rimraf'
import Logger from './Logger'
import EventRelay from './EventRelay'
import showFolder from './showFolder'
import Connection from './Connection'
import preferences from './preferences'
import binaryInstaller from './binaryInstaller'
import electronInterface from './electronInterface'
import ConnectionPool from './ConnectionPool'
import environment from './environment'
import Binary from './Binary'
import EventBus from './EventBus'
import server from './server'
import user, { User } from './User'
import launch, { openCMDforWindows } from './launch'

class Controller {
  private io: SocketIO.Server
  private pool: ConnectionPool

  constructor(io: SocketIO.Server, pool: ConnectionPool) {
    this.io = io
    this.pool = pool
    EventBus.on(server.EVENTS.ready, this.openSockets)
    EventBus.on(electronInterface.EVENTS.recapitate, this.recapitate)
    EventBus.on(electronInterface.EVENTS.signOut, this.signOut)

    let eventNames = [
      ...Object.values(User.EVENTS),
      ...Object.values(Binary.EVENTS),
      ...Object.values(Connection.EVENTS),
      ...Object.values(ConnectionPool.EVENTS),
      ...Object.values(lan.EVENTS),
      ...Object.values(cli.EVENTS),
      ...Object.values(server.EVENTS),
      ...Object.values(environment.EVENTS),
      ...Object.values(electronInterface.EVENTS),
      ...Object.values(preferences.EVENTS),
      ...Object.values(launch.EVENTS),
    ]

    new EventRelay(eventNames, EventBus, this.io.sockets)
  }

  openSockets = () => {
    const socket = server.socket

    if (!socket) Logger.error('Socket.io server failed to start.')
    if (!socket) throw new Error('Socket.io server failed to start.')
    Logger.info('OPEN SOCKETS', { existing: socket.eventNames() })
    this.checkBackendSetting()
    if (socket.eventNames().includes('init')) socket.removeAllListeners()

    socket.on('user/lock', user.signOut)
    socket.on('user/sign-out', this.signOut)
    socket.on('user/sign-out-complete', this.signOutComplete)
    socket.on('user/quit', this.quit)
    socket.on('service/connect', this.connect)
    socket.on('service/disconnect', this.disconnect)
    socket.on('service/clear', this.pool.clear)
    socket.on('service/clear-recent', this.pool.clearRecent)
    socket.on('service/forget', this.forget)
    socket.on('binaries/install', this.installBinaries)
    socket.on('launch/app', openCMDforWindows)
    socket.on('connection', this.connection)
    socket.on('targets', this.targets)
    socket.on('device', this.device)
    socket.on('registration', this.registration)
    socket.on('restore', this.restore)
    socket.on('scan', this.scan)
    socket.on(lan.EVENTS.interfaces, this.interfaces)
    socket.on('freePort', this.freePort)
    socket.on('reachablePort', this.isReachablePort)
    socket.on('preferences', preferences.set)
    socket.on('restart', this.restart)
    socket.on('uninstall', this.uninstall)
    socket.on('heartbeat', this.check)
    socket.on('showFolder', this.showFolder)
    socket.on('maximize', () => EventBus.emit(electronInterface.EVENTS.maximize))

    this.initBackend()
    this.check()
    binaryInstaller.check()
  }

  recapitate = () => {
    // environment changes after recapitation
    this.io.emit(environment.EVENTS.send, environment.frontend)
  }

  check = () => {
    this.pool.check()
    lan.check()
    app.check()
  }

  connect = async (connection: IConnection) => {
    await this.pool.start(connection)
    this.freePort()
  }

  disconnect = async (connection: IConnection) => {
    await this.pool.stop(connection)
    this.freePort()
  }

  forget = async (connection: IConnection) => {
    await this.pool.forget(connection)
    this.freePort()
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

  restore = async (deviceId: string) => {
    await cli.restore(deviceId)
    this.io.emit('device', cli.data.device)
    this.io.emit('targets', cli.data.targets)
  }

  interfaces = async () => {
    await lan.getInterfaces()
    this.io.emit(lan.EVENTS.interfaces, lan.interfaces)
  }

  scan = async (interfaceName: string) => {
    await lan.scan(interfaceName)
    this.io.emit('scan', lan.data)
  }

  freePort = async () => {
    await this.pool.nextFreePort()
    this.io.emit(ConnectionPool.EVENTS.freePort, this.pool.freePort)
  }

  isReachablePort = async (data: IReachablePort) => {
    const result = await this.pool.reachablePort(data)
    this.io.emit(ConnectionPool.EVENTS.reachablePort, result)
  }

  initBackend = async () => {
    cli.read()
    this.pool.init()
    this.io.emit('targets', cli.data.targets)
    this.io.emit('device', cli.data.device)
    this.io.emit('scan', lan.data)
    this.io.emit(lan.EVENTS.interfaces, lan.interfaces)
    this.io.emit(ConnectionPool.EVENTS.updated, this.pool.toJSON())
    this.io.emit(environment.EVENTS.send, environment.frontend)
    this.io.emit('preferences', preferences.data)
    this.freePort()
    this.io.emit('dataReady', true)
  }

  connection = async (connection: IConnection) => {
    await this.pool.set(connection, true)
  }

  showFolder = (type: IShowFolderType) => {
    Logger.info('SHOW FOLDER', { type })
    showFolder.show(type)
  }

  quit = () => {
    Logger.info('WEB UI QUIT')
    app.quit()
  }

  restart = async (update?: string) => {
    Logger.info('WEB UI AUTO UPDATE RESTART')
    await cli.serviceUninstall()
    app.restart(update)
  }

  signOut = async () => {
    Logger.info('CLEAR CREDENTIALS')
    await cli.signOut()
    await user.signOut()
    await this.pool.clearMemory()
  }

  signOutComplete = () => {
    Logger.info('FRONTEND SIGN OUT COMPLETE')
    if (binaryInstaller.uninstallInitiated) {
      this.quit()
    }
  }

  uninstall = async () => {
    Logger.info('UNINSTALL INITIATED')
    binaryInstaller.uninstallInitiated = true
    await cli.reset()
    await binaryInstaller.uninstall()
    await this.pool.clearMemory()
    try {
      rimraf.sync(environment.userPath, { disableGlob: true })
    } catch (error) {
      Logger.warn('FILE REMOVAL FAILED', { error, path: environment.userPath })
    }
    await user.signOut()
    // frontend will emit user/sign-out-complete and then we will call exit
  }

  installBinaries = async () => {
    try {
      await binaryInstaller.install()
    } catch (error) {
      EventBus.emit(Binary.EVENTS.error, error)
    }
  }

  checkBackendSetting = async () => {
    Logger.info('SETTING OVERRIDES READING')
    cli.readOverrides()
    Logger.info('SETTING OVERRIDES', cli.data.overridesSetting)
    this.io.emit('setting-overrides', cli.data.overridesSetting)
  }
}

export default Controller
