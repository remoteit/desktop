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
  browser,
  storeState,
  oidcReconcileIssuer,
  chooseStage,
  reloadIfStageChanged,
  controllerClose,
  emitWithAck,
  oidcClaims,
  oidcActivateAccount,
} = vi.hoisted(() => ({
  emitWithAck: vi.fn(),
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
  browser: { isElectron: false, hasBackend: false },
  storeState: { auth: {} as Record<string, unknown> },
}))

// signInFailure() tests `error instanceof OidcError`, so the mock must export a real class
// (an undefined right-hand side of instanceof throws rather than returning false).
vi.mock('../services/oidc', () => ({
  oidcStart,
  oidcEndSession,
  oidcGrantStale,
  oidcMcpDetailReady,
  oidcActor,
  oidcClearLocal: vi.fn(),
  oidcReconcileIssuer,
  oidcClaims,
  oidcActivateAccount,
  oidcSelectKnownAccount: vi.fn(),
  OidcError: class OidcError extends Error {},
}))
vi.mock('../helpers/stageHelper', () => ({ chooseStage, reloadIfStageChanged }))
vi.mock('../services/permitteerAccount', () => ({ signOutEverywhere }))
vi.mock('../services/accountSecurity', () => ({ changePassword }))
vi.mock('../services/Controller', () => ({
  default: { close: controllerClose, emitWithAck },
  emit: vi.fn(() => false),
}))
vi.mock('../services/CloudSync', () => ({ default: { reset: vi.fn() } }))
vi.mock('../services/cloudController', () => ({ default: { reset: vi.fn() } }))
vi.mock('../services/Network', () => ({ default: {} }))
vi.mock('../services/browser', () => ({ default: browser }))
vi.mock('../services/analytics', () => ({ default: {} }))
vi.mock('../services/zendesk', () => ({ default: { endChat: vi.fn() } }))
vi.mock('../services/graphQLRequest', () => ({ graphQLLogin: vi.fn() }))
vi.mock('../services/remoteit', () => ({ getToken: vi.fn(), apiAuthHeaders: vi.fn() }))
vi.mock('../selectors/devices', () => ({ selectDeviceModelAttributes: vi.fn() }))
vi.mock('../store', () => ({ persistor: { purge: vi.fn() }, store: { getState: () => storeState } }))
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
    auth: { set: vi.fn(), signedOut: vi.fn(), signOut: vi.fn(), releaseAgent: vi.fn(), switchAccount: vi.fn() },
    ui: { set: vi.fn(), setPersistent: vi.fn() },
    chat: { signOut: vi.fn() },
  }
}

// The only shape SignInApp renders: it shows a message ONLY while signInFailed is true, and
// signInFailed is also the brake on auto sign-in — so every failure writer must produce it.
const aFailureShowing = (signInError: string) => expect.objectContaining({ signInFailed: true, signInError })

// eslint-disable-next-line @typescript-eslint/no-var-requires
import authModel from './auth'
import { agentOwnedMessage } from '@common/agentOwner'

const effectsFor = (dispatch: any) => (authModel as any).effects(dispatch)

beforeEach(() => {
  oidcStart.mockReset()
  oidcEndSession.mockReset().mockResolvedValue(204)
  changePassword.mockReset()
  signOutEverywhere.mockReset().mockResolvedValue({ status: 200, body: { ended: 1, pool: 'skipped' } })
  oidcActor.mockReset().mockReturnValue(null)
  oidcGrantStale.mockReset()
  oidcMcpDetailReady.mockReset().mockResolvedValue('mcp_type')
  oidcReconcileIssuer.mockReset()
  chooseStage.mockReset()
  reloadIfStageChanged.mockReset()
  controllerClose.mockReset()
})

describe('auth model — sign-in always offers the chooser', () => {
  it('signIn authorizes with prompt=select_account (never a promptless / silent SSO)', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).signIn()
    expect(oidcStart).toHaveBeenCalledTimes(1)
    expect(oidcStart).toHaveBeenCalledWith({ prompt: 'select_account' })
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
    const [grant, session, local] = [
      dispatch.chat.signOut.mock.invocationCallOrder[0],
      oidcEndSession.mock.invocationCallOrder[0],
      dispatch.auth.signedOut.mock.invocationCallOrder[0],
    ]
    expect(grant).toBeLessThan(session)
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
    const [grant, everywhere, local] = [
      dispatch.chat.signOut.mock.invocationCallOrder[0],
      signOutEverywhere.mock.invocationCallOrder[0],
      dispatch.auth.signOut.mock.invocationCallOrder[0],
    ]
    expect(grant).toBeLessThan(everywhere)
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

describe('auth model — a dropped, unauthenticated backend socket still explains itself', () => {
  const unauthenticated = { auth: { authenticated: false, backendAuthenticated: false } }
  beforeEach(() => {
    browser.hasBackend = true // the disconnect teardown is the electron/backend branch
  })
  afterEach(() => {
    browser.hasBackend = false
    storeState.auth = {}
  })

  it('records the generic failure (signInFailed) after teardown when nothing more specific is on screen', async () => {
    storeState.auth = { signInFailed: false }
    const dispatch = makeDispatch()
    await effectsFor(dispatch).disconnect(undefined, unauthenticated)
    expect(dispatch.auth.signedOut).toHaveBeenCalledTimes(1)
    expect(dispatch.auth.set).toHaveBeenCalledWith(aFailureShowing('Sign in failed, please try again.'))
  })

  it("carries a specific failure already recorded (backendSignInError's) through the teardown instead of wiping it", async () => {
    // disconnect fires right behind backendSignInError when the rejected socket drops; the
    // invocation-time snapshot predates that message, so it must read the LIVE store.
    storeState.auth = { signInFailed: true, signInError: 'backend said no' }
    const dispatch = makeDispatch()
    await effectsFor(dispatch).disconnect(undefined, unauthenticated)
    expect(dispatch.auth.set).toHaveBeenCalledWith(aFailureShowing('backend said no'))
    expect(dispatch.auth.set).not.toHaveBeenCalledWith(aFailureShowing('Sign in failed, please try again.'))
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
    const fns: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {}
    const dispatch = new Proxy(fns, {
      get: (models, model: string) =>
        (models[model] ??= new Proxy({} as Record<string, ReturnType<typeof vi.fn>>, {
          get: (calls, fn: string) => (calls[fn] ??= vi.fn()),
        })),
    })
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

/* On desktop the account leaving signs the agent out from its own window before any switch, so the
   agent only moves on its owner's credentials. */
describe('auth model — switching accounts releases the agent first', () => {
  beforeEach(() => {
    emitWithAck.mockReset()
    oidcStart.mockReset()
    oidcClaims.mockReset()
    oidcActivateAccount.mockReset()
  })

  it('a window signed in to the backend asks it to release the agent', async () => {
    emitWithAck.mockResolvedValue(true)
    const dispatch = makeDispatch()
    expect(await effectsFor(dispatch).releaseAgent(undefined, { auth: { backendAuthenticated: true } })).toBe(true)
    expect(emitWithAck).toHaveBeenCalledWith('agent/release', 1000)
    expect(dispatch.auth.set).toHaveBeenCalledWith({ backendAuthenticated: false })
  })

  it('a release the backend refuses or never answers stops the switch and says so', async () => {
    emitWithAck.mockResolvedValue(undefined)
    const dispatch = makeDispatch()
    expect(await effectsFor(dispatch).releaseAgent(undefined, { auth: { backendAuthenticated: true } })).toBe(false)
    expect(dispatch.ui.set).toHaveBeenCalledWith({ errorMessage: 'notices:auth.agentReleaseFailed' })
  })

  it('without a signed-in backend there is nothing to release', async () => {
    const dispatch = makeDispatch()
    expect(await effectsFor(dispatch).releaseAgent(undefined, { auth: { backendAuthenticated: false } })).toBe(true)
    expect(emitWithAck).not.toHaveBeenCalled()
  })

  it('the chooser opens only once the agent is released', async () => {
    const dispatch = makeDispatch()
    dispatch.auth.releaseAgent.mockResolvedValue(false)
    await effectsFor(dispatch).switchAccount()
    expect(oidcStart).not.toHaveBeenCalled()

    dispatch.auth.releaseAgent.mockResolvedValue(true)
    await effectsFor(dispatch).switchAccount()
    expect(oidcStart).toHaveBeenCalledTimes(1)
  })

  it('a saved account activates only once the agent is released', async () => {
    oidcActivateAccount.mockReturnValue(false)
    const dispatch = makeDispatch()
    dispatch.auth.releaseAgent.mockResolvedValue(false)
    await effectsFor(dispatch).activateAccount('sub-b')
    expect(oidcActivateAccount).not.toHaveBeenCalled()

    dispatch.auth.releaseAgent.mockResolvedValue(true)
    await effectsFor(dispatch).activateAccount('sub-b')
    expect(oidcActivateAccount).toHaveBeenCalledWith('sub-b')
  })
})
