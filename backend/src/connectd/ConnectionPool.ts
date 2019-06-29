import debug from 'debug'
import * as Peer from './connection'
import { execFile } from 'child_process'
import * as Platform from '../services/Platform'
import SavedConnectionsFile from './SavedConnectionsFile'
import UserCredetialsFile from './UserCredentialsFile'
import logger from '../utils/logger'

const d = debug('r3:backend:connectd:pool')

const POOL: ConnectdProcess[] = []

interface RegisterProps {
  connection: ConnectionInfo
  user: User
}

export class ConnectionPool {
  public get pool() {
    return this.toJSON()
  }

  public get processes() {
    return POOL
  }

  public usedPorts(): number[] {
    return this.pool.reduce((all: number[], conn) => {
      if (conn.port) all.push(conn.port)
      return all
    }, [])
  }

  /**
   * Start a new connection and put it in the connection pool.
   */
  public async register({ connection, user }: RegisterProps) {
    d('Registering connection: %O', connection)
    logger.info('Registering connection:', connection)

    // Update our saved copy of the user's credentials
    // TODO: Shouldn't be here, too much coupling
    UserCredetialsFile.write({
      username: user.username,
      authHash: user.authHash,
      language: user.language,
    })

    if (!connection || !connection.port || !connection.serviceID)
      throw new Error('Missing required connection details!')

    // If a connection with this signature already exists,
    // return that instead of creating a new connection.
    const dupe = this.findDuplicateConnection(
      connection.serviceID,
      connection.port
    )
    if (dupe) {
      d('Found duplicate connection to service: %O', connection)
      return dupe
    }

    const connectd = await this.addConectionToPool(connection)

    this.updateConnectionsFile()

    d('Connections: %O', connection)

    return connectd
  }

  public async loadFromSavedConnectionsFile() {
    const connections = SavedConnectionsFile.read()
    if (!connections) return

    d('Loading saved connections: %0', connections)
    logger.info('Loading saved connections', connections)

    return Promise.all(
      connections.map(connection => this.addConectionToPool(connection))
    )
  }

  /**
   * Shuts down the Peer-to-Peer ChildProcess, if any, and
   * removes the connection from the ConnectionPool.
   *
   * @param serviceID The service's ID
   */
  public disconnectByServiceID(serviceID: string) {
    d('Disconnecting by service ID:', serviceID)
    const conn = this.findByServiceID(serviceID)
    return this.disconnect(conn)
  }

  public disconnectAll() {
    d('Disconnecting all services')
    this.processes.map(conn => this.disconnect(conn))
    this.updateConnectionsFile()
  }

  public async restartByServiceID(
    id: string
  ): Promise<ConnectionInfo | undefined> {
    console.log('RESTART SERVICE:', id)
    const connection = this.findByServiceID(id)
    if (!connection) return
    d('restarting connection: %O', connection.info)
    this.disconnect(connection)
    await this.addConectionToPool(connection.info)
    return connection.info
  }

  public forgetByServiceID(id: string): ConnectionInfo[] | undefined {
    const connection = this.findByServiceID(id)
    if (!connection) return

    // Make sure connection is closed first
    this.disconnect(connection)

    // Remove connection from pool
    this.processes.splice(this.processes.indexOf(connection), 1)

    // Save updated connections
    this.updateConnectionsFile()

    // Return the new list of connections
    return this.pool
  }

  public toJSON(): ConnectionInfo[] {
    const p = this.processes.map(connectd => ({
      ...connectd.info,
      pid: connectd.pid,
    }))
    d('Pool: %O', p)
    logger.info('Pool:', p)
    return p
  }

  public findDuplicateConnection(serviceID: string, port: number) {
    // Look for existing service with this port number.
    const dupePort = this.findByProxyPort(port)
    if (dupePort) return dupePort

    // Look for existing connection with this service ID
    const dupeService = this.findByServiceID(serviceID)
    if (dupeService) return dupeService
  }

  private async addConectionToPool(connection: ConnectionInfo) {
    const connectd = await this.startConnection(connection)
    if (!connectd) throw new Error('Could not start connection')

    // If existing, update, otherwise add new connection
    const existing = this.findByServiceID(connection.serviceID)
    existing
      ? (this.processes[this.processes.indexOf(existing)] = connectd)
      : this.processes.push(connectd)

    return connectd
  }

  private async startConnection(
    connection: ConnectionInfo
  ): Promise<ConnectdProcess | undefined> {
    const user = UserCredetialsFile.read()
    if (!user) return

    return Peer.connect({ connection, user })
  }

  private updateConnectionsFile() {
    d('Updating connections file')
    logger.info('Updating connections file')

    SavedConnectionsFile.write(
      this.processes.map(c => ({
        serviceName: c.info.serviceName,
        serviceID: c.info.serviceID,
        type: c.info.type,
        port: c.info.port,
        pid: c.pid,
      }))
    )
  }

  private disconnect(conn?: ConnectdProcess) {
    if (!conn) return false

    d('Disconnecting connection:', conn.pid)

    if (Platform.isWindows) {
      execFile('(taskkill /pid ' + conn.pid + ' /T /F')
    } else {
      conn.kill('SIGINT')
    }

    this.updateConnectionsFile()

    return true
  }

  private findByServiceID(id: string) {
    return this.processes.find(c => c.info.serviceID === id)
  }

  private findByProxyPort(port: number) {
    return this.processes.find(c => c.info.port === port)
  }
}

export default new ConnectionPool()
