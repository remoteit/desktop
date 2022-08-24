import { API_URL, DEVELOPER_KEY } from './sharedCopy/constants'
import environment from './environment'
import cli from './cliInterface'
import rimraf from 'rimraf'
import Logger from './Logger'
import EventBus from './EventBus'
import path from 'path'
import axios from 'axios'

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

  async authHashLogin(username: string, authhash: string) {
    const { data } = await axios.post<IRawUser>(
      '/user/login/authhash',
      { username, authhash },
      {
        baseURL: API_URL,
        headers: {
          'Content-Type': 'application/json',
          developerKey: DEVELOPER_KEY,
        },
      }
    )
    // Logger.info('AUTH LOGIN RESULT', data)
    return { id: data.guid, authHash: data.service_authhash }
  }

  checkSignIn = async (credentials?: UserCredentials) => {
    if (!credentials) {
      Logger.warn('No user, sign in failed')
      return false
    }

    Logger.info('Attempting auth hash login', { username: credentials.username })

    try {
      const user = await this.authHashLogin(credentials.username, credentials.authHash)
      Logger.info('CHECK SIGN IN', user)

      if (!user) {
        EventBus.emit(User.EVENTS.signInError, { message: 'No user found.' })
        return false
      }

      this.signedIn = true
      this.username = credentials.username
      this.authHash = user.authHash
      this.id = user.id

      Logger.info('CHECK CLI SIGN IN')
      await cli.checkSignIn()
      EventBus.emit(User.EVENTS.signedIn, user)

      Logger.info('BACKEND SIGNED IN', { userId: user.id })
      return true
    } catch (error) {
      Logger.warn('LOGIN AUTH FAILURE', { username: credentials.username, error })
      return false
    }
  }

  signOut = () => {
    this.id = ''
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
