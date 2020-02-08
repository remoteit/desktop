import debug from 'debug'
import Controller from './Controller'
import ConnectionPool from './ConnectionPool'
import remoteitInstaller from './remoteitInstaller'
import CLIInterface from './CLIInterface'
import environment from './environment'
import ElectronApp from './ElectronApp'
import Logger from './Logger'
import user from './User'
import server from './Server'
import Tracker from './Tracker'
import EventBus from './EventBus'

const d = debug('r3:backend:Application')

export default class Application {
  public pool: ConnectionPool
  public cli: CLIInterface
  private controller?: Controller
  private app?: ElectronApp

  constructor() {
    Logger.info('Application starting up!')

    this.install()
    this.bindExitHandlers()
    environment.setElevatedState()

    // exit electron start if running headless
    if (!environment.isHeadless) this.app = new ElectronApp()

    // Start pool and load connections from filesystem
    this.pool = new ConnectionPool()

    // remoteit CLI init
    this.cli = new CLIInterface()

    // Start server and listen to events
    server.start()

    // create the event controller
    if (server.io) this.controller = new Controller(server.io, this.cli, this.pool)

    EventBus.on(user.EVENTS.signedIn, this.startHeartbeat)
    EventBus.on(user.EVENTS.signedOut, this.handleSignedOut)
  }

  private install = async () => {
    const install = !(await remoteitInstaller.isCurrent())
    if (install && this.controller) this.controller.installBinaries()
  }

  private startHeartbeat = () => {
    // start heartbeat 1bpm
    setInterval(this.check, 1000 * 60)
  }

  private check = () => {
    this.app && this.app.check()
    remoteitInstaller.check()
    this.pool.check()
  }

  private bindExitHandlers = () => {
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
   * When a user logs out, remove their credentials from the
   * saved connections file.
   */
  private handleSignedOut = async () => {
    Logger.info('Signing out user')

    // Stop all connections cleanly
    await this.pool.stopAll()
  }
}
