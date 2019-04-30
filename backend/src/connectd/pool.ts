import debug from 'debug'
import { IService } from 'remote.it'
import { connect } from './connection'

const d = debug('r3:backend:connectd:pool')

export const pool: ConnectdProcess[] = []

interface RegisterProps {
  port: number
  service: IService
  user: { authHash: string; username: string }
}

/**
 * Start a new connection and put it in the connection pool.
 */
export async function register({ port, service, user }: RegisterProps) {
  const meta = { serviceID: service.id, port }
  d('Registering connection: %O', meta)

  // If a connection with this signature already exists,
  // return that instead of creating a new connection.
  const dupe = findDuplicateConnection(service.id, port)
  if (dupe) {
    d('Found duplicate connection to service: %O', meta)
    return dupe
  }

  const connection = await connect({ port, service, user })
  pool.push(connection)

  d('Connections: %O', meta)

  return connection
}

export function findByServiceID(id: string) {
  return pool.find(c => c.service.id === id)
}

export function findByProxyPort(port: number) {
  return pool.find(c => c.port === port)
}

export function findDuplicateConnection(serviceID: string, port: number) {
  // Look for existing service with this port number.
  const dupePort = findByProxyPort(port)
  if (dupePort) return dupePort

  // Look for existing connection with this service ID
  const dupeService = findByServiceID(serviceID)
  if (dupeService) return dupeService
}
