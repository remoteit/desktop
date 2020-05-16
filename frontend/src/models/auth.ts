import Controller from '../services/Controller'
import { store } from '../store'
import { IUser } from 'remote.it'
import { createModel } from '@rematch/core'
import { clearUserCredentials, updateUserCredentials, r3 } from '../services/remote.it'
import { emit } from '../services/Controller'
import analytics from '../helpers/Analytics'

const USER_KEY = 'user'

export interface AuthState {
  loadingInitialState: boolean
  signInStarted: boolean
  authenticated: boolean
  signInError?: string
  user?: IUser
}

const state: AuthState = {
  loadingInitialState: true,
  authenticated: false,
  signInStarted: false,
  signInError: undefined,
  user: undefined,
}

// @ts-ignore
window.setAuth = (credentials: UserCredentials) => {
  store.dispatch.auth.setUser(credentials)
  Controller.open()
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async init(_: void, rootState: any) {
      let { user } = rootState.auth

      if (!user) {
        const storedUser = window.localStorage.getItem(USER_KEY)
        if (storedUser) user = JSON.parse(storedUser)
      }

      if (user?.username) {
        console.log('WE HAVE A USER', user.username)
        dispatch.auth.setUser(user)
      } else {
        dispatch.auth.signedOut()
      }
    },
    handleDisconnect(_: void, rootState: any) {
      const { authenticated } = rootState.auth
      // re-open if disconnected unintentionally
      if (authenticated) Controller.open(true)
    },
    async checkSession(_: void, rootState: any) {
      let { user } = rootState.auth

      if (await r3.user.sessionExpired(user.username)) {
        try {
          user = await r3.user.authHashLogin(user.username, user.authHash)
          dispatch.auth.setUser(user)
          return
        } catch (error) {
          dispatch.auth.signInError(error.message)
          return
        }
      }

      console.log('Session still active')
    },
    async signIn({ password, username }) {
      dispatch.auth.signInStarted()
      console.log('Logging in user', username)
      let user
      r3.post('/user/login', { username, password })
        .then(resp => {
          user = r3.user.process(resp, username)
          r3.user.updateCredentials(user)
          dispatch.auth.setUser(user)
          Controller.open()
          analytics.track('signIn')
        })
        .catch(error => {
          const e = error.response.data
          if (e.code && ['SMS_MFA', 'SOFTWARE_TOKEN_MFA', 'MFA_SETUP'].includes(e.code)) {
            dispatch.auth.signInError(
              "This version of remote.it desktop doesn't support two-factor authentication. Please upgrade to the latest version or disable two-factor authentication in the web portal."
            )
          } else {
            dispatch.auth.signInError(e.reason)
          }
          return
        })
      return user
    },
    async signedIn() {
      await dispatch.auth.checkSession()
      dispatch.devices.fetch()
      dispatch.auth.signInFinished()
    },
    async authenticated() {
      dispatch.auth.signedIn()
      dispatch.auth.setAuthenticated(true)
    },
    async signInError(error: string) {
      dispatch.auth.signInFinished()
      dispatch.auth.setError(error)
    },
    /**
     * Gets called when the backend signs the user out
     */
    signedOut() {
      analytics.clearIdentity()
      dispatch.auth.signOutFinished()
      dispatch.devices.reset()
      dispatch.logs.reset()
      dispatch.auth.setAuthenticated(false)
      window.location.search = ''
      console.log('SIGNOUT COMPLETE')
      emit('user/sign-out-complete')
      Controller.close()
    },
  }),
  reducers: {
    signInStarted(state: AuthState) {
      state.signInStarted = true
    },
    signInFinished(state: AuthState) {
      state.signInStarted = false
    },
    signOutFinished(state: AuthState) {
      state.user = undefined
      clearUserCredentials()
      window.localStorage.removeItem('devices')
      window.localStorage.removeItem(USER_KEY)
    },
    setAuthenticated(state: AuthState, authenticated: boolean) {
      state.authenticated = authenticated
      state.loadingInitialState = false
      console.log('NOT LOADING INITIAL STATE ANY MORE')
    },
    setError(state: AuthState, error: string) {
      state.signInError = error
    },
    setUser(state: AuthState, user: IUser) {
      state.user = user
      state.signInError = undefined
      window.localStorage.setItem(USER_KEY, JSON.stringify(user))
      analytics.identify(user.id)
      Controller.emit('authentication', { username: user.username, authHash: user.authHash })
      updateUserCredentials(user)
    },
  },
})
