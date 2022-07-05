import debug from 'debug'
import cli from './cliInterface'
import { WEB_PORT } from './constants'
import { IP_PRIVATE } from './sharedCopy/constants'
import electronInterface from './electronInterface'
import binaryInstaller from './binaryInstaller'
import preferences from './preferences'
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
    connections.map(c => this.set(c, false, true))
    this.updated()
  }

  // Sync with CLI
  check = async () => {
    let update = false
    if (!binaryInstaller.ready || binaryInstaller.inProgress || !user.signedIn) return
    const cliData = await cli.readConnections()
    if (!cliData) return

    // move connections: cli -> desktop
    cliData.forEach(cliConnection => {
      const connection = this.find(cliConnection.id)?.params
      if (!connection || (!connection.public && this.changed(connection, cliConnection))) {
        Logger.info('SYNC CONNECTION CLI -> DESKTOP', { id: cliConnection.id })
        this.set({ ...connection, ...cliConnection }, false, true)
        update = true
      }
    })

    // start any connections: desktop -> cli
    this.pool.forEach(connection => {
      if (!(connection.params.enabled || connection.params.connected) || connection.params.public) return

      const cliConnection = cliData.find(c => c.id === connection.params.id)

      if (!cliConnection) {
        Logger.info('SYNC CONNECTION DESKTOP -> CLI', { connection: connection.params })
        connection.start()
        update = true
      }

      if (connection.params.host === IP_PRIVATE && preferences.get().useCertificate) {
        if (!connection.params.error) {
          Logger.warn('CERTIFICATE HOSTNAME ERROR', { connection: connection.params })
          connection.error(new Error('Connection certificate error, unable to use custom hostname.'))
        }
      }
    })

    if (update) this.updated()
  }

  // update single connection
  set = (connection: IConnection, setCLI?: boolean, skipUpdate?: boolean) => {
    if (!connection) Logger.warn('No connections to set!', { connection })
    let instance = this.find(connection.id)
    d('SET SINGLE CONNECTION', { name: connection.name, id: connection.id })
    if (instance) {
      if (JSON.stringify(connection) !== JSON.stringify(instance.params)) {
        instance.set(connection, setCLI)
        if (!skipUpdate) this.updated()
      }
    } else {
      instance = this.add(connection)
      if (!skipUpdate) this.updated()
    }
    return instance
  }

  add = (connection: IConnection) => {
    const instance = new Connection(connection)
    d('ADDING CONNECTION', connection.id)
    this.pool.push(instance)
    return instance
  }

  changed = (c1: IConnection, c2: IConnection) => {
    const props: (keyof IConnection)[] = [
      'host',
      'port',
      'enabled',
      'startTime',
      'connected',
      'connecting',
      'disconnecting',
      'reachable',
      'sessionId',
      'starting',
    ]
    return props.some(prop => {
      if (c1[prop] !== c2[prop]) {
        Logger.info('CONNECTION CHANGED', { prop, fromConn: c1[prop], toCLI: c2[prop] })
        return true
      }
    })
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
    // Logger.info('CONNECTION POOL UPDATED')
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
    const next = await PortScanner.findFreePortInRange(PEER_PORT_RANGE[0], PEER_PORT_RANGE[1], this.usedPorts)
    Logger.info('NEXT_FREE_PORT', { next })
    return next
  }

  private assignPort = async (connection: Connection) => {
    if (!connection.params.port) connection.params.port = await this.nextFreePort()
    if (!connection.params.port) throw new Error('No port could be assigned to connection!')
  }

  reachablePort = async (data: IReachablePort) => {
    return await PortScanner.isPortReachable(data.port, data.host)
  }

  private get usedPorts() {
    return this.pool
      .reduce(
        (result: number[], c) => {
          if (c.params.port) result.push(c.params.port)
          return result
        },
        [WEB_PORT]
      )
      .sort()
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
    const previousCLI = preferences.get().cliConfigVersion || 0
    const thisCLI = cli.data.configVersion || 0

    if (previousCLI < thisCLI && thisCLI === 3) {
      Logger.info('MIGRATING CONNECTION DATA', { previousVersion: previousCLI, thisVersion: thisCLI })

      // migrate active to enabled and connected
      connections = connections.map(c => {
        // @ts-ignore
        c.enabled = !!(c.enabled || c.active)
        // @ts-ignore
        delete c.active
        // setup safe names for hostname
        c.name = c.name?.toLowerCase().replace(/[-\s]+/g, '-')
        c.targetHost = undefined
        return { ...c }
      })
    }

    preferences.update({ cliConfigVersion: thisCLI })
    return connections
  }
}
