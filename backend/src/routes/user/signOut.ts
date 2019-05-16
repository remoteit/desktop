import debug from 'debug'
import * as storage from '../../services/storage'
import { r3 } from '../../services/remote.it'
import * as pool from '../../connectd/pool'

const d = debug('r3:desktop:backend:routes:user:signIn')

export function signOut() {
  return async ({}, callback: () => void) => {
    d('Signing out user')

    // Clear all cookies, localstorage, etc
    storage.clear()

    // Disconnect all services
    pool.disconnectAll()

    // Clear data from remote.it.js
    r3.token = undefined
    r3.authHash = undefined

    callback()
  }
}
