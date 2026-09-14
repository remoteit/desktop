import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The auth model pulls in the whole service layer at import time; stub everything the module
// touches so we can exercise the sign-in / sign-out EFFECTS in isolation. Only the two OIDC
// functions the tests assert on carry real spies — declared via vi.hoisted so they exist before
// the hoisted vi.mock factory runs. `browser` and the live `store` state are hoisted MUTABLE
// objects so individual tests can steer the electron/backend branch and what the effects
// re-read from the store after a teardown.
const { oidcStart, oidcEndSessionSilently, oidcGrantStale, oidcMcpDetailReady, browser, storeState } = vi.hoisted(() => ({
  oidcStart: vi.fn(),
  oidcEndSessionSilently: vi.fn(),
  oidcGrantStale: vi.fn(),
  oidcMcpDetailReady: vi.fn(),
  browser: { isElectron: false, hasBackend: false },
  storeState: { auth: {} as Record<string, unknown> },
}))

// signInFailure() tests `error instanceof OidcError`, so the mock must export a real class
// (an undefined right-hand side of instanceof throws rather than returning false).
vi.mock('../services/oidc', () => ({
  oidcStart,
  oidcEndSessionSilently,
  oidcGrantStale,
  oidcMcpDetailReady,
  OidcError: class OidcError extends Error {},
}))
vi.mock('../services/Controller', () => ({ default: {}, emit: vi.fn(() => false) }))
vi.mock('../services/CloudSync', () => ({ default: {} }))
vi.mock('../services/cloudController', () => ({ default: {} }))
vi.mock('../services/Network', () => ({ default: {} }))
vi.mock('../services/browser', () => ({ default: browser }))
vi.mock('../services/analytics', () => ({ default: {} }))
vi.mock('../services/zendesk', () => ({ default: {} }))
vi.mock('../services/graphQLRequest', () => ({ graphQLLogin: vi.fn() }))
vi.mock('../services/remoteit', () => ({ getToken: vi.fn(), apiAuthHeaders: vi.fn() }))
vi.mock('../selectors/devices', () => ({ selectDeviceModelAttributes: vi.fn() }))
vi.mock('../store', () => ({ persistor: { purge: vi.fn() }, store: { getState: () => storeState } }))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))
vi.mock('../constants', () => ({ API_URL: '', DEVELOPER_KEY: '', SIGN_OUT_BACKEND_TIMEOUT: 1000 }))
vi.mock('axios', () => ({ default: {} }))

// The effects are `dispatch => ({...})`; build them against a fake dispatch so each auth.*
// call is an observable spy rather than a real reducer/effect.
function makeDispatch() {
  return { auth: { set: vi.fn(), signedOut: vi.fn(), signOut: vi.fn() }, ui: { set: vi.fn() } }
}

// The only shape SignInApp renders: it shows a message ONLY while signInFailed is true, and
// signInFailed is also the brake on auto sign-in — so every failure writer must produce it.
const aFailureShowing = (signInError: string) => expect.objectContaining({ signInFailed: true, signInError })

// eslint-disable-next-line @typescript-eslint/no-var-requires
import authModel from './auth'

const effectsFor = (dispatch: any) => (authModel as any).effects(dispatch)

beforeEach(() => {
  oidcStart.mockReset()
  oidcEndSessionSilently.mockReset()
  oidcGrantStale.mockReset()
  oidcMcpDetailReady.mockReset().mockResolvedValue('mcp_type')
})

describe('auth model — sign-in always offers the chooser', () => {
  it('signIn authorizes with prompt=select_account (never a promptless / silent SSO)', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).signIn()
    expect(oidcStart).toHaveBeenCalledTimes(1)
    expect(oidcStart).toHaveBeenCalledWith({ prompt: 'select_account' })
  })
})

describe('auth model — sign-out is local to the app', () => {
  it('signOut does NOT end the AS session (no oidcEndSessionSilently)', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).signOut(undefined, { auth: { backendAuthenticated: false } })
    expect(oidcEndSessionSilently).not.toHaveBeenCalled()
    // Local teardown still happens.
    expect(dispatch.auth.signedOut).toHaveBeenCalledTimes(1)
  })
})

describe('auth model — "Sign out everywhere" stays AS-wide', () => {
  it('globalSignOut ends the AS session BEFORE local teardown', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).globalSignOut()
    expect(oidcEndSessionSilently).toHaveBeenCalledTimes(1)
    expect(dispatch.auth.signOut).toHaveBeenCalledTimes(1)
    // Order matters: the AS logout must precede the local sign-out.
    expect(oidcEndSessionSilently.mock.invocationCallOrder[0]).toBeLessThan(
      dispatch.auth.signOut.mock.invocationCallOrder[0]
    )
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

  it('signInError writes the signInFailure shape, never a bare signInError string', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).signInError('locked')
    expect(dispatch.auth.set).toHaveBeenCalledWith(aFailureShowing('locked'))
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
