import environment from './environment'
import cli from './cliInterface'
import rimraf from 'rimraf'
import debug from 'debug'
import Logger from './Logger'
import EventBus from './EventBus'
import path from 'path'

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
    return this.authHash && this.username && this.id
  }

  get credentials() {
    return { username: this.username, authHash: this.authHash, id: this.id }
  }

  is(user: UserCredentials) {
    return user.username === this.username && user.authHash === this.authHash && user.guid === this.id
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

    Logger.info('Attempting auth hash login', { username: credentials.username, credential: credentials.authHash, id: credentials.guid })

    try {


      Logger.info('CHECK SIGN IN', { username: credentials.username, id: credentials.guid, hash: credentials.authHash})

      if (!credentials) {
        EventBus.emit(User.EVENTS.signInError, { message: 'No user found.' })
        return false
      }

      this.signedIn = true
      this.username = credentials.username
      this.authHash = credentials.authHash
      this.id = credentials.guid

      Logger.info('CHECK CLI SIGN IN')
      await cli.checkSignIn()
      EventBus.emit(User.EVENTS.signedIn, credentials)

      Logger.info('BACKEND SIGNED IN', { username: credentials.username })
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
