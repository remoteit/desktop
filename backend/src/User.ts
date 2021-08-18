import 'win-ca'
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

  id: string = ''
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

      Logger.info('CHECK SIGN IN', { username: user.username, id: user.id })

      if (!user) {
        EventBus.emit(User.EVENTS.signInError, { message: 'No user found.' })
        return false
      }

      this.signedIn = true
      this.username = user.username
      this.authHash = user.authHash
      this.id = user.id

      Logger.info('CHECK CLI SIGN IN')
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
    this.username = ''
    this.authHash = ''
    this.signedIn = false

    Logger.info('SIGN OUT USER', { user: this })

    EventBus.emit(User.EVENTS.signedOut)
    try {
      rimraf.sync(path.join(environment.userPath, 'user.json'), { disableGlob: true })
    } catch (error) {
      Logger.info('NO USER FILE TO CLEAN UP', { error })
    }
  }
}

export default new User()
