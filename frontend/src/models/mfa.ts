import { createModel } from '@rematch/core'
import { RootModel } from '.'

/**
 * PHASE-2B PLACEHOLDER (permitteer docs/remoteit-desktop-login.md, D4): MFA management
 * moves from the Cognito APIs (died with the Cognito stack) to the Passport self-API,
 * consumed natively here. Until that lands, MFA state is display-only defaults and the
 * management effects are inert — enrollment/preference live at the account console.
 */
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

const PENDING = 'Two-factor management is moving to the new sign-in — available shortly.'

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async getAWSUser(_: void) {
      /* Phase 2b: read MFA standing from the Passport self-API. */
    },
    async setMFAPreference(_: IMfa['mfaMethod']) {
      dispatch.ui.set({ errorMessage: PENDING })
    },
    async updatePhone(_: string) {
      dispatch.ui.set({ errorMessage: PENDING })
    },
    async verifyPhone(_: string) {
      dispatch.ui.set({ errorMessage: PENDING })
    },
    async getTotpCode(_: void): Promise<string | undefined> {
      dispatch.ui.set({ errorMessage: PENDING })
      return undefined
    },
    async verifyTotpCode(_: string) {
      dispatch.ui.set({ errorMessage: PENDING })
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
