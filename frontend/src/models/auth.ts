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
  user?: IUser
}

const state: AuthState = {
  checkSignInStarted: false,
  signInStarted: false,
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
      // TODO: Deal with device search only UI
      // dispatch.devices.shouldSearchDevices()
      dispatch.devices.fetch()
      updateUserCredentials(user)
    },
    /**
     * Triggers a signout via the backend process
     */
    async signOut() {
      // const { signOutFinished } = dispatch.auth

      BackendAdapter.emit('user/sign-out')
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
    setUser(state: AuthState, user: IUser) {
      state.user = user
    },
  },
})
