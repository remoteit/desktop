import cloudSync from '../services/CloudSync'
import cloudController from '../services/cloudController'
import Controller, { emit } from '../services/Controller'
import network from '../services/Network'
import pushNotifications from '../services/pushNotifications'
import browser from '../services/browser'
import analytics from '../services/analytics'
import { selectDeviceModelAttributes } from '../selectors/devices'
import {
  AGENT_RELEASE_TIMEOUT,
  SIGN_OUT_BACKEND_TIMEOUT,
  SIGN_OUT_EVERYWHERE_TIMEOUT,
  SIGN_OUT_SESSION_TIMEOUT,
  StageName,
} from '../constants'
import { chooseStage, reloadIfStageChanged } from '../helpers/stageHelper'
import { persistor, persistsState, store } from '../store'
import { graphQLLogin } from '../services/graphQLRequest'
import { getToken } from '../services/remoteit'
import { changePassword as changeAccountPassword } from '../services/accountSecurity'
import { signOutEverywhere } from '../services/permitteerAccount'
import { broadcastChatSignout } from '../services/chatPopout'
import {
  oidcConfigured,
  oidcSignedIn,
  oidcClaims,
  oidcStart,
  oidcClearLocal,
  oidcReconcileIssuer,
  oidcEndSession,
  oidcCompleteFromUrl,
  oidcActivateAccount,
  oidcIsSavedAccount,
  oidcActivationHint,
  invalidateOidcToken,
  oidcGrantStale,
  oidcMcpDetailReady,
  oidcActor,
  oidcTakeSupportTicket,
  oidcSelectKnownAccount,
  oidcAccounts,
  oidcSignIns,
  oidcSignOutAccount,
  oidcPromoteSignIn,
  oidcSubscribe,
  oidcSeveral,
  oidcSetSeveral,
  oidcUseAccount,
  oidcClearAutoStarts,
  oidcUseShell,
  oidcShell,
  oidcCallbackReason,
  oidcTakeSwitched,
  OidcError,
  OidcErrorCode,
} from '../services/oidc'
import { createModel } from '@rematch/core'
import { getSignIns } from '../selectors/signIns'
import { RootModel } from '.'
import zendesk from '../services/zendesk'
import i18n from '../i18n'
import { withTimeout } from '../helpers/sleep'
import { browserClientUsed, resetBrowserClient } from '../services/browserClient'

// Bounded: a client that does not answer never holds the sign-out. Only in a browser that ran one; once done, the mark is
// gone, so the second call of a sign-out does nothing.
const forgetBrowserClientAtSignOut = async () => {
  if (browserClientUsed()) await withTimeout(resetBrowserClient({ signingOut: true }).catch(() => {}), 15_000)
}
import { parseAgentOwned } from '@common/agentOwner'

export type SignInErrorCode = OidcErrorCode | 'agentOwned'

export interface AuthState {
  initialized: boolean
  authenticated: boolean
  backendAuthenticated: boolean
  /** This window has signed the agent out for an account switch; it no longer owns it. */
  agentReleased?: boolean
  /** A sign-in attempt failed. Deliberately SEPARATE from the message: this is what stops
   *  the web app starting another authorize by itself, and a brake that reads a display
   *  string is a brake that vanishes the moment the string is empty or suppressed. */
  signInFailed?: boolean
  /** Technical detail — console, support, bug reports. NEVER rendered on its own: it is
   *  the server's own wording, so it is untranslated and often meaningless to a person. */
  signInError?: string
  /** What the failure MEANS, which is what the screen actually translates and acts on. */
  signInErrorCode?: SignInErrorCode
  /** Seconds the server asked us to wait, when it said so (429). */
  signInRetryAfter?: number
  signInClockOffset?: number
  signingIn?: boolean
  user?: IUser
}

/** What a refused password change means, in the person's words. The AS's own sentence is the
 *  fallback: it names the policy a weak password missed. */
function passwordError(error: string, description?: string): string {
  switch (error) {
    case 'bad_password':
      return i18n.t('notices:auth.passwordIncorrect', { defaultValue: 'Current password is incorrect.' })
    case 'locked':
      return i18n.t('notices:auth.passwordLocked', {
        defaultValue: 'Too many wrong attempts. Try again in a few minutes.',
      })
    case 'weak_password':
      return description || i18n.t('notices:auth.passwordWeak', { defaultValue: 'Choose a stronger password.' })
    case 'no_password_set':
    case 'no_credential':
      return i18n.t('notices:auth.passwordNotHeld', {
        defaultValue: 'This account has no password yet — set one from the link we email you.',
      })
    default:
      return description || i18n.t('notices:auth.passwordFailed', { defaultValue: 'Something went wrong — try again.' })
  }
}

const defaultState: AuthState = {
  initialized: false,
  authenticated: false,
  backendAuthenticated: false,
  signInFailed: false,
  signInError: undefined,
  signInErrorCode: undefined,
  signInRetryAfter: undefined,
  signInClockOffset: undefined,
  signingIn: false,
  user: undefined,
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
  signInClockOffset: error instanceof OidcError ? error.clockOffset : undefined,
})

// auth.init is not gated on rehydration, and an owner read before it sees the empty default.
const rehydrated = () =>
  new Promise<void>(resolve => {
    if (persistor.getState().bootstrapped) return resolve()
    const unsubscribe = persistor.subscribe(() => {
      if (!persistor.getState().bootstrapped) return
      unsubscribe()
      resolve()
    })
  })

// The sign-ins in use are followed from the moment someone is signed in: one joining or leaving (here, in another
// tab, or in the app's menu) changes the rows with no reload. A token rotating changes no one, and asks nothing.
const signInSubs = () =>
  oidcSignIns()
    .filter(signIn => !signIn.primary)
    .map(signIn => signIn.sub)
    .sort()
    .join(' ')
let followed: string | undefined
let unfollow: (() => void) | undefined
function followSignIns() {
  followed = signInSubs()
  unfollow ??= oidcSubscribe(() => {
    const now = signInSubs()
    if (now === followed || !store.getState().auth.authenticated) return
    followed = now
    void store.dispatch.accounts.fetchSignIns()
  })
}
function unfollowSignIns() {
  unfollow?.()
  unfollow = followed = undefined
}

const signInCleared = {
  signInFailed: false,
  signInError: undefined,
  signInErrorCode: undefined,
  signInRetryAfter: undefined,
  signInClockOffset: undefined,
}

// This phone's push token goes with the agent's grant: both calls mint from the session, so they run
// before it ends, and each runs once, so a later sign-out path's call is a no-op.
function releaseSessionGrants(dispatch: { chat: { signOut: () => Promise<unknown> } }) {
  return Promise.all([dispatch.chat.signOut(), pushNotifications.unregister()])
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    /* The RENDERER owns the OIDC session (services/oidc, permitteer docs/remoteit-desktop-login.md
       D8): init completes a callback if this boot is one, else restores the stored tokens.

       This used to take a `silent` flag that skipped RECORDING a failed sign-in, meaning
       to spare an unattended window a toast. But signInError is not a toast — it is the
       only thing telling SignInApp not to start another authorize. Suppressed, a rejected
       authorize returned, left no trace, and was retried immediately: an invisible
       redirect loop (skipConsent shows no consent screen) running as fast as the page
       could reload, until the AS rate-limited the address for everyone behind it. A
       failure is always recorded now; being unattended is not a reason to forget it. */
    async init(_: void, state) {
      oidcReconcileIssuer()
      const { user } = state.auth
      console.log('AUTH INIT START', { user })
      if (!user) {
        const healing = oidcCallbackReason() === 'heal'
        const switched = oidcTakeSwitched()
        try {
          // In an app, the app's own sign-in is this page's (services/oidc, "the SHELL's sign-in"): asked first, so
          // nothing below starts a flow or reads stored tokens there.
          await oidcUseShell()
          // A boot with ?code&state in the URL IS the sign-in completing (web return, or
          // the desktop deep-link reload); otherwise restore a stored session.
          // A support LAUNCH (permitteer docs/desktop-support.md): this tab arrived with a one-time
          // ticket, and the authorize it starts binds the sign-in to the operator's support session.
          const ticket = oidcTakeSupportTicket()
          if (ticket) {
            await oidcStart({ supportTicket: ticket })
            return
          }
          const previous = oidcClaims()?.sub
          // With one account in use, a different one arriving on this phone replaces it: the leaving one's push
          // token goes while its session can still mint.
          const claims = await oidcCompleteFromUrl(undefined, async returned => {
            if (!oidcSeveral() && previous && returned?.sub !== previous) await pushNotifications.unregister()
            return true
          })
          // With several in use, another account arriving joined the one signed in (services/oidc exchangeCallback):
          // the page's person is who they were, restored and checked below like any stored session, and the new
          // account's rows follow.
          if (claims && claims.sub === oidcClaims()?.sub) await dispatch.auth.handleSignInSuccess()
          else if (oidcSignedIn()) {
            // Stored tokens are a CLAIM of a session, not proof of one: the AS may have
            // revoked it (sign-out elsewhere, admin action, family revocation). Force one
            // token mint — a dead refresh family clears itself and we boot signed OUT
            // instead of rendering an authenticated shell over a corpse.
            const alive = await getToken()
            if (alive) {
              await dispatch.auth.handleSignInSuccess()
              // Desktop and mobile authorize in the system browser, which opening the app must never show, so
              // there only the boot a switch causes heals. A support tab's heal is refused by oidcStart.
              if (!browser.isNative || switched) await dispatch.auth.healGrant()
            } else {
              invalidateOidcToken()
              // A JUST-ACTIVATED saved account whose refresh family died: one silent
              // recovery through the AS — prompt=none + login_hint serves any live
              // session-set member the hint names (permitteer silent selection), so the
              // person lands back signed in with zero screens. The marker is one-shot;
              // a refused silent round falls to the ordinary sign-in screen.
              const hint = switched && oidcActivationHint()
              if (hint) await oidcStart({ prompt: 'none', loginHint: hint, auto: `activate:${hint}` })
              // This account's grant is dead and its tokens are gone, with others still signed in: the page boots
              // as the next of them, as it does when its person signs out (signedOut). Each dead one is dropped
              // before the next is tried, so this ends. Not under the app's shell, which says who is active.
              else if (!oidcSignedIn() && !oidcShell() && oidcPromoteSignIn()) return window.location.assign('/')
            }
          } else if (!oidcConfigured()) console.error('VITE_OAUTH_ISSUER is not configured')
        } catch (error: any) {
          console.error('AUTH INIT: sign-in completion failed', error)
          // A REFUSED silent selection (a known account signed out elsewhere meanwhile) must not
          // strand a signed-in person on the sign-in screen: the stored session is intact — restore
          // it, say why, and let the menu re-learn the browser's accounts. A failed heal restores it
          // without a word: the session never stopped working. Otherwise fall through to this
          // branch's richer error mapping (signInFailure).
          if ((healing || error?.oauthError === 'login_required') && oidcSignedIn() && (await getToken())) {
            await dispatch.auth.handleSignInSuccess({ keepAutoStarts: healing })
            if (!healing) dispatch.ui.set({ errorMessage: 'That account is no longer signed in on this browser.' })
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
     *  Automatic attempts are bounded by oidcStart's ledger (reason `heal`); a person pressing the
     *  chat's "Refresh permissions" is their own loop-breaker, so `force` skips both the ledger and
     *  the stale check — a resource server's refusal is a runtime fact this stamp cannot see.
     *
     *  A failed automatic heal says nothing (init, completeCallback): the session still works, and the
     *  feature that needs the slice offers "Refresh permissions", whose failure the person is told. */
    async healGrant(options?: { force?: boolean }) {
      try {
        // The freshness check compares against the MCP detail type; on the first load after a
        // rename the cached name is the OLD one until the boot metadata refresh lands. Wait for it
        // (bounded, resolved instantly thereafter) so this cannot call a renamed-away grant current.
        await oidcMcpDetailReady()
        if (!options?.force && !oidcGrantStale()) return
        const email = oidcClaims()?.email
        if (!email) return console.warn('AUTH: this session has no email to name, so its grant is not healed')
        console.log('AUTH: re-authorizing for this build’s declaration')
        // Only prompt=none makes the AS serve the session login_hint names; without it, the AS serves
        // the browser's active account.
        await oidcStart({ prompt: 'none', loginHint: email, auto: options?.force ? undefined : 'heal' })
      } catch (error) {
        console.warn('AUTH: grant heal check failed (leaving the session as it is)', error)
      }
    },
    /** "Sign in on this device": re-run authorize with select_account — the AS chooser shows the
     * real session chips. A SAME-account re-auth replaces that account's family.
     *
     * With several used at once, the account that comes back JOINS the one signed in (services/oidc.ts
     * exchangeCallback): the page's person, their rows and this computer's agent stay as they are, and
     * the new account's rows appear beside them. On desktop the chooser returns through a deep link that
     * the live window completes (completeCallback) with no reload; on the web the authorize is a page of
     * its own, and the app boots again as the same person with the new account beside them.
     *
     * With one used at a time, the account that comes back becomes the page's person and the one it
     * replaces stays saved. On desktop the live window releases the agent only for a different account
     * (completeCallback); any other shell with a local backend returns through a fresh page load that
     * cannot release it, so that shell releases first. */
    async addAccount(_: void) {
      if (!oidcSeveral() && !browser.isElectron && !(await dispatch.auth.releaseAgent())) return
      try {
        await oidcStart({ prompt: 'select_account' })
      } catch (error) {
        dispatch.auth.set(signInFailure(error))
      }
    },
    /** Make another account the page's person from the avatar menu: the pages about one person
     * (profile, billing, keys, chat) are then about them. A storage swap plus a full reload, so every
     * model boots as the new identity — a soft swap would show one account's profile under the other's
     * name. A stale saved session surfaces on boot exactly like any expired sign-in (refresh fails →
     * sign-in screen), which is the honest fallback.
     *
     * With one used at a time this is the switch: the account left stays saved, and is used no more.
     * With several used at once, both stay in use and the switcher's rows are the same either way; an
     * account that is NOT in use yet (saved, known to this browser, or remembered by the app's shell)
     * is brought into use beside the page's person instead (useAccount), with no reload where none is
     * needed. An unknown sub falls to the chooser, so a menu row that somehow outlived its entry still
     * lands somewhere sensible. */
    async activateAccount(sub: string) {
      if (oidcClaims()?.sub === sub) return // already active — nothing to do
      if (oidcSeveral() && !oidcAccounts().find(a => a.sub === sub)?.signedIn)
        return dispatch.auth.useAccount({ sub, use: true })
      if (oidcIsSavedAccount(sub)) {
        if (!(await dispatch.auth.releaseAgent())) return
        await pushNotifications.unregister()
        if (oidcActivateAccount(sub)) return window.location.assign('/')
      }
      // Under the app's shell the accounts are the shell's: it makes this one active and the page boots as them.
      // A KNOWN account (signed in on this browser, not in this app yet), with one used at a time: silent
      // selection — the AS serves the live set member the hint names, no chooser (docs/browser-accounts.md).
      // Outside desktop it returns through a page load that cannot release the agent (addAccount).
      if (!browser.isElectron && !(await dispatch.auth.releaseAgent())) return
      if (await oidcSelectKnownAccount(sub)) return
      await dispatch.auth.addAccount()
    },
    /** The check beside an account, with several used at once. Checked: a saved account is used again
     * and its rows appear, with no reload; one this browser only knows is signed in by a silent
     * selection, and one that cannot be falls to the chooser. Unchecked: it is used no more — its rows
     * and what was stored for them go, its socket closes — and it stays saved, a check away. Signing it
     * out (signOutAccount) is what forgets it. */
    async useAccount({ sub, use }: { sub: string; use: boolean }) {
      try {
        if (!(await oidcUseAccount(sub, use)) && use) return dispatch.auth.addAccount()
      } catch (error) {
        console.warn('AUTH: the account’s use was not changed', error)
      }
      await dispatch.accounts.fetchSignIns()
    },
    /** Use several at once, on or off (services/oidc oidcSetSeveral). Off: the page's person stays, and
     * every other account's rows, stored data and socket go with its use; the accounts stay saved. */
    async setSeveral(several: boolean) {
      await oidcSetSeveral(several)
      await dispatch.accounts.fetchSignIns()
    },
    /** Sign ONE account out and leave the rest. An account beside the page's person, in use or only
     * saved: its sign-in ends (its own session at the AS; under the app's shell, the shell's sign-out of
     * it) and it is forgotten here, and its rows and what was stored for them go, with no reload. The page's own person signs out as ever (signOut),
     * and the page then boots as one of those still signed in. */
    async signOutAccount(sub: string) {
      if (oidcClaims()?.sub === sub) return dispatch.auth.signOut()
      try {
        await withTimeout(oidcSignOutAccount(sub), SIGN_OUT_SESSION_TIMEOUT)
      } catch (error) {
        console.warn('SIGN OUT: the account was not signed out', error)
      }
      await dispatch.accounts.fetchSignIns()
    },
    /** Desktop: a chooser's deep link delivered to this still signed-in window (liveAuthCallback).
     *  With several used at once, a DIFFERENT account joins the one signed in: nothing reloads, the agent
     *  stays its owner's, and the new account's rows are read (models/accounts followSignIns). With one
     *  used at a time it becomes the page's person, stored only once this window has released the agent. */
    async completeCallback(search: string) {
      const previous = oidcClaims()?.sub
      const healing = oidcCallbackReason(search) === 'heal'
      const several = oidcSeveral()
      try {
        const claims = await oidcCompleteFromUrl(
          search,
          async returned => several || returned?.sub === previous || dispatch.auth.releaseAgent()
        )
        if (claims && (!several || claims.sub === previous)) window.location.assign('/')
        else if (claims) await dispatch.accounts.fetchSignIns()
      } catch (error: any) {
        console.error('AUTH: sign-in callback did not complete', error)
        if (healing) return
        dispatch.ui.set({
          errorMessage:
            error?.oauthError === 'login_required'
              ? 'That account is no longer signed in on this browser.'
              : i18n.t('notices:auth.callbackFailed', { defaultValue: "Sign-in didn't complete, so nothing changed." }),
        })
      }
    },
    /** `auto` names a sign-in nobody clicked for (the web sign-in screen's own start) so the
     *  ledger in oidcStart can bound it; a refused one leaves the screen as it was. */
    async signIn(options?: { auto?: string; idpHint?: string; signUp?: boolean }) {
      dispatch.auth.set({ signingIn: true, ...signInCleared })
      try {
        // Every sign-in but sign-up offers the CHOOSER (prompt=select_account), web and desktop
        // alike. A sign-in button should let the person pick; and with a live AS cookie a
        // PROMPTLESS authorize would silently SSO the last user straight back in — which is
        // exactly the "sign-out doesn't stick" bug. select_account also means that signing
        // out and reloading always lands on the picker, never a silent re-login.
        const prompt = options?.signUp ? 'create' : 'select_account'
        if (!(await oidcStart({ prompt, idpHint: options?.idpHint, auto: options?.auto })))
          dispatch.auth.set({ signingIn: false })
      } catch (error: any) {
        console.error('SIGN IN FAILED', error)
        dispatch.auth.set(signInFailure(error))
      }
    },
    async fetchUser(_: void) {
      const { auth } = dispatch
      const response = await graphQLLogin()
      if (response === 'ERROR') {
        // In an app, remote.it out of reach (offline, its API down) must not hold the page on a spinner waiting for a
        // user: it shows This device, whose controls are the machine's own, saying remote.it is not reached
        // (components/ThisDeviceApp). The shell keeps the sign-in; a retry or the network's return boots it again.
        if (oidcShell()) auth.set({ authenticated: false })
        return
      }

      const user = response?.data?.data?.login

      // Switching accounts reloads without signing out, so a window's persisted state, and any chat popout still paired
      // with it, can be the last account's. With no owner recorded neither can be trusted.
      await rehydrated()
      const owner = store.getState().user.id
      if (persistsState && user?.id && owner !== user.id) {
        auth.adoptAccountData(user.id)
        broadcastChatSignout()
      }
      // Stamped here rather than when user.fetch lands, so a second switch before then still sees an owner.
      if (user?.id) {
        dispatch.user.set({ id: user.id })
        dispatch.accounts.set({ primarySub: oidcClaims()?.sub })
      }

      auth.set({ user, ...signInCleared })
      if (user.authhash && user.yoicsId) {
        Controller.setupConnection({ username: user.yoicsId, authHash: user.authhash, guid: user.id })
        auth.signedIn()
      } else {
        console.warn('Login failed!', response)
        dispatch.ui.set({ errorMessage: i18n.t('notices:auth.loginFailed', { defaultValue: 'Login failed.' }) })
      }
    },
    // The password, on the AS's account API (permitteer docs/unified-idp.md): the current password
    // is the proof, and nothing is relayed — a store that would challenge a factor here is taken as
    // having accepted the password. It signs no other session out; the confirm dialog says so.
    async changePassword(passwordValues: IPasswordValue): Promise<boolean> {
      const r = await changeAccountPassword(passwordValues.currentPassword ?? '', passwordValues.password ?? '')
      if (r.ok) {
        dispatch.ui.set({
          successMessage: i18n.t('notices:auth.passwordChanged', { defaultValue: 'Password changed successfully.' }),
        })
        return true
      }
      dispatch.ui.set({ errorMessage: passwordError(r.error, r.description) })
      return false
    },
    // The 401 recovery path (services/post.ts): drop the renderer cache and let the
    // backend refresh on the next token fetch. If the backend says the session is gone
    // (refresh family revoked / AS session expired), sign the app out.
    async checkSession(options: { status?: number }, state) {
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
        await dispatch.auth.signedOut()
      }
    },
    async handleSignInSuccess(options?: { keepAutoStarts?: boolean }): Promise<void> {
      // A session — freshly exchanged OR restored from stored tokens — is proof the
      // automatic path works, so it clears the auto-start budget. Doing it only at the
      // code exchange left a tab that had spent its budget unable to auto sign-in again
      // after a perfectly healthy restore. A restore after a failed heal is no such proof:
      // clearing there sent every page load back through the AS.
      if (!options?.keepAutoStarts) oidcClearAutoStarts()
      await dispatch.auth.set({ authenticated: true })
      await dispatch.auth.fetchUser()
      console.log('AUTHENTICATED SUCCESS')
    },
    async backendAuthenticated(_: void, state) {
      if (state.auth.authenticated) {
        dispatch.auth.set({ backendAuthenticated: true, agentReleased: false })
        console.log('BACKEND AUTHENTICATED')
        if (!state.backend.initialized) {
          emit('init')
          console.log('INIT BACKEND')
        }
      }
    },
    async disconnect() {
      // No teardown here: a signed-out window's socket only drops from signedOut()'s own close(),
      // and a second teardown from that echo wipes backendSignInError's agent-owned notice.
      dispatch.ui.set({ connected: false })
      dispatch.auth.set({ backendAuthenticated: false })
    },
    async backendSignInError(signInError: string) {
      console.error(signInError)
      const owner = parseAgentOwned(signInError)
      // Tear down FIRST, then record the failure: signedOut() deliberately clears
      // signInFailed/signInError (a failure logged while signed in must not survive into the
      // signed-out screen), so a set() before it was wiped and SignInApp — which renders its
      // message only while signInFailed is true — showed a bare sign-in screen with no word of
      // the backend's rejection. signInFailure is the one shape every failure takes.
      await dispatch.auth.signedOut()
      dispatch.auth.set({
        ...signInFailure(new Error(signInError)),
        ...(owner && { signInErrorCode: 'agentOwned' as const }),
      })
    },
    /** Desktop: the account leaving signs this computer's agent out from its own window before a switch,
     *  so the agent only ever moves on its owner's credentials. Its saved session stays in the switcher. */
    async releaseAgent(_: void, state): Promise<boolean> {
      if (!browser.hasBackend || !state.auth.user || state.auth.agentReleased) return true
      const ask = () => Controller.emitWithAck('agent/release', AGENT_RELEASE_TIMEOUT)
      // The backend only answers agent/release from a window it has finished signing in; asked sooner, it never does.
      const ready = state.auth.backendAuthenticated || (await Controller.reconnectNow(AGENT_RELEASE_TIMEOUT))
      if (ready && ((await ask()) || ((await Controller.reconnectNow(SIGN_OUT_BACKEND_TIMEOUT)) && (await ask())))) {
        dispatch.auth.set({ backendAuthenticated: false, agentReleased: true })
        return true
      }
      dispatch.ui.set({
        errorMessage: i18n.t('notices:auth.agentReleaseFailed', {
          defaultValue: "Couldn't sign out of this computer, so the account wasn't switched.",
        }),
      })
      return false
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
      followSignIns()
      dispatch.ui.init()
      zendesk.initChat(state.auth.user)
      analytics.signedIn(state.auth.user)
      cloudController.init()
      cloudSync.init()
      network.tick()
      pushNotifications.register()
      if (!browser.hasBackend) dispatch.auth.appReady()
    },
    async signOut(options: { keepSession?: boolean } | void, state) {
      // The person signing out ends this account's single sign-on too: the AS session its
      // id_token names, so the next sign-in here — or in any app that shared that session —
      // asks who they are instead of passing them straight through. Only THIS account's
      // session: the browser's other accounts, this app's other saved accounts and the
      // account's other devices each hold their own. It runs first, while the id_token is
      // still stored, and it is BOUNDED and best-effort: an unreachable AS must never leave
      // the person signed in here, so the local sign-out always follows.
      // The failure paths (dead refresh token, backend sign-out) go straight to signedOut()
      // and never reach the AS; globalSignOut has already ended every session and passes
      // keepSession so a down AS is not waited on twice.
      if (!options?.keepSession) {
        // The agent's background grant goes FIRST, as in globalSignOut: its revoke mints a token
        // from the session about to end. It revokes once per identity, so the chat.signOut in
        // signedOut() is a no-op afterwards.
        await releaseSessionGrants(dispatch)
        // This browser's remote.it client too, while the session lives: its device is removed as the person, which a
        // token of a session already ended cannot do (solo, 2026-11-12: the client forgot itself at sign-out, its device
        // stayed). Done here, signedOut finds nothing left to do; its own call stays for the paths that never come here.
        await forgetBrowserClientAtSignOut()
        try {
          const status = await withTimeout(oidcEndSession(), SIGN_OUT_SESSION_TIMEOUT)
          if (status && status !== 204) console.warn('SIGN OUT: AS session end refused', status)
        } catch (error) {
          console.warn('SIGN OUT: AS session end failed — signing out locally', error)
        }
      }
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
      // Runs before the purge (and the transcript reset joins the model resets below) so nothing
      // dispatches between purge and a signOut-triggered reload — a store write there makes
      // redux-persist re-save the pre-signout state for the next user of the machine.
      // AWAIT the chat sign-out: it revokes the background-agent grant, whose authenticated DELETE
      // needs a live token — letting it run unawaited raced the oidcClearLocal() below and left
      // background AI access alive. chat.signOut bounds itself so this never hangs the sign-out.
      await releaseSessionGrants(dispatch)
      // This browser's remote.it client acts for the person who signed in — every device page they may reach opens
      // through it with no session — so it forgets itself: in signOut while the session lives, else here, its device
      // then left to its expiry if no token can remove it.
      await forgetBrowserClientAtSignOut()
      unfollowSignIns()
      // Other accounts are still signed in: the page boots as one of them below, and what is stored for the rows
      // they serve is theirs to keep — the boot's owner check drops what only this person's sign-in served
      // (adoptAccountData). The last one out purges it all.
      const others = oidcSignIns().some(signIn => !signIn.primary)
      if (!others) await persistor.purge()
      // Drop this app's tokens. The AS is never called from here — the failure paths land here
      // too; the person's own sign-out ended the AS session in signOut before this.
      oidcClearLocal()
      /* signInCleared as well as the user: a failure recorded while SIGNED IN — a refused
         account switch, say — would otherwise survive into the signed-out screen, where
         signInFailed is the brake on auto sign-in. The next person to land here would get
         a stale error and no redirect, for something that happened in someone else's
         session. */
      await dispatch.auth.set({ user: undefined, ...signInCleared })
      if (others) dispatch.auth.resetPersonData()
      else dispatch.auth.resetAccountData()
      dispatch.agents.reset()
      dispatch.logs.reset()
      dispatch.search.reset()
      dispatch.billing.reset()
      dispatch.backend.reset()
      dispatch.keys.reset()
      dispatch.ui.reset()
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
      // Someone is still signed in: the next of them becomes the page's person, and the page boots as them.
      if (others && oidcPromoteSignIn()) window.location.assign('/')
      else reloadIfStageChanged()
    },
    /** Every persisted model: what the last sign-out clears. */
    resetAccountData() {
      dispatch.auth.resetPersonData()
      dispatch.organization.reset()
      dispatch.networks.reset()
      dispatch.accounts.reset()
      dispatch.devices.reset()
      dispatch.applicationTypes.reset()
      dispatch.files.reset()
      dispatch.jobs.reset()
      dispatch.tags.reset()
      dispatch.products.reset()
    },
    /** The persisted models that are about ONE person — the page's own — rather than kept by account id: what goes
     *  whenever the page's person changes, whoever else stays signed in. */
    resetPersonData() {
      dispatch.chat.reset()
      dispatch.user.reset()
      dispatch.connections.reset()
      dispatch.sessions.reset()
      dispatch.announcements.reset()
      dispatch.plans.reset()
      dispatch.contacts.reset()
    },
    /** The page boots as `userId` over state stored for another person. What is about one person goes. What is
     *  kept by account id stays only for the accounts a sign-in STILL IN USE served when it was stored — the page's
     *  former person, if they are still signed in, and each sign-in that was beside them — so signing one account
     *  out, or making another the page's person, costs the others nothing, and nothing a signed-out account served
     *  is left to show. With no record of whose the state was, none of it is kept. */
    adoptAccountData(userId: string) {
      const { accounts, user } = store.getState()
      const inUse = new Set(oidcSignIns().map(signIn => signIn.sub))
      const kept = new Set<string>()
      if (accounts.primarySub && inUse.has(accounts.primarySub) && user.id) {
        kept.add(user.id)
        accounts.membership.forEach(m => kept.add(m.account.id))
      }
      Object.values(getSignIns(store.getState())).forEach(signIn => {
        if (!inUse.has(signIn.sub)) return
        kept.add(signIn.id)
        signIn.membership.forEach(m => kept.add(m.account.id))
      })
      const stored = new Set<string>()
      const { devices, products, networks, files, jobs, tags, organization, applicationTypes } = store.getState()
      ;[devices, products, networks.all, files.all, jobs.all, tags.all, organization.accounts, applicationTypes.account]
        .flatMap(byAccount => Object.keys(byAccount || {}))
        .forEach(id => id !== 'default' && stored.add(id))
      dispatch.accounts.forgetData([...stored].filter(id => !kept.has(id)))
      dispatch.auth.resetPersonData()
      // The rows are read again as the new person (accounts.fetch, fetchSignIns), who starts on their own account.
      dispatch.accounts.set({
        membership: [],
        signIns: {},
        activeId: undefined,
        primarySub: undefined,
        pendingOrganizationClosures: undefined,
      })
      console.log('AUTH: stored state was another person’s — kept the accounts still signed in', userId, [...kept])
    },
    /** Test Settings' stage switch. This signs out of the old login server; the reload at the end of
     *  signedOut boots every endpoint on the new stage, where init drops the old stage's accounts. */
    async switchStage(stage: StageName, state) {
      chooseStage(stage)
      await dispatch.ui.setPersistent({
        apis: {
          ...state.ui.apis,
          switchApi: false,
          customTarget: false,
          apiGraphqlURL: '',
          webSocketURL: '',
          agentURL: '',
        },
      })
      if (state.auth.user) await dispatch.auth.signOut()
      else reloadIfStageChanged()
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
      // always follows — a miss is logged, never fatal. The menu sign-out ends only THIS
      // account's session (signOut).
      //
      // A SUPPORT session (an operator viewing as the person) holds no refresh token and can
      // mint for nothing but the data plane, and the account API refuses writes from an acted
      // token anyway — so there is nothing to call; the control is hidden for it (SecurityPage),
      // and this is the backstop: straight to the local teardown. Ending the support session
      // itself is the operator's console or the person's account page, never this button.
      if (oidcActor()) {
        dispatch.auth.signOut({ keepSession: true })
        return
      }
      // The agent's background grant goes FIRST: chat.signOut revokes it through the agent
      // service with a token minted from THIS session, and once the AS has ended the session no
      // token can be minted for that call. It revokes once per identity, so the chat.signOut
      // inside signedOut() is a real no-op on the far side.
      await releaseSessionGrants(dispatch)
      // This browser's remote.it client, while a token can still remove its device (signOut says why).
      await forgetBrowserClientAtSignOut()
      // BOUNDED, like the revoke above. Audience mints serialize through one shared promise
      // (services/oidc), so a mint the revoke abandoned mid-stall would otherwise queue this call
      // behind it indefinitely — and the panic button must never leave the person signed in here
      // because the token service was half-open. Past the bound, the local sign-out proceeds and
      // the AS is told nothing; that is the failure the mail and the account page can still show.
      try {
        const r = await withTimeout(signOutEverywhere(), SIGN_OUT_EVERYWHERE_TIMEOUT)
        if (!r) console.warn('SIGN OUT EVERYWHERE timed out — signing out locally')
        else if (r.status === 200) console.log('SIGN OUT EVERYWHERE', r.body)
        else console.warn('SIGN OUT EVERYWHERE refused', r.status, r.body)
      } catch (error) {
        console.warn('SIGN OUT EVERYWHERE FAILED', error)
      }
      dispatch.auth.signOut({ keepSession: true })
    },
  }),
  reducers: {
    set(state: AuthState, params: Partial<AuthState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

let completing: Promise<void> | undefined

/** The desktop main process hands an auth deep link here before falling back to reloading the
 *  window with it. True means this signed-in window owns the callback; a reload instead would
 *  sign the new account in while this window still holds the agent. */
export function liveAuthCallback(search: string): boolean {
  if (!store.getState().auth.user) return false
  completing ??= store.dispatch.auth.completeCallback(search).finally(() => (completing = undefined))
  return true
}
