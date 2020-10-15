import Controller from './Controller'
import electronInterface from './electronInterface'
import ConnectionPool from './ConnectionPool'
import environment from './environment'
import Logger from './Logger'
import server from './server'
import EventBus from './EventBus'
import lan from './LAN'

export default class Application {
  public electron?: any
  public pool: ConnectionPool

  constructor() {
    this.pool = new ConnectionPool()
    this.constructorSync()
  }

  async constructorSync() {
    await lan.checkOob()
    await environment.setElevatedState()
    server.start()
    if (server.io) new Controller(server.io, this.pool)
  }

  check() {
    this.electron && this.electron.check()
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
}
