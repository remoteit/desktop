import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The auth model pulls in the whole service layer at import time; stub everything the module
// touches so we can exercise the sign-in / sign-out EFFECTS in isolation. Only the two OIDC
// functions the tests assert on carry real spies — declared via vi.hoisted so they exist before
// the hoisted vi.mock factory runs. `browser` and the live `store` state are hoisted MUTABLE
// objects so individual tests can steer the electron/backend branch and what the effects
// re-read from the store after a teardown.
const {
  oidcStart,
  oidcEndSession,
  signOutEverywhere,
  changePassword,
  oidcGrantStale,
  oidcMcpDetailReady,
  oidcActor,
  oidcShell,
  pushUnregister,
  browser,
  storeState,
  oidcReconcileIssuer,
  chooseStage,
  reloadIfStageChanged,
  controllerClose,
  emitWithAck,
  reconnectNow,
  oidcClaims,
  oidcActivateAccount,
  oidcIsSavedAccount,
  oidcSelectKnownAccount,
  oidcCompleteFromUrl,
  oidcCallbackReason,
  oidcSignedIn,
  oidcActivationHint,
  oidcTakeSwitched,
  completeCallback,
  oidcAccounts,
  oidcSignIns,
  oidcSignOutAccount,
  oidcPromoteSignIn,
  oidcSubscribe,
  oidcSeveral,
  oidcSetSeveral,
  oidcUseAccount,
} = vi.hoisted(() => ({
  oidcSeveral: vi.fn(() => false),
  oidcSetSeveral: vi.fn(),
  oidcUseAccount: vi.fn(),
  oidcAccounts: vi.fn((): any[] => []),
  oidcSignIns: vi.fn((): any[] => []),
  oidcSignOutAccount: vi.fn(),
  oidcPromoteSignIn: vi.fn(),
  oidcSubscribe: vi.fn(),
  oidcCallbackReason: vi.fn(),
  oidcActivationHint: vi.fn(),
  oidcTakeSwitched: vi.fn(),
  oidcSignedIn: vi.fn(),
  oidcIsSavedAccount: vi.fn(),
  oidcSelectKnownAccount: vi.fn(),
  oidcCompleteFromUrl: vi.fn(),
  completeCallback: vi.fn(),
  emitWithAck: vi.fn(),
  reconnectNow: vi.fn(),
  oidcClaims: vi.fn(),
  oidcActivateAccount: vi.fn(),
  oidcReconcileIssuer: vi.fn(),
  chooseStage: vi.fn(),
  reloadIfStageChanged: vi.fn(),
  controllerClose: vi.fn(),
  oidcStart: vi.fn(),
  oidcEndSession: vi.fn(),
  changePassword: vi.fn(),
  signOutEverywhere: vi.fn(),
  oidcGrantStale: vi.fn(),
  oidcActor: vi.fn(),
  oidcMcpDetailReady: vi.fn(),
  oidcShell: vi.fn(),
  pushUnregister: vi.fn(),
  browser: { isElectron: false, isNative: false, hasBackend: false },
  storeState: { auth: {} as Record<string, unknown>, user: { id: '' } } as Record<string, any>,
}))

// signInFailure() tests `error instanceof OidcError`, so the mock must export a real class
// (an undefined right-hand side of instanceof throws rather than returning false).
vi.mock('../services/oidc', () => ({
  oidcStart,
  oidcEndSession,
  oidcGrantStale,
  oidcMcpDetailReady,
  oidcActor,
  oidcUseShell: vi.fn(async () => false),
  oidcShell,
  oidcClearLocal: vi.fn(),
  oidcReconcileIssuer,
  oidcClaims,
  oidcActivateAccount,
  oidcIsSavedAccount,
  oidcSelectKnownAccount,
  oidcCompleteFromUrl,
  oidcCallbackReason,
  oidcSignedIn,
  oidcActivationHint,
  oidcTakeSwitched,
  oidcAccounts,
  oidcSignIns,
  oidcSignOutAccount,
  oidcPromoteSignIn,
  oidcSubscribe,
  oidcSeveral,
  oidcSetSeveral,
  oidcUseAccount,
  invalidateOidcToken: vi.fn(),
  oidcTakeSupportTicket: vi.fn(),
  OidcError: class OidcError extends Error {},
}))
vi.mock('../helpers/stageHelper', () => ({ chooseStage, reloadIfStageChanged }))
const browserClient = vi.hoisted(() => ({ browserClientUsed: vi.fn(), resetBrowserClient: vi.fn() }))
vi.mock('../services/browserClient', () => browserClient)
vi.mock('../services/permitteerAccount', () => ({ signOutEverywhere }))
const { broadcastChatSignout } = vi.hoisted(() => ({ broadcastChatSignout: vi.fn() }))
vi.mock('../services/chatPopout', () => ({ broadcastChatSignout }))
vi.mock('../services/accountSecurity', () => ({ changePassword }))
vi.mock('../services/Controller', () => ({
  default: { close: controllerClose, emitWithAck, reconnectNow, setupConnection: vi.fn() },
  emit: vi.fn(() => false),
}))
vi.mock('../services/CloudSync', () => ({ default: { reset: vi.fn() } }))
vi.mock('../services/cloudController', () => ({ default: { reset: vi.fn() } }))
vi.mock('../services/Network', () => ({ default: {} }))
vi.mock('../services/browser', () => ({ default: browser }))
vi.mock('../services/analytics', () => ({ default: {} }))
vi.mock('../services/zendesk', () => ({ default: { endChat: vi.fn() } }))
vi.mock('../services/pushNotifications', () => ({ default: { register: vi.fn(), unregister: pushUnregister } }))
vi.mock('../services/graphQLRequest', () => ({ graphQLLogin: vi.fn() }))
vi.mock('../services/remoteit', () => ({ getToken: vi.fn(), apiAuthorized: vi.fn() }))
vi.mock('../selectors/devices', () => ({
  selectDeviceModelAttributes: vi.fn(),
  BESIDE_ROWS: ['default', 'connections'],
  deviceRows: (devices: object) => Object.keys(devices),
}))
const persist = vi.hoisted(() => ({
  bootstrapped: true,
  persistsState: true,
  listener: undefined as undefined | (() => void),
}))
vi.mock('../store', () => ({
  get persistsState() {
    return persist.persistsState
  },
  persistor: {
    purge: vi.fn(),
    getState: () => ({ bootstrapped: persist.bootstrapped }),
    subscribe: (listener: () => void) => {
      persist.listener = listener
      return () => (persist.listener = undefined)
    },
  },
  store: { getState: () => storeState, dispatch: { auth: { completeCallback } } },
}))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))
vi.mock('../constants', () => ({
  API_URL: '',
  DEVELOPER_KEY: '',
  AGENT_RELEASE_TIMEOUT: 1000,
  SIGN_OUT_BACKEND_TIMEOUT: 1000,
  SIGN_OUT_EVERYWHERE_TIMEOUT: 50,
  SIGN_OUT_SESSION_TIMEOUT: 50,
}))
vi.mock('axios', () => ({ default: {} }))

// The effects are `dispatch => ({...})`; build them against a fake dispatch so each auth.*
// call is an observable spy rather than a real reducer/effect.
function makeDispatch() {
  return {
    auth: {
      set: vi.fn(),
      signedOut: vi.fn(),
      signOut: vi.fn(),
      releaseAgent: vi.fn(),
      addAccount: vi.fn(),
      useAccount: vi.fn(),
      handleSignInSuccess: vi.fn(),
      healGrant: vi.fn(),
    },
    ui: { set: vi.fn(), setPersistent: vi.fn() },
    chat: { signOut: vi.fn() },
    accounts: { fetchSignIns: vi.fn() },
  }
}

const boot = async () => {
  const dispatch = makeDispatch()
  await effectsFor(dispatch).init(undefined, { auth: {} })
  return dispatch
}

// Every model and method on demand, as a spy: for effects that fan out across many models.
function spyDispatch() {
  const models: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {}
  const dispatch = new Proxy(models, {
    get: (all, model: string) =>
      (all[model] ??= new Proxy({} as Record<string, ReturnType<typeof vi.fn>>, {
        get: (calls, fn: string) => (calls[fn] ??= vi.fn()),
      })),
  })
  return { models, dispatch: dispatch as any }
}

// The only shape SignInApp renders: it shows a message ONLY while signInFailed is true, and
// signInFailed is also the brake on auto sign-in — so every failure writer must produce it.
const aFailureShowing = (signInError: string) => expect.objectContaining({ signInFailed: true, signInError })

// eslint-disable-next-line @typescript-eslint/no-var-requires
import authModel, { liveAuthCallback } from './auth'
import { agentOwnedMessage } from '@common/agentOwner'
import { graphQLLogin } from '../services/graphQLRequest'
import { getToken } from '../services/remoteit'
import { PERSISTED_MODELS } from './persistedModels'
import { rowKey } from '../helpers/rowKey'

const effectsFor = (dispatch: any) => (authModel as any).effects(dispatch)

beforeEach(() => {
  oidcStart.mockReset()
  oidcSeveral.mockReset().mockReturnValue(false)
  oidcSetSeveral.mockReset().mockResolvedValue(true)
  oidcUseAccount.mockReset().mockResolvedValue(true)
  oidcEndSession.mockReset().mockResolvedValue(204)
  changePassword.mockReset()
  signOutEverywhere.mockReset().mockResolvedValue({ status: 200, body: { ended: 1, pool: 'skipped' } })
  oidcActor.mockReset().mockReturnValue(null)
  oidcGrantStale.mockReset()
  oidcMcpDetailReady.mockReset().mockResolvedValue('mcp_type')
  oidcClaims.mockReset()
  oidcCallbackReason.mockReset()
  oidcSignedIn.mockReset()
  oidcActivationHint.mockReset()
  oidcTakeSwitched.mockReset()
  vi.mocked(getToken).mockReset()
  oidcReconcileIssuer.mockReset()
  chooseStage.mockReset()
  reloadIfStageChanged.mockReset()
  controllerClose.mockReset()
  pushUnregister.mockReset()
  oidcAccounts.mockReset().mockReturnValue([])
  oidcSignIns.mockReset().mockReturnValue([])
  oidcSignOutAccount.mockReset().mockResolvedValue(true)
  oidcPromoteSignIn.mockReset().mockReturnValue(false)
  oidcSubscribe.mockReset().mockReturnValue(() => {})
})

describe('auth model — the sign-in paths', () => {
  it('signIn authorizes with prompt=select_account (never a promptless / silent SSO)', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).signIn()
    expect(oidcStart).toHaveBeenCalledTimes(1)
    expect(oidcStart).toHaveBeenCalledWith({ prompt: 'select_account' })
  })

  it('asks the AS to open straight on the hinted provider', async () => {
    await effectsFor(makeDispatch()).signIn({ idpHint: 'google' })
    expect(oidcStart).toHaveBeenCalledWith({ prompt: 'select_account', idpHint: 'google' })
  })

  it('asks the AS for its sign-up page', async () => {
    await effectsFor(makeDispatch()).signIn({ signUp: true })
    expect(oidcStart).toHaveBeenCalledWith({ prompt: 'create' })
  })
})

/* The person's sign-out ends this account's session at the AS too — its single sign-on — and
   nothing wider: never sign-out-all. The background grant's revoke mints from that session, so it
   goes first; the AS call is bounded and best-effort, so the local teardown always follows. */
describe('auth model — sign-out ends this account’s AS session, then the local teardown', () => {
  const signedIn = { auth: { backendAuthenticated: false } }

  it('revokes the background grant, ends the AS session, THEN signs out locally', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).signOut(undefined, signedIn)
    expect(oidcEndSession).toHaveBeenCalledTimes(1)
    expect(signOutEverywhere).not.toHaveBeenCalled()
    expect(dispatch.auth.signedOut).toHaveBeenCalledTimes(1)
    const [grant, push, session, local] = [
      dispatch.chat.signOut.mock.invocationCallOrder[0],
      pushUnregister.mock.invocationCallOrder[0],
      oidcEndSession.mock.invocationCallOrder[0],
      dispatch.auth.signedOut.mock.invocationCallOrder[0],
    ]
    expect(grant).toBeLessThan(session)
    expect(push).toBeLessThan(session)
    expect(session).toBeLessThan(local)
  })

  it('an AS that refuses, fails, or never answers still signs the app out locally', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const outcome of [
      Promise.resolve(400),
      Promise.reject(new Error('network down')),
      new Promise(() => {}), // never settles — cut off at the bound
    ]) {
      oidcEndSession.mockReturnValueOnce(outcome)
      const dispatch = makeDispatch()
      await effectsFor(dispatch).signOut(undefined, signedIn)
      expect(dispatch.auth.signedOut).toHaveBeenCalledTimes(1)
    }
  })

  it('keepSession skips the AS entirely — the caller has already dealt with it', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).signOut({ keepSession: true }, signedIn)
    expect(oidcEndSession).not.toHaveBeenCalled()
    expect(dispatch.auth.signedOut).toHaveBeenCalledTimes(1)
  })
})

/* "Sign out everywhere" is ONE call at the AS — every session of the account, this one
   included — and it must run while this app still holds a usable token: before the local
   teardown, and after the agent's background grant is revoked (that revocation mints from the
   very session the call ends). It is best-effort: the person reaching for the panic button
   must end up signed out here whatever the AS answered. */
describe('auth model — "Sign out everywhere" is one AS call, then the local teardown', () => {
  it('globalSignOut revokes the background grant, calls sign-out-all, THEN signs out locally', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).globalSignOut()
    expect(dispatch.chat.signOut).toHaveBeenCalledTimes(1)
    expect(signOutEverywhere).toHaveBeenCalledTimes(1)
    expect(dispatch.auth.signOut).toHaveBeenCalledTimes(1)
    const [grant, push, everywhere, local] = [
      dispatch.chat.signOut.mock.invocationCallOrder[0],
      pushUnregister.mock.invocationCallOrder[0],
      signOutEverywhere.mock.invocationCallOrder[0],
      dispatch.auth.signOut.mock.invocationCallOrder[0],
    ]
    expect(grant).toBeLessThan(everywhere)
    expect(push).toBeLessThan(everywhere)
    expect(everywhere).toBeLessThan(local)
    // Every session is already ended — the sign-out that follows does not ask the AS again.
    expect(dispatch.auth.signOut).toHaveBeenCalledWith({ keepSession: true })
  })

  it('a refused sign-out-all still signs the app out locally', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    signOutEverywhere.mockResolvedValue({ status: 403, body: { error: 'insufficient_authorization' } })
    const dispatch = makeDispatch()
    await effectsFor(dispatch).globalSignOut()
    expect(dispatch.auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('an AS that cannot be reached still signs the app out locally', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    signOutEverywhere.mockRejectedValue(new Error('network down'))
    const dispatch = makeDispatch()
    await effectsFor(dispatch).globalSignOut()
    expect(dispatch.auth.signOut).toHaveBeenCalledTimes(1)
  })

  /* Audience mints serialize through one shared promise; a mint the grant revoke abandoned
     mid-stall would queue the AS call behind it for good. The bound is what keeps the panic
     button from leaving the person signed in here. */
  it('a call that never answers is cut off at the bound — the local sign-out still follows', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    signOutEverywhere.mockReturnValue(new Promise(() => {})) // never settles
    const dispatch = makeDispatch()
    await effectsFor(dispatch).globalSignOut()
    expect(dispatch.auth.signOut).toHaveBeenCalledTimes(1)
  })

  /* A support session (the id_token carries `act`) holds no refresh token and the AS refuses its
     writes: there is nothing to call. Straight to the local teardown, no revoke, no AS round trip. */
  it('a support session goes straight to the local sign-out — nothing is asked of the AS', async () => {
    oidcActor.mockReturnValue({ sub: 'op_1' })
    const dispatch = makeDispatch()
    await effectsFor(dispatch).globalSignOut()
    expect(signOutEverywhere).not.toHaveBeenCalled()
    expect(dispatch.chat.signOut).not.toHaveBeenCalled()
    expect(dispatch.auth.signOut).toHaveBeenCalledTimes(1)
  })
})

/* signedOut() deliberately clears signInFailed/signInError so a failure logged while signed in
   cannot leak onto the signed-out screen. The cost: any writer that records a failure BEFORE
   calling it loses the message, and SignInApp then shows a bare sign-in screen with no word of
   why. These pin that every failure writer lands its message in the signInFailure shape, and
   on the far side of the teardown. */
describe('auth model — a backend rejection survives the sign-out teardown', () => {
  it('backendSignInError records the failure AFTER signedOut(), with signInFailed set', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const dispatch = makeDispatch()
    await effectsFor(dispatch).backendSignInError('backend said no')
    expect(dispatch.auth.signedOut).toHaveBeenCalledTimes(1)
    expect(dispatch.auth.set).toHaveBeenCalledWith(aFailureShowing('backend said no'))
    // The failure must land AFTER the teardown that clears it, or it never reaches the screen.
    expect(dispatch.auth.set.mock.invocationCallOrder[0]).toBeGreaterThan(
      dispatch.auth.signedOut.mock.invocationCallOrder[0]
    )
  })
})

/* oidcGrantStale() compares against the MCP detail type. On the first load after a rename the
   cached name is the OLD one until the boot metadata refresh lands; a check that ran before it
   called a renamed-away grant current, and the discovery that followed re-ran nothing. */
describe('auth model — the grant freshness check waits for the boot MCP metadata', () => {
  it('healGrant does not consult oidcGrantStale until oidcMcpDetailReady resolves', async () => {
    let ready!: (type: string) => void
    oidcMcpDetailReady.mockReturnValue(new Promise<string>(resolve => (ready = resolve)))
    oidcGrantStale.mockReturnValue(false)
    const dispatch = makeDispatch()
    const healing = effectsFor(dispatch).healGrant()
    await Promise.resolve()
    expect(oidcGrantStale).not.toHaveBeenCalled()
    ready('mcp_type_v2')
    await healing
    expect(oidcGrantStale).toHaveBeenCalledTimes(1)
  })
})

/* A heal with no prompt came back as whichever account the browser had active, and the window
   completing it released the agent and switched to that account — on the first boot after an update. */
describe('auth model — the grant heal re-authorizes the signed-in account', () => {
  beforeEach(() => {
    oidcGrantStale.mockReturnValue(true)
    oidcClaims.mockReturnValue({ sub: 'sub-a', email: 'a@example.com' })
  })

  it('a stale grant heals by silent selection of this account', async () => {
    await effectsFor(makeDispatch()).healGrant()
    expect(oidcStart).toHaveBeenCalledWith({ prompt: 'none', loginHint: 'a@example.com', auto: 'heal' })
  })

  it('a forced heal names the account too, outside the ledger', async () => {
    oidcGrantStale.mockReturnValue(false)
    await effectsFor(makeDispatch()).healGrant({ force: true })
    expect(oidcStart).toHaveBeenCalledWith({ prompt: 'none', loginHint: 'a@example.com' })
  })

  it('an account with no email to name is not healed', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    oidcClaims.mockReturnValue({ sub: 'sub-a' })
    await effectsFor(makeDispatch()).healGrant()
    expect(oidcStart).not.toHaveBeenCalled()
  })
})

/* signedOut() ends with Controller.close(), and socket.io-client fires 'disconnect' synchronously
   from close() on a connected socket — so disconnect runs in the middle of every teardown. */
describe('auth model — the teardown closing its own socket', () => {
  afterEach(() => {
    storeState.auth = {}
  })

  it('disconnect only marks the backend gone, and never tears down a second time', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).disconnect()
    expect(dispatch.auth.signedOut).not.toHaveBeenCalled()
    expect(dispatch.ui.set).toHaveBeenCalledWith({ connected: false })
    expect(dispatch.auth.set).toHaveBeenCalledWith({ backendAuthenticated: false })
  })

  it("the agent's owner is still named after the refusal's teardown closes the socket", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const owner = { username: 'jr', command: 'sudo remoteit signout' }
    const { dispatch } = spyDispatch()
    const effects = effectsFor(dispatch)
    dispatch.auth.set.mockImplementation((params: object) => (storeState.auth = { ...storeState.auth, ...params }))
    dispatch.auth.signedOut.mockImplementation(() => effects.signedOut())
    let disconnecting: Promise<void> | undefined
    controllerClose.mockImplementationOnce(() => (disconnecting = effects.disconnect()))
    await effects.backendSignInError(agentOwnedMessage(owner))
    await disconnecting
    expect(dispatch.auth.signedOut).toHaveBeenCalledTimes(1)
    expect(storeState.auth).toEqual(
      expect.objectContaining({
        signInFailed: true,
        signInErrorCode: 'agentOwned',
        signInError: agentOwnedMessage(owner),
      })
    )
  })
})

/* The password lives on the AS's account API: the current password is the whole proof, so a change
   either lands or is refused with a reason — there is no challenge to carry between two calls. */
describe('auth model — the password change is one call to the AS', () => {
  const values = { currentPassword: 'old-one', password: 'new-one' }

  it('changes the password and says so', async () => {
    changePassword.mockResolvedValue({ ok: true, data: { changed: true } })
    const dispatch = makeDispatch()
    expect(await effectsFor(dispatch).changePassword(values)).toBe(true)
    expect(changePassword).toHaveBeenCalledWith('old-one', 'new-one')
    expect(dispatch.ui.set).toHaveBeenCalledWith({ successMessage: 'notices:auth.passwordChanged' })
  })

  it('names a wrong current password rather than repeating the server', async () => {
    changePassword.mockResolvedValue({ ok: false, status: 403, error: 'bad_password', description: 'nope' })
    const dispatch = makeDispatch()
    expect(await effectsFor(dispatch).changePassword(values)).toBe(false)
    expect(dispatch.ui.set).toHaveBeenCalledWith({ errorMessage: 'notices:auth.passwordIncorrect' })
  })

  it('keeps the AS’s sentence for a weak password — it names the rule that was missed', async () => {
    changePassword.mockResolvedValue({
      ok: false,
      status: 400,
      error: 'weak_password',
      description: 'Choose a password of at least 12 characters.',
    })
    const dispatch = makeDispatch()
    await effectsFor(dispatch).changePassword(values)
    expect(dispatch.ui.set).toHaveBeenCalledWith({ errorMessage: 'Choose a password of at least 12 characters.' })
  })
})

/* In an app (a shell signs in) remote.it out of reach must not hold the page on a spinner waiting for a user that never
   comes: the page goes to This device (components/ThisDeviceApp), whose controls are the machine's own. A browser is
   left as it was. */
describe('auth model — the user unreached', () => {
  it('in an app: no longer authenticated, so This device shows', async () => {
    oidcShell.mockReturnValue(true)
    vi.mocked(graphQLLogin).mockResolvedValue('ERROR')
    const dispatch = makeDispatch()
    await effectsFor(dispatch).fetchUser()
    expect(dispatch.auth.set).toHaveBeenCalledWith({ authenticated: false })
  })

  it('in a plain browser: unchanged', async () => {
    oidcShell.mockReturnValue(false)
    vi.mocked(graphQLLogin).mockResolvedValue('ERROR')
    const dispatch = makeDispatch()
    await effectsFor(dispatch).fetchUser()
    expect(dispatch.auth.set).not.toHaveBeenCalled()
  })
})

/* A stage switch stores the choice, clears the old API overrides, signs out and reloads; boot then
   drops whatever the old login server issued. */
describe('auth model — a stage switch signs out and reloads onto the new stage', () => {
  const apis = {
    switchApi: true,
    apiGraphqlURL: 'https://cloud.evan.remote.it/api/graphql',
    agentURL: 'https://x.test',
  }
  const cleared = {
    apis: { switchApi: false, customTarget: false, apiGraphqlURL: '', webSocketURL: '', agentURL: '' },
  }
  it('signed in: stores the stage and clears the old API overrides, then signs out', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).switchStage('dev', { auth: { user: { id: 'u1' } }, ui: { apis } })
    expect(chooseStage).toHaveBeenCalledWith('dev')
    expect(dispatch.ui.setPersistent).toHaveBeenCalledWith(cleared)
    expect(dispatch.auth.signOut).toHaveBeenCalledTimes(1)
    expect(chooseStage.mock.invocationCallOrder[0]).toBeLessThan(dispatch.auth.signOut.mock.invocationCallOrder[0])
    expect(reloadIfStageChanged).not.toHaveBeenCalled()
  })

  it('signed out: nothing to sign out of, so it reloads straight away', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).switchStage('prod', { auth: {}, ui: { apis: {} } })
    expect(chooseStage).toHaveBeenCalledWith('prod')
    expect(dispatch.auth.signOut).not.toHaveBeenCalled()
    expect(reloadIfStageChanged).toHaveBeenCalledTimes(1)
  })

  it('boot reconciles the stored session with the running login server before anything else', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).init(undefined, { auth: { user: { id: 'u1' } } })
    expect(oidcReconcileIssuer).toHaveBeenCalledTimes(1)
    expect(oidcReconcileIssuer.mock.invocationCallOrder[0]).toBeLessThan(dispatch.auth.set.mock.invocationCallOrder[0])
  })

  it('the sign-out teardown reloads onto a changed stage as its last step', async () => {
    const { dispatch } = spyDispatch()
    await effectsFor(dispatch).signedOut()
    expect(reloadIfStageChanged).toHaveBeenCalledTimes(1)
    expect(controllerClose.mock.invocationCallOrder[0]).toBeLessThan(reloadIfStageChanged.mock.invocationCallOrder[0])
  })
})

/* The backend refuses a second account while this computer's agent belongs to another, and the
   sign-in screen says who owns it and how to free it. */
describe("auth model — this computer's agent belongs to another account", () => {
  const owner = { username: 'Jamie@Remote.it', command: 'sudo remoteit signout' }
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('the refusal signs out and names the owner', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).backendSignInError(agentOwnedMessage(owner))
    expect(dispatch.auth.signedOut).toHaveBeenCalledTimes(1)
    expect(dispatch.auth.set).toHaveBeenCalledWith(
      expect.objectContaining({
        signInFailed: true,
        signInErrorCode: 'agentOwned',
        signInError: agentOwnedMessage(owner),
      })
    )
  })

  it('a malformed refusal falls back to the plain failure', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).backendSignInError('agent-owned:{not json')
    expect(dispatch.auth.signedOut).toHaveBeenCalledTimes(1)
    expect(dispatch.auth.set).toHaveBeenCalledWith(expect.not.objectContaining({ signInErrorCode: 'agentOwned' }))
  })
})

describe('auth model — switching accounts releases the agent first', () => {
  const signedIn = { auth: { user: { id: 'guid-a' }, backendAuthenticated: true } }
  beforeEach(() => {
    browser.hasBackend = true
    emitWithAck.mockReset()
    reconnectNow.mockReset()
    oidcStart.mockReset()
    oidcClaims.mockReset()
    oidcActivateAccount.mockReset()
    oidcIsSavedAccount.mockReset()
    oidcSelectKnownAccount.mockReset()
  })
  afterEach(() => {
    browser.hasBackend = false
    browser.isElectron = false
  })

  it('signing back in to the backend makes this window the owner again', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).backendAuthenticated(undefined, {
      auth: { authenticated: true, agentReleased: true },
      backend: { initialized: true },
    })
    expect(dispatch.auth.set).toHaveBeenCalledWith({ backendAuthenticated: true, agentReleased: false })
  })

  it('a signed-in desktop window asks the backend to release the agent', async () => {
    emitWithAck.mockResolvedValue(true)
    const dispatch = makeDispatch()
    expect(await effectsFor(dispatch).releaseAgent(undefined, signedIn)).toBe(true)
    expect(emitWithAck).toHaveBeenCalledWith('agent/release', 1000)
    expect(dispatch.auth.set).toHaveBeenCalledWith({ backendAuthenticated: false, agentReleased: true })
  })

  it('a dropped socket reconnects and asks again rather than switching without a release', async () => {
    emitWithAck.mockResolvedValueOnce(undefined).mockResolvedValueOnce(true)
    reconnectNow.mockResolvedValue(true)
    const dispatch = makeDispatch()
    expect(await effectsFor(dispatch).releaseAgent(undefined, signedIn)).toBe(true)
    expect(emitWithAck).toHaveBeenCalledTimes(2)
  })

  // A switch landing in a window that had just reloaded asked before the backend had signed it in, got no
  // answer, and warned that the agent could not be signed out while nothing had failed.
  it('a window the backend has not signed in yet waits for it before asking', async () => {
    reconnectNow.mockResolvedValue(true)
    emitWithAck.mockResolvedValue(true)
    const dispatch = makeDispatch()
    expect(await effectsFor(dispatch).releaseAgent(undefined, { auth: { user: { id: 'guid-a' } } })).toBe(true)
    expect(reconnectNow).toHaveBeenCalledTimes(1)
    expect(emitWithAck).toHaveBeenCalledTimes(1)
    expect(reconnectNow.mock.invocationCallOrder[0]).toBeLessThan(emitWithAck.mock.invocationCallOrder[0])
    expect(dispatch.ui.set).not.toHaveBeenCalled()
  })

  it('a window the backend never signs in gives up after the one wait, without asking', async () => {
    reconnectNow.mockResolvedValue(false)
    const dispatch = makeDispatch()
    expect(await effectsFor(dispatch).releaseAgent(undefined, { auth: { user: { id: 'guid-a' } } })).toBe(false)
    expect(reconnectNow).toHaveBeenCalledTimes(1)
    expect(emitWithAck).not.toHaveBeenCalled()
    expect(dispatch.ui.set).toHaveBeenCalledWith({ errorMessage: 'notices:auth.agentReleaseFailed' })
  })

  it('a release the backend refuses or never answers stops the switch and says so', async () => {
    emitWithAck.mockResolvedValue(undefined)
    reconnectNow.mockResolvedValue(false)
    const dispatch = makeDispatch()
    expect(await effectsFor(dispatch).releaseAgent(undefined, signedIn)).toBe(false)
    expect(dispatch.ui.set).toHaveBeenCalledWith({ errorMessage: 'notices:auth.agentReleaseFailed' })
  })

  it('nothing to release without a backend, a signed-in account, or after this window released it', async () => {
    const dispatch = makeDispatch()
    expect(await effectsFor(dispatch).releaseAgent(undefined, { auth: {} })).toBe(true)
    expect(
      await effectsFor(dispatch).releaseAgent(undefined, { auth: { ...signedIn.auth, agentReleased: true } })
    ).toBe(true)
    browser.hasBackend = false
    expect(await effectsFor(dispatch).releaseAgent(undefined, signedIn)).toBe(true)
    expect(emitWithAck).not.toHaveBeenCalled()
  })

  it('with one used at a time, the chooser releases the agent first — except on desktop, whose live window does', async () => {
    const dispatch = makeDispatch()
    dispatch.auth.releaseAgent.mockResolvedValue(false)
    await effectsFor(dispatch).addAccount()
    expect(oidcStart).not.toHaveBeenCalled()

    dispatch.auth.releaseAgent.mockResolvedValue(true)
    await effectsFor(dispatch).addAccount()
    expect(oidcStart).toHaveBeenCalledWith({ prompt: 'select_account' })

    browser.isElectron = true
    dispatch.auth.releaseAgent.mockClear()
    await effectsFor(dispatch).addAccount()
    expect(dispatch.auth.releaseAgent).not.toHaveBeenCalled()
    expect(oidcStart).toHaveBeenCalledTimes(2)
    browser.isElectron = false
  })

  it('with one used at a time, choosing a saved account switches to it: the agent released, the push token dropped, then a reload as them', async () => {
    const assign = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, assign })
    // The other account is saved, and not in use.
    beside('sub-b', false)
    oidcIsSavedAccount.mockReturnValue(true)
    oidcActivateAccount.mockReturnValue(true)
    const dispatch = makeDispatch()
    dispatch.auth.releaseAgent.mockResolvedValue(true)
    await effectsFor(dispatch).activateAccount('sub-b')
    expect(dispatch.auth.releaseAgent).toHaveBeenCalledTimes(1)
    expect(pushUnregister).toHaveBeenCalledTimes(1)
    expect(oidcActivateAccount).toHaveBeenCalledWith('sub-b')
    expect(assign).toHaveBeenCalledWith('/')
    expect(dispatch.auth.useAccount).not.toHaveBeenCalled()
    expect(oidcUseAccount).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it('with one used at a time, choosing an account the browser only knows selects it silently, the agent released first', async () => {
    beside('sub-b', false)
    oidcIsSavedAccount.mockReturnValue(false)
    oidcSelectKnownAccount.mockResolvedValue(true)
    const dispatch = makeDispatch()
    dispatch.auth.releaseAgent.mockResolvedValue(false)
    await effectsFor(dispatch).activateAccount('sub-b')
    expect(oidcSelectKnownAccount).not.toHaveBeenCalled()

    dispatch.auth.releaseAgent.mockResolvedValue(true)
    await effectsFor(dispatch).activateAccount('sub-b')
    expect(oidcSelectKnownAccount).toHaveBeenCalledWith('sub-b')
    expect(dispatch.auth.useAccount).not.toHaveBeenCalled()
  })

  it('the chooser adds an account without releasing the agent: the one signed in stays this computer’s', async () => {
    oidcSeveral.mockReturnValue(true)
    const dispatch = makeDispatch()
    await effectsFor(dispatch).addAccount()
    expect(dispatch.auth.releaseAgent).not.toHaveBeenCalled()
    expect(oidcStart).toHaveBeenCalledWith({ prompt: 'select_account' })

    browser.isElectron = true
    await effectsFor(dispatch).addAccount()
    expect(dispatch.auth.releaseAgent).not.toHaveBeenCalled()
    expect(oidcStart).toHaveBeenCalledTimes(2)
  })

  const beside = (sub: string, signedIn: boolean) =>
    oidcAccounts.mockReturnValue([
      { sub: 'sub-a', active: true, signedIn: true },
      { sub, active: false, signedIn },
    ])

  it('making a signed-in account the page’s person activates it only once the agent is released', async () => {
    beside('sub-b', true)
    oidcIsSavedAccount.mockReturnValue(true)
    oidcActivateAccount.mockReturnValue(false)
    const dispatch = makeDispatch()
    dispatch.auth.releaseAgent.mockResolvedValue(false)
    await effectsFor(dispatch).activateAccount('sub-b')
    expect(oidcActivateAccount).not.toHaveBeenCalled()

    dispatch.auth.releaseAgent.mockResolvedValue(true)
    await effectsFor(dispatch).activateAccount('sub-b')
    expect(oidcActivateAccount).toHaveBeenCalledWith('sub-b')
  })

  it("making a signed-in account the page’s person drops this phone's push token before it activates", async () => {
    beside('sub-b', true)
    oidcIsSavedAccount.mockReturnValue(true)
    oidcActivateAccount.mockReturnValue(false)
    const dispatch = makeDispatch()
    dispatch.auth.releaseAgent.mockResolvedValue(true)
    await effectsFor(dispatch).activateAccount('sub-b')
    expect(pushUnregister).toHaveBeenCalledTimes(1)
    expect(pushUnregister.mock.invocationCallOrder[0]).toBeLessThan(oidcActivateAccount.mock.invocationCallOrder[0])
  })

  it('with several at once, an account not in use joins the one that is: no release, no push token dropped, nothing activated', async () => {
    oidcSeveral.mockReturnValue(true)
    beside('sub-b', false)
    const dispatch = makeDispatch()
    await effectsFor(dispatch).activateAccount('sub-b')
    expect(dispatch.auth.useAccount).toHaveBeenCalledWith({ sub: 'sub-b', use: true })
    expect(dispatch.auth.releaseAgent).not.toHaveBeenCalled()
    expect(pushUnregister).not.toHaveBeenCalled()
    expect(oidcActivateAccount).not.toHaveBeenCalled()
  })

  it('checking an account brings it into use and reads its rows; one that cannot be goes to the chooser', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).useAccount({ sub: 'sub-b', use: true })
    expect(oidcUseAccount).toHaveBeenCalledWith('sub-b', true)
    expect(dispatch.accounts.fetchSignIns).toHaveBeenCalledTimes(1)
    expect(dispatch.auth.addAccount).not.toHaveBeenCalled()

    oidcUseAccount.mockResolvedValue(false)
    await effectsFor(dispatch).useAccount({ sub: 'sub-unknown', use: true })
    expect(dispatch.auth.addAccount).toHaveBeenCalledTimes(1)
  })

  it('unchecking an account takes it out of use and drops its rows: it is not signed out, and nothing reloads', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).useAccount({ sub: 'sub-b', use: false })
    expect(oidcUseAccount).toHaveBeenCalledWith('sub-b', false)
    expect(oidcSignOutAccount).not.toHaveBeenCalled()
    expect(dispatch.accounts.fetchSignIns).toHaveBeenCalledTimes(1)
    expect(oidcUseAccount.mock.invocationCallOrder[0]).toBeLessThan(
      dispatch.accounts.fetchSignIns.mock.invocationCallOrder[0]
    )
    expect(dispatch.auth.releaseAgent).not.toHaveBeenCalled()
    expect(dispatch.auth.addAccount).not.toHaveBeenCalled()
  })

  it('turning Use several at once off or on sets it, then reads the rows again so the others’ go', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).setSeveral(false)
    expect(oidcSetSeveral).toHaveBeenCalledWith(false)
    expect(oidcSetSeveral.mock.invocationCallOrder[0]).toBeLessThan(
      dispatch.accounts.fetchSignIns.mock.invocationCallOrder[0]
    )
    await effectsFor(dispatch).setSeveral(true)
    expect(oidcSetSeveral).toHaveBeenLastCalledWith(true)
    expect(dispatch.accounts.fetchSignIns).toHaveBeenCalledTimes(2)
  })

  it('in an app, a signed-in account is made the page’s person through the shell, the agent released first', async () => {
    beside('sub-b', true)
    oidcIsSavedAccount.mockReturnValue(false)
    oidcSelectKnownAccount.mockResolvedValue(true)
    const dispatch = makeDispatch()
    dispatch.auth.releaseAgent.mockResolvedValue(true)
    await effectsFor(dispatch).activateAccount('sub-b')
    expect(dispatch.auth.releaseAgent).toHaveBeenCalledTimes(1)
    expect(oidcSelectKnownAccount).toHaveBeenCalledWith('sub-b')
  })
})

describe('auth model — signing one account out leaves the rest', () => {
  beforeEach(() => oidcClaims.mockReset().mockReturnValue({ sub: 'sub-a' }))

  it('an account beside the page’s person: its sign-in ends, its rows are read again, and nothing else is torn down', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).signOutAccount('sub-b')
    expect(oidcSignOutAccount).toHaveBeenCalledWith('sub-b')
    expect(dispatch.accounts.fetchSignIns).toHaveBeenCalledTimes(1)
    expect(oidcSignOutAccount.mock.invocationCallOrder[0]).toBeLessThan(
      dispatch.accounts.fetchSignIns.mock.invocationCallOrder[0]
    )
    expect(dispatch.auth.signOut).not.toHaveBeenCalled()
    expect(dispatch.auth.signedOut).not.toHaveBeenCalled()
    expect(oidcEndSession).not.toHaveBeenCalled()
  })

  it('a sign-out the shell or the login server fails still reads the rows again', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    oidcSignOutAccount.mockRejectedValue(new Error('refused'))
    const dispatch = makeDispatch()
    await effectsFor(dispatch).signOutAccount('sub-b')
    expect(dispatch.accounts.fetchSignIns).toHaveBeenCalledTimes(1)
  })

  it('the page’s own person signs out as ever', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).signOutAccount('sub-a')
    expect(dispatch.auth.signOut).toHaveBeenCalledTimes(1)
    expect(oidcSignOutAccount).not.toHaveBeenCalled()
  })
})

describe('auth model — the page’s person signing out with others still signed in', () => {
  const assign = vi.fn()
  beforeEach(() => {
    assign.mockReset()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, assign })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  const purge = async () => vi.mocked((await import('../store')).persistor.purge)

  it('the last one out purges the stored state, resets every model and lands on the sign-in screen', async () => {
    ;(await purge()).mockClear()
    const { dispatch } = spyDispatch()
    await effectsFor(dispatch).signedOut()
    expect(await purge()).toHaveBeenCalledTimes(1)
    expect(dispatch.auth.resetAccountData).toHaveBeenCalledTimes(1)
    expect(oidcPromoteSignIn).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
    expect(reloadIfStageChanged).toHaveBeenCalledTimes(1)
  })

  it('with another signed in: what is stored for their rows stays, and the page boots as them', async () => {
    ;(await purge()).mockClear()
    oidcSignIns.mockReturnValue([
      { sub: 'sub-a', primary: true },
      { sub: 'sub-b', primary: false },
    ])
    oidcPromoteSignIn.mockReturnValue(true)
    const { dispatch } = spyDispatch()
    await effectsFor(dispatch).signedOut()
    expect(await purge()).not.toHaveBeenCalled()
    expect(dispatch.auth.resetAccountData).not.toHaveBeenCalled()
    expect(dispatch.auth.resetPersonData).toHaveBeenCalledTimes(1)
    expect(oidcPromoteSignIn).toHaveBeenCalledTimes(1)
    expect(assign).toHaveBeenCalledWith('/')
    expect(controllerClose.mock.invocationCallOrder[0]).toBeLessThan(oidcPromoteSignIn.mock.invocationCallOrder[0])
  })
})

describe('auth model — the chooser callback in a signed-in window', () => {
  const assign = vi.fn()
  beforeEach(() => {
    assign.mockReset()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, assign })
    oidcClaims.mockReset().mockReturnValue({ sub: 'sub-a' })
    oidcCompleteFromUrl.mockReset()
    oidcActivateAccount.mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('with one used at a time, a different account is admitted only once the agent is released, and the page boots as it', async () => {
    const dispatch = makeDispatch()
    dispatch.auth.releaseAgent.mockResolvedValue(true)
    oidcCompleteFromUrl.mockImplementation(async (_search: string, admit: (claims: any) => Promise<boolean>) =>
      (await admit({ sub: 'sub-b' })) ? { sub: 'sub-b' } : undefined
    )
    await effectsFor(dispatch).completeCallback('?code=c&state=s')
    expect(dispatch.auth.releaseAgent).toHaveBeenCalledTimes(1)
    expect(assign).toHaveBeenCalledWith('/')
    expect(dispatch.accounts.fetchSignIns).not.toHaveBeenCalled()

    assign.mockReset()
    dispatch.auth.releaseAgent.mockResolvedValue(false)
    await effectsFor(dispatch).completeCallback('?code=c&state=s')
    expect(assign).not.toHaveBeenCalled()
  })

  it('a different account joins the one signed in: no reload, the agent kept, and its rows read', async () => {
    oidcSeveral.mockReturnValue(true)
    oidcCompleteFromUrl.mockImplementation(async (_search: string, admit: (claims: any) => Promise<boolean>) =>
      (await admit({ sub: 'sub-b' })) ? { sub: 'sub-b' } : undefined
    )
    const dispatch = makeDispatch()
    await effectsFor(dispatch).completeCallback('?code=c&state=s')
    expect(oidcCompleteFromUrl).toHaveBeenCalledWith('?code=c&state=s', expect.any(Function))
    expect(dispatch.auth.releaseAgent).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
    expect(dispatch.accounts.fetchSignIns).toHaveBeenCalledTimes(1)
  })

  it('the same account signing in again boots on its new tokens, the agent kept', async () => {
    oidcCompleteFromUrl.mockResolvedValue({ sub: 'sub-a' })
    const dispatch = makeDispatch()
    await effectsFor(dispatch).completeCallback('?code=c&state=s')
    expect(dispatch.auth.releaseAgent).not.toHaveBeenCalled()
    expect(assign).toHaveBeenCalledWith('/')
    expect(dispatch.accounts.fetchSignIns).not.toHaveBeenCalled()
  })

  it('a cancelled or failed chooser keeps the agent and this session', async () => {
    oidcCompleteFromUrl.mockRejectedValue(new Error('access_denied'))
    const dispatch = makeDispatch()
    await effectsFor(dispatch).completeCallback('?error=access_denied&state=s')
    expect(dispatch.auth.releaseAgent).not.toHaveBeenCalled()
    expect(dispatch.ui.set).toHaveBeenCalledWith({ errorMessage: 'notices:auth.callbackFailed' })
    expect(assign).not.toHaveBeenCalled()
  })

  it('a refused silent selection says that account is no longer signed in', async () => {
    oidcCompleteFromUrl.mockRejectedValue(Object.assign(new Error('login_required'), { oauthError: 'login_required' }))
    const dispatch = makeDispatch()
    await effectsFor(dispatch).completeCallback('?error=login_required&state=s')
    expect(dispatch.ui.set).toHaveBeenCalledWith({
      errorMessage: 'That account is no longer signed in on this browser.',
    })
  })

  it('a background heal that fails says nothing: the session still works', async () => {
    oidcCallbackReason.mockReturnValue('heal')
    oidcCompleteFromUrl.mockRejectedValue(Object.assign(new Error('login_required'), { oauthError: 'login_required' }))
    const dispatch = makeDispatch()
    await effectsFor(dispatch).completeCallback('?error=login_required&state=s')
    expect(oidcCallbackReason).toHaveBeenCalledWith('?error=login_required&state=s')
    expect(dispatch.ui.set).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })

  it('a stale callback changes nothing', async () => {
    oidcCompleteFromUrl.mockResolvedValue(undefined)
    const dispatch = makeDispatch()
    await effectsFor(dispatch).completeCallback('?code=c&state=old')
    expect(dispatch.auth.releaseAgent).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })
})

describe('auth model — the desktop hands the chooser callback to a signed-in window', () => {
  beforeEach(() => {
    completeCallback.mockReset()
  })
  afterEach(() => {
    storeState.auth = {}
  })

  it('declines without a signed-in account, so the main process reloads with it', () => {
    storeState.auth = {}
    expect(liveAuthCallback('?code=c&state=s')).toBe(false)
    expect(completeCallback).not.toHaveBeenCalled()
  })

  it('takes it while signed in, and one at a time', async () => {
    let finish = () => {}
    completeCallback.mockReturnValue(new Promise<void>(resolve => (finish = resolve)))
    storeState.auth = { user: { id: 'guid-a' } }
    expect(liveAuthCallback('?code=c&state=s')).toBe(true)
    expect(liveAuthCallback('?code=c&state=s')).toBe(true)
    expect(completeCallback).toHaveBeenCalledTimes(1)
    finish()
    await new Promise(resolve => setTimeout(resolve))
    completeCallback.mockResolvedValue(undefined)
    liveAuthCallback('?code=d&state=t')
    expect(completeCallback).toHaveBeenCalledTimes(2)
  })
})

describe('auth model — booting as another person over stored state', () => {
  const signInAs = async (id: string, persistedOwner: string) => {
    storeState.user = { id: persistedOwner }
    vi.mocked(graphQLLogin).mockResolvedValue({
      data: { data: { login: { id, authhash: 'hash', yoicsId: 'yoics' } } },
    } as any)
    const { dispatch } = spyDispatch()
    await effectsFor(dispatch).fetchUser()
    return dispatch
  }

  beforeEach(() => {
    broadcastChatSignout.mockReset()
    oidcClaims.mockReset().mockReturnValue({ sub: 'sub-b' })
  })

  afterEach(() => {
    for (const key of Object.keys(storeState)) if (key !== 'auth' && key !== 'user') delete storeState[key]
    storeState.user = { id: '' }
    persist.bootstrapped = true
    persist.persistsState = true
  })

  it('adopts the stored state and closes chat popouts before the new user is set when it is another person’s', async () => {
    const dispatch = await signInAs('USER-B', 'USER-A')
    expect(dispatch.auth.adoptAccountData).toHaveBeenCalledWith('USER-B')
    expect(broadcastChatSignout).toHaveBeenCalledTimes(1)
    expect(dispatch.auth.adoptAccountData.mock.invocationCallOrder[0]).toBeLessThan(
      dispatch.auth.set.mock.invocationCallOrder[0]
    )
  })

  it('stamps the new owner, and their sub, right after, before any account fetch can persist', async () => {
    const dispatch = await signInAs('USER-B', 'USER-A')
    expect(dispatch.user.set).toHaveBeenCalledWith({ id: 'USER-B' })
    expect(dispatch.accounts.set).toHaveBeenCalledWith({ primarySub: 'sub-b' })
    expect(dispatch.auth.adoptAccountData.mock.invocationCallOrder[0]).toBeLessThan(
      dispatch.user.set.mock.invocationCallOrder[0]
    )
  })

  it('keeps the persisted state and chat popouts for the same account', async () => {
    const dispatch = await signInAs('USER-A', 'USER-A')
    expect(dispatch.auth.adoptAccountData).not.toHaveBeenCalled()
    expect(broadcastChatSignout).not.toHaveBeenCalled()
  })

  it('treats state with no recorded owner as another account’s, popouts included', async () => {
    const dispatch = await signInAs('USER-A', '')
    expect(dispatch.auth.adoptAccountData).toHaveBeenCalledTimes(1)
    expect(broadcastChatSignout).toHaveBeenCalledTimes(1)
    expect(dispatch.user.set).toHaveBeenCalledWith({ id: 'USER-A' })
  })

  it('skips the check in a popout or support tab, which persists nothing and must not close other windows’ popouts', async () => {
    persist.persistsState = false
    const dispatch = await signInAs('USER-A', '')
    expect(dispatch.auth.adoptAccountData).not.toHaveBeenCalled()
    expect(broadcastChatSignout).not.toHaveBeenCalled()
    expect(dispatch.user.set).toHaveBeenCalledWith({ id: 'USER-A' })
  })

  it('waits for rehydration before reading the owner', async () => {
    persist.bootstrapped = false
    vi.mocked(graphQLLogin).mockResolvedValue({
      data: { data: { login: { id: 'USER-B', authhash: 'h', yoicsId: 'y' } } },
    } as any)
    const { dispatch } = spyDispatch()
    const signingIn = effectsFor(dispatch).fetchUser()
    await vi.waitFor(() => expect(persist.listener).toBeDefined())
    expect(dispatch.auth.set).not.toHaveBeenCalled()

    storeState.user = { id: 'USER-A' }
    persist.bootstrapped = true
    persist.listener?.()
    await signingIn
    expect(dispatch.auth.adoptAccountData).toHaveBeenCalledTimes(1)
  })

  it('the last sign-out resets every persisted model', () => {
    const { models, dispatch } = spyDispatch()
    const effects = effectsFor(dispatch)
    dispatch.auth.resetPersonData.mockImplementation(() => effects.resetPersonData())
    effects.resetAccountData()
    const reset = Object.keys(models).filter(model => models[model].reset?.mock.calls.length)
    expect(reset.sort()).toEqual([...PERSISTED_MODELS].sort())
  })

  /* A was the page's person with org-a; B was signed in beside them with org-b; C had been too, with org-c, and has
     since signed out. Something is stored for each, and for an account no one recorded ('stray'). Everything is kept by
     row (helpers/rowKey): A's under the accounts' own ids, B's and C's under theirs with their sub. */
  const B = (id: string) => rowKey(id, 'sub-b')
  const C = (id: string) => rowKey(id, 'sub-c')
  const stored = () => {
    const byRow = (rows: string[]) => Object.fromEntries(rows.map(row => [row, {}]))
    const rows = ['USER-A', 'org-a', 'stray', B('USER-B'), B('org-b'), C('USER-C'), C('org-c')]
    const member = (id: string) => ({ account: { id } })
    Object.assign(storeState, {
      user: { id: 'USER-A' },
      accounts: {
        primarySub: 'sub-a',
        membership: [member('org-a')],
        signIns: {
          'sub-b': { sub: 'sub-b', id: 'USER-B', email: 'b@x.test', membership: [member('org-b')] },
          'sub-c': { sub: 'sub-c', id: 'USER-C', email: 'c@x.test', membership: [member('org-c')] },
        },
      },
      devices: { default: {}, connections: {}, ...byRow(rows) },
      products: { default: {} },
      partnerStats: { default: {} },
      networks: { all: byRow(rows) },
      files: { all: {} },
      jobs: { all: {} },
      tags: { all: byRow([C('org-c')]) },
      organization: { accounts: byRow(rows) },
      applicationTypes: { account: {} },
    })
  }
  const adopt = () => {
    const { models, dispatch } = spyDispatch()
    effectsFor(dispatch).adoptAccountData('USER-B')
    // The rows kept, each by the key it is kept under from now on: said to every model at once (accounts.rekey).
    return { models, rows: models.accounts.rekey.mock.calls[0][0] as Record<string, string> }
  }

  it('keeps what is stored for the accounts of sign-ins still in use, the former person’s included', () => {
    stored()
    oidcSignIns.mockReturnValue([{ sub: 'sub-b', primary: true }, { sub: 'sub-a', primary: false }])
    const { models, rows } = adopt()
    // B's rows are the plain ones now, A's are under A's sub; C's go, the lists kept beside the rows', and the row
    // of an account none of them reaches.
    expect(rows).toEqual({
      'USER-A': rowKey('USER-A', 'sub-a'),
      'org-a': rowKey('org-a', 'sub-a'),
      [B('USER-B')]: 'USER-B',
      [B('org-b')]: 'org-b',
    })
    expect(models.auth.resetPersonData).toHaveBeenCalledTimes(1)
    // The rows are laid out again as stored: the new person's memberships theirs, the former person beside them.
    expect(models.accounts.set).toHaveBeenCalledWith(
      expect.objectContaining({
        membership: [{ account: { id: 'org-b' } }],
        signIns: {
          'sub-a': expect.objectContaining({ sub: 'sub-a', id: 'USER-A', membership: [{ account: { id: 'org-a' } }] }),
        },
        activeId: undefined,
        primarySub: undefined,
      })
    )
    // Nothing kept by row is reset wholesale.
    expect(models.devices).toBeUndefined()
    expect(models.networks).toBeUndefined()
  })

  it('drops what only the former person’s sign-in served once they have signed out', () => {
    stored()
    oidcSignIns.mockReturnValue([{ sub: 'sub-b', primary: true }])
    expect(adopt().rows).toEqual({ [B('USER-B')]: 'USER-B', [B('org-b')]: 'org-b' })
  })

  /* A and B both belong to org-s: each has read it, into its row under each. */
  const shared = () => {
    stored()
    const member = (id: string) => ({ account: { id } })
    storeState.accounts.membership.push(member('org-s'))
    storeState.accounts.signIns['sub-b'].membership.push(member('org-s'))
    storeState.organization.accounts['org-s'] = {}
    storeState.organization.accounts[B('org-s')] = {}
    storeState.devices['org-s'] = {}
    storeState.devices[B('org-s')] = {}
  }

  it('drops the row of an organization another sign-in reaches too that was read as the one who has signed out', () => {
    shared()
    oidcSignIns.mockReturnValue([{ sub: 'sub-b', primary: true }])
    const { models, rows } = adopt()
    // B's own row of it stays, and is the plain one now; A's is gone with A.
    expect(rows).toEqual({ [B('USER-B')]: 'USER-B', [B('org-b')]: 'org-b', [B('org-s')]: 'org-s' })
    const [set] = models.accounts.set.mock.calls[0]
    expect(set.membership.map((m: IMembership) => m.account.id)).toEqual(['org-b', 'org-s'])
    expect(set.signIns).toEqual({})
  })

  it('keeps both rows of it while both stay signed in, each under whoever is the page’s person now', () => {
    shared()
    oidcSignIns.mockReturnValue([{ sub: 'sub-b', primary: true }, { sub: 'sub-a', primary: false }])
    expect(adopt().rows).toMatchObject({ 'org-s': rowKey('org-s', 'sub-a'), [B('org-s')]: 'org-s' })
  })

  it('keeps nothing of the former person when one is used at a time: the account switched to read none of it', () => {
    stored()
    storeState.accounts.signIns = {}
    oidcSignIns.mockReturnValue([{ sub: 'sub-b', primary: true }])
    const { models, rows } = adopt()
    // Their own account's row alone: nothing stored says what else they reach.
    expect(rows).toEqual({ [B('USER-B')]: 'USER-B' })
    expect(models.accounts.set).toHaveBeenCalledWith(expect.objectContaining({ membership: [], signIns: {} }))
  })

  it('keeps no plain row of state with no record of whose it was', () => {
    stored()
    storeState.accounts = { membership: [{ account: { id: 'org-a' } }], signIns: {} }
    oidcSignIns.mockReturnValue([{ sub: 'sub-b', primary: true }, { sub: 'sub-a', primary: false }])
    // A row says its own sign-in: B's own stays B's. The plain rows were someone's no one recorded, and go.
    expect(adopt().rows).toEqual({ [B('USER-B')]: 'USER-B' })
  })
})

describe('auth model — a boot that finds the page’s person’s grant dead', () => {
  const assign = vi.fn()
  beforeEach(() => {
    assign.mockReset()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, assign })
    oidcCompleteFromUrl.mockReset().mockResolvedValue(undefined)
    vi.mocked(getToken).mockResolvedValue('')
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('boots as the next account still signed in, once the dead one’s tokens are gone', async () => {
    oidcSignedIn.mockReturnValueOnce(true).mockReturnValue(false)
    oidcPromoteSignIn.mockReturnValue(true)
    const dispatch = await boot()
    expect(assign).toHaveBeenCalledWith('/')
    expect(dispatch.auth.handleSignInSuccess).not.toHaveBeenCalled()
  })

  it('stays as it is while the tokens are kept (the network, not the grant), and with no one else signed in', async () => {
    oidcSignedIn.mockReturnValue(true)
    oidcPromoteSignIn.mockReturnValue(true)
    await boot()
    expect(oidcPromoteSignIn).not.toHaveBeenCalled()

    oidcSignedIn.mockReset().mockReturnValueOnce(true).mockReturnValue(false)
    oidcPromoteSignIn.mockReturnValue(false)
    await boot()
    expect(assign).not.toHaveBeenCalled()
  })

  it('leaves it to the shell in an app', async () => {
    oidcSignedIn.mockReturnValueOnce(true).mockReturnValue(false)
    oidcShell.mockReturnValue(true)
    oidcPromoteSignIn.mockReturnValue(true)
    await boot()
    expect(assign).not.toHaveBeenCalled()
    oidcShell.mockReset()
  })
})

describe('auth model — another account arriving at boot joins the one signed in', () => {
  beforeEach(() => {
    oidcClaims.mockReset().mockReturnValue({ sub: 'sub-a' })
    oidcCompleteFromUrl.mockReset()
  })

  it('keeps this phone’s push token and restores the page’s own person, checked like any stored session', async () => {
    oidcCompleteFromUrl.mockResolvedValue({ sub: 'sub-b' })
    oidcSignedIn.mockReturnValue(true)
    vi.mocked(getToken).mockResolvedValue('Bearer t')
    const dispatch = await boot()
    expect(pushUnregister).not.toHaveBeenCalled()
    expect(getToken).toHaveBeenCalledTimes(1)
    expect(dispatch.auth.handleSignInSuccess).toHaveBeenCalledTimes(1)
  })

  it('signs in as the account that came back when it is the page’s own', async () => {
    oidcCompleteFromUrl.mockResolvedValue({ sub: 'sub-a' })
    const dispatch = await boot()
    expect(pushUnregister).not.toHaveBeenCalled()
    expect(getToken).not.toHaveBeenCalled()
    expect(dispatch.auth.handleSignInSuccess).toHaveBeenCalledTimes(1)
  })
})

describe("auth model — a different account arriving at boot", () => {
  beforeEach(() => {
    oidcClaims.mockReset().mockReturnValue({ sub: 'sub-a' })
    oidcCompleteFromUrl.mockReset()
  })

  // The exchange as services/oidc runs it: the admit gate, then the account stored — as the page's person with one
  // used at a time, beside them with several.
  const arriving = (returned: { sub: string }, replaces: boolean) =>
    oidcCompleteFromUrl.mockImplementation(async (_search, admit) => {
      if (!(await admit(returned))) return undefined
      if (replaces) oidcClaims.mockReturnValue(returned)
      return returned
    })

  it("with one used at a time, drops this phone's push token before the new account is stored, then signs in as it", async () => {
    arriving({ sub: 'sub-b' }, true)
    const dispatch = await boot()
    expect(pushUnregister).toHaveBeenCalledTimes(1)
    expect(dispatch.auth.handleSignInSuccess).toHaveBeenCalledTimes(1)
  })

  it('keeps the push token when the same account signs back in', async () => {
    arriving({ sub: 'sub-a' }, true)
    await boot()
    expect(pushUnregister).not.toHaveBeenCalled()
  })

  it('with several at once, keeps the push token: the page’s person is who they were', async () => {
    oidcSeveral.mockReturnValue(true)
    arriving({ sub: 'sub-b' }, false)
    await boot()
    expect(pushUnregister).not.toHaveBeenCalled()
  })
})

/* The heal opens the system browser in the desktop and mobile apps, and it did so by itself on the first
   launch after an update — once per account, or on every launch while it could not succeed. */
describe('auth model — which boots heal the grant', () => {
  beforeEach(() => {
    oidcCompleteFromUrl.mockReset().mockResolvedValue(undefined)
    oidcSignedIn.mockReturnValue(true)
    vi.mocked(getToken).mockResolvedValue('token')
  })
  afterEach(() => {
    browser.isNative = false
  })

  it('a plain launch of the desktop or mobile app never heals', async () => {
    browser.isNative = true
    expect((await boot()).auth.healGrant).not.toHaveBeenCalled()
  })

  it('the launch a saved-account switch causes heals', async () => {
    browser.isNative = true
    oidcTakeSwitched.mockReturnValue(true)
    expect((await boot()).auth.healGrant).toHaveBeenCalledTimes(1)
  })

  it('every web boot heals', async () => {
    expect((await boot()).auth.healGrant).toHaveBeenCalledTimes(1)
  })

  it('a later reload that cannot mint a token never leaves for the AS on the hint a switch left', async () => {
    vi.mocked(getToken).mockResolvedValue('')
    oidcActivationHint.mockReturnValue('b@x.test')
    await boot()
    expect(oidcStart).not.toHaveBeenCalled()
    oidcTakeSwitched.mockReturnValue(true)
    await boot()
    expect(oidcStart).toHaveBeenCalledWith({ prompt: 'none', loginHint: 'b@x.test', auto: 'activate:b@x.test' })
  })
})

describe('auth model — a background heal that fails on boot', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    oidcCallbackReason.mockReturnValue('heal')
    oidcCompleteFromUrl.mockReset().mockRejectedValue(new Error('consent_required'))
    oidcSignedIn.mockReturnValue(true)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('restores the working session without a word', async () => {
    vi.mocked(getToken).mockResolvedValue('token')
    const dispatch = await boot()
    expect(dispatch.auth.handleSignInSuccess).toHaveBeenCalledWith({ keepAutoStarts: true })
    expect(dispatch.ui.set).not.toHaveBeenCalled()
    expect(dispatch.auth.set).not.toHaveBeenCalledWith(expect.objectContaining({ signInFailed: true }))
  })

  it('still lands on the sign-in screen when the session itself is gone', async () => {
    vi.mocked(getToken).mockResolvedValue('')
    const dispatch = await boot()
    expect(dispatch.auth.handleSignInSuccess).not.toHaveBeenCalled()
    expect(dispatch.auth.set).toHaveBeenCalledWith(aFailureShowing('consent_required'))
  })
})

/* The browser's remote.it client acts for the person who signed in: device pages open through it with no session. So
   sign-out makes it forget itself and removes its device — while a token can still remove it, before this app's own
   tokens go — and only in a browser that ran one. */
describe('auth model — sign-out forgets this browser’s remote.it client', () => {
  it('a browser that ran a client: reset, as signing out, before the tokens are dropped', async () => {
    const { oidcClearLocal } = await import('../services/oidc')
    browserClient.browserClientUsed.mockReturnValue(true)
    browserClient.resetBrowserClient.mockReset().mockResolvedValue(undefined)
    const { dispatch } = spyDispatch()
    await effectsFor(dispatch).signedOut()
    expect(browserClient.resetBrowserClient).toHaveBeenCalledWith({ signingOut: true })
    expect(browserClient.resetBrowserClient.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(oidcClearLocal).mock.invocationCallOrder.at(-1)!
    )
  })

  it('a browser that never ran one is not touched, and a client that fails never holds the sign-out', async () => {
    browserClient.browserClientUsed.mockReturnValue(false)
    browserClient.resetBrowserClient.mockReset()
    await effectsFor(spyDispatch().dispatch).signedOut()
    expect(browserClient.resetBrowserClient).not.toHaveBeenCalled()

    browserClient.browserClientUsed.mockReturnValue(true)
    browserClient.resetBrowserClient.mockRejectedValue(new Error('no answer'))
    const { dispatch } = spyDispatch()
    await effectsFor(dispatch).signedOut()
    expect(dispatch.auth.set).toHaveBeenCalledWith(expect.objectContaining({ authenticated: false }))
  })

  // The device's removal needs a live session: the person's sign-out ends it, so the client is forgotten first
  // (solo, 2026-11-12: forgotten in signedOut, after the session ended, its device stayed).
  it('the menu sign-out forgets it before the AS session ends', async () => {
    browserClient.browserClientUsed.mockReturnValue(true)
    browserClient.resetBrowserClient.mockReset().mockResolvedValue(undefined)
    const dispatch = makeDispatch()
    await effectsFor(dispatch).signOut(undefined, { auth: { backendAuthenticated: false } })
    expect(browserClient.resetBrowserClient).toHaveBeenCalledWith({ signingOut: true })
    expect(browserClient.resetBrowserClient.mock.invocationCallOrder[0]).toBeLessThan(oidcEndSession.mock.invocationCallOrder[0])
  })

  it('sign out everywhere forgets it before every session ends', async () => {
    browserClient.browserClientUsed.mockReturnValue(true)
    browserClient.resetBrowserClient.mockReset().mockResolvedValue(undefined)
    const dispatch = makeDispatch()
    await effectsFor(dispatch).globalSignOut()
    expect(browserClient.resetBrowserClient.mock.invocationCallOrder[0]).toBeLessThan(signOutEverywhere.mock.invocationCallOrder[0])
  })
})
