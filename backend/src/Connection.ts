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
    started: 'service/started', // save log for 1yr
    connected: 'service/connected', // save log for 1yr
    disconnected: 'service/disconnected', // save log for 1yr
    forgotten: 'service/forgotten', // save log for 1yr
    error: 'service/error', // save log for 1yr
  }

  constructor(connection: IConnection) {
    super()
    connection.createdTime = Date.now()
    this.set(connection)
  }

  async set(
    { host = IP_PRIVATE, restriction = IP_OPEN, failover = true, ...connection }: IConnection,
    setCLI?: boolean
  ) {
    this.params = { host, restriction, failover, ...connection }
    Logger.info('SET CONNECTION', { params: this.params })
    if (setCLI) await cli.setConnection(this.params, this.error)
  }

  async start() {
    this.params.connecting = true
    this.params.startTime = Date.now()
    EventBus.emit(Connection.EVENTS.started, { connection: this.params, raw: 'Connection started' })

    this.params.active = true
    this.params.connecting = false
    await cli.addConnection(this.params, this.error)
    EventBus.emit(Connection.EVENTS.connected, { connection: this.params, raw: 'Connected' })
  }

  async stop() {
    d('Stopping service:', this.params.id)

    this.params.active = false
    this.params.endTime = Date.now()

    await cli.setConnection(this.params, this.error)
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
