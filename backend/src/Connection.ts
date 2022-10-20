import cli from './cliInterface'
import debug from 'debug'
import { IP_OPEN, IP_PRIVATE } from './sharedCopy/constants'

const d = debug('r3:backend:Connection')
const MAX_COMMAND_LOGS = 5

export default class Connection {
  params!: IConnection

  constructor(connection: IConnection) {
    this.set(connection)
  }

  async set({ ip = IP_PRIVATE, restriction = IP_OPEN, failover = true, ...connection }: IConnection, setCLI?: boolean) {
    this.params = { ip, restriction, failover, ...connection }
    d('SET CONNECTION', { params: this.params })
    if (setCLI) await cli.setConnection(this.params, this.error, this.log)
  }

  async start() {
    this.params.enabled = true
    this.params.error = undefined
    await cli.addConnection(this.params, this.error, this.log)
  }

  async stop() {
    this.params.disconnecting = true
    await cli.stopConnection(this.params, this.error, this.log)
  }

  async disable() {
    this.params.enabled = false
    await cli.removeConnection(this.params, this.error, this.log)
  }

  async clear() {
    this.params.enabled = false
    this.params.connecting = false
    this.params.disconnecting = false
    this.params.createdTime = undefined
    this.params.error = undefined
    await cli.removeConnection(this.params, this.error, this.log)
  }

  log = (c: string) => {
    let commands = c
      .replace(/.*remoteit" -j/, 'remoteit')
      .replace(/\s+/g, ' ')
      .split(' ')

    const filter = ['--enableCertificate', '--log', '--logfolder', '--manufacture-id', '--authhash']
    filter.forEach(param => {
      const index = commands.indexOf(param)
      if (index >= 0) commands.splice(index, 2)
    })

    this.params.commandLog = this.params.commandLog || []
    this.params.commandLog.unshift(commands.join(' '))
    if (this.params.commandLog.length > MAX_COMMAND_LOGS) this.params.commandLog.length = MAX_COMMAND_LOGS
  }

  error = (e: Error) => {
    this.params.error = { message: e.message }
  }
}
