import Controller from '../services/Controller'
import analyticsHelper from '../helpers/analyticsHelper'
import cloudController from '../services/cloudController'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { getRedirectUrl, isElectron } from '../services/Browser'
import { CLIENT_ID, CALLBACK_URL } from '../shared/constants'
import { CognitoUser } from '@remote.it/types'
import { AuthService } from '@remote.it/services'
import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'
import { Dispatch } from '../store'
import { store } from '../store'
import { emit } from '../services/Controller'

const USER_KEY = 'user'

export interface AuthState {
  initialized: boolean
  signInStarted: boolean
  authenticated: boolean
  backendAuthenticated: boolean
  signInError?: string
  authService?: AuthService
  user?: IUser
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

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async init(_: void, rootState: any) {
      let { user } = rootState.auth
      console.log('AUTH INIT', { user })
      if (!user) {
        const authService = new AuthService({
          cognitoClientID: CLIENT_ID,
          redirectURL: Buffer.from(getRedirectUrl()).toString('hex'),
          callbackURL: CALLBACK_URL,
          signoutCallbackURL: isElectron() ? getRedirectUrl() : CALLBACK_URL,
        })
        dispatch.auth.setAuthService(authService)
        dispatch.auth.setInitialized()
      }
    },
    async fetchUser() {
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
              }
            }`
        )
        graphQLGetErrors(result)
        const data = result?.data?.data?.login
        auth.setUser({
          id: data.id,
          email: data.email,
          authHash: data.authhash,
          yoicsId: data.yoicsId,
          created: data.created,
        })
      } catch (error) {
        await graphQLCatchError(error)
      }
    },
    async checkSession(_: void, rootState: any) {
      const { ui } = store.dispatch
      try {
        const result = await rootState.auth.authService.checkSignIn()
        if (result.authUser) {
          await dispatch.auth.handleSignInSuccess(result.cognitoUser)
        } else {
          console.error('SESSION ERROR', result.error)
          ui.set({ errorMessage: result.error.message })       
        }
      } catch (err) {
        console.log('check sign in error:')
        console.log(err)
      }
    },
    async handleSignInSuccess(cognitoUser: CognitoUser): Promise<void> {
      if (cognitoUser?.username) {
        if (cognitoUser?.authProvider === 'Google') {
          window.localStorage.setItem('amplify-signin-with-hostedUI', 'true')
        }
        dispatch.auth.setAuthenticated(true)
        dispatch.auth.setInitialized()
        dispatch.auth.fetchUser()
      }
    },
    async authenticated(_: void, rootState) {
      if (rootState.auth.authenticated) {
        dispatch.auth.setBackendAuthenticated(true)
        await cloudController.init()
        await dispatch.licensing.fetch()
        await dispatch.accounts.init()
        dispatch.applicationTypes.fetch()
        dispatch.announcements.fetch()
      }
      // always fetch on connect
      await dispatch.devices.fetch()
      dispatch.sessions.fetch()
    },
    async disconnect(_: void, rootState: any) {
      console.log('DISCONNECT')
      if (!rootState.auth.backendAuthenticated) {
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
    /**
     * Gets called when the backend signs the user out
     */
    async signedOut(_: void, rootState: any) {
      await rootState.auth.authService.signOut()
      window.localStorage.removeItem('amplify-signin-with-hostedUI')
      dispatch.auth.signOutFinished()
      dispatch.auth.signInFinished()
      dispatch.accounts.set({ devices: [] })
      dispatch.backend.set({ connections: [] })
      dispatch.devices.set({ query: '', filter: 'all', initialized: false })
      dispatch.sessions.set({ all: [] })
      dispatch.logs.reset()
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
      window.localStorage.removeItem(USER_KEY)
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
      window.localStorage.setItem(USER_KEY, JSON.stringify(user))
      analyticsHelper.identify(user.id)
      if (user.authHash && user.yoicsId) Controller.setupConnection(user.yoicsId, user.authHash)
      else console.warn('Login failed!', user)
      return state
    },
    setAuthService(state: AuthState, authService: AuthService) {
      state.authService = authService
      return state
    },
  },
})
