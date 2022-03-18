import { createModel } from '@rematch/core'
import { getToken } from '../services/remote.it'
import { RootModel } from './rootModel'
import axios from 'axios'

export type IMfa = {
  mfaMethod: 'SMS_MFA' | 'SOFTWARE_TOKEN_MFA' | 'NO_MFA'
  verificationCode: string
  showPhone: boolean
  showMFASelection: boolean
  showVerificationCode: boolean
  showSMSConfig: boolean
  lastCode: string | null
  totpVerificationCode: string
  showAuthenticatorConfig: boolean
  showEnableSelection: boolean
  error: string | null
}

const defaultState: IMfa = {
  mfaMethod: 'NO_MFA',
  verificationCode: '',
  showPhone: false,
  showMFASelection: false,
  showVerificationCode: false,
  showSMSConfig: false,
  lastCode: null,
  totpVerificationCode: '',
  showAuthenticatorConfig: false,
  showEnableSelection: false,
  error: null,
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async init() {
      await dispatch.licensing.fetch()
      dispatch.licensing.set({ initialized: true })
    },
    // updated
    async getAuthenticatedUserInfo(_, state) {
      const userInfo = await state.auth.authService?.currentUserInfo()
      if (!userInfo) {
        console.warn('No user info in authService')
        return
      }

      const Authorization = await getToken()
      // Get MFA Preference
      const response = await axios.get(`${process.env.AUTH_API_URL}/mfaPref`, {
        headers: { developerKey: process.env.DEVELOPER_KEY, Authorization },
      })
      dispatch.mfa.set({ mfaMethod: response.data['MfaPref'] })
      if (userInfo && userInfo.attributes) {
        delete userInfo.attributes['identities']
        delete userInfo.attributes['sub']
      }
      const AWSUser = {
        ...userInfo.attributes,
        authProvider: userInfo.username.includes('Google') || userInfo.username.includes('google') ? 'Google' : '',
      }
      const updatedAWSUser = { ...state.auth.AWSUser, ...AWSUser }

      if (state.auth.AWSUser !== updatedAWSUser) {
        console.log('setAwsUser')
        dispatch.auth.set({ AWSUser: updatedAWSUser })
      }
      return updatedAWSUser
    },
    // updated
    async setMFAPreference(mfaMethod: IMfa['mfaMethod']) {
      const Authorization = await getToken()
      try {
        const response = await axios.post(
          `${process.env.AUTH_API_URL}/mfaPref`,
          { MfaPref: mfaMethod },
          { headers: { developerKey: process.env.DEVELOPER_KEY, Authorization } }
        )
        dispatch.mfa.set({ mfaMethod: response.data['MfaPref'] })
        dispatch.ui.set({ successMessage: 'Two-factor authentication enabled successfully.' })
        console.log('SET MFA PREFERENCE', response)
        return response.data['backupCode']
      } catch (error) {
        if (error instanceof Error) {
          dispatch.ui.set({ errorMessage: `Two-factor authentication enabled error: ${error.message}` })
        }
      }
    },
    // updated
    async updatePhone(phone: string, state) {
      try {
        await state.auth.authService?.updateCurrentUserAttributes({ phone_number: phone })
        await dispatch.mfa.getAuthenticatedUserInfo()

        await state.auth.authService?.verifyCurrentUserAttribute('phone_number')
        dispatch.mfa.setMFAPreference('NO_MFA')
        dispatch.ui.set({ successMessage: 'Phone Number updated!.' })
        return true
      } catch (error) {
        console.error(error)
        dispatch.ui.set({ errorMessage: ' Update phone error: ' + error })
      }
    },
    // updated
    async verifyPhone(verificationCode: string, state) {
      try {
        await state.auth.authService?.verifyCurrentUserAttributeSubmit('phone_number', verificationCode)
        // @ts-ignore -- FIXME maybe save the backup code instead of returning it
        const backupCode = await dispatch.mfa.setMFAPreference('SMS_MFA')
        dispatch.mfa.getAuthenticatedUserInfo()
        return backupCode
      } catch (error) {
        console.log(error)
        throw error
      }
    },
    // updated
    async getTotpCode(_, state) {
      return state.auth.authService?.setupTOTP()
    },
    // updated
    async verifyTotpCode(code: string, state) {
      // const awsUser = await window.authService.currentAuthenticatedUser()
      try {
        await state.auth.authService?.verifyTotpToken(code)
      } catch (error) {
        if (error instanceof Error) console.error(error.message)
        return false
      }
      const backupCode = await dispatch.mfa.setMFAPreference('SOFTWARE_TOKEN_MFA')
      console.log('VERIFY TOTP backupCode', backupCode)
      return backupCode
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
