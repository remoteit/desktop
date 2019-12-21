import { IUser } from 'remote.it'
import { createModel } from '@rematch/core'
import Controller from '../services/Controller'
import { clearUserCredentials, updateUserCredentials, r3 } from '../services/remote.it'

const USER_KEY = 'user'
const OPEN_ON_LOGIN_KEY = 'open-on-login'

export interface AuthState {
  checkSignInStarted: boolean
  openOnLogin: boolean
  signInStarted: boolean
  authenticated: boolean
  signInError?: string
  user?: IUser
}

const state: AuthState = {
  checkSignInStarted: false,
  authenticated: false,
  openOnLogin: false,
  signInStarted: false,
  signInError: undefined,
  user: undefined,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async authenticate() {},
    async init(_: void, rootState: any) {
      let { user } = rootState.auth

      // Get "open on login" setting
      dispatch.auth.getOpenOnLoginState()

      if (!user) {
        const storedUser = localStorage.getItem(USER_KEY)
        if (storedUser) {
          user = JSON.parse(storedUser)
          dispatch.auth.setUser(user)
        }
      }

      if (user) {
        Controller.emit('authentication', { username: user.username, authHash: user.authHash })
      } else {
        dispatch.auth.signedOut()
      }
    },
    async signIn({ password, username }) {
      dispatch.auth.signInStarted()
      console.log('Logging in user', username)

      let user
      try {
        user = await r3.user.login(username, password)
      } catch (error) {
        dispatch.auth.signInError(error.message)
        return
      }

      if (!user) {
        console.warn('Could not log in user:', { username })
        dispatch.auth.signInError('User not found')
        return
      }

      dispatch.auth.setUser(user)
      Controller.open()
    },
    async signedIn() {
      dispatch.auth.signInFinished()
      dispatch.auth.checkSignInFinished()
      dispatch.devices.shouldSearchDevices()
    },
    async authenticated() {
      dispatch.auth.signedIn()
      dispatch.auth.setAuthenticated(true)
    },
    /**
     * Triggers a signout via the backend process
     */
    async signOut() {
      Controller.emit('user/sign-out')
    },
    async quit() {
      Controller.emit('user/quit')
    },
    async signInError(error: string) {
      dispatch.auth.signInFinished()
      dispatch.auth.setError(error)
    },
    /**
     * Gets called when the backend signs the user out
     */
    async signedOut() {
      dispatch.auth.checkSignInFinished()
      dispatch.auth.signOutFinished()
      dispatch.devices.reset()
      dispatch.logs.reset()
      dispatch.auth.setAuthenticated(false)
      Controller.close()
    },
    async getOpenOnLoginState() {
      // Get "open on login" setting
      const openOnLogin = localStorage.getItem(OPEN_ON_LOGIN_KEY)
      dispatch.auth.setOpenOnLogin(openOnLogin === 'true')
    },
    async toggleOpenOnLogin(_, state) {
      const open = !state.auth.openOnLogin
      dispatch.auth.setOpenOnLogin(open)
    },
  }),
  reducers: {
    checkSignInStarted(state: AuthState) {
      state.checkSignInStarted = true
    },
    checkSignInFinished(state: AuthState) {
      state.checkSignInStarted = false
    },
    signInStarted(state: AuthState) {
      state.signInStarted = true
    },
    signInFinished(state: AuthState) {
      state.signInStarted = false
    },
    signOutFinished(state: AuthState) {
      state.user = undefined
      clearUserCredentials()
      localStorage.removeItem('devices')
      localStorage.removeItem(USER_KEY)
    },
    setAuthenticated(state: AuthState, authenticated: boolean) {
      state.authenticated = authenticated
    },
    setError(state: AuthState, error: string) {
      state.signInError = error
    },
    setUser(state: AuthState, user: IUser) {
      state.user = user
      state.signInError = undefined
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      updateUserCredentials(user)
    },
    setOpenOnLogin(state: AuthState, open: boolean) {
      Controller.emit('app/open-on-login', open)
      localStorage.setItem(OPEN_ON_LOGIN_KEY, open.toString())
      state.openOnLogin = open
    },
  },
})
