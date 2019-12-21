import debug from 'debug'
import Logger from './Logger'
import Tracker from './Tracker'
import EventBus from './EventBus'
import JSONFile from './JSONFile'
import Environment from './Environment'
import path from 'path'
import { r3 } from './remote.it'

const d = debug('r3:backend:User')

export class User {
  EVENTS = {
    signInError: 'user/sign-in/error',
    signedOut: 'signed-out',
    signedIn: 'signed-in',
  }

  username: string
  authHash: string
  signedIn: boolean = false
  private userFile: JSONFile<UserCredentials>

  constructor() {
    this.userFile = new JSONFile<UserCredentials>(path.join(Environment.userPath, 'user.json'))
    const user = this.userFile.read()

    d('Reading user credentials:', { user })
    Logger.info('Setting user:', { user })

    this.username = (user && user.username) || ''
    this.authHash = (user && user.authHash) || ''
  }

  get hasCredentials() {
    return this.authHash && this.username
  }

  get credentials() {
    return { username: this.username, authHash: this.authHash }
  }

  is(user: UserCredentials) {
    return user.username === this.username && user.authHash === this.authHash
  }

  authenticated() {
    this.signedIn = true
    EventBus.emit(this.EVENTS.signedIn, this.credentials)
  }

  checkSignIn = async (credentials?: UserCredentials) => {
    Logger.info('Check sign in:', { credentials })
    Tracker.event('auth', 'check-sign-in', 'check user sign in')

    if (!credentials) {
      Logger.warn('No user, sign in failed')
      return false
    }

    Logger.info('Attempting auth hash login')

    const user = await r3.user.authHashLogin(credentials.username, credentials.authHash)

    Logger.info('User', { user })
    d('User signed in: %O', user)

    if (!user) return false

    this.userFile.write({
      username: user.username,
      authHash: user.authHash,
    })

    this.signedIn = true
    this.username = user.username
    this.authHash = user.authHash

    console.log('SIGNED IN USER', user)

    EventBus.emit(this.EVENTS.signedIn, user)

    return user
  }

  signOut = () => {
    Tracker.event('auth', 'sign-out', 'user signed out')
    Tracker.pageView('/sign-out')
    Logger.info('SIGN OUT USER')

    this.userFile.remove()

    this.username = ''
    this.authHash = ''
    this.signedIn = false

    EventBus.emit(this.EVENTS.signedOut)
  }
}

export default new User()
