import debug from 'debug'
import Connection from './Connection'
import EventBus from './EventBus'
import Logger from './Logger'
import PortScanner from './PortScanner'
import ElectronApp from './ElectronApp'
import TrayMenu from './TrayMenu'

const d = debug('r3:backend:ConnectionPool')
const PEER_PORT_RANGE = [33000, 42999]

export default class ConnectionPool {
  freePort?: number

  private pool: Connection[] = []

  static EVENTS = {
    updated: 'pool',
    freePort: 'freePort',
  }

  constructor(connections: IConnection[]) {
    Logger.info('Initializing connections pool', { connections })

    connections.map(c => this.set(c))

    // start any auto-start connections
    this.check()

    // init freeport
    this.nextFreePort()

    // Listen to events to synchronize state
    EventBus.on(Connection.EVENTS.disconnected, this.updated)
    EventBus.on(Connection.EVENTS.connected, this.updated)
    EventBus.on(Connection.EVENTS.started, this.updated)
    EventBus.on(ElectronApp.EVENTS.ready, this.updated)
    EventBus.on(TrayMenu.EVENTS.forget, this.forget)
  }

  // maintain auto start connections
  check = () => {
    this.toJSON().map(connection => {
      // start if auto start set, not running, has been started before and is online
      if (connection.autoStart && !connection.pid && connection.startTime && connection.online) this.start(connection)
    })
  }

  set = (connection: IConnection) => {
    if (!connection) Logger.warn('No connections to set!', { connection })
    let instance = this.find(connection.id)
    if (instance) instance.set(connection)
    else instance = this.add(connection)
    this.updated()
    return instance
  }

  add = (connection: IConnection) => {
    const instance = new Connection(connection)
    this.pool.push(instance)
    return instance
  }

  find = (id: string) => {
    d('Find connection with ID:', { id, pool: this.pool })
    return this.pool.find(c => c.params.id === id)
  }

  start = async (connection: IConnection) => {
    d('Connecting:', connection)
    if (!connection) return new Error('No connection data!')
    const instance = this.set(connection)
    if (!instance) return
    await this.assignPort(instance)
    await instance.start()
    this.updated()
  }

  stop = async ({ id }: IConnection, autoStart?: boolean) => {
    d('Stopping connection:', id)
    const instance = this.find(id)
    instance && instance.stop(autoStart)
  }

  forget = async ({ id }: IConnection) => {
    d('Forgetting connection:', id)
    const connection = this.find(id)
    if (connection) {
      const index = this.pool.indexOf(connection)
      await connection.stop()
      this.pool.splice(index, 1)
      this.updated()
    }
    EventBus.emit(Connection.EVENTS.forgotten, id)
  }

  stopAll = async () => {
    d('Stopping all services')
    await this.pool.map(async c => await c.stop())
    this.updated()
  }

  reset = async () => {
    await this.stopAll()
    this.pool = []
  }

  updated = async () => {
    EventBus.emit(ConnectionPool.EVENTS.updated, this.toJSON())
  }

  toJSON = (): IConnection[] => {
    return this.pool
      .map(c => c.toJSON())
      .sort((a, b) => this.sort(a.createdTime, b.createdTime))
      .sort((a, b) => this.sort(a.startTime, b.startTime))
    // .sort(a => (a.active ? -1 : 1))
  }

  sort = (a: number = 0, b: number = 0) => (a && b ? b - a : 0)

  nextFreePort = async () => {
    const usedPorts = this.usedPorts
    let lastPort = usedPorts.sort((a, b) => b - a)[0] || PEER_PORT_RANGE[0]
    if (lastPort >= PEER_PORT_RANGE[1]) lastPort = PEER_PORT_RANGE[0]
    this.freePort = await PortScanner.findFreePortInRange(lastPort, PEER_PORT_RANGE[1], usedPorts)
    Logger.info('nextFreePort', { freePort: this.freePort, lastPort, usedPorts })
    return this.freePort
  }

  private assignPort = async (connection: Connection) => {
    const { port } = connection.params
    if (port) {
      if (!(await PortScanner.isPortFree(port))) {
        connection.params.error = { message: `Port ${port} is in use. Port auto-assigned` }
        connection.params.port = await this.nextFreePort()
      }
    } else {
      connection.params.port = await this.nextFreePort()
    }

    if (!connection.params.port) throw new Error('No port could be assigned to connection!')
  }

  private get usedPorts() {
    return this.pool.reduce((result: number[], c) => {
      if (c.params.port) result.push(c.params.port)
      return result
    }, [])
  }
}
