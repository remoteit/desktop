import cloudSync from '../services/CloudSync'
import cloudController from '../services/cloudController'
import Controller, { emit } from '../services/Controller'
import network from '../services/Network'
import browser from '../services/browser'
import analytics from '../services/analytics'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { API_URL, DEVELOPER_KEY, SIGN_OUT_BACKEND_TIMEOUT } from '../constants'
import { persistor } from '../store'
import { graphQLLogin } from '../services/graphQLRequest'
import { getToken } from '../services/remoteit'
import { oidcConfigured, oidcSignedIn, oidcClaims, oidcStart, oidcClearLocal, oidcCompleteFromUrl, invalidateOidcToken, OidcClaims } from '../services/oidc'
import { createModel } from '@rematch/core'
import { RootModel } from '.'
import zendesk from '../services/zendesk'
import axios from 'axios'
import i18n from '../i18n'

export interface AWSUser {
  authProvider: string
  email?: string
  email_verified?: boolean
  phone_number?: string
  phone_number_verified?: boolean
  given_name?: string //first_name
  family_name?: string //last_name
  gender?: string
  'custom:backup_code'?: string
}

export interface AuthState {
  initialized: boolean
  authenticated: boolean
  backendAuthenticated: boolean
  signInError?: string
  signingIn?: boolean
  passwordChallenge?: { challenge: string; hint?: string }
  user?: IUser
  mfaMethod: string
  AWSUser: AWSUser
}

const defaultState: AuthState = {
  initialized: false,
  authenticated: false,
  backendAuthenticated: false,
  signInError: undefined,
  signingIn: false,
  user: undefined,
  mfaMethod: '',
  AWSUser: { authProvider: '' },
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    // The BACKEND owns the OIDC session (permitteer docs/remoteit-desktop-login.md):
    // init just asks it whether one exists. silent suppresses the session-error toast
    // for machine-triggered runs (a network reconnect). See Controller.onNetworkConnect.
    async init(options: { silent?: boolean } = {}, state) {
      const { user } = state.auth
      console.log('AUTH INIT START', { user })
      if (!user) {
        try {
          // A boot with ?code&state in the URL IS the sign-in completing (web return, or
          // the desktop deep-link reload); otherwise restore a stored session.
          const claims = await oidcCompleteFromUrl()
          if (claims) await dispatch.auth.handleSignInSuccess(claims)
          else if (oidcSignedIn()) {
            // Stored tokens are a CLAIM of a session, not proof of one: the AS may have
            // revoked it (sign-out elsewhere, admin action, family revocation). Force one
            // token mint — a dead refresh family clears itself and we boot signed OUT
            // instead of rendering an authenticated shell over a corpse.
            const alive = await getToken()
            if (alive) await dispatch.auth.handleSignInSuccess(oidcClaims() ?? {})
            else invalidateOidcToken()
          } else if (!oidcConfigured()) console.error('VITE_OAUTH_ISSUER is not configured')
        } catch (error: any) {
          console.error('AUTH INIT: sign-in completion failed', error)
          if (!options.silent) dispatch.auth.set({ signInError: error?.message || 'Sign in failed, please try again.' })
        }
      }
      dispatch.auth.set({ initialized: true })
      console.log('AUTH INIT END')
    },
    // Leave for the AS (the whole login UX — email-first, org SSO, MFA, signup, forgot —
    // lives there). On web the page departs; on desktop the window shows the waiting
    // panel until the deep link reloads it with the code.
    /** Account switch: re-run authorize with select_account — the AS chooser shows the
     * real session chips; nothing is torn down locally, so a canceled chooser costs
     * nothing. Completion replaces the session like any sign-in (old family revoked). */
    async switchAccount(_: void) {
      try {
        await oidcStart({ prompt: 'select_account' })
      } catch (error) {
        dispatch.auth.set({ signInError: error?.message || 'Could not open the account chooser.' })
      }
    },
    async signIn(_: void) {
      dispatch.auth.set({ signingIn: true, signInError: undefined })
      try {
        await oidcStart()
      } catch (error: any) {
        console.error('SIGN IN FAILED', error)
        dispatch.auth.set({ signingIn: false, signInError: error?.message || 'Sign in failed, please try again.' })
      }
    },
    async fetchUser(_: void) {
      const { auth } = dispatch
      const response = await graphQLLogin()
      if (response === 'ERROR') return

      const user = response?.data?.data?.login

      auth.set({ user, signInError: undefined })
      if (user.authhash && user.yoicsId) {
        Controller.setupConnection({ username: user.yoicsId, authHash: user.authhash, guid: user.id })
        auth.signedIn()
      } else {
        console.warn('Login failed!', response)
        dispatch.ui.set({ errorMessage: i18n.t('notices:auth.loginFailed', { defaultValue: 'Login failed.' }) })
      }
    },
    // Native password change over the Passport self-API (Phase 2b): the current password
    // is the proof of possession; accounts whose store challenges (pool MFA) get a code
    // continuation the ChangePassword form renders.
    async changePassword(passwordValues: IPasswordValue): Promise<boolean> {
      const { selfChangePassword } = await import('../services/passportSelf')
      const r = await selfChangePassword(passwordValues.currentPassword ?? '', passwordValues.password ?? '')
      if (r.status === 'ok') {
        dispatch.auth.set({ passwordChallenge: undefined })
        dispatch.ui.set({ successMessage: i18n.t('notices:auth.passwordChanged', { defaultValue: 'Password changed successfully.' }) })
        return true
      }
      if (r.status === 'mfa' && r.challenge) {
        dispatch.auth.set({ passwordChallenge: { challenge: r.challenge, hint: r.hint } })
        return false
      }
      dispatch.ui.set({
        errorMessage:
          r.error === 'invalid_password' ? 'Current password is incorrect.'
          : r.error === 'weak_password' ? r.error_description || 'New password does not meet the requirements.'
          : r.error_description || 'An unexpected error occurred. Please try again.',
      })
      return false
    },
    /** Answer the store's second-factor challenge raised by changePassword. */
    async completePasswordChallenge(code: string, state): Promise<boolean> {
      const pending = state.auth.passwordChallenge
      if (!pending) return false
      const { selfChallenge } = await import('../services/passportSelf')
      const r = await selfChallenge(pending.challenge, { code })
      if (r.status === 'ok') {
        dispatch.auth.set({ passwordChallenge: undefined })
        dispatch.ui.set({ successMessage: i18n.t('notices:auth.passwordChanged', { defaultValue: 'Password changed successfully.' }) })
        return true
      }
      // invalid_code re-arms the SAME step under a fresh handle — a typo never restarts.
      dispatch.auth.set({ passwordChallenge: r.challenge ? { challenge: r.challenge, hint: pending.hint } : undefined })
      dispatch.ui.set({ errorMessage: r.challenge ? 'That code didn’t match — try again.' : 'The request expired — start over.' })
      return false
    },
    /* TODO validate and hook changeEmail up */
    async changeEmail(email: string) {
      const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      if (mailFormat.test(email)) {
        await axios.post(
          '/user/email/',
          { email },
          {
            baseURL: API_URL,
            headers: {
              'Content-Type': 'application/json',
              developerKey: DEVELOPER_KEY,
              Authorization: await getToken(),
            },
          }
        )
        dispatch.auth.setAWSUserEmail(email)
        dispatch.ui.set({
          successMessage: i18n.t('notices:auth.emailModified', { defaultValue: 'Email modified successfully.' }),
        })
      } else {
        dispatch.ui.set({ errorMessage: i18n.t('notices:auth.invalidFormat', { defaultValue: 'Invalid format.' }) })
      }
    },
    async forceRefreshToken(_: void) {
      invalidateOidcToken()
      await getToken()
    },
    // The 401 recovery path (services/post.ts): drop the renderer cache and let the
    // backend refresh on the next token fetch. If the backend says the session is gone
    // (refresh family revoked / AS session expired), sign the app out.
    async checkSession(options: { refreshToken: boolean; silent?: boolean }, state) {
      invalidateOidcToken()
      if (!oidcSignedIn() && state.auth.authenticated) {
        console.error('SESSION ERROR: session gone (refresh family dead or signed out)')
        if (!options.silent) dispatch.ui.set({ errorMessage: 'Session expired.' })
        await dispatch.auth.signedOut()
      }
    },
    async handleSignInSuccess(claims: OidcClaims): Promise<void> {
      await dispatch.auth.set({
        authenticated: true,
        AWSUser: {
          authProvider: Array.isArray(claims.amr) ? claims.amr.join(' ') : String(claims.idp ?? ''),
          email: claims.email,
          email_verified: claims.email_verified,
        },
      })
      await dispatch.auth.fetchUser()
      console.log('AUTHENTICATED SUCCESS')
    },
    async backendAuthenticated(_: void, state) {
      if (state.auth.authenticated) {
        dispatch.auth.set({ backendAuthenticated: true })
        console.log('BACKEND AUTHENTICATED')
        if (!state.backend.initialized) {
          emit('init')
          console.log('INIT BACKEND')
        }
      }
    },
    async disconnect(_: void, state) {
      if (!state.auth.authenticated && !state.auth.backendAuthenticated && browser.hasBackend) {
        await dispatch.auth.signedOut()
        if (!state.auth.signInError) dispatch.auth.set({ signInError: 'Sign in failed, please try again.' })
      }
      dispatch.ui.set({ connected: false })
      dispatch.auth.set({ backendAuthenticated: false })
    },
    async signInError(signInError: string) {
      dispatch.auth.set({ signInError })
      //send message to backend to sign out
      emit('user/lock')
    },
    async backendSignInError(signInError: string) {
      console.error(signInError)
      await dispatch.auth.set({ signInError })
      await dispatch.auth.signedOut()
    },
    async appReady(_: void, state) {
      // Temp migration of state
      await dispatch.connections.migrate()

      if (state.backend.initialized) {
        console.warn('BACKEND ALREADY INITIALIZED')
        return
      }

      if (selectDeviceModelAttributes(state).initialized) {
        console.warn('STATE ALREADY INITIALIZED')
        return
      } else {
        console.log('INITIALIZE STATE')
      }

      dispatch.backend.init()
      dispatch.applicationTypes.fetchAll()
      dispatch.contacts.fetch()
      await dispatch.accounts.fetch()
      await dispatch.networks.init()
      await cloudSync.all()
    },
    async signedIn(_: void, state) {
      dispatch.ui.init()
      zendesk.initChat(state.auth.user)
      analytics.signedIn(state.auth.user)
      cloudController.init()
      cloudSync.init()
      network.tick()
      if (!browser.hasBackend) dispatch.auth.appReady()
    },
    async signOut(_: void, state) {
      // EXPLICIT sign-out ends the AS session too — SILENTLY (fetch, before teardown
      // clears the id_token): no end_session redirect parade, no navigation race with
      // the sign-in auto-start. The next authorize carries prompt=login so the user
      // lands on the LOGIN PAGE, never a silent SSO into another chip's live session.
      // Failure-driven teardown (signedOut via the error paths) stays local-only.
      const { oidcEndSessionSilently, oidcRequireLoginPrompt } = await import('../services/oidc')
      await oidcEndSessionSilently()
      oidcRequireLoginPrompt()
      // emit returns false when the local socket isn't connected, and
      // backendAuthenticated can still be true at that moment - the flag is only
      // cleared once the socket's disconnect event lands. Without checking the
      // return value, sign out in that window did nothing at all: no purge, no
      // teardown, no redirect, and the user stayed signed in with no feedback.
      if (state.auth.backendAuthenticated) {
        if (emit('user/sign-out')) return
        // Don't tear down behind the backend's back if it's only momentarily
        // unreachable. It owns cli.signOut() and the connection pool, and a
        // frontend-only sign out leaves the CLI admin registered - which makes
        // the helper reject a different account until someone runs a manual
        // 'remoteit signout'. Force the socket back rather than wait out
        // socket.io's 20s retry, then send it for real.
        if ((await Controller.reconnectNow(SIGN_OUT_BACKEND_TIMEOUT)) && emit('user/sign-out')) return
        console.warn('SIGN OUT: local backend unreachable, signing the app out only')
      }
      await dispatch.auth.signedOut()
    },
    /**
     * Gets called when the backend signs the user out
     */
    async signedOut(_: void) {
      await persistor.purge()
      // LOCAL-ONLY: drop this app's tokens. The AS session is never ended from here —
      // signing out of the app must not sign the user out of login.* (their browser
      // session is theirs; an explicit "sign out everywhere" action can come later).
      oidcClearLocal()
      await dispatch.auth.set({ user: undefined })
      dispatch.user.reset()
      dispatch.organization.reset()
      dispatch.networks.reset()
      dispatch.accounts.reset()
      dispatch.connections.reset()
      dispatch.devices.reset()
      dispatch.sessions.reset()
      dispatch.logs.reset()
      dispatch.search.reset()
      dispatch.announcements.reset()
      dispatch.applicationTypes.reset()
      dispatch.plans.reset()
      dispatch.contacts.reset()
      dispatch.billing.reset()
      dispatch.backend.reset()
      dispatch.files.reset()
      dispatch.jobs.reset()
      dispatch.tags.reset()
      dispatch.mfa.reset()
      dispatch.ui.reset()
      dispatch.products.reset()
      dispatch.partnerStats.reset()
      dispatch.adminUsers.reset()
      dispatch.adminPartners.reset()
      dispatch.adminEnterpriseLicenses.reset()
      dispatch.adminNotices.reset()
      // ui.reset() only restores redux defaults; the live i18next/luxon locale must be
      // re-resolved so signed-out screens follow the OS rather than the previous
      // account's language override.
      dispatch.ui.setLanguage('system')

      cloudSync.reset()
      dispatch.accounts.set({ activeId: undefined })
      dispatch.auth.set({ authenticated: false })
      window.location.hash = ''
      zendesk.endChat()
      emit('user/sign-out-complete')
      cloudController.reset()
      Controller.close()
    },
    async globalSignOut() {
      // Pilot: signs this session out at the AS (RP-initiated logout). Every-device
      // sign-out maps to the AS's /logout/all and rides Phase 2b with the rest of the
      // security surface.
      dispatch.auth.signOut()
    },
  }),
  reducers: {
    setAWSUserEmail(state: AuthState, value: string) {
      state.AWSUser.email = value
      return state
    },
    set(state: AuthState, params: Partial<AuthState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
