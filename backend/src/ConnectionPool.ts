import debug from 'debug'
import cli from './cliInterface'
import { WEB_PORT } from './constants'
import { IP_PRIVATE, DEFAULT_CONNECTION } from './sharedCopy/constants'
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
    pool: 'pool',
    updated: 'updated',
    clearErrors: 'clearErrors',
  }

  constructor() {
    EventBus.on(electronInterface.EVENTS.ready, this.updated)
    EventBus.on(electronInterface.EVENTS.clear, this.clear)
    EventBus.on(ConnectionPool.EVENTS.clearErrors, this.clearErrors)
  }

  init() {
    this.file = new JSONFile<IConnection[]>(path.join(environment.userPath, `connections/${user.id}.json`))
    this.migrateLegacyFile()

    let connections: IConnection[] = this.file.read() || []
    connections = this.migrateConnectionData(connections)

    Logger.info('INITIALIZING CONNECTIONS', { file: this.file.location, length: connections.length })

    // load connection data
    this.setAll(connections, false)
  }

  // Sync with CLI
  check = async () => {
    if (!binaryInstaller.ready || binaryInstaller.inProgress || !user.signedIn) return
    const cliData = await cli.readConnections()
    if (!cliData) return

    // move connections: cli -> desktop
    cliData.forEach(cliConnection => {
      const connection = this.find(cliConnection.id)?.params || DEFAULT_CONNECTION
      if (connection.public || connection.connectLink) {
        this.stop(connection)
      } else if (this.changed(cliConnection, connection)) {
        Logger.info('SYNC CONNECTION CLI -> DESKTOP', { id: cliConnection.id })
        this.set({
          ...connection,
          ...cliConnection,
          enabled: this.stopLocked(connection) ? false : cliConnection.enabled,
        })
      }
    })

    // start any connections: desktop -> cli
    this.pool.forEach(instance => {
      if (
        !(instance.params.enabled || instance.params.connected) ||
        instance.params.public ||
        instance.params.connectLink
      ) {
        this.clearTransitions(instance)
        return
      }

      const cliConnection = cliData.find(c => c.id === instance.params.id)
      if (!cliConnection && !this.stopLocked(instance.params)) {
        Logger.info('SYNC CONNECTION DESKTOP -> CLI', { connection: instance.params })
        this.start(instance.params)
        this.updated(instance)
      }

      if (instance.params.host === IP_PRIVATE && preferences.get().useCertificate) {
        if (!instance.params.error) {
          Logger.warn('CERTIFICATE HOSTNAME ERROR', { connection: instance.params })
          instance.error(
            new Error(
              'Connection certificate error, unable to use custom hostname. If this continues turn off "Named Connections" in the Application Settings page.'
            )
          )
          this.updated(instance)
        }
      }
    })
  }

  setAll = (connections: IConnection[], setCLI?: boolean) => {
    connections.forEach(c => this.set(c, c.public || c.connectLink ? false : setCLI, true))
    this.updated()
  }

  // update single connection
  set = (connection: IConnection, setCLI?: boolean, skipUpdate?: boolean): Connection => {
    if (!connection) Logger.warn('No connections to set!', { connection })
    let instance = this.find(connection.id)
    if (instance) instance.set(connection, setCLI)
    else instance = this.add(connection)
    if (!skipUpdate) this.updated(instance)
    return instance
  }

  add = (connection: IConnection) => {
    const instance = new Connection(connection)
    d('ADDING CONNECTION', connection.id)
    this.pool.push(instance)
    return instance
  }

  stopLocked = (connection: IConnection) => {
    const expireLock = Date.now() - 1000 * 60 * 2
    return Boolean(connection.stopLock && connection.stopLock > expireLock)
  }

  changed = (f: IConnection, t: IConnection) => {
    const props: (keyof IConnection)[] = [
      'host',
      'port',
      'enabled',
      'starting',
      'connecting',
      'connected',
      'disconnecting',
      'stopping',
      'typeID',
      'isP2P',
      'restriction',
      'timeout',
      'sessionId',
      'createdTime',
      'startTime',
      'endTime',
      'error',
      'checkpoint',
    ]
    return props.some(prop => {
      if (f[prop] !== undefined && JSON.stringify(f[prop]) !== JSON.stringify(t[prop])) {
        Logger.info('CONNECTION CHANGED', {
          id: f.id,
          prop,
          fromCLI: f[prop] === undefined ? '<empty>' : f[prop],
          toDesktop: t[prop] === undefined ? '<empty>' : t[prop],
        })
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
    const instance = this.set(connection, false, true)
    instance.params = await this.assignPort(instance.params)
    await instance.start()
    this.updated(instance)
  }

  disconnect = async (connection: IConnection) => {
    Logger.info('DISCONNECT', { id: connection.id })
    const instance = this.set(connection, false, true)
    await instance.disconnect()
    this.updated(instance)
  }

  stop = async (connection: IConnection) => {
    Logger.info('REMOVE', { id: connection.id })
    const instance = this.set(connection, false, true)
    await instance.stop()
    this.updated(instance)
  }

  forget = async (connection: IConnection) => {
    Logger.info('FORGET', { id: connection.id })
    const instance = this.set(connection, false, true)
    const index = this.pool.indexOf(instance)
    await instance.clear()
    this.pool.splice(index, 1)
    this.updated()
  }

  clear = async (connection: IConnection) => {
    Logger.info('CLEAR', { id: connection.id })
    const instance = this.set(connection, false, true)
    await instance.clear()
    this.updated()
  }

  clearTransitions = (instance: Connection) => {
    if (
      instance.params.stopping ||
      instance.params.disconnecting ||
      instance.params.starting ||
      instance.params.connecting
    ) {
      Logger.info('CLEAR CONNECTION TRANSITION STATE')
      instance.params.connecting = false
      instance.params.disconnecting = false
      instance.params.stopping = false
      instance.params.starting = false
      this.updated(instance)
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
    EventBus.emit(ConnectionPool.EVENTS.pool, [])
  }

  updated = (instance?: Connection) => {
    if (!user.signedIn) return
    const json = this.toJSON()
    this.file?.write(json)
    if (instance) Logger.info('CONNECTION UPDATE EVENT', { id: instance.params.id, name: instance.params.name })
    if (instance) EventBus.emit(ConnectionPool.EVENTS.updated, instance.params)
    else EventBus.emit(ConnectionPool.EVENTS.pool, json)
  }

  toJSON = (): IConnection[] => {
    return this.pool.map(c => c.params)
  }

  nextFreePort = async () => {
    const next = await PortScanner.findFreePortInRange(PEER_PORT_RANGE[0], PEER_PORT_RANGE[1], this.usedPorts)
    Logger.info('NEXT_FREE_PORT', { next })
    return next
  }

  private assignPort = async (connection: IConnection) => {
    if (!connection.port) connection.port = await this.nextFreePort()
    if (!connection.port) throw new Error('No port could be assigned to connection!')
    return connection
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

    connections = connections.map(c => {
      if (!c.failover && c.proxyOnly) c.failover = true
      return c
    })

    if (previousCLI !== thisCLI) preferences.update({ cliConfigVersion: thisCLI })
    return connections
  }
}
