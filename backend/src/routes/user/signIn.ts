import debug from 'debug'
import { IUser } from 'remote.it'
import { refreshAccessKey, r3 } from '../../services/remote.it'
import { set } from '../../services/storage'
import { AUTH_HASH_COOKIE, USERNAME_COOKIE } from '../../constants'

const d = debug('r3:desktop:backend:routes:user:signIn')

export interface LoginRouteData {
  password: string
  username: string
}

export function signIn() {
  return async (
    { password, username }: LoginRouteData,
    callback: (user: IUser) => void
  ) => {
    d('Logging in user:', username)

    await refreshAccessKey()
    const user = await r3.user.login(username, password)

    d('Got user:', user)

    if (!user) throw new Error('Invalid username or password')

    // Store signIn cookies so the user can signIn again without entering
    // their credentials
    await Promise.all([
      set(AUTH_HASH_COOKIE, user.authHash),
      set(USERNAME_COOKIE, user.username),
    ])

    // Store accesskey in remote.it.js
    // TODO: make this into a helper of some kind
    r3.authHash = user.authHash
    r3.token = user.token

    callback(user)
  }
}
