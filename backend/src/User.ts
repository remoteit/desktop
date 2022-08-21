import environment from './environment'
import cli from './cliInterface'
import rimraf from 'rimraf'
import debug from 'debug'
import Logger from './Logger'
import EventBus from './EventBus'
import path from 'path'
import axios from 'axios'
import { API_URL, DEVELOPER_KEY } from './sharedCopy/constants'

const defaults = {
  apiURL: 'https://api.remot3.it/apv/v27',
  successURL: 'https://app.remote.it'
}

const instance = setupAxios({ apiURL: API_URL, developerKey: DEVELOPER_KEY })

export function setupAxios(config: IConfig = {}, newGetToken?: () => Promise<string>) {
  const options: IConfig = { ...defaults, ...config }
  return axios.create({
    baseURL: options.apiURL,
    // timeout: 1000,
    headers: {
      'content-type': 'application/json',
      accessKey: options.accessKey !== undefined ? options.accessKey : '',
      apiKey: options.apiKey !== undefined ? options.apiKey : '',
      developerKey: options.developerKey !== undefined ? options.developerKey : '',
      token: options.token !== undefined ? options.token : ''
    },
  })
}
  
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
  token: string = ''

  
  
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

  async authHashLogin(username: string, authhash: string): Promise<any> {
    const userDetails:any = await instance.post<IRawUser>('/user/login/authhash', { username, authhash })
    return this.process(userDetails.data, username)
  }

  process(user: IRawUser, username: string) {
    return {
      id: user.guid,
      username,
      token: user.token || user.auth_token,
      authHash: user.service_authhash,
    }
  }

  checkSignIn = async (credentials?: UserCredentials) => {
    if (!credentials) {
      Logger.warn('No user, sign in failed')
      return false
    }

    Logger.info('Attempting auth hash login', { username: credentials.username })

    try {
      const user = await this.authHashLogin(credentials.username, credentials.authHash)
      if (!user) {
        EventBus.emit(User.EVENTS.signInError, { message: 'No user found.' })
        return false
      }

      this.signedIn = true
      this.username = user.username
      this.authHash = user.authHash
      this.id = user.id
      this.token = user.token

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
    this.id = ''
    this.token = ''
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

export interface IConfig {
  accessKey?: string
  apiURL?: string
  apiKey?: string
  authHash?: string
  developerKey?: string
  successURL?: string
  token?: string
}

