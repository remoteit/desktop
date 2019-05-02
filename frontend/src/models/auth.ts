import { IUser } from 'remote.it'
import { createModel } from '@rematch/core'
import * as user from '../services/user'

export interface AuthState {
  loginStarted: boolean
  user?: IUser
}

const state: AuthState = {
  loginStarted: false,
  user: undefined,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async checkLogin() {
      const { loginStarted, loginFinished, setUser } = dispatch.auth
      loginStarted()
      return user
        .checkLogin()
        .then(user => setUser(user))
        .finally(loginFinished)
    },
    async login({
      password,
      username,
    }: {
      password: string
      username: string
    }) {
      const { loginStarted, loginFinished, setUser } = dispatch.auth
      loginStarted()
      return user
        .login(username, password)
        .then((user: IUser) => setUser(user))
        .finally(loginFinished)
    },
  }),
  reducers: {
    loginStarted(state: AuthState) {
      state.loginStarted = true
    },
    loginFinished(state: AuthState) {
      state.loginStarted = false
    },
    setUser(state: AuthState, user: IUser) {
      state.user = user
    },
  },
})
