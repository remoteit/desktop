import debug from 'debug'
import Connection, { ConnectionData } from './connection'
import Service from './service'

const d = debug('desktop:models:connection-pool')

export default class ConnectionPool {
  public connections: Connection[] = []

  /**
   * Add a new connection to the connection pool.
   * If an existing connection matches the give port
   * or service ID, then we do nothing.
   */
  public async register(opts: ConnectionData) {
    d('Attempting to register connection: %o', opts)

    const dupe = this.checkForDuplicates(opts)
    if (dupe) {
      d('Duplicate connection found: %o', dupe)
      return dupe
    }

    d('Connection is not a duplicate, creating: %o', opts)

    if (!opts.authHash || !opts.username)
      throw new Error('No username or auth hash provided to register!')

    const conn = new Connection({
      authHash: opts.authHash,
      username: opts.username,
      subdomain: opts.subdomain,
      deviceID: opts.deviceID,
      service: new Service({
        id: opts.serviceID,
      }),
    })

    this.connections.push(conn)

    d('Created connection: %o', conn.toJSON())
    d('Total connections:', this.connections.length)

    return conn
  }

  /**
   * Shuts down the Peer-to-Peer ChildProcess, if any, and
   * removes the connection from the ConnectionPool.
   *
   * @param serviceID The service's ID
   */
  public disconnect(serviceID: string) {
    const conn = this.find(serviceID)
    if (!conn) return false

    // Shut down the connection to the service
    conn.disconnect()

    // Remove item from list of connections
    const index = this.connections.indexOf(conn)
    if (index > -1) this.connections.splice(index, 1)
    return true
  }

  /**
   * Shutdown and remove all service connections.
   */
  public disconnectAll() {
    for (const conn of this.connections) {
      this.disconnect(conn.serviceID)
    }
    return true
  }

  /**
   * Find and return a given service.
   *
   * @param serviceID The service's ID
   */
  public find(serviceID: string) {
    return this.connections.find(c => c.serviceID === serviceID)
  }

  private checkForDuplicates(opts: ConnectionData): Connection | undefined {
    // Look for existing service with this port number.
    const dupePort = this.connections.find(c => c.proxyPort === opts.proxyPort)
    if (dupePort) {
      d('Duplicate port: %o', dupePort)
      return dupePort
    }

    // Look for existing connection with this service ID
    const dupeService = this.connections.find(
      c => c.service.id === opts.serviceID
    )
    if (dupeService) {
      d('Duplicate service ID: %o', dupeService)
      return dupeService
    }

    // Look for existing service with this subdomain
    if (opts.subdomain) {
      const dupeSubdomain = this.connections.find(
        c => c.subdomain === opts.subdomain
      )
      if (dupeSubdomain) {
        d('Duplicate subdomain: %o', dupeSubdomain)
        return dupeSubdomain
      }
    }
  }
}
