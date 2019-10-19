import ConnectdInstaller from './ConnectdInstaller'
import ConnectionPool from './ConnectionPool'
import Controller from './Controller'
import debug from 'debug'
import DemuxerInstaller from './DemuxerInstaller'
import Environment from './Environment'
import ElectronApp from './ElectronApp'
import JSONFile from './JSONFile'
import Logger from './Logger'
import MuxerInstaller from './MuxerInstaller'
import path from 'path'
import Server from './Server'
import Tracker from './Tracker'
import cli from './CLIInterface'
import EventBus from './EventBus'
import Installer from './Installer'
import User from './User'

const d = debug('r3:backend:Application')

export default class Application {
  public pool: ConnectionPool
  private connectionsFile: JSONFile<SavedConnection[]>
  private userFile: JSONFile<UserCredentials>
  private window: ElectronApp

  constructor() {
    Logger.info('Application starting up!')

    this.handleExit()

    this.window = new ElectronApp()

    this.connectionsFile = new JSONFile<SavedConnection[]>(path.join(Environment.remoteitDirectory, 'connections.json'))
    this.userFile = new JSONFile<UserCredentials>(path.join(Environment.remoteitDirectory, 'user.json'))

    const userCredentials = this.userFile.read()

    d('Reading user credentials:', { user: userCredentials })
    Logger.info('Setting user:', userCredentials)

    // Start pool and load connections from filestystem
    this.pool = new ConnectionPool(this.connectionsFile.read() || [], userCredentials)

    // Start server and listen to events.
    const server = new Server()

    // create the event controller
    new Controller(server.io, this.pool, userCredentials)

    // if (user) this.signIn(user) -- NEED?

    EventBus.on(ConnectionPool.EVENTS.updated, this.handlePoolUpdated)
    EventBus.on(Server.EVENTS.ready, this.handleServerReady)
    EventBus.on(Server.EVENTS.connection, this.handleConnection)
    EventBus.on(User.EVENTS.signedIn, this.handleSignedIn)
    EventBus.on(User.EVENTS.signedOut, this.handleSignedOut)
  }

  get url() {
    return this.window.url
  }

  private handleConnection = () => {
    d('Server connected')
    cli.read()

    Logger.info('Checking install status:', {
      connectdInstalled: ConnectdInstaller.isInstalled,
      muxerInstalled: MuxerInstaller.isInstalled,
      demuxerInstalled: DemuxerInstaller.isInstalled,
    })

    ConnectdInstaller.isInstalled
      ? EventBus.emit(Installer.EVENTS.installed, {
          path: ConnectdInstaller.binaryPath,
          version: ConnectdInstaller.version,
          name: ConnectdInstaller.name,
        } as InstallationInfo)
      : EventBus.emit(Installer.EVENTS.notInstalled)
    MuxerInstaller.isInstalled
      ? EventBus.emit(Installer.EVENTS.installed, {
          path: MuxerInstaller.binaryPath,
          version: MuxerInstaller.version,
          name: MuxerInstaller.name,
        } as InstallationInfo)
      : EventBus.emit(Installer.EVENTS.notInstalled)
    DemuxerInstaller.isInstalled
      ? EventBus.emit(Installer.EVENTS.installed, {
          path: DemuxerInstaller.binaryPath,
          version: DemuxerInstaller.version,
          name: DemuxerInstaller.name,
        } as InstallationInfo)
      : EventBus.emit(Installer.EVENTS.notInstalled)
  }

  private handleExit = () => {
    Tracker.event('app', 'close', 'closing application')
    // Do something when app is closing
    process.on('exit', this.handleException)

    // Catches ctrl+c event
    process.on('SIGINT', this.handleException)

    // Catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', this.handleException)
    process.on('SIGUSR2', this.handleException)

    // Catches uncaught exceptions
    process.on('uncaughtException', this.handleException)
  }

  private handleException = async () => {
    await this.pool.stopAll()
    process.exit()
  }

  /**
   * When the pool is updated, persist it to the saved connections
   * file on disk.
   */
  private handlePoolUpdated = (pool: ConnectionData[]) => {
    d('Pool updated:', pool)
    Logger.info('Pool updated', { pool })
    this.connectionsFile.write(pool)
  }

  /**
   *  Make sure connectd is installed on startup of server
   */
  private handleServerReady = async () => {
    d('Server ready')
    Logger.info('Server is ready')
  }

  /**
   * When a user is signed in, persist them to the user credentials
   * file on disk.
   */

  private handleSignedIn = (user: UserCredentials) => {
    d('User signed in:', user.username)
    Logger.info('User signed in', { username: user.username })

    // cli add user data - @DANA can this be shared?
    cli.write('user', {
      username: user.username,
      authHash: user.authHash,
    })

    // Save the user to the user JSON file.
    this.userFile.write({
      username: user.username,
      authHash: user.authHash,
    })
  }

  /**
   * When a user logs out, remove their credentials from the
   * saved connections file.
   */

  private handleSignedOut = async () => {
    Logger.info('Signing out user')

    // Stop all connections cleanly
    await this.pool.reset()

    // cli clear user data
    cli.write('user', {})

    // Clear out the authenticated user in the connection
    // pool so future connections don't start.
    this.pool.user = undefined

    // Remove files from system.
    this.userFile.remove()
    this.connectionsFile.remove()
  }
}
