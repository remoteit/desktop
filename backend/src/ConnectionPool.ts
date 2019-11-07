import debug from 'debug'
import Connection from './Connection'
import EventBus from './EventBus'
import Logger from './Logger'
import PortScanner from './PortScanner'
import ElectronApp from './ElectronApp'
import User from './User'
import { IUser } from 'remote.it'

const d = debug('r3:backend:ConnectionPool')

const PEER_PORT_RANGE = [33000, 42999]

export default class ConnectionPool {
  user?: UserCredentials

  private pool: Connection[] = []

  static EVENTS = {
    updated: 'pool/updated',
  }

  constructor(connections: IConnection[], user?: UserCredentials) {
    Logger.info('Initializing connections pool', { connections })

    this.user = user
    this.set(connections)

    // Only turn on connections the user had open last time.
    connections.map(conn => conn.autoStart && this.start(conn.id))

    // Listen to events to synchronize state
    EventBus.on(User.EVENTS.signedIn, (user: IUser) => (this.user = user))
    EventBus.on(User.EVENTS.signedOut, () => (this.user = undefined))
    EventBus.on(Connection.EVENTS.disconnected, this.updated)
    EventBus.on(Connection.EVENTS.connected, this.updated)
    EventBus.on(Connection.EVENTS.started, this.updated)
    EventBus.on(ElectronApp.EVENTS.ready, this.updated)
  }

  set = async (connections: IConnection[]) => {
    connections.map(connection => {
      const exists = this.find(connection.id)
      // update
      if (exists) {
        if (exists.active) throw new Error('Can not update an active connection!')
        else exists.set(connection)
      }
      // add
      else this.add(connection)
    })
  }

  add = (connection: IConnection) => {
    if (!this.user) throw new Error('No user to authenticate connection!')
    const instance = new Connection(this.user, connection)
    this.pool.push(instance)
    return instance
  }

  find = (id: string) => {
    d('Find connection with ID:', { id, pool: this.pool })
    return this.pool.find(c => c.params.id === id)
    // if (!connection) throw new Error(`Connection with ID ${id} could not be found!`)
    // d('Connection found:', { id, port: connection.params.port, pid: connection.params.pid })
    // return connection
  }

  start = async (id: string) => {
    d('Connecting:', id)
    if (!id) throw new Error('No service id to create a connection!')

    const connection = this.find(id) || this.add({ id })
    if (!connection) throw new Error('No connection definition exists!')

    connection.params.port = connection.params.port || (await this.freePort())
    if (!connection.params.port) throw new Error('No port could be assigned to connection!')

    Logger.info('Connecting to service:', connection.params)
    d(`Starting connection - port:${connection.params.port}, id: ${connection.params.id}`)
    await connection.start()

    // Trigger a save of the connections file
    this.updated()
  }

  stop = async (id: string) => {
    d('Stopping service:', id)
    const instance = this.find(id)
    instance && instance.stop()
  }

  stopAll = async () => {
    d('Stopping all services')
    return await this.pool.map(async c => await c.stop())
  }

  forget = async (id: string) => {
    d('Forgetting service:', id)
    const connection = this.find(id)
    if (connection) {
      const index = this.pool.indexOf(connection)
      await connection.stop()
      this.pool.splice(index, 1)
      this.updated()
    }
    EventBus.emit(Connection.EVENTS.forgotten, id)
  }

  reset = async () => {
    await this.stopAll()
    this.pool = []
    this.updated()
  }

  restart = async (id: string) => {
    d('Restart service:', id)
    const instance = this.find(id)
    instance && (await instance.restart())
  }

  updated = async () => {
    EventBus.emit(ConnectionPool.EVENTS.updated, this.toJSON())
  }

  toJSON = (): IConnection[] => {
    return this.pool
      .map(c => c.toJSON())
      .sort((a, b) => this.sort(a.createdTime, b.createdTime))
      .sort((a, b) => this.sort(a.startTime, b.startTime))
  }

  sort = (a: number = 0, b: number = 0) => {
    return a && b ? a - b : 0
  }

  private freePort = async () => {
    return await PortScanner.findFreePortInRange(PEER_PORT_RANGE[0], PEER_PORT_RANGE[1], this.usedPorts)
  }

  private get usedPorts() {
    return this.pool.reduce((result: any[], c) => {
      if (c.params.port) result.push(c.params.port)
      return result
    }, [])
  }
}
