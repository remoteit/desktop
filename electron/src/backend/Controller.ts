import SocketIO from 'socket.io'
import app from '.'
import lan from './LAN'
import cli from './cliInterface'
import rimraf from 'rimraf'
import Logger from './Logger'
import sshConfig from './sshConfig'
import EventRelay from './EventRelay'
import showFolder from './showFolder'
import preferences from './preferences'
import binaryInstaller from './binaryInstaller'
import electronInterface from './electronInterface'
import ConnectionPool from './ConnectionPool'
import PortScanner from './PortScanner'
import environment from './environment'
import Binary from './Binary'
import EventBus from './EventBus'
import server, { AUTHENTICATED } from './server'
import user, { User } from './User'
import launch from './launch'

const DEFAULT_SOCKETS_LENGTH = 3

class Controller {
  private clients: ReturnType<SocketIO.Server['to']>
  private pool: ConnectionPool

  constructor(io: SocketIO.Server, pool: ConnectionPool) {
    this.clients = io.to(AUTHENTICATED)
    this.pool = pool
    EventBus.on(server.EVENTS.ready, this.openSockets)
    EventBus.on(electronInterface.EVENTS.recapitate, this.recapitate)
    EventBus.on(electronInterface.EVENTS.signOut, this.signOutRequested)

    let eventNames = [
      ...Object.values(User.EVENTS),
      ...Object.values(Binary.EVENTS),
      ...Object.values(ConnectionPool.EVENTS),
      ...Object.values(lan.EVENTS),
      ...Object.values(cli.EVENTS),
      ...Object.values(server.EVENTS),
      ...Object.values(environment.EVENTS),
      ...Object.values(electronInterface.EVENTS),
      ...Object.values(preferences.EVENTS),
    ]

    new EventRelay(eventNames, EventBus, this.clients)
    // After the relay, so the signed-out broadcast still reaches the sockets it removes.
    EventBus.on(User.EVENTS.signedOut, () => this.clients.socketsLeave(AUTHENTICATED))
  }

  openSockets = () => {
    const socket = server.socket

    if (!socket) throw new Error('Socket.io server failed to start.')
    Logger.info('OPEN SOCKETS', { existing: socket.eventNames() })
    if (socket.eventNames().length > DEFAULT_SOCKETS_LENGTH) socket.removeAllListeners()

    socket.on('init', this.init)
    socket.on('refresh', this.refresh)
    socket.on('user/lock', user.signOut)
    socket.on('user/sign-out', this.signOut)
    socket.on('user/sign-out-complete', this.signOutComplete)
    socket.on('agent/release', (done?: (released: boolean) => void) => this.releaseAgent(socket).then(done))
    socket.on('user/quit', this.quit)
    socket.on('service/connect', this.connect)
    socket.on('service/disconnect', this.disconnect)
    socket.on('service/stop', this.stop)
    socket.on('service/clear', this.pool.clear)
    socket.on('service/clearRecent', this.pool.clearRecent)
    socket.on('service/clearErrors', this.pool.clearErrors)
    socket.on('service/forget', this.forget)
    socket.on('binaries/install', this.installBinaries)
    socket.on('launch/app', launch)
    socket.on('connection', connection => this.pool.set(connection, true))
    socket.on('connections', connections => this.pool.setAll(connections))
    socket.on('device', this.device)
    socket.on('registration', this.registration)
    socket.on('restore', this.restore)
    socket.on('scan', this.scan)
    socket.on('useCertificate', this.useCertificate)
    socket.on('sshConfig', this.sshConfig)
    socket.on(lan.EVENTS.interfaces, this.interfaces)
    socket.on('freePort', this.freePort)
    socket.on('reachablePort', this.isReachablePort)
    socket.on('preferences', preferences.set)
    socket.on('uninstall', this.uninstall)
    socket.on('forceUnregister', this.forceUnregister)
    socket.on('heartbeat', this.check)
    socket.on('showFolder', this.showFolder)
    socket.on('update/check', () => EventBus.emit(electronInterface.EVENTS.check, true))
    socket.on('update/install', () => EventBus.emit(electronInterface.EVENTS.install))
    socket.on('navigate', action => EventBus.emit(electronInterface.EVENTS.navigate, action))
    socket.on('maximize', () => EventBus.emit(electronInterface.EVENTS.maximize))
    socket.on('filePrompt', type => EventBus.emit(electronInterface.EVENTS.filePrompt, type))
    socket.on('cancelBluetooth', type => EventBus.emit(electronInterface.EVENTS.cancelBluetooth))
  }

  init = () => {
    Logger.info('INIT FRONTEND DATA')
    binaryInstaller.check()
    this.initBackend()
    EventBus.emit(electronInterface.EVENTS.check, true)
  }

  recapitate = () => {
    // environment changes after recapitation
    this.clients.emit(environment.EVENTS.send, environment.frontend)
  }

  check = (all?: boolean) => {
    this.pool.check()
    lan.check()
    if (all) binaryInstaller.check()
    EventBus.emit(electronInterface.EVENTS.check)
  }

  connect = async (connection: IConnection) => {
    await this.pool.start(connection)
    this.freePort()
  }

  disconnect = async (connection: IConnection) => {
    await this.pool.disconnect(connection)
  }

  stop = async (connection: IConnection) => {
    await this.pool.stop(connection)
    this.freePort()
  }

  forget = async (connection: IConnection) => {
    await this.pool.forget(connection)
    this.freePort()
  }

  device = async () => {
    await cli.set('device')
    this.clients.emit('device', cli.data.device?.uid)
  }

  registration = async (code: string) => {
    await cli.set('registration', code)
    this.clients.emit('device', cli.data.device?.uid)
  }

  restore = async (deviceId: string) => {
    await cli.restore(deviceId)
    this.clients.emit('device', cli.data.device?.uid)
  }

  forceUnregister = async (code: string) => {
    cli.forceUnregister()
  }

  interfaces = async () => {
    await lan.getInterfaces()
    this.clients.emit(lan.EVENTS.interfaces, lan.interfaces)
  }

  scan = async (interfaceName: string) => {
    await lan.scan(interfaceName)
    this.clients.emit('scan', lan.data)
  }

  freePort = async () => {
    const freePort = await this.pool.nextFreePort()
    this.clients.emit(PortScanner.EVENTS.freePort, freePort)
  }

  isReachablePort = async (data: IReachablePort) => {
    const result = await PortScanner.isPortReachable(data.port, data.host)
    this.clients.emit(PortScanner.EVENTS.reachablePort, result)
  }

  useCertificate = async (use: boolean) => {
    preferences.set({ useCertificate: use })
    this.pool.updateAll()
  }

  sshConfig = async (use: boolean) => {
    preferences.set({ sshConfig: use })
    sshConfig.toggle(use)
  }

  initBackend = () => {
    cli.read()
    this.pool.init()
    sshConfig.init()
    this.refresh()
    this.clients.emit('appReady')
    Logger.info('DATA READY')
  }

  refresh = () => {
    cli.read()
    this.check()
    this.freePort()
    this.clients.emit('device', cli.data.device?.uid)
    this.clients.emit('scan', lan.data)
    this.clients.emit(lan.EVENTS.interfaces, lan.interfaces)
    this.clients.emit(ConnectionPool.EVENTS.pool, this.pool.toJSON())
    this.clients.emit(environment.EVENTS.send, environment.frontend)
    this.clients.emit('preferences', preferences.data)
    EventBus.emit(electronInterface.EVENTS.navigate, 'STATUS')
  }

  showFolder = (type: IShowFolderType) => {
    Logger.info('SHOW FOLDER', { type })
    showFolder.show(type)
  }

  quit = () => {
    Logger.info('WEB UI QUIT')
    app.quit()
  }

  /* The tray's Sign out. The relay already carries it to the renderer, which owns the OIDC
     session: it ends the account's AS session, then comes back with user/sign-out. Only with
     no signed-in renderer for the relay to reach does the backend clear the credentials on its own. */
  signOutRequested = async () => {
    if ((await this.clients.fetchSockets()).length) return
    Logger.info('SIGN OUT REQUESTED WITHOUT A RENDERER')
    await this.signOut()
  }

  signOut = async () => {
    Logger.info('CLEAR CREDENTIALS')
    await cli.signOut()
    await user.signOut()
    await this.pool.clearMemory()
  }

  // Not user.signOut(): its signed-out broadcast makes every window run a full sign-out, dropping the owner's saved
  // session from the account switcher. The window that asked keeps its connection for the answer.
  releaseAgent = async (requester: SocketIO.Socket) => {
    Logger.info('RELEASE AGENT')
    await cli.signOut()
    if (!cli.isSignedOut()) {
      Logger.warn('RELEASE AGENT FAILED: the CLI is still signed in')
      return false
    }
    user.clear()
    requester.leave(AUTHENTICATED)
    this.clients.disconnectSockets(true)
    await this.pool.clearMemory()
    return true
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
    await cli.uninstall()
    await binaryInstaller.uninstall()
    await this.pool.clearMemory()
    try {
      rimraf.sync(environment.userPath)
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
}

export default Controller
