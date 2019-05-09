import { IUser } from 'remote.it'
import { createModel } from '@rematch/core'
import * as User from '../services/User'

export interface AuthState {
  signInStarted: boolean
  user?: IUser
}

const state: AuthState = {
  signInStarted: false,
  user: undefined,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async checkSignIn() {
      const { signInStarted, signInFinished, setUser } = dispatch.auth
      signInStarted()
      return User.checkSignIn()
        .then(user => {
          console.log('USER:', user)
          if (!user) return
          setUser(user)
        })
        .finally(signInFinished)
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
      return User.signIn(username, password)
        .then((user: IUser) => setUser(user))
        .finally(signInFinished)
    },
    async signOut() {
      const { signOutFinished } = dispatch.auth
      return User.signOut().then(signOutFinished)
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
    },
    setUser(state: AuthState, user: IUser) {
      state.user = user
    },
  },
})
