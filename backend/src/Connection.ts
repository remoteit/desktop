import cli from './cliInterface'
import debug from 'debug'
import EventBus from './EventBus'
import { EventEmitter } from 'events'
import { IP_OPEN, IP_PRIVATE } from './sharedCopy/constants'
import { Logger } from '.'

const d = debug('r3:backend:Connection')

export default class Connection extends EventEmitter {
  params!: IConnection

  static EVENTS: { [name: string]: SocketEvent } = {
    connected: 'service/connected',
    disconnected: 'service/disconnected',
    error: 'service/error',
  }

  constructor(connection: IConnection) {
    super()
    connection.createdTime = Date.now()
    this.set(connection)
  }

  set({ host = IP_PRIVATE, restriction = IP_OPEN, failover = true, ...connection }: IConnection, setCLI?: boolean) {
    this.params = { host, restriction, failover, ...connection }
    d('SET CONNECTION', { params: this.params })
    if (setCLI) cli.setConnection(this.params, this.error)
  }

  start() {
    this.params.connecting = true
    this.params.startTime = Date.now()
    this.params.error = undefined
    // if (cli.data.connections.find(c => c.id === this.params.id)) cli.setConnection(this.params, this.error) else
    cli.addConnection(this.params, this.error)
    EventBus.emit(Connection.EVENTS.connected, { connection: this.params, raw: 'Connected' })
  }

  stop() {
    d('Stopping service:', this.params.id)
    this.params.active = false
    this.params.endTime = Date.now()
    cli.setConnection(this.params, this.error)
    EventBus.emit(Connection.EVENTS.disconnected, { connection: this.params } as ConnectionMessage)
  }

  async clear() {
    this.params.connecting = false
    this.params.startTime = undefined
    this.params.error = undefined
    await cli.removeConnection(this.params, this.error)
  }

  async forget() {
    Logger.info('FORGET ', this.params)
    await cli.removeConnection(this.params, this.error)
  }

  error = (e: Error) => {
    this.params.error = { message: e.message }
    this.params.active = false
    this.params.endTime = Date.now()
    EventBus.emit(Connection.EVENTS.error, { ...this.params.error, connection: this.params } as ConnectionErrorMessage)
  }
}
