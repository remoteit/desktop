import { CLIENT_ID, API_URL, DEVELOPER_KEY, CALLBACK_URL, PROTOCOL } from '../shared/constants'
import { r3 } from '../services/remote.it'
import { IUser as LegacyUser } from 'remote.it'
import { createModel } from '@rematch/core'
import { emit } from '../services/Controller'
import Controller from '../services/Controller'
import analyticsHelper from '../helpers/analyticsHelper'
import { AuthUser } from '@remote.it/types'
import { AuthService } from '@remote.it/services'
import { getRedirectUrl, isElectron } from '../services/Browser'
import { store } from '../store'

const USER_KEY = 'user'

export interface AuthState {
  initialized: boolean
  signInStarted: boolean
  authenticated: boolean
  backendAuthenticated: boolean
  signInError?: string
  user?: LegacyUser
  authService?: AuthService
}

const state: AuthState = {
  initialized: false,
  authenticated: false,
  backendAuthenticated: false,
  signInStarted: false,
  signInError: undefined,
  user: undefined,
  authService: undefined,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async init(_: void, rootState: any) {
      let { user } = rootState.auth

      if (!user) {
        const authService = new AuthService({
          cognitoClientID: CLIENT_ID,
          developerKey: DEVELOPER_KEY,
          redirectURL: (Buffer.from(getRedirectUrl())).toString('hex'),
          callbackURL: CALLBACK_URL,
          signoutCallbackURL: isElectron() ? getRedirectUrl() : CALLBACK_URL 
        })
        dispatch.auth.setAuthService(authService)
        dispatch.auth.setInitialized()
      }
    },
    async checkSession(_: void, rootState: any) {
      const { backend } = store.dispatch
      const result = await rootState.auth.authService.checkSignIn()
      if (result.authUser) {
        await dispatch.auth.handleSignInSuccess(result.authUser)
      } else {
        if(result.error.code === 'NetworkError') {
          backend.set({ globalError:result.error.message })
        } else {
          dispatch.auth.signInError('Session Expired')
        } 
      }
    },
    async handleSignInSuccess(authUser: AuthUser): Promise<void> {
      if (authUser.cognitoUser?.username) {
        if( authUser.cognitoUser?.authProvider === 'Google' ) {
          window.localStorage.setItem('amplify-signin-with-hostedUI', 'true');
        }
        dispatch.auth.setAuthenticated(true)
        dispatch.auth.setInitialized()
        const user = await r3.user.userData(authUser.cognitoUser?.username)
        dispatch.auth.setUser(user)
      }
    },
    async authenticated(_: void, rootState: any) {
      if (rootState.auth.authenticated) {
        dispatch.auth.setBackendAuthenticated(true)
        dispatch.applicationTypes.fetch()
        await dispatch.accounts.init()
        dispatch.devices.fetch()
      }
    },
    async signInError(error: string) {
      dispatch.auth.setError(error)
      //send message to backend to sign out
      emit('user/sign-out')
    },
    async backendSignInError(error: string) {
      await dispatch.auth.signedOut()
      dispatch.auth.setError(error)
    },
    /**
     * Gets called when the backend signs the user out
     */
    async signedOut(_: void, rootState: any) {
      await rootState.auth.authService.signOut()
      window.localStorage.removeItem('amplify-signin-with-hostedUI')
      dispatch.backend.set({ connections: [] })
      dispatch.auth.signOutFinished()
      dispatch.auth.signInFinished()
      dispatch.devices.reset()
      dispatch.logs.reset()
      dispatch.auth.setAuthenticated(false)
      dispatch.auth.setBackendAuthenticated(false)
      dispatch.accounts.setActive('')
      window.location.hash = ''
      emit('user/sign-out-complete')
      analyticsHelper.clearIdentity()
      Controller.close()
    },
  }),
  reducers: {
    setInitialized(state: AuthState) {
      state.initialized = true
    },
    signInStarted(state: AuthState) {
      state.signInStarted = true
    },
    signInFinished(state: AuthState) {
      state.signInStarted = false
    },
    signOutFinished(state: AuthState) {
      state.user = undefined
      window.localStorage.removeItem(USER_KEY)
    },
    setAuthenticated(state: AuthState, authenticated: boolean) {
      state.authenticated = authenticated
    },
    setBackendAuthenticated(state: AuthState, backendAuthenticated: boolean) {
      state.backendAuthenticated = backendAuthenticated
    },
    setError(state: AuthState, error: string) {
      state.signInError = error
    },
    setUser(state: AuthState, user: LegacyUser) {
      user.username = user.email
      state.user = user
      state.signInError = undefined
      window.localStorage.setItem(USER_KEY, JSON.stringify(user))
      analyticsHelper.identify(user.id)
      Controller.setupConnection(user.username, user.authHash)
    },
    setAuthService(state: AuthState, authService: AuthService) {
      state.authService = authService
    },
  },
})
