import cli from './cliInterface'
import debug from 'debug'
import Logger from './Logger'
import EventBus from './EventBus'
import JSONFile from './JSONFile'
import environment from './environment'
import path from 'path'
import { r3 } from './remote.it'

const d = debug('r3:backend:User')

export class User {
  static EVENTS = {
    signInError: 'user/sign-in/error',
    signedOut: 'signed-out',
    signedIn: 'signed-in',
  }

  username: string
  authHash: string
  signedIn: boolean = false
  // configFile: JSONFile<ConfigFile>
  private userFile: JSONFile<UserCredentials>

  constructor() {
    this.userFile = new JSONFile<UserCredentials>(path.join(environment.userPath, 'user.json'))
    // this.configFile = new JSONFile<UserCredentials>(path.join(environment.userPath, 'user.json'))
    const user = this.userFile.read()

    d('Reading user credentials:', { user })
    Logger.info('Setting user:', { username: user && user.username })

    this.username = user?.username || ''
    this.authHash = user?.authHash || ''
    if (this.hasCredentials) this.signedIn = true
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

  isDeviceOwner(user: UserCredentials) {
    const { admin } = cli.data
    return admin && user.username === admin.username
  }

  authenticated() {
    this.signedIn = true
    EventBus.emit(User.EVENTS.signedIn, this.credentials)
  }

  checkSignIn = async (credentials?: UserCredentials) => {
    Logger.info('Check sign in:', { username: credentials && credentials.username })

    if (!credentials) {
      Logger.warn('No user, sign in failed')
      return false
    }

    Logger.info('Attempting auth hash login')

    const user = await r3.user.authHashLogin(credentials.username, credentials.authHash)

    Logger.info('User', { username: user.username })
    d('User signed in: %O', user)

    if (!user) return false

    this.userFile.write({
      username: user.username,
      authHash: user.authHash,
    })

    this.signedIn = true
    this.username = user.username
    this.authHash = user.authHash

    EventBus.emit(User.EVENTS.signedIn, user)

    return user
  }

  signOut = () => {
    Logger.info('SIGN OUT USER')

    this.userFile.remove()

    this.username = ''
    this.authHash = ''
    this.signedIn = false

    EventBus.emit(User.EVENTS.signedOut)
  }

  clearAll = () => {
    this.signOut()
    cli.signOut(true)
  }
}

export default new User()
