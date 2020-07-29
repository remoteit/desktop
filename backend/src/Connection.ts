import cli from './cliInterface'
import debug from 'debug'
import Logger from './Logger'
import EventBus from './EventBus'
import { EventEmitter } from 'events'
import { IP_OPEN, IP_PRIVATE } from './sharedCopy/constants'

const d = debug('r3:backend:Connection')

export default class Connection extends EventEmitter {
  params!: IConnection

  static EVENTS: { [name: string]: SocketEvent } = {
    connected: 'service/connected',
    disconnected: 'service/disconnected',
    forgotten: 'service/forgotten',
    error: 'service/error',
  }

  constructor(connection: IConnection) {
    super()
    connection.createdTime = Date.now()
    this.set(connection)
  }

  set({ host = IP_PRIVATE, restriction = IP_OPEN, failover = true, ...connection }: IConnection, setCLI?: boolean) {
    this.params = { host, restriction, failover, ...connection }
    Logger.info('SET CONNECTION', { params: this.params })
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

  async forget() {
    await cli.removeConnection(this.params, this.error)
  }

  error = (e: Error) => {
    this.params.error = { message: e.message }
    this.params.active = false
    this.params.endTime = Date.now()
    EventBus.emit(Connection.EVENTS.error, { ...this.params.error, connection: this.params } as ConnectionErrorMessage)
  }
}
