import { r3 } from '../services/remote.it'

import { IUser } from 'remote.it'
import { createModel } from '@rematch/core'
import { emit } from '../services/Controller'
import Controller from '../services/Controller'
import analyticsHelper from '../helpers/analyticsHelper'
import { AuthUser } from '@remote.it/types'
import { auth as cognitoAuth } from '@remote.it/components'

const USER_KEY = 'user'

export interface AuthState {
  initialized: boolean
  signInStarted: boolean
  authenticated: boolean
  signInError?: string
  user?: IUser
}

const state: AuthState = {
  initialized: false,
  authenticated: false,
  signInStarted: false,
  signInError: undefined,
  user: undefined,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async init(_: void, rootState: any) {
      let { user } = rootState.auth

      console.error('USER INIT:')
      console.error(user)

      if (!user) {
        // const storedUser = window.localStorage.getItem(USER_KEY)
        // if (storedUser) user = JSON.parse(storedUser)
        try {
          const authUser = await cognitoAuth.checkSignIn()
          if (authUser) {
            user = authUser.remoteitUser
          }
        } catch (e) {
          console.log('Not Authenticated')
        }
      }

      if (user?.email) {
        await dispatch.auth.setUser(user)
      } else {
        dispatch.auth.setInitialized()
      }
    },
    async handleDisconnect(_: void, rootState: any) {
      const { authenticated } = rootState.auth
      // re-open if disconnected unintentionally
      if (authenticated) Controller.open(true)
    },
    async checkSession(_: void, rootState: any) {
      //TODO Check we reject login after expiring

      try {
        return
      } catch (e) {
        dispatch.auth.signInError('Login Expired')
        return
      }

      // let { user } = rootState.auth

      // if (await r3.user.sessionExpired(user.username)) {
      //   try {
      //     user = await r3.user.authHashLogin(user.username, user.authHash)
      // dispatch.auth.setUser(user)
      // return
      //   } catch (error) {
      //     dispatch.auth.signInError(error.message)
      //     return
      //   }
      // }
    },
    async handleSignInSuccess(authUser: AuthUser): Promise<void> {
      console.error(authUser.cognitoUser?.username)
      if (authUser.cognitoUser?.username) {
        const user = await r3.user.userData(authUser.cognitoUser?.username)
        dispatch.auth.setUser(user)
        Controller.open()
      }
    },
    async authenticated() {
      dispatch.auth.signInFinished()
      await dispatch.auth.checkSession()
      dispatch.auth.setAuthenticated(true)
      dispatch.devices.fetch()
      dispatch.applicationTypes.fetch()
      dispatch.auth.setInitialized()
      emit('init')
    },
    async signInError(error: string) {
      dispatch.auth.setError(error)
      dispatch.auth.setInitialized()
    },
    /**
     * Gets called when the backend signs the user out
     */
    async signedOut() {
      cognitoAuth.signOut()
      //if (r3.token) await r3.post('/user/logout')
      dispatch.backend.set({ connections: [] })
      dispatch.auth.signOutFinished()
      dispatch.auth.signInFinished()
      dispatch.devices.reset()
      dispatch.logs.reset()
      dispatch.auth.setAuthenticated(false)
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
    setError(state: AuthState, error: string) {
      state.signInError = error
    },
    setUser(state: AuthState, user: IUser) {
      user.username = user.email
      state.user = user
      state.signInError = undefined
      window.localStorage.setItem(USER_KEY, JSON.stringify(user))
      analyticsHelper.identify(user.id)
      console.error('USER:')
      console.error(user)
      emit('authentication', { username: user.username, authHash: user.authHash })
    },
  },
})
