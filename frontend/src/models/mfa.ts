import { createModel } from '@rematch/core'
import { getToken } from '../services/remote.it'
import { AUTH_API_URL, DEVELOPER_KEY } from '../shared/constants'
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
  showEnableSelection: false
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: (dispatch: any) => ({
    async init() {
      await dispatch.licensing.fetch()
      dispatch.licensing.set({ initialized: true })
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
        auth.setMfaMethod(response.data['MfaPref'])
        dispatch.ui.set({ successMessage: 'Set preferences success!.' })
      } catch (error) {
        dispatch.ui.set({ errorMessage: `Error when trying set preferences: ${error.message}` })
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

