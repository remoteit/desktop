import analyticsHelper from '../helpers/analyticsHelper'
import cloudController from '../services/cloudController'
import Controller, { emit } from '../services/Controller'
import { graphQLRequest, graphQLGetErrors, apiError } from '../services/graphQL'
import {
  CLIENT_ID,
  CALLBACK_URL,
  AUTH_API_URL,
  COGNITO_USER_POOL_ID,
  COGNITO_AUTH_DOMAIN,
  REDIRECT_URL,
} from '../shared/constants'
import { getLocalStorage, isElectron, isPortal, removeLocalStorage, setLocalStorage } from '../services/Browser'
import { getToken, r3 } from '../services/remote.it'
import { CognitoUser } from '@remote.it/types'
import { AuthService } from '@remote.it/services'
import { createModel } from '@rematch/core'
import { RootModel } from '.'
import { Dispatch } from '../store'
import sleep from '../services/sleep'
import zendesk from '../services/zendesk'
import axios from 'axios'

const USER_KEY = 'user'
const HOSTED_UI_KEY = 'amplify-signin-with-hostedUI'
export const CHECKBOX_REMEMBER_KEY = 'remember-username'

export interface AWSUser {
  authProvider: string
  email?: string
  email_verified?: boolean
  phone_number?: string
  phone_number_verified?: boolean
  given_name?: string //first_name
  family_name?: string //last_name
  gender?: string
  'custom:backup_code'?: string
}

export interface AuthState {
  initialized: boolean
  authenticated: boolean
  backendAuthenticated: boolean
  signInError?: string
  authService?: AuthService
  user?: IUser
  localUsername?: string
  mfaMethod: string
  AWSUser: AWSUser
}

const defaultState: AuthState = {
  initialized: false,
  authenticated: false,
  backendAuthenticated: false,
  signInError: undefined,
  user: undefined,
  authService: undefined,
  localUsername: undefined,
  mfaMethod: '',
  AWSUser: { authProvider: '' },
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
  state: defaultState,
  effects: dispatch => ({
    async init(_, state) {
      let { user } = state.auth
      console.log('AUTH INIT START', { user })
      if (!user) {
        const authService = new AuthService(authServiceConfig)
        await sleep(500)
        await dispatch.auth.set({ authService })
        await dispatch.auth.checkSession({ refreshToken: true })
      }
      dispatch.auth.set({ initialized: true })
      console.log('AUTH INIT END')
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
              }
            }`
        )
        graphQLGetErrors(result)
        const data = result?.data?.data?.login
        const user = { ...data, authHash: data.authhash }
        auth.set({ user, signInError: undefined })
        setLocalStorage(state, USER_KEY, user)
        analyticsHelper.identify(data.id)
        if (data.authhash && data.yoicsId) {
          Controller.setupConnection({ username: data.yoicsId, authHash: data.authhash, guid: data.id })
          auth.signedIn()
        } else console.warn('Login failed!', data)
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
    /* TODO validate and hook changeEmail up */
    async changeEmail(email: string) {
      const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      if (mailFormat.test(email)) {
        r3.post('/user/email/', { email }).then(() => dispatch.auth.setAWSUserEmail(email))
        dispatch.ui.set({ successMessage: `Email modified successfully.` })
      } else {
        dispatch.ui.set({ errorMessage: `Invalid format.` })
      }
    },
    async forceRefreshToken(_, state) {
      if (!state.auth.authService) return
      await state.auth.authService.forceTokenRefresh()
    },
    async checkSession(options: { refreshToken: boolean }, state) {
      if (!state.auth.authService) return
      try {
        const result = await state.auth.authService.checkSignIn(options)
        if (result.cognitoUser) {
          await dispatch.auth.handleSignInSuccess(result.cognitoUser)
        } else {
          console.error('SESSION ERROR', result.error, result)
          if (result.error?.message) dispatch.ui.set({ errorMessage: result.error.message })
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
        await dispatch.auth.set({ authenticated: true })
        await dispatch.auth.fetchUser()
        await dispatch.mfa.getAWSUser()
        console.log('AUTHENTICATED SUCCESS')
      }
    },
    async getUsernameLocal() {
      const localUsername = localStorage.getItem('username')
      dispatch.auth.set({ localUsername })
    },
    async backendAuthenticated(_, state) {
      if (state.auth.authenticated) {
        dispatch.auth.set({ backendAuthenticated: true })
        console.log('BACKEND AUTHENTICATED')
        if (!state.backend.initialized) {
          emit('init')
          console.log('INIT BACKEND')
        }
      }
    },
    async disconnect(_, state) {
      if (!state.auth.authenticated && !state.auth.backendAuthenticated && !isPortal()) {
        await dispatch.auth.signedOut()
        dispatch.auth.set({ signInError: 'Sign in failed, please try again.' })
      }
      dispatch.ui.set({ connected: false })
      dispatch.auth.set({ backendAuthenticated: false })
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
    async dataReady(_, state) {
      if (state.backend.initialized) {
        console.warn('DATA ALREADY INITIALIZED')
        return
      }

      zendesk.initChat(state.auth.user)
      dispatch.backend.set({ initialized: true })
      dispatch.plans.init()
      await cloudController.init()
      await dispatch.accounts.init()
      await dispatch.organization.init()
      await dispatch.connections.init()
      await dispatch.networks.init()
      await dispatch.devices.init()
      await dispatch.tags.fetch()
      dispatch.user.fetch()
      dispatch.devices.fetch()
      dispatch.devices.fetchConnections()
      dispatch.contacts.fetch()
      dispatch.sessions.fetch()
      dispatch.announcements.fetch()
      dispatch.applicationTypes.fetch()
    },
    async signedIn() {
      if (isPortal()) dispatch.auth.dataReady()
      dispatch.ui.init()
    },
    async signOut(_, state) {
      if (state.auth.backendAuthenticated) emit('user/sign-out')
      else await dispatch.auth.signedOut()
    },
    /**
     * Gets called when the backend signs the user out
     */
    async signedOut(_, state) {
      await state.auth.authService?.signOut()
      removeLocalStorage(state, HOSTED_UI_KEY)
      removeLocalStorage(state, USER_KEY)
      dispatch.auth.set({ user: undefined })
      dispatch.user.reset()
      dispatch.organization.reset()
      dispatch.accounts.reset()
      dispatch.connections.reset()
      dispatch.devices.reset()
      dispatch.sessions.reset()
      dispatch.logs.reset()
      dispatch.search.reset()
      dispatch.announcements.reset()
      dispatch.plans.reset()
      dispatch.contacts.reset()
      dispatch.billing.reset()
      dispatch.backend.reset()
      dispatch.tags.reset()
      dispatch.mfa.reset()
      dispatch.ui.reset()
      dispatch.accounts.setActive('')
      window.location.hash = ''
      zendesk.endChat()
      emit('user/sign-out-complete')
      dispatch.auth.set({ authenticated: false })
      analyticsHelper.clearIdentity()
      cloudController.close()
      Controller.close()
    },
    async globalSignOut() {
      const Authorization = await getToken()
      const response = await axios.get(`${AUTH_API_URL}/globalSignout`, {
        headers: { Authorization },
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
    set(state: AuthState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
