import { IUser } from 'remote.it'
import { createModel } from '@rematch/core'
import BackendAdapter from '../services/BackendAdapter'
import {
  clearUserCredentials,
  updateUserCredentials,
} from '../services/remote.it'

export interface AuthState {
  checkSignInStarted: boolean
  signInStarted: boolean
  signInError?: string
  user?: IUser
}

const state: AuthState = {
  checkSignInStarted: false,
  signInStarted: false,
  signInError: undefined,
  user: undefined,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async checkSignIn() {
      const user = localStorage.getItem('user')
      dispatch.auth.checkSignInStarted()
      dispatch.devices.getConnections()
      if (user) {
        dispatch.auth.setUser(JSON.parse(user))
        dispatch.auth.signInFinished()
        dispatch.auth.checkSignInFinished()
        dispatch.devices.shouldSearchDevices()
        return
        // } else {
      }
      BackendAdapter.emit('user/check-sign-in')
    },
    async signIn(credentials: { password: string; username: string }) {
      dispatch.auth.signInStarted()
      BackendAdapter.emit('user/sign-in', credentials)
    },
    async signedIn(user: IUser) {
      dispatch.auth.signInFinished()
      dispatch.auth.checkSignInFinished()
      dispatch.auth.setUser(user)
      dispatch.devices.shouldSearchDevices()
    },
    /**
     * Triggers a signout via the backend process
     */
    async signOut() {
      // const { signOutFinished } = dispatch.auth
      BackendAdapter.emit('user/sign-out')
    },
    async quit() {
      BackendAdapter.emit('user/quit')
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
      dispatch.navigation.setPage('devices')
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
      localStorage.removeItem('user')
    },
    setError(state: AuthState, error: string) {
      state.signInError = error
    },
    setUser(state: AuthState, user: IUser) {
      state.user = user
      state.signInError = undefined
      localStorage.setItem('user', JSON.stringify(user))
      updateUserCredentials(user)
    },
  },
})
