import debug from 'debug'
import electron from 'electron'
import Controller from './Controller'
import ConnectionPool from './ConnectionPool'
import RemoteitInstaller from './RemoteitInstaller'
import CLIInterface from './CLIInterface'
import Environment from './Environment'
import ElectronApp from './ElectronApp'
import AutoUpdater from './AutoUpdater'
import JSONFile from './JSONFile'
import Logger from './Logger'
import path from 'path'
import user from './User'
import Server from './Server'
import Tracker from './Tracker'
import EventBus from './EventBus'

const d = debug('r3:backend:Application')

export default class Application {
  public pool: ConnectionPool
  public cli: CLIInterface
  private connectionsFile: JSONFile<IConnection[]>
  private autoUpdater?: AutoUpdater

  constructor() {
    Logger.info('Application starting up!')

    this.handleExit()
    this.connectionsFile = new JSONFile<IConnection[]>(path.join(Environment.userPath, 'connections.json'))

    // exit electron start if running headless
    if (electron.app) {
      // Create app UI
      new ElectronApp()
      // add auto updater
      this.autoUpdater = new AutoUpdater()
    }

    // Start pool and load connections from filesystem
    this.pool = new ConnectionPool(this.connectionsFile.read() || [])

    // remoteit CLI init
    this.cli = new CLIInterface()

    // Start server and listen to events
    const server = new Server()

    // create the event controller
    new Controller(server.io, this.cli, this.pool)

    // start heartbeat 1bpm
    setInterval(this.check, 1000 * 60)

    EventBus.on(ConnectionPool.EVENTS.updated, this.handlePoolUpdated)
    EventBus.on(Server.EVENTS.authenticated, this.check)
    EventBus.on(user.EVENTS.signedOut, this.handleSignedOut)
  }

  private check = () => {
    this.autoUpdater && this.autoUpdater.check()
    RemoteitInstaller.check()
    this.pool.check()
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
   * When a user logs out, remove their credentials from the
   * saved connections file.
   */
  private handleSignedOut = async () => {
    Logger.info('Signing out user')

    // Stop all connections cleanly
    await this.pool.stopAll()

    // Remove files from system.
    // this.connectionsFile.remove() // Lets keep the connections, unless manually removed.
  }
}
