import debug from 'debug'
import { IService } from 'remote.it'
import { connect } from './connection'
import { execFile } from 'child_process'
import * as platform from '../services/platform'
import * as file from './SavedConnectionsFile'
import * as userFile from './UserCredentialsFile'

const d = debug('r3:backend:connectd:pool')

export const pool: ConnectdProcess[] = []

interface RegisterProps {
  connection: Connection
  user: User
}

/**
 * Start a new connection and put it in the connection pool.
 */
export async function register({ connection, user }: RegisterProps) {
  d('Registering connection: %O', connection)

  // Update our saved copy of the user's credentials
  userFile.write({
    username: user.username,
    authHash: user.authHash,
    language: user.language,
  })

  // If a connection with this signature already exists,
  // return that instead of creating a new connection.
  const dupe = findDuplicateConnection(connection.serviceID, connection.port)
  if (dupe) {
    d('Found duplicate connection to service: %O', connection)
    return dupe
  }

  const connectd = await addConectionToPool(connection)

  updateConnectionsFile()

  d('Connections: %O', connection)

  return connectd
}

async function addConectionToPool(connection: Connection) {
  const user = userFile.read()
  if (!user) return

  const connectd = await connect({ connection, user })
  pool.push(connectd)

  return connectd
}

export async function loadFromSavedConnectionsFile() {
  const connections = file.read()
  if (!connections) return

  d('Loading saved connections: %0', connections)

  return Promise.all(
    connections.map(connection => addConectionToPool(connection))
  )
}

export function updateConnectionsFile() {
  d('Updating connections file')
  file.write(connectionsFromPool())
}

export function connectionsFromPool(): Connection[] {
  return pool.map(c => ({
    port: c.port,
    serviceID: c.serviceID,
    serviceName: c.serviceName,
    type: c.type,
    deviceID: c.deviceID,
  }))
}

/**
 * Shuts down the Peer-to-Peer ChildProcess, if any, and
 * removes the connection from the ConnectionPool.
 *
 * @param serviceID The service's ID
 */
export function disconnectByServiceID(serviceID: string) {
  d('Disconnecting by service ID:', serviceID)
  const conn = findByServiceID(serviceID)
  return disconnect(conn)
}

export function disconnectAll() {
  d('Disconnecting all services')
  pool.map(conn => disconnect(conn))
}

export function disconnect(conn?: ConnectdProcess) {
  if (!conn) return false

  d('Disconnecting connection:', conn.pid)

  if (platform.isWindows) {
    execFile('(taskkill /pid ' + conn.pid + ' /T /F')
  } else {
    conn.kill('SIGINT')
  }

  // Remove item from list of connections
  const index = pool.indexOf(conn)
  if (index > -1) pool.splice(index, 1)

  updateConnectionsFile()

  return true
}

export function findByServiceID(id: string) {
  return pool.find(c => c.serviceID === id)
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
