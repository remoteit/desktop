import debug from 'debug'
import cli from './cliInterface'
import electronInterface from './electronInterface'
import Connection from './Connection'
import EventBus from './EventBus'
import Logger from './Logger'
import path from 'path'
import environment from './environment'
import PortScanner from './PortScanner'
import JSONFile from './JSONFile'

const d = debug('ConnectionPool')
const PEER_PORT_RANGE = [33000, 42999]

export default class ConnectionPool {
  freePort?: number

  private pool: Connection[] = []
  private connectionsFile: JSONFile<IConnection[]>

  static EVENTS = {
    updated: 'pool',
    freePort: 'freePort',
  }

  constructor() {
    this.connectionsFile = new JSONFile<IConnection[]>(path.join(environment.userPath, 'connections.json'))
    const connections: IConnection[] = this.connectionsFile.read() || []

    Logger.info('Initializing connections pool', { length: connections.length })

    // load connection data
    connections.map(async c => await this.set(c))

    // init freeport
    this.nextFreePort()

    // Listen to events to synchronize state
    EventBus.on(Connection.EVENTS.disconnected, this.updated)
    EventBus.on(Connection.EVENTS.connected, this.updated)
    EventBus.on(Connection.EVENTS.started, this.updated)
    EventBus.on(electronInterface.EVENTS.forget, this.forget)
    EventBus.on(electronInterface.EVENTS.ready, this.updated)
  }

  syncCLI = () => {
    // move connections: cli -> desktop
    cli.data.connections.forEach(async c => {
      const connection = this.find(c.id)?.params
      d('SYNC CLI CONNECTION', connection, c)
      if (
        !connection ||
        connection.startTime !== c.startTime ||
        connection.active !== c.active ||
        connection.failover !== c.failover ||
        connection.autoStart !== c.autoStart
      ) {
        await this.set({ ...connection, ...c })
      }
    })
    // start any connections: desktop -> cli
    this.pool.forEach(connection => {
      const cliConnection = cli.data.connections.find(c => c.id === connection.params.id)
      if (!cliConnection && connection.params.active) {
        Logger.info('SYNC START CONNECTION', { connection: connection.params })
        connection.start()
      }
    })
  }

  check = this.syncCLI

  // update single connection
  set = async (connection: IConnection, setCLI?: boolean) => {
    if (!connection) Logger.warn('No connections to set!', { connection })
    let instance = this.find(connection.id)
    if (instance) await instance.set(connection, setCLI)
    else instance = this.add(connection)
    this.updated()
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
    d('CONNECTING:', connection)
    if (!connection) return new Error('No connection data!')
    const instance = await this.set(connection)
    if (!instance) return
    await this.assignPort(instance)
    await instance.start()
    this.updated()
  }

  stop = async ({ id }: IConnection) => {
    d('STOPPING CONNECTION:', id)
    const instance = this.find(id)
    instance && instance.stop()
  }

  forget = async ({ id }: IConnection) => {
    d('FORGETTING CONNECTION:', id)
    const connection = this.find(id)
    if (connection) {
      const index = this.pool.indexOf(connection)
      await connection.forget()
      this.pool.splice(index, 1)
      this.updated()
    }
    EventBus.emit(Connection.EVENTS.forgotten, id)
  }

  stopAll = async () => {
    d('STOPPING ALL CONNECTIONS')
    if (this.pool.length) {
      await this.pool.forEach(async c => await c.stop())
      this.updated()
    }
  }

  reset = async () => {
    await this.stopAll()
    this.pool = []
    this.connectionsFile.remove()
  }

  updated = () => {
    const json = this.toJSON()
    this.connectionsFile.write(json)
    EventBus.emit(ConnectionPool.EVENTS.updated, json)
  }

  toJSON = (): IConnection[] => {
    return this.pool
      .map(c => c.params)
      .sort((a, b) => {
        return (
          this.sort(a.active, b.active) ||
          (a.active ? this.sort(a.startTime, b.startTime) : this.sort(a.endTime, b.endTime))
        )
      })
  }

  //@ts-ignore - you can do math with booleans
  sort = (a: number | boolean = 0, b: number | boolean = 0) => b - a

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

  private get usedPorts() {
    return this.pool.reduce((result: number[], c) => {
      if (c.params.port) result.push(c.params.port)
      return result
    }, [])
  }
}
