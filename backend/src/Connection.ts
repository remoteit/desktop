import cli from './cliInterface'
import debug from 'debug'
import EventBus from './EventBus'
import { IP_OPEN, IP_PRIVATE } from './sharedCopy/constants'

const d = debug('r3:backend:Connection')

export default class Connection {
  params!: IConnection

  constructor(connection: IConnection) {
    this.set(connection)
  }

  async set({ ip = IP_PRIVATE, restriction = IP_OPEN, failover = true, ...connection }: IConnection, setCLI?: boolean) {
    this.params = { ip, restriction, failover, ...connection }
    d('SET CONNECTION', { params: this.params })
    if (setCLI && !this.params.public) await cli.setConnection(this.params, this.error)
  }

  async start() {
    this.params.enabled = true
    this.params.error = undefined
    if (!this.params.public) await cli.addConnection(this.params, this.error)
  }

  async stop() {
    this.params.disconnecting = true
    await cli.stopConnection(this.params, this.error)
  }

  async disable() {
    this.params.enabled = false
    if (!this.params.public) await cli.removeConnection(this.params, this.error)
  }

  async clear() {
    this.params.enabled = false
    this.params.connecting = false
    this.params.disconnecting = false
    this.params.createdTime = undefined
    this.params.error = undefined
    if (!this.params.public) await cli.removeConnection(this.params, this.error)
  }

  error = (e: Error) => {
    this.params.error = { message: e.message }
  }
}
