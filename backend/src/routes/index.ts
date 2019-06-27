import debug from 'debug'
import socketIO from 'socket.io'
import { signIn } from './user/signIn'
import { checkSignIn } from './user/checkSignIn'
import { install } from './connectd/install'
import { start } from './connections/start'
import { r3 } from '../services/remote.it'
import { exists, version } from '../connectd/binary'
import { targetPath } from '../connectd/host'
import * as storage from '../services/storage'
import * as Pool from '../connectd/Pool'

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
) => callback(Pool.disconnectByServiceID(serviceID))

const restart = () => async (
  serviceID: string,
  callback: (connection: ConnectionInfo | undefined) => void
) => callback(await Pool.restartByServiceID(serviceID))

const signOut = () => async ({}, callback: () => void) => {
  d('Signing out user')

  // Clear all cookies, localstorage, etc
  storage.clear()

  // Disconnect all services
  Pool.disconnectAll()

  // Clear data from remote.it.js
  r3.token = undefined
  r3.authHash = undefined

  callback()
}

const list = () => async (
  callback: (connections: ConnectionInfo[]) => void
) => {
  d('Return list of connected services:', Pool.pool.length)
  callback(Pool.getPool())
}

const info = () => async (callback: (data: any) => void) => {
  const params = {
    exists: exists(),
    path: targetPath,
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
) => callback(Pool.forgetByServiceID(serviceID))

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
