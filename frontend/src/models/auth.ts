import { CLIENT_ID, API_URL, DEVELOPER_KEY, CALLBACK_URL } from '../shared/constants'
import { r3 } from '../services/remote.it'

import { IUser } from 'remote.it'
import { createModel } from '@rematch/core'
import { emit } from '../services/Controller'
import Controller from '../services/Controller'
import analyticsHelper from '../helpers/analyticsHelper'
import { AuthUser } from '@remote.it/types'
import { AuthService } from '@remote.it/services'
import { getRedirectUrl } from '../services/Browser'

const USER_KEY = 'user'

export interface AuthState {
  initialized: boolean
  signInStarted: boolean
  authenticated: boolean
  backendAuthenticated: boolean
  signInError?: string
  user?: IUser
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
        const authService = new AuthService({cognitoClientID:CLIENT_ID, apiURL:API_URL, developerKey:DEVELOPER_KEY, redirectURL:getRedirectUrl(), callbackURL:CALLBACK_URL});
        dispatch.auth.setAuthService(authService)
        try {
          const authUser = await authService.checkSignIn()
          if (authUser) {
            await  dispatch.auth.handleSignInSuccess(authUser)
          }
        } catch (e) {
          console.log('Not Authenticated')
          dispatch.auth.setInitialized()
        }
      }
    },
    async handleDisconnect(_: void, rootState: any) {
      const { authenticated } = rootState.auth
      // re-open if disconnected unintentionally
      if (authenticated) Controller.open(true)
    },
    async checkSession(_: void, rootState: any) {
      try {
        await rootState.auth.authService.checkSignIn()
        return
      } catch (e) {
        dispatch.auth.signInError('Login Expired')
        return
      }
    },
    async handleSignInSuccess(authUser: AuthUser): Promise<void> {
      if (authUser.cognitoUser?.username) {
        dispatch.auth.setAuthenticated(true)
        dispatch.auth.setInitialized()
        const user = await r3.user.userData(authUser.cognitoUser?.username)
        Controller.open(false,true)
        dispatch.auth.setUser(user)
      }
    },
    async authenticated(_: void, rootState: any) {
      if(rootState.auth.authenticated) {
        dispatch.auth.setBackendAuthenticated(true)
        dispatch.devices.fetch()
        dispatch.applicationTypes.fetch()
        emit('init')
      }
    },
    async signInError(error: string) {
      dispatch.auth.setError(error)
      dispatch.auth.signedOut()
    },
    /**
     * Gets called when the backend signs the user out
     */
    async signedOut(_: void, rootState: any) {
      const user = await rootState.auth.authService.checkSignIn()
      await rootState.auth.authService.signOut()
      if (user.cognitoUser.authProvider == 'Google') {
        window.open('https://auth.remote.it/logout?client_id=26g0ltne0gr8lk1vs51mihrmig&logout_uri=remoteitdev://')
      }
      dispatch.backend.set({ connections: [] })
      dispatch.auth.signOutFinished()
      dispatch.auth.signInFinished()
      dispatch.devices.reset()
      dispatch.logs.reset()
      dispatch.auth.setAuthenticated(false)
      dispatch.auth.setBackendAuthenticated(false)
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
      window.localStorage.removeItem('devices')
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
    setUser(state: AuthState, user: IUser) {
      user.username = user.email
      state.user = user
      state.signInError = undefined
      window.localStorage.setItem(USER_KEY, JSON.stringify(user))
      analyticsHelper.identify(user.id)
      emit('authentication', { username: user.username, authHash: user.authHash })
    },
    setAuthService(state: AuthState, authService: AuthService) {
      state.authService = authService
    },
  },
})
