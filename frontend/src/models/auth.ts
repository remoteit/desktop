import cloudSync from '../services/CloudSync'
import cloudController from '../services/cloudController'
import Controller, { emit } from '../services/Controller'
import network from '../services/Network'
import browser from '../services/browser'
import analytics from '../services/analytics'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { API_URL, DEVELOPER_KEY, SIGN_OUT_BACKEND_TIMEOUT, SIGN_OUT_EVERYWHERE_TIMEOUT } from '../constants'
import { persistor, store } from '../store'
import { graphQLLogin } from '../services/graphQLRequest'
import { getToken, apiAuthHeaders } from '../services/remoteit'
import {
  oidcConfigured,
  oidcSignedIn,
  oidcClaims,
  oidcStart,
  oidcClearLocal,
  oidcCompleteFromUrl,
  oidcActivateAccount,
  oidcTakeActivationHint,
  invalidateOidcToken,
  oidcGrantStale,
  oidcMcpDetailReady,
  oidcDeclaration,
  oidcActor,
  oidcTakeSupportTicket,
  oidcIsSupportTab,
  oidcSelectKnownAccount,
  oidcClearAutoStarts,
  OidcClaims,
  OidcError,
  OidcErrorCode,
} from '../services/oidc'
import { createModel } from '@rematch/core'
import { RootModel } from '.'
import zendesk from '../services/zendesk'
import axios from 'axios'
import i18n from '../i18n'
import sleep from '../helpers/sleep'

// One re-authorize attempt per browser session, keyed by the declaration it was made from
// (healGrant below). sessionStorage rather than local: the bound is meant to survive reloads of
// this tab and nothing more, so a new tab is always a clean slate.

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
  /** A sign-in attempt failed. Deliberately SEPARATE from the message: this is what stops
   *  the web app starting another authorize by itself, and a brake that reads a display
   *  string is a brake that vanishes the moment the string is empty or suppressed. */
  signInFailed?: boolean
  /** Technical detail — console, support, bug reports. NEVER rendered on its own: it is
   *  the server's own wording, so it is untranslated and often meaningless to a person. */
  signInError?: string
  /** What the failure MEANS, which is what the screen actually translates and acts on. */
  signInErrorCode?: OidcErrorCode
  /** Seconds the server asked us to wait, when it said so (429). */
  signInRetryAfter?: number
  signingIn?: boolean
  passwordChallenge?: { challenge: string; hint?: string }
  user?: IUser
  AWSUser: AWSUser
}

const defaultState: AuthState = {
  initialized: false,
  authenticated: false,
  backendAuthenticated: false,
  signInFailed: false,
  signInError: undefined,
  signInErrorCode: undefined,
  signInRetryAfter: undefined,
  signingIn: false,
  user: undefined,
  AWSUser: { authProvider: '' },
}

/* Every sign-in failure lands here, so the screen has exactly one shape to read and a
   new throw site cannot reintroduce a raw server string on the UI. */
const signInFailure = (error: any): Partial<AuthState> => ({
  signingIn: false,
  signInFailed: true,
  // Never empty: an absent message used to leave the auto-start guard looking like success.
  signInError: error?.message || 'Sign in failed',
  signInErrorCode: error instanceof OidcError ? error.code : undefined,
  signInRetryAfter: error instanceof OidcError ? error.retryAfter : undefined,
})

const signInCleared = {
  signInFailed: false,
  signInError: undefined,
  signInErrorCode: undefined,
  signInRetryAfter: undefined,
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    /* The BACKEND owns the OIDC session (permitteer docs/remoteit-desktop-login.md):
       init just asks it whether one exists.

       This used to take a `silent` flag that skipped RECORDING a failed sign-in, meaning
       to spare an unattended window a toast. But signInError is not a toast — it is the
       only thing telling SignInApp not to start another authorize. Suppressed, a rejected
       authorize returned, left no trace, and was retried immediately: an invisible
       redirect loop (skipConsent shows no consent screen) running as fast as the page
       could reload, until the AS rate-limited the address for everyone behind it. A
       failure is always recorded now; being unattended is not a reason to forget it. */
    async init(_: void, state) {
      const { user } = state.auth
      console.log('AUTH INIT START', { user })
      if (!user) {
        try {
          // A boot with ?code&state in the URL IS the sign-in completing (web return, or
          // the desktop deep-link reload); otherwise restore a stored session.
          // A support LAUNCH (permitteer docs/desktop-support.md): this tab arrived with a one-time
          // ticket, and the authorize it starts binds the sign-in to the operator's support session.
          const ticket = oidcTakeSupportTicket()
          if (ticket) {
            await oidcStart({ supportTicket: ticket })
            return
          }
          const claims = await oidcCompleteFromUrl()
          if (claims) await dispatch.auth.handleSignInSuccess(claims)
          else if (oidcSignedIn()) {
            // Stored tokens are a CLAIM of a session, not proof of one: the AS may have
            // revoked it (sign-out elsewhere, admin action, family revocation). Force one
            // token mint — a dead refresh family clears itself and we boot signed OUT
            // instead of rendering an authenticated shell over a corpse.
            const alive = await getToken()
            if (alive) {
              await dispatch.auth.handleSignInSuccess(oidcClaims() ?? {})
              // Never re-authorize a SUPPORT session: a plain authorize in this tab would sign
              // the operator in as THEMSELVES and quietly turn the support view into their own.
              if (!oidcActor()) await dispatch.auth.healGrant()
            } else {
              invalidateOidcToken()
              // A JUST-ACTIVATED saved account whose refresh family died: one silent
              // recovery through the AS — prompt=none + login_hint serves any live
              // session-set member the hint names (permitteer silent selection), so the
              // person lands back signed in with zero screens. The marker is one-shot;
              // a refused silent round falls to the ordinary sign-in screen.
              const hint = oidcTakeActivationHint()
              if (hint) await oidcStart({ prompt: 'none', loginHint: hint, auto: `activate:${hint}` })
            }
          } else if (!oidcConfigured()) console.error('VITE_OAUTH_ISSUER is not configured')
        } catch (error: any) {
          console.error('AUTH INIT: sign-in completion failed', error)
          // A REFUSED silent selection (a known account signed out elsewhere meanwhile) must not
          // strand a signed-in person on the sign-in screen: the stored session is intact — restore
          // it, say why, and let the menu re-learn the browser's accounts. Otherwise fall through
          // to this branch's richer error mapping (signInFailure).
          if (String(error?.message || '').includes('login_required') && oidcSignedIn() && (await getToken())) {
            await dispatch.auth.handleSignInSuccess(oidcClaims() ?? {})
            dispatch.ui.set({ errorMessage: 'That account is no longer signed in on this browser.' })
          } else dispatch.auth.set(signInFailure(error))
        }
      }
      dispatch.auth.set({ initialized: true })
      console.log('AUTH INIT END')
    },
    /** A build that declares MORE than the standing grant carries (a slice added in a deploy,
     *  against an install that has not signed in since) heals itself: only a fresh authorize
     *  merges the new slice in, and for this first-party skipConsent client that shows no
     *  consent screen — a redirect chain back to the app. Without it the person hits an
     *  unexplained 403 in whichever feature needed the slice, and the only cure they could
     *  find is signing out and in again.
     *
     *  ONE attempt per app session. If the re-authorize comes back still short — a client
     *  whose declaration outruns what the AS will grant it — a second try would return here
     *  and loop the person through the browser forever. Same loop-breaker the console's
     *  renew marker uses. */
    async healGrant(options?: { force?: boolean }) {
      try {
        // The freshness check compares against the MCP detail type; on the first load after a
        // rename the cached name is the OLD one until the boot metadata refresh lands. Wait for it
        // (bounded, resolved instantly thereafter) so this cannot call a renamed-away grant current.
        await oidcMcpDetailReady()
        if (!oidcGrantStale()) return
        console.log('AUTH: grant predates this build’s declaration — re-authorizing')
        // FORCE is a deliberate human action (the chat's "Refresh permissions" button): a person is
        // their own loop-breaker, so it skips the ledger that stops an AUTOMATIC retry cycling the
        // tab through the AS. The automatic reason names the account AND the declaration, so a
        // deploy that changes what this build asks for gets a fresh attempt, and one account's
        // spent attempt never blocks another's in the same tab. A refusal the agent reports later
        // clears the stamp (oidcMarkGrantStale) — that, not this, is what makes a retry due.
        await oidcStart(options?.force ? {} : { auto: `heal:${oidcClaims()?.sub}:${oidcDeclaration()}` })
      } catch (error) {
        console.warn('AUTH: grant heal check failed (leaving the session as it is)', error)
      }
    },
    // Leave for the AS (the whole login UX — email-first, org SSO, MFA, signup, forgot —
    // lives there). On web the page departs; on desktop the window shows the waiting
    // panel until the deep link reloads it with the code.
    /** Account switch: re-run authorize with select_account — the AS chooser shows the
     * real session chips; nothing is torn down locally, so a canceled chooser costs
     * nothing. Completion replaces the session like any sign-in (a SAME-account re-auth
     * revokes the old family; a DIFFERENT account files the old one in the registry —
     * services/oidc.ts). */
    async switchAccount(_: void) {
      try {
        await oidcStart({ prompt: 'select_account' })
      } catch (error) {
        dispatch.auth.set(signInFailure(error))
      }
    },
    /** Activate a SAVED account from the avatar menu (the oidc registry): a storage swap
     * plus a full reload, so every model boots as the new identity — a soft swap would
     * bleed one account's devices and orgs into the other's view. A stale saved session
     * surfaces on boot exactly like any expired sign-in (refresh fails → sign-in screen),
     * which is the honest fallback. An unknown sub falls to the add-account chooser, so a
     * menu row that somehow outlived its registry entry still lands somewhere sensible. */
    async activateAccount(sub: string) {
      if (oidcClaims()?.sub === sub) return // already active — nothing to do
      if (oidcActivateAccount(sub)) return window.location.assign('/')
      // A KNOWN account (signed in on this browser, not in this app yet): silent selection —
      // the AS serves the live set member the hint names, no chooser (docs/browser-accounts.md).
      if (await oidcSelectKnownAccount(sub)) return
      await dispatch.auth.switchAccount()
    },
    /** `auto` names a sign-in nobody clicked for (the web sign-in screen's own start) so the
     *  ledger in oidcStart can bound it; a refused one leaves the screen as it was. */
    async signIn(options?: { auto?: string }) {
      dispatch.auth.set({ signingIn: true, ...signInCleared })
      try {
        // Sign-in ALWAYS offers the CHOOSER (prompt=select_account), web and desktop alike.
        // A "Sign in" button should let the person pick; and with a live AS cookie a
        // PROMPTLESS authorize would silently SSO the last user straight back in — which is
        // exactly the "sign-out doesn't stick" bug. select_account also means that signing
        // out and reloading always lands on the picker, never a silent re-login.
        if (!(await oidcStart({ prompt: 'select_account', auto: options?.auto })))
          dispatch.auth.set({ signingIn: false })
      } catch (error: any) {
        console.error('SIGN IN FAILED', error)
        dispatch.auth.set(signInFailure(error))
      }
    },
    async fetchUser(_: void) {
      const { auth } = dispatch
      const response = await graphQLLogin()
      if (response === 'ERROR') return

      const user = response?.data?.data?.login

      auth.set({ user, ...signInCleared })
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
        dispatch.ui.set({
          successMessage: i18n.t('notices:auth.passwordChanged', { defaultValue: 'Password changed successfully.' }),
        })
        return true
      }
      if (r.status === 'mfa' && r.challenge) {
        dispatch.auth.set({ passwordChallenge: { challenge: r.challenge, hint: r.hint } })
        return false
      }
      dispatch.ui.set({
        errorMessage:
          r.error === 'invalid_password'
            ? 'Current password is incorrect.'
            : r.error === 'weak_password'
            ? r.error_description || 'New password does not meet the requirements.'
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
        dispatch.ui.set({
          successMessage: i18n.t('notices:auth.passwordChanged', { defaultValue: 'Password changed successfully.' }),
        })
        return true
      }
      // invalid_code re-arms the SAME step under a fresh handle — a typo never restarts.
      dispatch.auth.set({ passwordChallenge: r.challenge ? { challenge: r.challenge, hint: pending.hint } : undefined })
      dispatch.ui.set({
        errorMessage: r.challenge ? 'That code didn’t match — try again.' : 'The request expired — start over.',
      })
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
              ...(await apiAuthHeaders('POST', `${API_URL}/user/email/`)),
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
    async checkSession(options: { silent?: boolean; status?: number }, state) {
      invalidateOidcToken()
      // A SUPPORT session cannot be recovered: no refresh token, and a 401 means the session was
      // ended — by the user, by the operator's relaunch, or by its own expiry. The end is the end
      // (docs/desktop-support.md). A 403 is an ordinary refused write and changes nothing.
      if (oidcActor() && options.status === 401) {
        oidcClearLocal()
        dispatch.ui.set({ errorMessage: 'Support session ended.' })
        await dispatch.auth.signedOut()
        return
      }
      if (!oidcSignedIn() && state.auth.authenticated) {
        console.error('SESSION ERROR: session gone (refresh family dead or signed out)')
        if (!options.silent)
          dispatch.ui.set({ errorMessage: oidcIsSupportTab() ? 'Support session ended.' : 'Session expired.' })
        await dispatch.auth.signedOut()
      }
    },
    async handleSignInSuccess(claims: OidcClaims): Promise<void> {
      // A session — freshly exchanged OR restored from stored tokens — is proof the
      // automatic path works, so it clears the auto-start budget. Doing it only at the
      // code exchange left a tab that had spent its budget unable to auto sign-in again
      // after a perfectly healthy restore.
      oidcClearAutoStarts()
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
        // Read the LIVE store, not the invocation-time snapshot: backendSignInError records its
        // failure after its own teardown and this handler fires right behind it when the
        // rejected socket drops, so the snapshot predates that message. Carry an existing
        // failure through this teardown (signedOut()'s signInCleared would wipe it) and only
        // otherwise fall back to the generic one — either way through the signInFailure shape,
        // so signInFailed is set and SignInApp actually renders the message.
        const live = store.getState().auth
        const failure: Partial<AuthState> = live.signInFailed
          ? {
              signInFailed: true,
              signInError: live.signInError,
              signInErrorCode: live.signInErrorCode,
              signInRetryAfter: live.signInRetryAfter,
            }
          : signInFailure(new Error('Sign in failed, please try again.'))
        await dispatch.auth.signedOut()
        dispatch.auth.set(failure)
      }
      dispatch.ui.set({ connected: false })
      dispatch.auth.set({ backendAuthenticated: false })
    },
    async signInError(signInError: string) {
      // Through signInFailure, not a bare signInError set: SignInApp renders the message only
      // while signInFailed is true, so a raw string here would never reach the screen.
      dispatch.auth.set(signInFailure(new Error(signInError)))
      //send message to backend to sign out
      emit('user/lock')
    },
    async backendSignInError(signInError: string) {
      console.error(signInError)
      // Tear down FIRST, then record the failure: signedOut() deliberately clears
      // signInFailed/signInError (a failure logged while signed in must not survive into the
      // signed-out screen), so a set() before it was wiped and SignInApp — which renders its
      // message only while signInFailed is true — showed a bare sign-in screen with no word of
      // the backend's rejection. signInFailure is the one shape every failure takes.
      await dispatch.auth.signedOut()
      dispatch.auth.set(signInFailure(new Error(signInError)))
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
      // Sign-out is LOCAL to this app: drop this app's tokens/session (dispatch.auth.signedOut
      // below). The AS browser session belongs to the user and is NOT ended here — a true
      // "sign out everywhere" is a separate, explicit action (globalSignOut). Because signIn
      // always uses prompt=select_account, the next sign-in and any reload land on the AS
      // chooser rather than silently SSO-ing back in, so no login-prompt guard is needed.
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
      // Agent (Hydra) session goes with the app session — clears stored
      // tokens synchronously, revoke is fire-and-forget so sign-out never
      // blocks on it. Runs before the purge (and the transcript reset joins
      // the model resets below) so nothing dispatches between purge and a
      // signOut-triggered reload — a store write there makes redux-persist
      // re-save the pre-signout state for the next user of the machine.
      // (The DCR agent session retires with the permitteer chat lane —
      // remoteit-ai-agent.md Phase 4; until then both sign-outs run.)
      // AWAIT the chat sign-out: it revokes the background-agent grant, whose authenticated DELETE
      // needs a live token — letting it run unawaited raced the oidcClearLocal() below and left
      // background AI access alive. chat.signOut bounds itself so this never hangs the sign-out.
      await dispatch.chat.signOut()
      await persistor.purge()
      // LOCAL-ONLY: drop this app's tokens. The AS session is never ended from here —
      // signing out of the app must not sign the user out of login.* (their browser
      // session is theirs; the explicit "sign out everywhere" is globalSignOut).
      oidcClearLocal()
      /* signInCleared as well as the user: a failure recorded while SIGNED IN — a refused
         account switch, say — would otherwise survive into the signed-out screen, where
         signInFailed is the brake on auto sign-in. The next person to land here would get
         a stale error and no redirect, for something that happened in someone else's
         session. */
      await dispatch.auth.set({ user: undefined, ...signInCleared })
      dispatch.chat.reset()
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
      dispatch.ui.reset()
      dispatch.products.reset()
      dispatch.partnerStats.reset()
      dispatch.adminUsers.reset()
      dispatch.adminPartners.reset()
      dispatch.adminEnterpriseLicenses.reset()
      dispatch.adminAddonLicenses.reset()
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
      // "Sign out everywhere" (SecurityPage) is the EXPLICIT, account-wide action, distinct from
      // the avatar-menu sign-out which is local to this app. ONE call at the AS ends every session
      // of the account — this one included — with each refresh family swept, the resource servers
      // told, and on a bridged stage the legacy pool's tokens revoked too (permitteer
      // docs/remoteit-desktop-login.md Phase 4e); it runs BEFORE the local teardown, so the
      // security control does what it reports, and it needs only the access token this app
      // already holds. Best-effort by design: the refusal or outage that a person hits while
      // reaching for the panic button must not leave them signed in here, so the local sign-out
      // always follows — a miss is logged, never fatal. signOut itself stays LOCAL — a
      // failure-path or menu sign-out must never end the AS sessions.
      //
      // A SUPPORT session (an operator viewing as the person) holds no refresh token and can
      // mint for nothing but the data plane, and the account API refuses writes from an acted
      // token anyway — so there is nothing to call; the control is hidden for it (SecurityPage),
      // and this is the backstop: straight to the local teardown. Ending the support session
      // itself is the operator's console or the person's account page, never this button.
      if (oidcActor()) {
        dispatch.auth.signOut()
        return
      }
      // The agent's background grant goes FIRST: chat.signOut revokes it through the agent
      // service with a token minted from THIS session, and once the AS has ended the session no
      // token can be minted for that call. It revokes once per identity, so the chat.signOut
      // inside signedOut() is a real no-op on the far side.
      await dispatch.chat.signOut()
      // BOUNDED, like the revoke above. Audience mints serialize through one shared promise
      // (services/oidc), so a mint the revoke abandoned mid-stall would otherwise queue this call
      // behind it indefinitely — and the panic button must never leave the person signed in here
      // because the token service was half-open. Past the bound, the local sign-out proceeds and
      // the AS is told nothing; that is the failure the mail and the account page can still show.
      try {
        const { signOutEverywhere } = await import('../services/permitteerAccount')
        const r = await Promise.race([signOutEverywhere(), sleep(SIGN_OUT_EVERYWHERE_TIMEOUT).then(() => null)])
        if (!r) console.warn('SIGN OUT EVERYWHERE timed out — signing out locally')
        else if (r.status === 200) console.log('SIGN OUT EVERYWHERE', r.body)
        else console.warn('SIGN OUT EVERYWHERE refused', r.status, r.body)
      } catch (error) {
        console.warn('SIGN OUT EVERYWHERE FAILED', error)
      }
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
