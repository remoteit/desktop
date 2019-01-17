import debug from 'debug'
import Connection from './connection'
import Service from './service'

const d = debug('desktop:models:connection-pool')

type ConnectionOpts = {
  port: number
  serviceID: string
}

export default class ConnectionPool {
  public connections: Connection[] = []

  /**
   * Add a new connection to the connection pool.
   * If an existing connection matches the give port
   * or service ID, then we do nothing.
   */
  public register(opts: ConnectionOpts) {
    d('[ConnectionPool.register] Attempting to register connection:', opts)
    d('[ConnectionPool.register] Connections:', this.connections)
    const dupePort = this.connections.find(c => c.port === opts.port)
    if (dupePort) return dupePort

    const dupeService = this.connections.find(
      c => c.service.id === opts.serviceID
    )
    if (dupeService) return dupeService

    d(
      '[ConnectionPool.register] Connection is not a duplicate, creating:',
      opts
    )

    const conn = new Connection({
      port: opts.port,
      service: new Service({
        id: opts.serviceID,
      }),
    })
    this.connections.push(conn)

    return conn
  }
}
