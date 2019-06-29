import debug from 'debug'
import socketIO from 'socket.io'
import { signIn } from './user/signIn'
import { checkSignIn } from './user/checkSignIn'
import { install } from './connectd/install'
import { start } from './connections/start'
import { r3 } from '../services/remote.it'
import { exists, version } from '../connectd/binary'
import * as Storage from '../services/storage'
import ConnectionPool from '../connectd/ConnectionPool'
import { REMOTEIT_BINARY_PATH } from '../constants'
import UserCredentialsFile from '../connectd/UserCredentialsFile'
import SavedConnectionsFile from '../connectd/SavedConnectionsFile'

const d = debug('r3:desktop:backend:routes')

export interface RouteParams {
  socket: socketIO.Socket
}

interface Routes {
  [path: string]: (params: RouteParams) => (...args: any) => Promise<any | void>
}

const disconnect = () => async (
  serviceID: string,
  callback: (success: boolean) => void
) => callback(ConnectionPool.disconnectByServiceID(serviceID))

const restart = () => async (
  serviceID: string,
  callback: (connection: ConnectionInfo | undefined) => void
) => callback(await ConnectionPool.restartByServiceID(serviceID))

const signOut = () => async ({}, callback: () => void) => {
  d('Signing out user')

  // Clear all cookies, localstorage, etc
  Storage.flush()
  Storage.clear()

  // Disconnect all services
  ConnectionPool.disconnectAll()

  // Clear saved user
  UserCredentialsFile.remove()

  // Clear saved connections
  SavedConnectionsFile.remove()

  // Clear data from remote.it.js
  r3.token = undefined
  r3.authHash = undefined

  callback()
}

const list = () => async (
  callback: (connections: ConnectionInfo[]) => void
) => {
  d('Return list of connected services:', ConnectionPool.pool.length)
  callback(ConnectionPool.pool)
}

const info = () => async (callback: (data: any) => void) => {
  const params = {
    exists: exists(),
    path: REMOTEIT_BINARY_PATH,
    version: version(),
  }
  // track.event(
  //   'connectd',
  //   'info',
  //   'Retrieved connectd info',
  //   `exists: ${params.exists}, path: ${params.path}, version: ${
  //     params.version
  //   }`
  // )
  callback(params)
}

const forget = () => async (
  serviceID: string,
  callback: (connections?: ConnectionInfo[]) => void
) => callback(ConnectionPool.forgetByServiceID(serviceID))

export const routes: Routes = {
  'user/sign-in': signIn,
  'user/sign-out': signOut,
  'user/check-sign-in': checkSignIn,
  'connection/list': list,
  'service/connect': start,
  'service/disconnect': disconnect,
  'service/forget': forget,
  'service/restart': restart,
  'connectd/install': install,
  'connectd/info': info,
}
