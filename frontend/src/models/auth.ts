import analyticsHelper from '../helpers/analyticsHelper'
import cloudController from '../services/cloudController'
import Controller, { emit } from '../services/Controller'
import { graphQLRequest, graphQLGetErrors, apiError } from '../services/graphQL'
import {
  CLIENT_ID,
  CALLBACK_URL,
  DEVELOPER_KEY,
  AUTH_API_URL,
  COGNITO_USER_POOL_ID,
  COGNITO_AUTH_DOMAIN,
} from '../shared/constants'
import { getLocalStorage, isElectron, isPortal, removeLocalStorage, setLocalStorage } from '../services/Browser'
import { CognitoUser } from '@remote.it/types'
import { AuthService } from '@remote.it/services'
import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'
import { Dispatch } from '../store'
import { REDIRECT_URL } from '../shared/constants'
import { graphQLUpdateNotification } from '../services/graphQLMutation'
import { getToken, r3 } from '../services/remote.it'
import axios from 'axios'

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

const USER_KEY = 'user'
const HOSTED_UI_KEY = 'amplify-signin-with-hostedUI'
export const CHECKBOX_REMEMBER_KEY = 'remember-username'

export interface AWSUser {
  authProvider: string
  email?: string
  email_verified?: boolean
  phone_number?: string
  phone_number_verified: boolean
  given_name?: string //first_name
  family_name?: string //last_name
  gender?: string
  'custom:backup_code'?: string
}

export interface AuthState {
  initialized: boolean
  signInStarted: boolean
  authenticated: boolean
  backendAuthenticated: boolean
  signInError?: string
  authService?: AuthService
  user?: IUser
  localUsername?: string
  notificationSettings: INotificationSetting
  mfaMethod: string
  AWSUser: AWSUser
  loggedIn?: boolean
}

const state: AuthState = {
  initialized: false,
  authenticated: false,
  backendAuthenticated: false,
  signInStarted: false,
  signInError: undefined,
  user: undefined,
  authService: undefined,
  localUsername: undefined,
  notificationSettings: {},
  mfaMethod: '',
  AWSUser: {
    authProvider: '',
  } as AWSUser,
  loggedIn: false,
}

export const authServiceConfig = {
  cognitoClientID: CLIENT_ID,
  cognitoUserPoolID: COGNITO_USER_POOL_ID,
  cognitoAuthDomain: COGNITO_AUTH_DOMAIN,
  checkSamlURL: AUTH_API_URL + '/checkSaml',
  redirectURL: isPortal() || isElectron() ? '' : window.origin + '/v1/callback/',
  callbackURL: isPortal() ? window.origin : isElectron() ? REDIRECT_URL : CALLBACK_URL,
  signoutCallbackURL: isPortal() ? window.origin : isElectron() ? REDIRECT_URL : CALLBACK_URL,
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async init(_: void, rootState) {
      let { user } = rootState.auth
      console.log('AUTH INIT', { user })
      if (!user) {
        const authService = new AuthService(authServiceConfig)
        await sleep(500)
        await authService.checkSignIn()
        dispatch.auth.set({ authService })
      }
      dispatch.auth.set({ initialized: true })
    },
    async signInSuccess() {
      const { auth } = dispatch as Dispatch
      auth.set({ signInStarted: false })
    },
    async changeLanguage(language: string) {
      const { setLanguage } = dispatch.auth
      await r3.post('/user/language/', { language })
      setLanguage(language)
    },
    async changeEmail(email: string) {
      const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      if (mailFormat.test(email)) {
        r3.post('/user/email/', { email }).then(() => dispatch.auth.setAWSUserEmail(email))
        dispatch.ui.set({ successMessage: `Email modified successfully.` })
      } else {
        dispatch.ui.set({ errorMessage: `Invalid format.` })
      }
    },
    async fetchUser(_, state) {
      const { auth } = dispatch as Dispatch
      try {
        const result = await graphQLRequest(
          ` {
              login {
                id
                email
                authhash
                yoicsId
                language
                created
                notificationSettings {
                  emailNotifications
                  desktopNotifications
                  urlNotifications
                  notificationEmail
                  notificationUrl
                }
              }
            }`
        )
        graphQLGetErrors(result)
        const data = result?.data?.data?.login
        const user = {
          id: data.id,
          email: data.email,
          authHash: data.authhash,
          yoicsId: data.yoicsId,
          language: data.language,
          created: data.created,
        }
        auth.set({ user, signInError: undefined })
        setLocalStorage(state, USER_KEY, user)
        analyticsHelper.identify(data.id)
        if (data.authhash && data.yoicsId) {
          Controller.setupConnection({ username: data.yoicsId, authHash: data.authhash, guid: data.id })
          auth.set({ notificationSettings: data.notificationSettings })
          auth.signedIn()
        } else console.warn('Login failed!', data)
      } catch (error) {
        await apiError(error)
      }
    },
    async updateUserMetadata(metadata: INotificationSetting) {
      const { auth } = dispatch as Dispatch
      try {
        const response = await graphQLUpdateNotification(metadata)
        auth.set({ notificationSettings: metadata })
        graphQLGetErrors(response)
      } catch (error) {
        await apiError(error)
      }
    },
    async changePassword(passwordValues: IPasswordValue, state) {
      const existingPassword = passwordValues.currentPassword
      const newPassword = passwordValues.password

      try {
        await state.auth.authService?.changePassword(existingPassword, newPassword)
        sleep(300)
        window.location.reload()
        dispatch.ui.set({ successMessage: `Password Changed Successfully` })
      } catch (error) {
        dispatch.ui.set({ errorMessage: `Change password error: ${error}` })
      }
    },
    async forceRefreshToken(_: void, rootState) {
      if (!rootState.auth.authService) return
      await rootState.auth.authService.forceTokenRefresh()
    },
    async checkSession(options: { refreshToken: boolean }, rootState) {
      const { ui } = dispatch
      if (!rootState.auth.authService) return
      try {
        const result = await rootState.auth.authService.checkSignIn(options)
        if (result.cognitoUser) {
          await dispatch.auth.handleSignInSuccess(result.cognitoUser)
        } else {
          console.error('SESSION ERROR', result.error, result)
          if (result.error?.message) ui.set({ errorMessage: result.error.message })
        }
      } catch (error) {
        console.error('Check sign in error', error)
      }
    },
    async handleSignInSuccess(cognitoUser: CognitoUser, state): Promise<void> {
      if (cognitoUser?.username) {
        if (cognitoUser?.attributes?.email && getLocalStorage(state, CHECKBOX_REMEMBER_KEY)) {
          setLocalStorage(state, 'username', cognitoUser?.attributes?.email)
        } else if (!getLocalStorage(state, CHECKBOX_REMEMBER_KEY)) {
          window.localStorage.removeItem('username')
        }

        if (cognitoUser?.authProvider === 'Google') {
          setLocalStorage(state, HOSTED_UI_KEY, 'true')
        }
        dispatch.auth.set({ authenticated: true })
        dispatch.auth.fetchUser()
      }
    },
    async getUsernameLocal() {
      const localUsername = localStorage.getItem('username')
      dispatch.auth.set({ localUsername })
    },
    async backendAuthenticated(_: void, rootState) {
      if (rootState.auth.authenticated) {
        dispatch.auth.set({ backendAuthenticated: true })
      }
    },
    async disconnect(_: void, rootState) {
      console.log('DISCONNECT')
      if (!rootState.auth.authenticated && !rootState.auth.backendAuthenticated && !isPortal()) {
        await dispatch.auth.signedOut()
        dispatch.auth.set({ signInError: 'Sign in failed, please try again.' })
      }
      dispatch.auth.set({ backendAuthenticated: false })
      dispatch.ui.set({ connected: false })
    },
    async signInError(signInError: string) {
      dispatch.auth.set({ signInError })
      //send message to backend to sign out
      emit('user/lock')
    },
    async backendSignInError(signInError: string) {
      await dispatch.auth.signedOut()
      dispatch.auth.set({ signInError })
    },
    async dataReady(_: void, rootState) {
      if (rootState.backend.initialized && !isPortal()) {
        console.warn('BACKEND ALREADY INITIALIZED')
        return
      }
      dispatch.backend.set({ initialized: true })
      dispatch.licensing.init()
      await cloudController.init()
      await dispatch.accounts.init()
      await dispatch.organization.init()
      await dispatch.devices.init()
      await dispatch.connections.init()
      await dispatch.tags.fetch()
      dispatch.devices.fetch()
      dispatch.contacts.fetch()
      dispatch.sessions.fetch()
      dispatch.announcements.fetch()
      dispatch.applicationTypes.fetch()
    },
    async signedIn() {
      if (isPortal()) dispatch.auth.dataReady()
      dispatch.ui.init()
    },
    async signOut(_, rootState) {
      if (rootState.auth.backendAuthenticated) emit('user/sign-out')
      else await dispatch.auth.signedOut()
    },
    /**
     * Gets called when the backend signs the user out
     */
    async signedOut(_: void, state) {
      await state.auth.authService?.signOut()
      removeLocalStorage(state, HOSTED_UI_KEY)
      removeLocalStorage(state, USER_KEY)
      dispatch.auth.set({ user: undefined, signInStarted: false })
      dispatch.organization.reset()
      dispatch.accounts.reset()
      dispatch.connections.reset()
      dispatch.devices.reset()
      dispatch.sessions.reset()
      dispatch.logs.reset()
      dispatch.search.reset()
      dispatch.licensing.reset()
      dispatch.contacts.reset()
      dispatch.billing.reset()
      dispatch.backend.reset()
      dispatch.tags.reset()
      dispatch.ui.reset()
      dispatch.accounts.setActive('')
      window.location.hash = ''
      emit('user/sign-out-complete')
      dispatch.auth.set({ authenticated: false })
      analyticsHelper.clearIdentity()
      cloudController.close()
      Controller.close()
    },
    async globalSignOut() {
      const Authorization = await getToken()
      const response = await axios.get(`${AUTH_API_URL}/globalSignout`, {
        headers: {
          Authorization,
        },
      })
      console.log(`globalSignOut: `, response)
      dispatch.auth.signOut()
    },
  }),
  reducers: {
    setAWSUserEmail(state: AuthState, value: string) {
      state.AWSUser.email = value
      return state
    },
    setLanguage(state: AuthState, language: string) {
      if (!state.user) return state
      state.user.language = language
      return state
    },
    set(state: AuthState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
