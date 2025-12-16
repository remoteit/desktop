import cloudSync from '../services/CloudSync'
import cloudController from '../services/cloudController'
import Controller, { emit } from '../services/Controller'
import network from '../services/Network'
import browser from '../services/browser'
import analytics from '../services/analytics'
import { selectDeviceModelAttributes } from '../selectors/devices'
import {
  CLIENT_ID,
  MOBILE_CLIENT_ID,
  CALLBACK_URL,
  AUTH_API_URL,
  COGNITO_USER_POOL_ID,
  COGNITO_AUTH_DOMAIN,
  REDIRECT_URL,
  SIGNOUT_REDIRECT_URL,
  API_URL,
  DEVELOPER_KEY,
} from '../constants'
import { persistor } from '../store'
import { graphQLLogin } from '../services/graphQLRequest'
import { getToken } from '../services/remoteit'
import { CognitoUser } from '../cognito/types'
import { AuthService, ConfigInterface } from '../cognito/auth'
import { createModel } from '@rematch/core'
import { RootModel } from '.'
import sleep from '../helpers/sleep'
import zendesk from '../services/zendesk'
import axios from 'axios'

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
  mfaMethod: '',
  AWSUser: { authProvider: '' },
}

const authServiceConfig = (): ConfigInterface => ({
  cognitoClientID: browser.isMobile ? MOBILE_CLIENT_ID : CLIENT_ID,
  cognitoUserPoolID: COGNITO_USER_POOL_ID,
  cognitoAuthDomain: COGNITO_AUTH_DOMAIN,
  checkSamlURL: AUTH_API_URL + '/checkSaml',
  cognitoRegion: 'US-WEST-2',
  redirectURL:
    browser.isPortal || browser.isElectron || browser.isMobile ? window.origin : window.origin + '/v1/callback/',
  callbackURL: browser.isPortal ? window.origin : browser.isElectron || browser.isMobile ? REDIRECT_URL : CALLBACK_URL,
  signoutCallbackURL: browser.isPortal
    ? window.origin
    : browser.isElectron || browser.isMobile
    ? SIGNOUT_REDIRECT_URL
    : CALLBACK_URL,
})

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async init(_: void, state) {
      const { user } = state.auth
      console.log('AUTH INIT START', { user })
      if (!user) {
        console.log('AUTH SERVICE CONFIG', authServiceConfig())
        const authService = new AuthService(authServiceConfig())
        console.log('AUTH INIT', { authService })
        await sleep(500)
        await dispatch.auth.set({ authService })
        await dispatch.auth.checkSession({ refreshToken: true })
      }
      dispatch.auth.set({ initialized: true })
      console.log('AUTH INIT END')
    },
    async fetchUser(_: void, state) {
      const { auth } = dispatch
      const response = await graphQLLogin()
      if (response === 'ERROR') return

      const user = response?.data?.data?.login

      auth.set({ user, signInError: undefined })
      if (user.authhash && user.yoicsId) {
        Controller.setupConnection({ username: user.yoicsId, authHash: user.authhash, guid: user.id })
        auth.signedIn()
      } else {
        console.warn('Login failed!', response)
        dispatch.ui.set({ errorMessage: 'Login failed.' })
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
        await axios.post(
          '/user/email/',
          { email },
          {
            baseURL: API_URL,
            headers: {
              'Content-Type': 'application/json',
              developerKey: DEVELOPER_KEY,
              Authorization: await getToken(),
            },
          }
        )
        dispatch.auth.setAWSUserEmail(email)
        dispatch.ui.set({ successMessage: `Email modified successfully.` })
      } else {
        dispatch.ui.set({ errorMessage: `Invalid format.` })
      }
    },
    async forceRefreshToken(_: void, state) {
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
        await dispatch.auth.set({ authenticated: true })
        await dispatch.auth.fetchUser()
        await dispatch.mfa.getAWSUser()
        console.log('AUTHENTICATED SUCCESS')
      }
    },
    async backendAuthenticated(_: void, state) {
      if (state.auth.authenticated) {
        dispatch.auth.set({ backendAuthenticated: true })
        console.log('BACKEND AUTHENTICATED')
        if (!state.backend.initialized) {
          emit('init')
          console.log('INIT BACKEND')
        }
      }
    },
    async disconnect(_: void, state) {
      if (!state.auth.authenticated && !state.auth.backendAuthenticated && browser.hasBackend) {
        await dispatch.auth.signedOut()
        if (!state.auth.signInError) dispatch.auth.set({ signInError: 'Sign in failed, please try again.' })
      }
      dispatch.ui.set({ connected: false })
      dispatch.auth.set({ backendAuthenticated: false })
    },
    async signInError(signInError: string) {
      dispatch.auth.set({ signInError })
      //send message to backend to sign out
      emit('user/lock')
    },
    async backendSignInError(signInError: string, state) {
      console.error(signInError)
      await dispatch.auth.set({ signInError })
      await dispatch.auth.signedOut()
    },
    async appReady(_: void, state) {
      // Temp migration of state
      await dispatch.connections.migrate()

      if (state.backend.initialized) {
        console.warn('BACKEND ALREADY INITIALIZED')
        return
      }

      if (selectDeviceModelAttributes(state).initialized) {
        console.warn('STATE ALREADY INITIALIZED')
        return
      } else {
        console.log('INITIALIZE STATE')
      }

      dispatch.backend.init()
      dispatch.applicationTypes.fetchAll()
      dispatch.contacts.fetch()
      await dispatch.accounts.fetch()
      await dispatch.networks.init()
      await cloudSync.all()
    },
    async signedIn(_: void, state) {
      dispatch.ui.init()
      zendesk.initChat(state.auth.user)
      analytics.signedIn(state.auth.user)
      cloudController.init()
      cloudSync.init()
      network.tick()
      if (!browser.hasBackend) dispatch.auth.appReady()
    },
    async signOut(_: void, state) {
      if (state.auth.backendAuthenticated) emit('user/sign-out')
      else await dispatch.auth.signedOut()
    },
    /**
     * Gets called when the backend signs the user out
     */
    async signedOut(_: void, state) {
      await persistor.purge()
      // purge has to happen before signOut because signOut can trigger a reload
      await state.auth.authService?.signOut()
      await dispatch.auth.set({ user: undefined })
      dispatch.user.reset()
      dispatch.organization.reset()
      dispatch.networks.reset()
      dispatch.accounts.reset()
      dispatch.connections.reset()
      dispatch.devices.reset()
      dispatch.sessions.reset()
      dispatch.logs.reset()
      dispatch.search.reset()
      dispatch.announcements.reset()
      dispatch.applicationTypes.reset()
      dispatch.plans.reset()
      dispatch.contacts.reset()
      dispatch.billing.reset()
      dispatch.backend.reset()
      dispatch.files.reset()
      dispatch.jobs.reset()
      dispatch.tags.reset()
      dispatch.mfa.reset()
      dispatch.ui.reset()
      dispatch.products.reset()

      cloudSync.reset()
      dispatch.accounts.set({ activeId: undefined })
      dispatch.auth.set({ authenticated: false })
      window.location.hash = ''
      zendesk.endChat()
      emit('user/sign-out-complete')
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
    set(state: AuthState, params: Partial<AuthState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
