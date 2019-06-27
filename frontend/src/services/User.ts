import { IUser } from 'remote.it'
import { emit } from './backend'
import { socket } from '../services/backend'
import {
  refreshAccessKey,
  updateUserCredentials,
  clearUserCredentials,
} from './remote.it'

/**
 * Log user in with the username and password and set the
 * remote.it.js library access key so future requests are authenticated.
 */
export async function signIn(
  username: string,
  password: string
): Promise<IUser> {
  // TODO: this shouldn't need to be called here
  await refreshAccessKey()

  // const user = await emit<IUser>('user/sign-in', { password, username })
  return new Promise((success, failure) => {
    socket.emit(
      'user/sign-in',
      { username, password },
      (error: string | undefined, user: IUser | undefined) => {
        console.log('Sign in error:', error)
        if (error) return failure(error)
        if (!user) return failure('Could not login')
        // d('User: %O', user)
        updateUserCredentials(user)
        console.log('SUCCESS', user)
        success(user)
      }
    )
  })
}

/**
 * Sign the user out by removing their session cookies
 */
export async function signOut(): Promise<void> {
  await emit<void>('user/sign-out')
  clearUserCredentials()
}

/**
 * Check if a user session is still valid by checking if they have
 * their username/auth hash stored in cookies then doing an
 * auth hash signIn to make sure they're still valid.
 */
export async function checkSignIn() {
  // TODO: this shouldn't need to be called here
  await refreshAccessKey()

  const user = await emit<IUser | undefined>('user/check-sign-in')

  if (!user) return

  updateUserCredentials(user)

  return user
}
