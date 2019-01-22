import debug from 'debug'
import Connection, { ConnectionData } from '../../models/connection'
import ConnectionPool from '../../models/connection-pool'

const d = debug('desktop:services:connection')

export const pool = new ConnectionPool()

export default class ConnectionService {
  async find(params: any): Promise<Connection[]> {
    d('[Connection.find] Params %o', params)
    d('[Connection.find]: Connection pool: %o', pool.connections)
    return pool.connections
  }

  async create(data: ConnectionData) {
    d('[Connection.create] Creating connection:', data)
    const conn = await pool.register(data)
    d('[Connection.create] Created connection:', conn)
    return conn.toJSON()
  }

  // async get(id, params) {},
  // async update(id, data, params) {},
  // async patch(id, data, params) {},
  // async remove(id, params) {}
}
