import { r3, refreshAccessKey } from '../../services/remote.it'
import { get, remove } from '../../services/storage'
import { AUTH_HASH_COOKIE, USERNAME_COOKIE } from '../../constants'
import { IUser } from 'remote.it'
// import cookies from 'js-cookie'

export function checkSignIn() {
  return async ({}, callback: (user?: IUser) => void) => {
    // Refresh/set the access key before checking session
    await refreshAccessKey()

    // const authHash = cookies.get(AUTH_HASH_COOKIE)
    // const username = cookies.get(USERNAME_COOKIE)
    const [authHash, username] = await Promise.all([
      await get(AUTH_HASH_COOKIE),
      await get(USERNAME_COOKIE),
    ])

    if (!username || !authHash) return callback(undefined)

    // TODO: Handle errors
    const user = await r3.user.authHashLogin(username, authHash)

    if (!user) {
      // If the auth hash is invalid or otherwise fails, remove the cookies.
      await Promise.all([remove(AUTH_HASH_COOKIE), remove(USERNAME_COOKIE)])

      // Clear settings for remote.it.js
      r3.authHash = undefined
      r3.token = undefined

      return callback(undefined)
    }

    // Store accesskey in remote.it.js
    // TODO: make this into a helper of some kind
    r3.authHash = user.authHash
    r3.token = user.token

    callback(user)
  }
}
