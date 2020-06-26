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
    await environment.setElevatedState()
    server.start()
    this.startHeartbeat()

    if (server.io) new Controller(server.io, this.pool)

    EventBus.on(User.EVENTS.signedIn, () => this.check(true))
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

  private check = (log?: boolean) => {
    if (!user.signedIn) return

    this.electron && this.electron.check()
    remoteitInstaller.check(log)
    this.pool.check()
    cli.check()
    lan.check()
  }
}
