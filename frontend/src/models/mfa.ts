import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'


type IMfa = {
  verificationCode: string
  showPhone: boolean
  showMFASelection: boolean
  showVerificationCode: boolean
  showSMSConfig: boolean
  totpCode: string | null
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
  totpCode: null,
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

