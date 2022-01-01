import analyticsHelper from '../helpers/analyticsHelper'
import cloudController from '../services/cloudController'
import Controller, { emit } from '../services/Controller'
import { graphQLRequest, graphQLGetErrors } from '../services/graphQL'
import { CLIENT_ID, CALLBACK_URL } from '../shared/constants'
import { getLocalStorage, isElectron, isPortal, removeLocalStorage, setLocalStorage } from '../services/Browser'
import { CognitoUser } from '@remote.it/types'
import { AuthService } from '@remote.it/services'
import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'
import { Dispatch } from '../store'
import { apiError } from '../helpers/apiHelper'
import { REDIRECT_URL } from '../shared/constants'
import { graphQLUpdateNotification } from '../services/graphQLMutation'

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

const USER_KEY = 'user'

export const CHECKBOX_REMEMBER_KEY = 'remember-username'

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
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async init(_: void, rootState) {
      let { user } = rootState.auth
      console.log('AUTH INIT', { user })
      if (!user) {
        const authService = new AuthService({
          cognitoClientID: CLIENT_ID,
          redirectURL: isPortal() || isElectron() ? '' : window.origin + '/v1/callback/',
          callbackURL: isPortal() ? window.origin : isElectron() ? REDIRECT_URL : CALLBACK_URL,
          signoutCallbackURL: isPortal() ? window.origin : isElectron() ? REDIRECT_URL : CALLBACK_URL,
        })
        await sleep(500)
        dispatch.auth.setAuthService(authService)
      }
      dispatch.auth.setInitialized()
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
          created: data.created,
        }
        auth.setUser(user)
        setLocalStorage(state, USER_KEY, user)
        analyticsHelper.identify(data.id)
        if (data.authhash && data.yoicsId) {
          Controller.setupConnection({ username: data.yoicsId, authHash: data.authhash, guid: data.id })
          auth.setNotificationSettings(data.notificationSettings)
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
        auth.setNotificationSettings(metadata)
        graphQLGetErrors(response)
      } catch (error) {
        await apiError(error)
      }
    },
    async checkSession(_: void, rootState) {
      const { ui } = dispatch
      if (!rootState.auth.authService) return
      try {
        const result = await rootState.auth.authService.checkSignIn()
        if (result.cognitoUser) {
          await dispatch.auth.handleSignInSuccess(result.cognitoUser)
        } else {
          console.error('SESSION ERROR', result.error, result)
          if (result.error?.message) ui.set({ errorMessage: result.error.message })
        }
      } catch (err) {
        console.log('check sign in error:')
        console.log(err)
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
          setLocalStorage(state, 'amplify-signin-with-hostedUI', 'true')
        }
        dispatch.auth.setAuthenticated(true)
        dispatch.auth.fetchUser()
      }
    },
    async getUsernameLocal() {
      const localUsername = localStorage.getItem('username')
      dispatch.auth.setUsername(localUsername || undefined)
    },
    async backendAuthenticated(_: void, rootState) {
      if (rootState.auth.authenticated) {
        dispatch.auth.setBackendAuthenticated(true)
      }
    },
    async disconnect(_: void, rootState) {
      console.log('DISCONNECT')
      if (!rootState.auth.authenticated && !rootState.auth.backendAuthenticated && !isPortal()) {
        await dispatch.auth.signedOut()
        dispatch.auth.setDefaultError('Sign in failed, please try again.')
      }
      dispatch.auth.setBackendAuthenticated(false)
      dispatch.ui.set({ connected: false })
    },
    async signInError(error: string) {
      dispatch.auth.setError(error)
      //send message to backend to sign out
      emit('user/lock')
    },
    async backendSignInError(error: string) {
      await dispatch.auth.signedOut()
      dispatch.auth.setError(error)
    },
    async signedIn() {
      dispatch.licensing.init()
      dispatch.ui.init()
      await cloudController.init()
      await dispatch.accounts.init()
      await dispatch.organization.init()
      await dispatch.devices.init()
      await dispatch.connections.init()
      await dispatch.devices.fetch()
      dispatch.applicationTypes.fetch()
      dispatch.announcements.fetch()
      dispatch.sessions.fetch()
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
      removeLocalStorage(state, 'amplify-signin-with-hostedUI')
      removeLocalStorage(state, USER_KEY)
      dispatch.auth.signOutFinished()
      dispatch.auth.signInFinished()
      dispatch.organization.reset()
      dispatch.accounts.reset()
      dispatch.connections.reset()
      dispatch.devices.reset()
      dispatch.sessions.reset()
      dispatch.logs.reset()
      dispatch.search.reset()
      dispatch.licensing.reset()
      dispatch.billing.reset()
      dispatch.tags.reset()
      dispatch.ui.reset()
      dispatch.accounts.setActive('')
      window.location.hash = ''
      emit('user/sign-out-complete')
      dispatch.auth.setAuthenticated(false)
      analyticsHelper.clearIdentity()
      cloudController.close()
      Controller.close()
    },
  }),
  reducers: {
    setInitialized(state: AuthState) {
      state.initialized = true
      return state
    },
    signInStarted(state: AuthState) {
      state.signInStarted = true
      return state
    },
    signInFinished(state: AuthState) {
      state.signInStarted = false
      return state
    },
    signOutFinished(state: AuthState) {
      state.user = undefined
      return state
    },
    setAuthenticated(state: AuthState, authenticated: boolean) {
      state.authenticated = authenticated
      return state
    },
    setBackendAuthenticated(state: AuthState, backendAuthenticated: boolean) {
      state.backendAuthenticated = backendAuthenticated
      return state
    },
    setError(state: AuthState, error: string) {
      state.signInError = error
      return state
    },
    setDefaultError(state: AuthState, error: string) {
      state.signInError = state.signInError || error
      return state
    },
    setUser(state: AuthState, user: IUser) {
      state.user = user
      state.signInError = undefined
      return state
    },
    setAuthService(state: AuthState, authService: AuthService) {
      state.authService = authService
      return state
    },
    setUsername(state: AuthState, username: string | undefined) {
      state.localUsername = username
      return state
    },
    setNotificationSettings(state: AuthState, notificationSettings: INotificationSetting) {
      state.notificationSettings = notificationSettings
      return state
    },
  },
})
