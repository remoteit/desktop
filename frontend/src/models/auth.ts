import { IUser } from 'remote.it'
import { createModel } from '@rematch/core'
import BackendAdapter from '../services/BackendAdapter'
import {
  clearUserCredentials,
  refreshAccessKey,
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
      dispatch.auth.checkSignInStarted()
      dispatch.devices.getConnections()
      await refreshAccessKey()
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
      updateUserCredentials(user)
    },
    /**
     * Triggers a signout via the backend process
     */
    async signOut() {
      // const { signOutFinished } = dispatch.auth

      BackendAdapter.emit('user/sign-out')
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
      clearUserCredentials()
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
    },
    setError(state: AuthState, error: string) {
      state.signInError = error
    },
    setUser(state: AuthState, user: IUser) {
      state.user = user
      state.signInError = undefined
    },
  },
})
