import { createModel } from '@rematch/core'
import { AUTH_API_URL, DEVELOPER_KEY } from '../constants'
import { getToken } from '../services/remoteit'
import { RootModel } from '.'
import axios from 'axios'
import i18n from '../i18n'

export type IMfa = {
  mfaMethod: 'SMS_MFA' | 'SOFTWARE_TOKEN_MFA' | 'NO_MFA'
  verificationCode: string
  backupCode?: string
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
  backupCode: undefined,
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
  state: { ...defaultState },
  effects: dispatch => ({
    async getAWSUser(_: void, state) {
      const userInfo = await state.auth.authService?.currentUserInfo()
      if (!userInfo) {
        console.error('Could not getAWSUser', userInfo)
        return
      }
      const response = await axios.get(`${AUTH_API_URL}/mfaPref`, {
        headers: {
          developerKey: DEVELOPER_KEY,
          Authorization: await getToken(),
        },
      })
      dispatch.mfa.set({ mfaMethod: response.data.MfaPref })
      if (userInfo.attributes) {
        delete userInfo.attributes['identities']
        delete userInfo.attributes['sub']
      }
      const AWSUser = {
        ...state.auth.AWSUser,
        ...userInfo.attributes,
        authProvider: userInfo.username?.toLowerCase().includes('google') ? 'Google' : '',
      }
      await dispatch.auth.set({ AWSUser })
    },

    async setMFAPreference(mfaMethod: IMfa['mfaMethod']) {
      try {
        const response = await axios.post(
          `${AUTH_API_URL}/mfaPref`,
          { MfaPref: mfaMethod },
          { headers: { developerKey: DEVELOPER_KEY, Authorization: await getToken() } }
        )
        dispatch.mfa.set({ mfaMethod: response.data.MfaPref, backupCode: response.data.backupCode })
        if (response.data.MfaPref !== 'NO_MFA') {
          dispatch.ui.set({
            successMessage: i18n.t('notices:mfa.enabled', {
              defaultValue: 'Two-factor authentication enabled successfully.',
            }),
          })
        }
        console.log('SET MFA PREFERENCE', response)
      } catch (error) {
        if (error instanceof Error) {
          dispatch.ui.set({
            errorMessage: i18n.t('notices:mfa.enableError', {
              error: error.message,
              defaultValue: 'Two-factor authentication enabled error: {{error}}',
            }),
          })
        }
      }
    },

    async updatePhone(phone: string, state) {
      try {
        await state.auth.authService?.updateCurrentUserAttributes({ phone_number: phone.replace(/\s+/g, '') })
        await dispatch.mfa.getAWSUser()
        await state.auth.authService?.verifyCurrentUserAttribute('phone_number')
        await dispatch.mfa.setMFAPreference('NO_MFA')
        dispatch.ui.set({
          successMessage: i18n.t('notices:mfa.verificationSent', { defaultValue: 'Verification sent.' }),
        })
        return true
      } catch (error) {
        console.error(error)
        if (error instanceof Error) {
          dispatch.ui.set({
            errorMessage: i18n.t('notices:mfa.updatePhoneError', {
              error: error.message,
              defaultValue: 'Update phone error: {{error}}',
            }),
          })
        }
      }
    },

    async verifyPhone(verificationCode: string, state) {
      try {
        await state.auth.authService?.verifyCurrentUserAttributeSubmit('phone_number', verificationCode)
        await dispatch.mfa.setMFAPreference('SMS_MFA')
        await dispatch.mfa.getAWSUser()
      } catch (error) {
        console.error(error)
        if (error instanceof Error) {
          dispatch.ui.set({
            errorMessage: i18n.t('notices:mfa.phoneVerificationError', {
              error: error.message,
              defaultValue: 'Phone verification error: {{error}}',
            }),
          })
        }
      }
    },

    async getTotpCode(_: void, state) {
      return state.auth.authService?.setupTOTP()
    },

    async verifyTotpCode(code: string, state) {
      try {
        await state.auth.authService?.verifyTotpToken(code)
      } catch (error) {
        console.error(error)
        if (error instanceof Error) {
          dispatch.ui.set({
            errorMessage: i18n.t('notices:mfa.invalidTotp', {
              error: error.message,
              defaultValue: 'Invalid TOTP Code. ({{error}})',
            }),
          })
        }
        return
      }
      await dispatch.mfa.setMFAPreference('SOFTWARE_TOKEN_MFA')
    },
  }),
  reducers: {
    reset(state: IMfa) {
      state = { ...defaultState }
      return state
    },
    set(state: IMfa, params: Partial<IMfa>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
