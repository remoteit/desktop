import { IUser } from 'remote.it'
import { createModel } from '@rematch/core'
import * as User from '../services/User'

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
      const { checkSignInStarted, checkSignInFinished, setUser } = dispatch.auth
      checkSignInStarted()
      return (
        User.checkSignIn()
          .then(user => {
            console.log('USER:', user)
            if (!user) return
            setUser(user)
            return user
          })
          // TODO: After sign in, fetch devices (if not search onlY) and connections
          // Check if user should only search for devices
          // rather than fetch all devices
          // .then(() => dispatch.devices.shouldSearchDevices())
          .finally(checkSignInFinished)
      )
    },
    async signIn({
      password,
      username,
    }: {
      password: string
      username: string
    }) {
      const { signInStarted, signInFinished, setUser } = dispatch.auth
      signInStarted()
      return (
        User.signIn(username, password)
          .then((user: IUser) => setUser(user))
          // Check if user should only search for devices
          // rather than fetch all devices
          .then(() => dispatch.devices.shouldSearchDevices())
          // .then(dispatch.logs.reset)
          .finally(signInFinished)
      )
    },
    async signOut() {
      const { signOutFinished } = dispatch.auth

      return User.signOut()
        .then(signOutFinished)
        .then(dispatch.devices.reset)
        .then(dispatch.logs.reset)
        .then(() => dispatch.navigation.setPage('devices'))
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
