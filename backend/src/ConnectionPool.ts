import debug from 'debug'
import cli from './cliInterface'
import { WEB_PORT } from './constants'
import electronInterface from './electronInterface'
import binaryInstaller from './binaryInstaller'
import environment from './environment'
import PortScanner from './PortScanner'
import Connection from './Connection'
import JSONFile from './JSONFile'
import EventBus from './EventBus'
import Logger from './Logger'
import path from 'path'
import user from './User'

const d = debug('ConnectionPool')
const PEER_PORT_RANGE = [33000, 42999]

export default class ConnectionPool {
  freePort?: number

  private pool: Connection[] = []
  private file?: JSONFile<IConnection[]>

  static EVENTS = {
    updated: 'pool',
    freePort: 'freePort',
    reachablePort: 'reachablePort',
    clearErrors: 'clearErrors',
  }

  constructor() {
    EventBus.on(Connection.EVENTS.disconnected, this.updated)
    EventBus.on(Connection.EVENTS.connected, this.updated)
    EventBus.on(electronInterface.EVENTS.ready, this.updated)
    EventBus.on(electronInterface.EVENTS.clear, this.clear)
    EventBus.on(electronInterface.EVENTS.clearRecent, this.clearRecent)
    EventBus.on(ConnectionPool.EVENTS.clearErrors, this.clearErrors)
  }

  init() {
    this.file = new JSONFile<IConnection[]>(path.join(environment.userPath, `connections/${user.id}.json`))
    this.migrateLegacyFile()

    let connections: IConnection[] = this.file.read() || []
    connections = this.migrateConnectionData(connections)

    Logger.info('INITIALIZING CONNECTIONS', { file: this.file.location, length: connections.length })

    // load connection data
    connections.map(c => this.set(c))
  }

  // Sync with CLI
  check = async () => {
    if (binaryInstaller.uninstallInitiated || !user.signedIn) return

    await cli.readConnections()

    // move connections: cli -> desktop
    cli.data.connections.forEach(async c => {
      const connection = this.find(c.id)?.params
      if (
        !connection ||
        (!connection.public &&
          (connection.ip !== c.ip ||
            connection.host !== c.host ||
            connection.port !== c.port ||
            connection.enabled !== c.enabled ||
            connection.startTime !== c.startTime ||
            connection.connected !== c.connected ||
            connection.connecting !== c.connecting ||
            connection.disconnecting !== c.disconnecting ||
            connection.reachable !== c.reachable ||
            connection.sessionId !== c.sessionId))
      ) {
        // Logger.info('SYNC CLI CONNECTION', { connection, c })
        this.set({ ...connection, ...c }, false)
      }
    })
    // start any connections: desktop -> cli
    this.pool.forEach(connection => {
      const cliConnection = cli.data.connections.find(c => c.id === connection.params.id)
      if (!cliConnection && connection.params.connected && !connection.params.public) {
        Logger.info('SYNC START CONNECTION', { connection: connection.params })
        connection.start()
      }
    })
  }

  // update single connection
  set = (connection: IConnection, setCLI?: boolean) => {
    if (!connection) Logger.warn('No connections to set!', { connection })
    let instance = this.find(connection.id)
    d('SET SINGLE CONNECTION', { name: connection.name, id: connection.id })
    if (instance) {
      if (JSON.stringify(connection) !== JSON.stringify(instance.params)) {
        instance.set(connection, setCLI)
        this.updated()
      }
    } else {
      instance = this.add(connection)
      this.updated()
    }
    return instance
  }

  add = (connection: IConnection) => {
    const instance = new Connection(connection)
    d('ADDING CONNECTION', connection.id)
    this.pool.push(instance)
    return instance
  }

  find = (id: string) => {
    d('FIND CONNECTION ID:', id)
    return this.pool.find(c => c.params.id === id)
  }

  start = async (connection: IConnection) => {
    Logger.info('CONNECT', { id: connection.id })
    if (!connection) return new Error('No connection data!')
    const instance = this.set(connection)
    if (!instance) return
    await this.assignPort(instance)
    instance.start()
    this.updated()
  }

  stop = async ({ id }: IConnection) => {
    Logger.info('DISCONNECT', { id })
    const instance = this.find(id)
    instance && instance.stop()
  }

  disable = async ({ id }: IConnection) => {
    Logger.info('REMOVE', { id })
    const instance = this.find(id)
    instance && instance.disable()
    this.updated()
  }

  forget = async ({ id }: IConnection) => {
    Logger.info('FORGET', { id })
    const connection = this.find(id)
    if (connection) {
      const index = this.pool.indexOf(connection)
      await connection.clear()
      this.pool.splice(index, 1)
      this.updated()
    }
  }

  clear = async ({ id }: IConnection) => {
    Logger.info('CLEAR', { id })
    const connection = this.find(id)
    if (connection) {
      await connection.clear()
      this.updated()
    }
  }

  clearRecent = () => {
    this.pool = this.pool.filter(async connection => {
      if (connection.params.enabled && connection.params.online) return true
      await connection.clear()
      return false
    })
    Logger.info('CLEAR RECENT CONNECTIONS', { count: this.pool.length })
    this.updated()
  }

  clearErrors = async () => {
    this.pool.forEach(connection => (connection.params.error = undefined))
    Logger.info('CLEARING ERRORS')
    this.updated()
  }

  clearMemory = async () => {
    Logger.info('CLEARING CONNECTIONS')
    this.pool = []
    EventBus.emit(ConnectionPool.EVENTS.updated, [])
  }

  updated = () => {
    const json = this.toJSON()
    if (!user.signedIn) return
    this.file?.write(json)
    d('CONNECTION POOL UPDATED')
    EventBus.emit(ConnectionPool.EVENTS.updated, json)
  }

  toJSON = (): IConnection[] => {
    return this.pool
      .map(c => c.params)
      .sort((a, b) => this.sort(a.name || '', b.name || ''))
      .sort((a, b) => Number(b.connected || 0) - Number(a.connected || 0))
  }

  sort = (a: string, b: string) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0)

  nextFreePort = async () => {
    const usedPorts = this.usedPorts
    let lastPort = usedPorts.sort((a, b) => b - a)[0] || PEER_PORT_RANGE[0]
    if (lastPort >= PEER_PORT_RANGE[1]) lastPort = PEER_PORT_RANGE[0]
    this.freePort = await PortScanner.findFreePortInRange(lastPort, PEER_PORT_RANGE[1], usedPorts)
    Logger.info('NEXT_FREE_PORT', { freePort: this.freePort, lastPort, usedPorts })
    return this.freePort
  }

  private assignPort = async (connection: Connection) => {
    if (!connection.params.port) connection.params.port = await this.nextFreePort()
    if (!connection.params.port) throw new Error('No port could be assigned to connection!')
  }

  reachablePort = async (data: IReachablePort) => {
    return await PortScanner.isPortReachable(data.port, data.host)
  }

  private get usedPorts() {
    return this.pool.reduce(
      (result: number[], c) => {
        if (c.params.port) result.push(c.params.port)
        return result
      },
      [WEB_PORT]
    )
  }

  private migrateLegacyFile() {
    if (!this.file) return
    const legacyFile = new JSONFile<IConnection[]>(path.join(environment.userPath, 'connections.json'))
    if (legacyFile.exists) {
      Logger.info('MIGRATING LEGACY CONNECTIONS FILE')
      const data = legacyFile.read()
      Logger.info('COPYING CONNECTIONS DATA', { data })
      this.file.write(data)
      legacyFile.remove()
    }
  }

  private migrateConnectionData(connections: IConnection[]) {
    // migrate active to enabled and connected
    return connections.map(c => {
      // @ts-ignore
      const enabled = c.active
      // @ts-ignore
      delete c.active
      return { ...c, enabled, connected: enabled }
    })
  }
}
