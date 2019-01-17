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
    d('[ConnectionPool.register] Attempting to register connection:', opts)

    const dupe = this.checkForDuplicates(opts)
    if (dupe) return dupe

    d(
      '[ConnectionPool.register] Connection is not a duplicate, creating:',
      opts
    )

    const conn = new Connection({
      subdomain: opts.subdomain,
      service: new Service({
        id: opts.serviceID,
      }),
    })
    await conn.start()
    this.connections.push(conn)

    d('[ConnectionPool.register] Total connections:', this.connections.length)

    return conn
  }

  private checkForDuplicates(opts: ConnectionData) {
    // Look for existing service with this port number.
    const dupePort = this.connections.find(c => c.proxyPort === opts.proxyPort)
    if (dupePort) {
      d('Duplicate port!', dupePort)
      return dupePort
    }

    // Look for existing connection with this service ID
    const dupeService = this.connections.find(
      c => c.service.id === opts.serviceID
    )
    if (dupeService) {
      d('Duplicate service ID!', dupeService)
      return dupeService
    }

    // Look for existing service with this subdomain
    if (opts.subdomain) {
      const dupeSubdomain = this.connections.find(
        c => c.subdomain === opts.subdomain
      )
      if (dupeSubdomain) {
        d('Duplicate subdomain!', dupeSubdomain)
        return dupeSubdomain
      }
    }
  }
}
