import ConnectionPool from './ConnectionPool'
import Controller from './Controller'
import debug from 'debug'
import RemoteitInstaller from './RemoteitInstaller'
import ConnectdInstaller from './ConnectdInstaller'
import DemuxerInstaller from './DemuxerInstaller'
import MuxerInstaller from './MuxerInstaller'
import CLIInterface from './CLIInterface'
import Environment from './Environment'
import ElectronApp from './ElectronApp'
import JSONFile from './JSONFile'
import Logger from './Logger'
import path from 'path'
import LAN from './LAN'
import User from './User'
import Server from './Server'
import Tracker from './Tracker'
import EventBus from './EventBus'

const d = debug('r3:backend:Application')

export default class Application {
  public pool: ConnectionPool
  private connectionsFile: JSONFile<IConnection[]>
  private userFile: JSONFile<UserCredentials>
  private window: ElectronApp

  constructor() {
    Logger.info('Application starting up!')

    this.handleExit()

    this.window = new ElectronApp()
    this.connectionsFile = new JSONFile<IConnection[]>(path.join(Environment.userPath, 'connections.json'))
    this.userFile = new JSONFile<UserCredentials>(path.join(Environment.userPath, 'user.json'))

    const userCredentials = this.userFile.read()

    d('Reading user credentials:', { user: userCredentials })
    Logger.info('Setting user:', { userCredentials })

    // Start pool and load connections from filesystem
    this.pool = new ConnectionPool(this.connectionsFile.read() || [], userCredentials)

    // remoteit CLI init.
    const cli = new CLIInterface(userCredentials)

    // Start server and listen to events.
    const server = new Server()

    // Network utils
    const lan = new LAN(cli)

    // create the event controller
    new Controller(server.io, cli, lan, this.pool, userCredentials)

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

    if (!this.pool.user) User.signOut()

    Logger.info('Checking install status:', {
      connectdInstalled: ConnectdInstaller.isInstalled,
      muxerInstalled: MuxerInstaller.isInstalled,
      demuxerInstalled: DemuxerInstaller.isInstalled,
      remoteitInstalled: RemoteitInstaller.isInstalled,
    })

    ConnectdInstaller.check()
    MuxerInstaller.check()
    DemuxerInstaller.check()
    RemoteitInstaller.check()
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
  }

  private handleException = async (code: any) => {
    Logger.warn('PROCESS EXIT', { errorCode: code })
    if (this.pool) await this.pool.stopAll()
    process.exit()
  }

  /**
   * When the pool is updated, persist it to the saved connections
   * file on disk.
   */
  private handlePoolUpdated = (pool: IConnection[]) => {
    d('Pool updated:', pool)
    // Logger.info('Pool updated', { pool })
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

    this.pool.user = user

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

    // Clear out the authenticated user in the connection
    // pool so future connections don't start.
    this.pool.user = undefined

    // Remove files from system.
    this.userFile.remove()
    this.connectionsFile.remove()
  }
}
