import debug from 'debug'
import Controller from './Controller'
import ConnectionPool from './ConnectionPool'
import remoteitInstaller from './remoteitInstaller'
import binaryInstaller from './binaryInstaller'
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

  constructor() {
    Logger.info('Application starting up!')
    this.pool = new ConnectionPool()
    this.constructorSync()
  }

  async constructorSync() {
    this.bindExitHandlers()
    environment.setElevatedState()
    await this.install()

    // Start server and listen to events
    server.start()

    // create the event controller
    if (server.io) new Controller(server.io, this.pool)

    EventBus.on(user.EVENTS.signedIn, this.startHeartbeat)
    EventBus.on(user.EVENTS.signedOut, this.handleSignedOut)
  }

  quit() {
    if (this.electron) this.electron.app.quit()
  }

  restart() {
    if (this.electron) this.electron.autoUpdater.restart()
  }

  recapitate(head: any) {
    this.electron = head
  }

  private install = async () => {
    const install = !(await remoteitInstaller.isCurrent(true))
    if (install) {
      Logger.info('INSTALLING BINARIES')
      await binaryInstaller.install()
    }
  }

  private startHeartbeat = () => {
    // start heartbeat 1bpm
    setInterval(this.check, 1000 * 60)
    this.check()
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
    this.pool && (await this.pool.stopAll())
    process.exit()
  }

  private handleException = async (code: any) => {
    if (code !== 0) Logger.warn('PROCESS EXCEPTION', { errorCode: code })
    this.pool && (await this.pool.stopAll())
  }

  /**
   * When a user logs out, remove their credentials from the
   * saved connections file.
   */
  private handleSignedOut = async () => {
    Logger.info('Signing out user')

    // Stop all connections cleanly
    this.pool && (await this.pool.stopAll())
  }
}
