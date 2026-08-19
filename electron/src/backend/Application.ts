import Controller from './Controller'
import oidc from './Oidc'
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
    // Restore any stored OIDC session before the renderer can ask for tokens (plain-file
    // read here; re-persisted encrypted when ElectronApp injects safeStorage).
    await oidc.load()
    await binaryInstaller.init()
    server.start()
    if (server.io) new Controller(server.io, this.pool)
  }

  quit() {
    this.electron && this.electron.app.quit()
  }

  quitDuplicateInstance() {
    this.electron && this.electron.quitDuplicateInstance()
  }

  recapitate(head: any) {
    this.electron = head
    environment.recapitate()
    EventBus.emit(electronInterface.EVENTS.recapitate)
  }
}
