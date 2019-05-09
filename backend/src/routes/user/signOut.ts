import debug from 'debug'
import * as storage from '../../services/storage'
import { AUTH_HASH_COOKIE, USERNAME_COOKIE } from '../../constants'
import { r3 } from '../../services/remote.it'

const d = debug('r3:desktop:backend:routes:user:signIn')

export function signOut() {
  return async ({}, callback: () => void) => {
    d('Signing out user')

    // Clear all cookies, localstorage, etc
    storage.clear()

    // Clear data from remote.it.js
    r3.token = undefined
    r3.authHash = undefined

    callback()
  }
}
