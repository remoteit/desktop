import { ClientSideParams, Application } from '@feathersjs/feathers'

export interface Service {
  id: string
}

export interface Connection {
  port: number
  hostname: string
  service: Service
}

export interface PeerConnection extends Connection {}

export interface LocalProxy extends Connection {}

export interface RemoteProxy extends Connection {}

export interface ConnectionConfig extends Connection {
  serviceID: string
}

const connections: Array<PeerConnection> = []

export default class ConnectionService {
  async find(params: any): Promise<PeerConnection[]> {
    console.log('[Connection.find]', params)
    return connections
  }

  // async get(id, params) {},

  async create(
    data: ConnectionConfig,
    params: ClientSideParams
  ): Promise<PeerConnection> {
    console.log('[Connection.create] Creating connection:', data, params)
    connections.find(c => c.port === data.port)
    const service = {
      id: data.serviceID,
    }
    const conn = {
      hostname: 'localhost',
      port: data.port,
      service,
    }
    connections.push(conn)
    return conn
  }

  // async update(id, data, params) {},
  // async patch(id, data, params) {},
  // async remove(id, params) {}
}
