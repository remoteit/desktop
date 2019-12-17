import debug from 'debug'
import Connection from './Connection'
import EventBus from './EventBus'
import Logger from './Logger'
import PortScanner from './PortScanner'
import ElectronApp from './ElectronApp'
import user from './User'

const d = debug('r3:backend:ConnectionPool')

const PEER_PORT_RANGE = [33000, 42999]

export default class ConnectionPool {
  freePort?: number

  private pool: Connection[] = []

  static EVENTS = {
    updated: 'pool',
  }

  constructor(connections: IConnection[]) {
    Logger.info('Initializing connections pool', { connections })

    connections.map(c => this.set(c))

    // Only turn on connections the user had open last time.
    connections.map(c => c.autoStart && this.start(c))

    // init freeport
    this.nextFreePort()

    // Listen to events to synchronize state
    EventBus.on(Connection.EVENTS.disconnected, this.updated)
    EventBus.on(Connection.EVENTS.connected, this.updated)
    EventBus.on(Connection.EVENTS.started, this.updated)
    EventBus.on(ElectronApp.EVENTS.ready, this.updated)
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
    if (!user.signedIn) {
      user.signOut()
      return
    }
    const instance = new Connection(user, connection)
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
    return await this.pool.map(async c => await c.stop())
  }

  reset = async () => {
    await this.stopAll()
    this.pool = []
    this.updated()
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
    const lastPort = usedPorts.sort((a, b) => b - a)[0]
    this.freePort = await PortScanner.findFreePortInRange(lastPort, PEER_PORT_RANGE[1], usedPorts)
    Logger.info('nextFreePort', { freePort: this.freePort })
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
    return this.pool.reduce((result: any[], c) => {
      if (c.params.port) result.push(c.params.port)
      return result
    }, [])
  }
}
