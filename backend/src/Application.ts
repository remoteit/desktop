import debug from 'debug'
import Controller from './Controller'
import ConnectionPool from './ConnectionPool'
import remoteitInstaller from './remoteitInstaller'
import environment from './environment'
import Logger from './Logger'
import user from './User'
import server from './server'
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
    await environment.setElevatedState()
    await remoteitInstaller.check(true)
    server.start()
    this.startHeartbeat()
    if (server.io) new Controller(server.io, this.pool)

    EventBus.on(user.EVENTS.signedIn, this.check)
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
    environment.isHeadless = false
  } // hi

  private startHeartbeat = () => {
    let count = 0
    setInterval(() => {
      this.check(count++)
      if (count > 999) count = 0
    }, 1000 * 60) // 1bpm
  }

  private check = (count: number) => {
    if (!user.signedIn) return

    // check every 5 minutes
    if (count % 5 === 0 || isNaN(count)) {
      this.electron && this.electron.check()
      remoteitInstaller.check()
    }
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
