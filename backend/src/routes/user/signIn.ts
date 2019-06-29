import debug from 'debug'
import { IUser } from 'remote.it'
import { refreshAccessKey, r3 } from '../../services/remote.it'
import * as Storage from '../../services/storage'
import { AUTH_HASH_COOKIE, USERNAME_COOKIE } from '../../constants'
import UserCredentialsFile from '../../connectd/UserCredentialsFile'
import logger from '../../utils/logger'

const d = debug('r3:desktop:backend:routes:user:signIn')

export interface LoginRouteData {
  password: string
  username: string
}

export function signIn() {
  return async (
    { password, username }: LoginRouteData,
    callback: (error: string | undefined, user?: IUser) => void
  ) => {
    try {
      d('Logging in user:', username)
      logger.info('Loggin in user', { username })

      await refreshAccessKey()

      d('Updated access key')
      logger.info('Updated access key')

      const user = await r3.user.login(username, password)

      d('Got user:', user)
      logger.info('Got user', { user })

      if (!user) return callback('Invalid username or password')

      // Store signIn cookies so the user can signIn again without entering
      // their credentials
      // TODO: Do we need this now that we store user in credentials file?
      await Promise.all([
        Storage.set(AUTH_HASH_COOKIE, user.authHash),
        Storage.set(USERNAME_COOKIE, user.username),
      ])

      logger.info('Set login cookies')

      // Store accesskey in remote.it.js
      // TODO: make this into a helper of some kind
      r3.authHash = user.authHash
      r3.token = user.token

      // Store this user in our user credentials file
      UserCredentialsFile.write({
        authHash: user.authHash,
        username: user.username,
        language: user.language,
      })

      logger.info('Write user to file')

      callback(undefined, user)
    } catch (error) {
      console.error('Sign in error', error)
      callback(error.message)
    }
  }
}
