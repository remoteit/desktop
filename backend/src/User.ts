import debug from 'debug'
import Logger from './Logger'
import Tracker from './Tracker'
import EventBus from './EventBus'
import { r3 } from './remote.it'

const d = debug('r3:backend:User')

export default class User {
  static EVENTS = {
    signInError: 'user/sign-in/error',
    signedOut: 'user/signed-out',
    signedIn: 'user/signed-in',
  }

  static async checkSignIn(credentials?: UserCredentials) {
    Logger.info('Check sign in:', { credentials })
    Tracker.event('auth', 'check-sign-in', 'check user sign in')

    if (!credentials) {
      Logger.warn('No user, signing out...')
      EventBus.emit(User.EVENTS.signedOut)
      return
    }

    Logger.info('Attempting auth hash login')

    const user = await r3.user.authHashLogin(
      credentials.username,
      credentials.authHash
    )

    d('User signed in: %O', user)

    // Set the user on the pool so we can
    // authenticate requests.

    Logger.info('User', { user })

    if (!user) {
      this.signOut()
      return
    }

    EventBus.emit(User.EVENTS.signedIn, user)
    return user
  }

  static async signIn(username: string, password: string) {
    Logger.info('Loggin in user', { username })
    Tracker.pageView('/sign-in')
    Tracker.event('auth', 'sign-in', 'user signed in')

    d('Updated access key')

    let user
    try {
      user = await r3.user.login(username, password)
    } catch (error) {
      EventBus.emit(User.EVENTS.signInError, error.message)
      return
    }

    d('Got user:', user)

    if (!user) {
      d('Could not login user: %O', { username, password })
      Logger.error('Could not log in user:', { username })
      return
    }

    // Store accesskey in remote.it.js
    // TODO: make this into a helper of some kind
    r3.authHash = user.authHash
    r3.token = user.token

    EventBus.emit(User.EVENTS.signedIn, user)

    return { username: user.username, authHash: user.authHash }
  }

  static signOut() {
    Tracker.event('auth', 'sign-out', 'user signed out')
    Tracker.pageView('/sign-out')
    Logger.info('Sign out user')
    EventBus.emit(User.EVENTS.signedOut)
  }
}
