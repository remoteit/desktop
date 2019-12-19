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
import user from './User'
import Server from './Server'
import Tracker from './Tracker'
import EventBus from './EventBus'

const d = debug('r3:backend:Application')

export default class Application {
  public pool: ConnectionPool
  private connectionsFile: JSONFile<IConnection[]>
  private window: ElectronApp

  constructor() {
    Logger.info('Application starting up!')

    this.handleExit()
    this.connectionsFile = new JSONFile<IConnection[]>(path.join(Environment.userPath, 'connections.json'))

    // pass the user through to tray menu
    this.window = new ElectronApp()

    // Start pool and load connections from filesystem
    this.pool = new ConnectionPool(this.connectionsFile.read() || [])

    // remoteit CLI init.
    const cli = new CLIInterface()

    // Start server and listen to events.
    const server = new Server()

    // Network utils
    const lan = new LAN(cli)

    // create the event controller
    new Controller(server.io, cli, lan, this.pool)

    EventBus.on(ConnectionPool.EVENTS.updated, this.handlePoolUpdated)
    EventBus.on(Server.EVENTS.authenticated, this.handleAuthenticated)
    EventBus.on(user.EVENTS.signedOut, this.handleSignedOut)
  }

  get url() {
    return this.window.url
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

  private handleAuthenticated = () => {
    ConnectdInstaller.check()
    MuxerInstaller.check()
    DemuxerInstaller.check()
    RemoteitInstaller.check()
  }

  /**
   * When a user logs out, remove their credentials from the
   * saved connections file.
   */
  private handleSignedOut = async () => {
    Logger.info('Signing out user')

    // Stop all connections cleanly
    await this.pool.reset()

    // Remove files from system.
    // this.connectionsFile.remove() // Lets keep the connections, unless manually removed.
  }
}
