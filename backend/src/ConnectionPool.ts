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
  private pool: { [id: string]: Connection } = {}

  static EVENTS = {
    updated: 'pool/updated',
  }

  constructor(connections: ConnectionData[], user?: UserCredentials) {
    Logger.info('Initializing connections pool', { connections })

    this.user = user

    // Only turn on connections the user had open last time.
    connections.map(conn => this.connect(conn))

    // Listen to events to synchronize state
    EventBus.on(User.EVENTS.signedIn, (user: IUser) => (this.user = user))
    EventBus.on(User.EVENTS.signedOut, () => (this.user = undefined))
    EventBus.on(Connection.EVENTS.disconnected, this.updated)
    EventBus.on(Connection.EVENTS.connected, this.updated)
    EventBus.on(Connection.EVENTS.started, this.updated)
    EventBus.on(ElectronApp.EVENTS.ready, this.updated)
  }

  connect = async (args: { id: string; port?: number; name?: string; autoStart?: boolean }) => {
    d('Connecting:', args)

    if (!args.id) throw new Error('No service id to create a connection!')

    if (!this.user) throw new Error('No user to authenticate connection!')

    const port = args.port || (await this.freePort())

    if (!port) throw new Error('No port could be assigned to connection!')

    Logger.info('Connecting to service:', args)

    // TODO: De-dupe connections!

    const connection = new Connection({
      port,
      username: this.user.username,
      authHash: this.user.authHash,
      ...args,
    })

    this.pool[args.id] = connection

    d(`Starting connection - port:${port}, id: ${args.id}`)

    if (!connection.autoStart) return

    await this.start(args.id)

    // Trigger a save of the connections file
    this.updated()

    return connection
  }

  find = (id: string) => {
    d('Find connection with ID:', { id, pool: this.pool })

    const conn = this.pool[id]
    if (!conn) throw new Error(`Connection with ID ${id} could not be found!`)
    d('Connection found:', { id, port: conn.port, pid: conn.pid })
    return conn
  }

  start = async (id: string) => {
    d('Starting service:', id)
    return this.find(id).start()
  }

  stop = async (id: string) => {
    d('Stopping service:', id)
    return this.find(id).stop()
  }

  stopAll = async () => {
    return Object.keys(this.pool).map(id => this.stop(id))
  }

  forget = async (id: string) => {
    await this.stop(id)
    delete this.pool[id]
    this.updated()
    EventBus.emit(Connection.EVENTS.forgotten, id)
  }

  reset = async () => {
    await this.stopAll()
    this.pool = {}
  }

  restart = async (id: string) => {
    d('Restart service:', id)
    return this.find(id).restart()
  }

  updated = async () => {
    EventBus.emit(ConnectionPool.EVENTS.updated, this.toJSON())
  }

  toJSON = (): ConnectionData[] => {
    const ids = Object.keys(this.pool)
    return ids.map(id => this.pool[id].toJSON()).sort((c: ConnectionData) => (c.pid ? -1 : 1))
  }

  private freePort = async () => {
    return await PortScanner.findFreePortInRange(PEER_PORT_RANGE[0], PEER_PORT_RANGE[1], this.usedPorts)
  }

  private get usedPorts() {
    return Object.keys(this.pool).map(id => this.pool[id].port)
  }
}
