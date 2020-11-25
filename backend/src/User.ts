import environment from './environment'
import cli from './cliInterface'
import rimraf from 'rimraf'
import debug from 'debug'
import Logger from './Logger'
import EventBus from './EventBus'
import path from 'path'
import { r3 } from './remote.it'

const d = debug('r3:backend:User')

export class User {
  static EVENTS = {
    signInError: 'unauthorized',
    signedOut: 'signed-out',
    signedIn: 'signed-in',
  }

  username: string = ''
  authHash: string = ''
  signedIn: boolean = false

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
    EventBus.emit(User.EVENTS.signedIn, this.credentials)
  }

  checkSignIn = async (credentials?: UserCredentials) => {
    if (!credentials) {
      Logger.warn('No user, sign in failed')
      return false
    }

    Logger.info('Attempting auth hash login', { username: credentials.username })

    try {
      const user = await r3.user.authHashLogin(credentials.username, credentials.authHash)

      Logger.info('CHECK SIGN IN', { username: user.username })

      if (!user) {
        EventBus.emit(User.EVENTS.signInError, { message: 'No user found.' })
        return false
      }

      this.signedIn = true
      this.username = user.username
      this.authHash = user.authHash

      Logger.info('CHECK CLI SIGNIN')
      await cli.checkSignIn()
      EventBus.emit(User.EVENTS.signedIn, user)

      Logger.info('BACKEND SIGNED IN', { username: user.username })
      return true
    } catch (error) {
      Logger.warn('LOGIN AUTH FAILURE', { username: credentials.username, error })
      return false
    }
  }

  signOut = () => {
    Logger.info('SIGN OUT USER')

    this.username = ''
    this.authHash = ''
    this.signedIn = false

    EventBus.emit(User.EVENTS.signedOut)
    rimraf.sync(path.join(environment.userPath, 'user.json'), { disableGlob: true })
  }

  clearAll = async () => {
    await cli.signOut()
    this.signOut()
  }
}

export default new User()
