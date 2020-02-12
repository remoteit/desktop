import debug from 'debug'
import Controller from './Controller'
import ConnectionPool from './ConnectionPool'
import remoteitInstaller from './remoteitInstaller'
import environment from './environment'
import Logger from './Logger'
import user from './User'
import server from './Server'
import Tracker from './Tracker'
import EventBus from './EventBus'

const d = debug('r3:backend:Application')

export default class Application {
  public electron?: any
  public pool: ConnectionPool
  private controller?: Controller

  constructor() {
    Logger.info('Application starting up!')

    this.bindExitHandlers()
    environment.setElevatedState()

    // This electron now should be set externally (id application.electron = ElectronApp)
    this.electron = false

    // Start pool and load connections from filesystem
    this.pool = new ConnectionPool()

    // Start server and listen to events
    server.start()

    // create the event controller
    if (server.io) this.controller = new Controller(server.io, this.pool)

    this.install()

    EventBus.on(user.EVENTS.signedIn, this.startHeartbeat)
    EventBus.on(user.EVENTS.signedOut, this.handleSignedOut)
  }

  private install = async () => {
    const install = !(await remoteitInstaller.isCurrent(true))
    if (install && this.controller) {
      Logger.info('INSTALLING BINARIES')
      this.controller.installBinaries()
    }
  }

  private startHeartbeat = () => {
    // start heartbeat 1bpm
    setInterval(this.check, 1000 * 60)
  }

  private check = () => {
    this.electron && this.electron.check()
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

  private handleExit = async () => {
    if (this.pool) await this.pool.stopAll()
    process.exit()
  }

  private handleException = async (code: any) => {
    if (code !== 0) Logger.warn('PROCESS EXCEPTION', { errorCode: code })
    if (this.pool) await this.pool.stopAll()
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
