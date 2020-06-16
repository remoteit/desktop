import cli from './cliInterface'
import user from './User'
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

  set({ host = IP_PRIVATE, restriction = IP_OPEN, ...connection }: IConnection) {
    this.params = { host, restriction, ...connection }
    Logger.info('SET CONNECTION', { params: this.params })
  }

  async start() {
    if (!user.signedIn || user.username !== this.params.owner) {
      let message = `Cannot start connection. Connection owner (${this.params.owner}) is not signed in or does not match user (${user.username}).`
      Logger.warn(message, { params: this.params })
      EventBus.emit(Connection.EVENTS.error, {
        connection: this.params,
        error: message,
      } as ConnectionErrorMessage)
      return
    }

    this.params.connecting = true
    this.params.startTime = Date.now()

    EventBus.emit(Connection.EVENTS.started, { connection: this.params, raw: 'Connection started' })

    await cli.addConnection(this.params)

    this.params.active = true
    this.params.connecting = false
    EventBus.emit(Connection.EVENTS.connected, { connection: this.params, raw: 'Connected' })
  }

  async stop(autoStart?: boolean) {
    // If the user manually stops a connection, we assume they
    // don't want it to automatically start on future connections.
    if (autoStart !== undefined) this.params.autoStart = autoStart

    d('Stopping service:', this.params.id)

    await cli.removeConnection(this.params)
    this.params.active = false
    this.params.endTime = Date.now()
    EventBus.emit(Connection.EVENTS.disconnected, { connection: this.params } as ConnectionMessage)
  }
}
