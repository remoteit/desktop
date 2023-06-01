import Controller from './Controller'
import binaryInstaller from './binaryInstaller'
import electronInterface from './electronInterface'
import ConnectionPool from './ConnectionPool'
import environment from './environment'
import server from './server'
import EventBus from './EventBus'

export default class Application {
  public electron?: any
  public pool: ConnectionPool

  constructor() {
    this.pool = new ConnectionPool()
    this.constructorSync()
  }

  async constructorSync() {
    await environment.setElevatedState()
    await binaryInstaller.init()
    server.start()
    if (server.io) new Controller(server.io, this.pool)
  }

  quit() {
    this.electron && this.electron.app.quit()
  }

  recapitate(head: any) {
    this.electron = head
    environment.recapitate()
    EventBus.emit(electronInterface.EVENTS.recapitate)
  }
}
