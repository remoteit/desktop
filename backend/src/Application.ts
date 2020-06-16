import { HEARTBEAT_INTERVAL } from './constants'
import Controller from './Controller'
import electronInterface from './electronInterface'
import ConnectionPool from './ConnectionPool'
import remoteitInstaller from './remoteitInstaller'
import environment from './environment'
import Logger from './Logger'
import cli from './cliInterface'
import user, { User } from './User'
import server from './server'
import EventBus from './EventBus'
import lan from './LAN'

export default class Application {
  public electron?: any
  public pool: ConnectionPool

  constructor() {
    Logger.info('Application starting up!')
    this.pool = new ConnectionPool()
    this.constructorSync()
  }

  async constructorSync() {
    await lan.checkOob()
    this.bindExitHandlers()
    await environment.setElevatedState()
    remoteitInstaller.check(true)
    server.start()
    this.startHeartbeat()

    if (server.io) new Controller(server.io, this.pool)

    EventBus.on(User.EVENTS.signedIn, this.check)
    EventBus.on(User.EVENTS.signedOut, this.handleSignedOut)
  }

  quit() {
    if (this.electron) this.electron.app.quit()
  }

  restart() {
    if (this.electron) this.electron.autoUpdater.restart()
  }

  recapitate(head: any) {
    this.electron = head
    environment.recapitate()
    EventBus.emit(electronInterface.EVENTS.recapitate)
  }

  private startHeartbeat = () => {
    setInterval(this.check, HEARTBEAT_INTERVAL)
  }

  private check = () => {
    if (!user.signedIn) return

    this.electron && this.electron.check()
    remoteitInstaller.check()
    this.pool.check()
    cli.check()
    lan.check()
  }

  private bindExitHandlers = () => {
    // Do something when app is closing
    process.on('exit', this.handleException)

    // Catches ctrl+c event
    process.on('SIGINT', this.handleException)
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
