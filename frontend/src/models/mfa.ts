import { createModel } from '@rematch/core'
import { getToken } from '../services/remote.it'
import { AUTH_API_URL, DEVELOPER_KEY } from '../shared/constants'
import { authServiceConfig } from './auth'
import { AuthService } from '@remote.it/services'
import { RootModel } from './rootModel'
import axios from 'axios'

type IMfa = {
  verificationCode: string
  showPhone: boolean
  showMFASelection: boolean
  showVerificationCode: boolean
  showSMSConfig: boolean
  lastCode: string | null
  totpVerificationCode: string
  error: string | null
  showAuthenticatorConfig: boolean
  showEnableSelection: boolean
}

const defaultState: IMfa = {
  verificationCode: '',
  showPhone: false,
  showMFASelection: false,
  showVerificationCode: false,
  showSMSConfig: false,
  lastCode: null,
  totpVerificationCode: '',
  error: null,
  showAuthenticatorConfig: false,
  showEnableSelection: false,
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async init() {
      await dispatch.licensing.fetch()
      dispatch.licensing.set({ initialized: true })
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
      dispatch.auth.set({ MfaMethod: response.data['MfaPref'] })
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
        dispatch.auth.set({ AWSUser: updatedAWSUser })
      }
      dispatch.mfa.set({ showEnableSelection: response.data['MfaPref'] === 'NO_MFA' })
    },
    async setMFAPreference(mfaMethod: 'SMS_MFA' | 'SOFTWARE_TOKEN_MFA' | 'NO_MFA') {
      const Authorization = await getToken()
      const { auth } = dispatch
      try {
        const response = await axios.post(
          `${AUTH_API_URL}/mfaPref`,
          {
            MfaPref: mfaMethod,
          },
          {
            headers: {
              developerKey: DEVELOPER_KEY,
              Authorization,
            },
          }
        )
        auth.set({ MfaMethod: response.data['MfaPref'] })
        dispatch.ui.set({ successMessage: 'Two-factor authentication enabled successfully.' })
      } catch (error) {
        if (error instanceof Error) {
          dispatch.ui.set({ errorMessage: `Two-factor authentication enabled error: ${error.message}` })
        }
      }
    },
    async getLastCode() {
      const authService = new AuthService(authServiceConfig)
      await authService.checkSignIn()
      const code = await authService?.setupTOTP()
      dispatch.mfa.set({ lastCode: code })
    },
    async verifyTopCode(code: string) {
      const { setMFAPreference } = dispatch.mfa
      try {
        const authService = new AuthService(authServiceConfig)
        await authService.verifyTotpToken(code)
      } catch {
        dispatch.ui.set({ errorMessage: 'Invalid Totp Code.' })
      }
      setMFAPreference('SOFTWARE_TOKEN_MFA')
    },
    async getMfaMethod() {
      const { auth } = dispatch
      const Authorization = await getToken()
      // Get MFA Preference
      const response = await axios.get(`${AUTH_API_URL}/mfaPref`, {
        headers: {
          developerKey: DEVELOPER_KEY,
          Authorization,
        },
      })
      console.log('getMfaMethod ', { response })
      auth.set({ MfaMethod: response.data['MfaPref'] })
    },
    async updatePhone(params: { originalPhone: string; phone: string }, state) {
      const { setMFAPreference, getAuthenticatedUserInfo } = dispatch.mfa
      try {
        // const authService = state.authService
        const authService = new AuthService(authServiceConfig)
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
      const { setMFAPreference, getAuthenticatedUserInfo } = dispatch.mfa
      try {
        state.auth.authService?.verifyCurrentUserAttributeSubmit('phone_number', verificationCode)
        setMFAPreference('SMS_MFA')
        getAuthenticatedUserInfo()
      } catch (error) {
        console.log(error)
        throw error
      }
    },
  }),
  reducers: {
    reset(state: IMfa) {
      state = defaultState
      return state
    },
    set(state: IMfa, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
