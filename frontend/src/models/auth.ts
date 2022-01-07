import analyticsHelper from '../helpers/analyticsHelper'
import cloudController from '../services/cloudController'
import Controller, { emit } from '../services/Controller'
import { graphQLRequest, graphQLGetErrors } from '../services/graphQL'
import {
  CLIENT_ID,
  CALLBACK_URL,
  DEVELOPER_KEY,
  AUTH_API_URL,
  COGNITO_USER_POOL_ID,
  COGNITO_AUTH_DOMAIN,
} from '../shared/constants'
import { getLocalStorage, isElectron, isPortal, removeLocalStorage, setLocalStorage } from '../services/Browser'
import { CognitoUser } from '@remote.it/types'
import { AuthService } from '@remote.it/services'
import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'
import { Dispatch } from '../store'
import { apiError } from '../helpers/apiHelper'
import { REDIRECT_URL } from '../shared/constants'
import { graphQLUpdateNotification } from '../services/graphQLMutation'
import { getToken, r3 } from '../services/remote.it'
import axios from 'axios'

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

const USER_KEY = 'user'

export const CHECKBOX_REMEMBER_KEY = 'remember-username'

export interface AWSUser {
  authProvider: string
  email?: string
  email_verified?: boolean
  phone_number?: string
  phone_number_verified: boolean
  given_name?: string //first_name
  family_name?: string //last_name
  gender?: string
  'custom:backup_code'?: string
}

export interface AuthState {
  initialized: boolean
  signInStarted: boolean
  authenticated: boolean
  backendAuthenticated: boolean
  signInError?: string
  authService?: AuthService
  user?: IUser
  localUsername?: string
  notificationSettings: INotificationSetting
  mfaMethod: string
  AWSUser: AWSUser
  loggedIn?: boolean
  cognitoUser?: CognitoUser
}

const state: AuthState = {
  initialized: false,
  authenticated: false,
  backendAuthenticated: false,
  signInStarted: false,
  signInError: undefined,
  user: undefined,
  authService: undefined,
  localUsername: undefined,
  notificationSettings: {},
  mfaMethod: '',
  AWSUser: {
    authProvider: '',
  } as AWSUser,
  loggedIn: false,
  cognitoUser: {} as CognitoUser,
}

const configAuthService = {
  cognitoClientID: CLIENT_ID,
  cognitoUserPoolID: COGNITO_USER_POOL_ID,
  cognitoAuthDomain: COGNITO_AUTH_DOMAIN,
  checkSamlURL: AUTH_API_URL + '/checkSaml',
  redirectURL: isPortal() || isElectron() ? '' : window.origin + '/v1/callback/',
  callbackURL: isPortal() ? window.origin : isElectron() ? REDIRECT_URL : CALLBACK_URL,
  signoutCallbackURL: isPortal() ? window.origin : isElectron() ? REDIRECT_URL : CALLBACK_URL,
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async init(_: void, rootState) {
      let { user } = rootState.auth
      console.log('AUTH INIT', { user })
      if (!user) {
        const authService = new AuthService(configAuthService)
        await sleep(500)
        await authService.checkSignIn()
        dispatch.auth.setAuthService(authService)
      }
      dispatch.auth.setInitialized()
    },
    async getLastCode() {
      const authService = new AuthService(configAuthService)
      await authService.checkSignIn()
      const code = await authService?.setupTOTP()
      dispatch.mfa.set({ lastCode: code })
    },
    async verifyTopCode(code: string) {
      const { setMFAPreference } = dispatch.mfa
      try {
        const authService = new AuthService(configAuthService)
        await authService.verifyTotpToken(code)
      } catch {
        dispatch.ui.set({ errorMessage: 'Invalid Totp Code.' })
      }
      setMFAPreference('SOFTWARE_TOKEN_MFA')
    },
    async signInSuccess() {
      const { auth } = dispatch as Dispatch
      auth.signInFinished()
    },
    async changeLanguage(language: string) {
      const { setLanguage } = dispatch.auth
      await r3.post('/user/language/', { language })
      setLanguage(language)
    },
    async changeEmail(email: string) {
      const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      if (mailFormat.test(email)) {
        r3.post('/user/email/', { email }).then(() => dispatch.auth.setEmail(email))
        dispatch.ui.set({ successMessage: `Email modified successfully.` })
      } else {
        dispatch.ui.set({ errorMessage: `Invalid format.` })
      }
    },
    async getMfaMethod() {
      const { auth } = dispatch as Dispatch
      const Authorization = await getToken()
      // Get MFA Preference
      const response = await axios.get(`${AUTH_API_URL}/mfaPref`, {
        headers: {
          developerKey: DEVELOPER_KEY,
          Authorization,
        },
      })
      console.log('getMfaMethod ', { response })
      auth.setMfaMethod(response.data['MfaPref'])
    },
    async updatePhone(params: { originalPhone: string, phone: string }, state) {
      const { getAuthenticatedUserInfo } = dispatch.auth
      const { setMFAPreference } = dispatch.mfa
      try {
        // const authService = state.authService
        const authService = new AuthService(configAuthService)
        await authService.checkSignIn()
        authService.updateCurrentUserAttributes({ phone_number: params.phone })
        await getAuthenticatedUserInfo()

        state.auth.authService?.verifyCurrentUserAttribute('phone_number')
        setMFAPreference('NO_MFA')
        dispatch.ui.set({ successMessage: 'Phone Number updated!.' })
      } catch (error) {
        dispatch.ui.set({ errorMessage: ' Update phone error: ' + error })
      }
    },
    async verifyPhone(verificationCode: string, state) {
      const { setMFAPreference } = dispatch.mfa
      try {
        state.auth.authService?.verifyCurrentUserAttributeSubmit('phone_number', verificationCode)
        setMFAPreference('SMS_MFA')
        dispatch.auth.getAuthenticatedUserInfo()
      } catch (error) {
        console.log(error)
        throw error
      }
    },
    async getAuthenticatedUserInfo(_fetch, state) {
      const userInfo = await state.auth.authService?.currentUserInfo()

      const Authorization = await getToken()
      // Get MFA Preference
      const response = await axios.get(`${AUTH_API_URL}/mfaPref`, {
        headers: {
          developerKey: DEVELOPER_KEY,
          Authorization,
        },
      })
      dispatch.auth.setMfaMethod(response.data['MfaPref'])
      if (userInfo && userInfo.attributes) {
        delete userInfo.attributes['identities']
        delete userInfo.attributes['sub']
      }
      const AWSUser = {
        ...userInfo?.attributes,
        ...{
          authProvider: userInfo?.username.includes('Google') || userInfo?.username.includes('google') ? 'Google' : '',
        },
      }
      const updatedAWSUser = { ...state.auth.AWSUser, ...AWSUser }
      if (state.auth.AWSUser !== updatedAWSUser) {
        dispatch.auth.setAWSUser(updatedAWSUser)
      }
      dispatch.mfa.set({ showEnableSelection: response.data['MfaPref'] === 'NO_MFA' })
    },
    async fetchUser(_, state) {
      const { auth } = dispatch as Dispatch
      try {
        const result = await graphQLRequest(
          ` {
              login {
                id
                email
                authhash
                yoicsId
                language
                created
                notificationSettings {
                  emailNotifications
                  desktopNotifications
                  urlNotifications
                  notificationEmail
                  notificationUrl
                }
              }
            }`
        )
        graphQLGetErrors(result)
        const data = result?.data?.data?.login
        const user = {
          id: data.id,
          email: data.email,
          authHash: data.authhash,
          yoicsId: data.yoicsId,
          created: data.created,
          apiKey: data.apiKey,
          language: data.language,
        }
        auth.setUser(user)
        setLocalStorage(state, USER_KEY, user)
        analyticsHelper.identify(data.id)
        if (data.authhash && data.yoicsId) {
          Controller.setupConnection({ username: data.yoicsId, authHash: data.authhash, guid: data.id })
          auth.setNotificationSettings(data.notificationSettings)
          auth.signedIn()
        } else console.warn('Login failed!', data)
      } catch (error) {
        await apiError(error)
      }
    },
    async updateUserMetadata(metadata: INotificationSetting) {
      const { auth } = dispatch as Dispatch
      try {
        const response = await graphQLUpdateNotification(metadata)
        auth.setNotificationSettings(metadata)
        graphQLGetErrors(response)
      } catch (error) {
        await apiError(error)
      }
    },
    async changePassword(passwordValues: IPasswordValue, state) {
      const existingPassword = passwordValues.currentPassword
      const newPassword = passwordValues.password

      try {
        await state.auth.authService?.changePassword(existingPassword, newPassword)
        sleep(300)
        window.location.reload()
        dispatch.ui.set({ successMessage: `Password Changed Successfully` })
      } catch (error) {
        dispatch.ui.set({ errorMessage: `Change password error: ${error}` })
      }
    },
    async checkSession(_: void, rootState) {
      const { ui } = dispatch
      if (!rootState.auth.authService) return
      try {
        const result = await rootState.auth.authService.checkSignIn()
        if (result.cognitoUser) {
          await dispatch.auth.handleSignInSuccess(result.cognitoUser)
        } else {
          console.error('SESSION ERROR', result.error, result)
          if (result.error?.message) ui.set({ errorMessage: result.error.message })
        }
      } catch (err) {
        console.log('check sign in error:')
        console.log(err)
      }
    },
    async handleSignInSuccess(cognitoUser: CognitoUser, state): Promise<void> {
      if (cognitoUser?.username) {
        if (cognitoUser?.attributes?.email && getLocalStorage(state, CHECKBOX_REMEMBER_KEY)) {
          setLocalStorage(state, 'username', cognitoUser?.attributes?.email)
        } else if (!getLocalStorage(state, CHECKBOX_REMEMBER_KEY)) {
          window.localStorage.removeItem('username')
        }

        if (cognitoUser?.authProvider === 'Google') {
          setLocalStorage(state, 'amplify-signin-with-hostedUI', 'true')
        }
        dispatch.auth.setAuthenticated(true)
        dispatch.auth.fetchUser()
      }
    },
    async getUsernameLocal() {
      const localUsername = localStorage.getItem('username')
      dispatch.auth.setUsername(localUsername || undefined)
    },
    async backendAuthenticated(_: void, rootState) {
      if (rootState.auth.authenticated) {
        dispatch.auth.setBackendAuthenticated(true)
      }
    },
    async disconnect(_: void, rootState) {
      console.log('DISCONNECT')
      if (!rootState.auth.authenticated && !rootState.auth.backendAuthenticated && !isPortal()) {
        await dispatch.auth.signedOut()
        dispatch.auth.setDefaultError('Sign in failed, please try again.')
      }
      dispatch.auth.setBackendAuthenticated(false)
      dispatch.ui.set({ connected: false })
    },
    async signInError(error: string) {
      dispatch.auth.setError(error)
      //send message to backend to sign out
      emit('user/lock')
    },
    async backendSignInError(error: string) {
      await dispatch.auth.signedOut()
      dispatch.auth.setError(error)
    },
    async signedIn() {
      dispatch.licensing.init()
      dispatch.ui.init()
      await cloudController.init()
      await dispatch.accounts.init()
      await dispatch.organization.init()
      await dispatch.devices.init()
      await dispatch.connections.init()
      await dispatch.devices.fetch()
      dispatch.applicationTypes.fetch()
      dispatch.announcements.fetch()
      dispatch.sessions.fetch()
    },
    async signOut(_, rootState) {
      if (rootState.auth.backendAuthenticated) emit('user/sign-out')
      else await dispatch.auth.signedOut()
    },
    /**
     * Gets called when the backend signs the user out
     */
    async signedOut(_: void, state) {
      await state.auth.authService?.signOut()
      removeLocalStorage(state, 'amplify-signin-with-hostedUI')
      removeLocalStorage(state, USER_KEY)
      dispatch.auth.signOutFinished()
      dispatch.auth.signInFinished()
      dispatch.organization.reset()
      dispatch.accounts.reset()
      dispatch.connections.reset()
      dispatch.devices.reset()
      dispatch.sessions.reset()
      dispatch.logs.reset()
      dispatch.search.reset()
      dispatch.licensing.reset()
      dispatch.billing.reset()
      dispatch.tags.reset()
      dispatch.ui.reset()
      dispatch.accounts.setActive('')
      window.location.hash = ''
      emit('user/sign-out-complete')
      dispatch.auth.setAuthenticated(false)
      analyticsHelper.clearIdentity()
      cloudController.close()
      Controller.close()
    },
    async globalSignOut() {
      const Authorization = await getToken()
      const response = await axios.get(`${AUTH_API_URL}/globalSignout`, {
        headers: {
          Authorization,
        },
      })
      console.log(`globalSignOut: `, response)
      dispatch.auth.signOut()
    },
  }),
  reducers: {
    setInitialized(state: AuthState) {
      state.initialized = true
      return state
    },
    signInStarted(state: AuthState) {
      state.signInStarted = true
      return state
    },
    signInFinished(state: AuthState) {
      state.signInStarted = false
      return state
    },
    signOutFinished(state: AuthState) {
      state.user = undefined
      return state
    },
    setAuthenticated(state: AuthState, authenticated: boolean) {
      state.authenticated = authenticated
      return state
    },
    setBackendAuthenticated(state: AuthState, backendAuthenticated: boolean) {
      state.backendAuthenticated = backendAuthenticated
      return state
    },
    setError(state: AuthState, error: string) {
      state.signInError = error
      return state
    },
    setDefaultError(state: AuthState, error: string) {
      state.signInError = state.signInError || error
      return state
    },
    setUser(state: AuthState, user: IUser) {
      state.user = user
      state.signInError = undefined
      return state
    },
    setAuthService(state: AuthState, authService: AuthService) {
      state.authService = authService
      return state
    },
    setUsername(state: AuthState, username: string | undefined) {
      state.localUsername = username
      return state
    },
    setNotificationSettings(state: AuthState, notificationSettings: INotificationSetting) {
      state.notificationSettings = notificationSettings
      return state
    },
    setLoggedIn(state: AuthState, loggedIn: boolean) {
      state.loggedIn = loggedIn
      return state
    },
    setMfaMethod(state: AuthState, value: string) {
      state.mfaMethod = value
      return state
    },
    setEmail(state: AuthState, value: string) {
      state.AWSUser.email = value
      return state
    },
    setAWSUser(state: AuthState, AWSUser: AWSUser) {
      state.AWSUser = AWSUser
      return state
    },
    setLanguage(state: AuthState, language: string) {
      if (!state.user) return state
      state.user.language = language
      return state
    },
    setCognitoUser(state: AuthState, cognitoUser: CognitoUser) {
      state.cognitoUser = cognitoUser
      return state
    },
  },
})
