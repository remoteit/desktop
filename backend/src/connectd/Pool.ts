import debug from 'debug'
import * as Peer from './connection'
import { execFile } from 'child_process'
import * as Platform from '../services/Platform'
import * as SavedConnectionsFile from './SavedConnectionsFile'
import * as UserCredetialsFile from './UserCredentialsFile'
import logger from '../utils/logger'

const d = debug('r3:backend:connectd:pool')

export const pool: ConnectdProcess[] = []

interface RegisterProps {
  connection: ConnectionInfo
  user: User
}

export function getPool(): ConnectionInfo[] {
  const p = pool.map(connectd => ({
    ...connectd.info,
    pid: connectd.pid,
  }))
  d('Pool: %O', p)
  logger.info('Pool:', p)
  return p
}

/**
 * Start a new connection and put it in the connection pool.
 */
export async function register({ connection, user }: RegisterProps) {
  d('Registering connection: %O', connection)
  logger.info('Registering connection:', connection)

  // Update our saved copy of the user's credentials
  UserCredetialsFile.write({
    username: user.username,
    authHash: user.authHash,
    language: user.language,
  })

  if (!connection || !connection.port || !connection.serviceID)
    throw new Error('Missing required connection details!')

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

async function addConectionToPool(connection: ConnectionInfo) {
  const connectd = await startConnection(connection)
  if (!connectd) throw new Error('Could not start connection')

  // If existing, update, otherwise add new connection
  const existing = findByServiceID(connection.serviceID)
  existing ? (pool[pool.indexOf(existing)] = connectd) : pool.push(connectd)

  return connectd
}

async function startConnection(
  connection: ConnectionInfo
): Promise<ConnectdProcess | undefined> {
  const user = UserCredetialsFile.read()
  if (!user) return

  return await Peer.connect({ connection, user })
}

export async function loadFromSavedConnectionsFile() {
  const connections = SavedConnectionsFile.read()
  if (!connections) return

  d('Loading saved connections: %0', connections)
  logger.info('Loading saved connections', connections)

  return Promise.all(
    connections.map(connection => addConectionToPool(connection))
  )
}

export function updateConnectionsFile() {
  d('Updating connections file')
  logger.info('Updating connections file')

  SavedConnectionsFile.write(
    pool.map(c => ({
      serviceName: c.info.serviceName,
      serviceID: c.info.serviceID,
      type: c.info.type,
      port: c.info.port,
      pid: c.pid,
    }))
  )
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
  updateConnectionsFile()
}

export function disconnect(conn?: ConnectdProcess) {
  if (!conn) return false

  d('Disconnecting connection:', conn.pid)

  if (Platform.isWindows) {
    execFile('(taskkill /pid ' + conn.pid + ' /T /F')
  } else {
    conn.kill('SIGINT')
  }

  updateConnectionsFile()

  return true
}

export async function restartByServiceID(
  id: string
): Promise<ConnectionInfo | undefined> {
  console.log('RESTART SERVICE:', id)
  const connection = findByServiceID(id)
  if (!connection) return
  d('restarting connection: %O', connection.info)
  disconnect(connection)
  await addConectionToPool(connection.info)
  return connection.info
}

export function forgetByServiceID(id: string): ConnectionInfo[] | undefined {
  const connection = findByServiceID(id)
  if (!connection) return

  // Make sure connection is closed first
  disconnect(connection)

  // Remove connection from pool
  pool.splice(pool.indexOf(connection), 1)

  // Save updated connections
  updateConnectionsFile()

  // Return the new list of connections
  return getPool()
}

export function findByServiceID(id: string) {
  return pool.find(c => c.info.serviceID === id)
}

export function findByProxyPort(port: number) {
  return pool.find(c => c.info.port === port)
}

export function findDuplicateConnection(serviceID: string, port: number) {
  // Look for existing service with this port number.
  const dupePort = findByProxyPort(port)
  if (dupePort) return dupePort

  // Look for existing connection with this service ID
  const dupeService = findByServiceID(serviceID)
  if (dupeService) return dupeService
}
