import axios from 'axios'
import cookies from 'js-cookie'
import { AUTH_HASH_COOKIE, USERNAME_COOKIE } from '../constants'
import { IUser } from 'remote.it'
import { r3 } from '../services/remote.it'

/**
 * Get an access key for this session so the user can make API requests.
 */
export async function getAccessKey() {
  // TODO: Handle errors
  const resp = await axios.post('https://api.remote.it/access-key')
  r3.accessKey = resp.data.accessKey
}

/**
 * Log user in with the username and password and set the
 * remote.it.js library access key so future requests are authenticated.
 */
export async function login(
  username: string,
  password: string
): Promise<IUser> {
  // Refresh/set the access key before attempting to login
  await getAccessKey()

  // Log the user in
  // TODO: Handle errors!
  const user = await r3.user.login(username, password)

  if (!user) throw new Error('Invalid username or password')

  // Store login cookies so the user can login again without entering
  // their credentials
  cookies.set(AUTH_HASH_COOKIE, user.authHash)
  cookies.set(USERNAME_COOKIE, user.username)

  return user
}

/**
 * Check if a user session is still valid by checking if they have
 * their username/auth hash stored in cookies then doing an
 * auth hash login to make sure they're still valid.
 */
export async function checkLogin() {
  // Refresh/set the access key before checking session
  await getAccessKey()

  const authHash = cookies.get(AUTH_HASH_COOKIE)
  const username = cookies.get(USERNAME_COOKIE)

  if (!username || !authHash) return

  // TODO: Handle errors
  const user = await r3.user.authHashLogin(username, authHash)

  if (!user) {
    // If the auth hash is invalid or otherwise fails, remove the cookies.
    cookies.remove(AUTH_HASH_COOKIE)
    cookies.remove(USERNAME_COOKIE)

    // Clear settings for remote.it.js
    r3.authHash = undefined
    r3.token = undefined

    return
  }

  // Store accesskey in remote.it.js
  r3.authHash = user.authHash
  r3.token = user.token

  return user
}
