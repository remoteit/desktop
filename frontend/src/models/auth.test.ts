import { describe, it, expect, vi, beforeEach } from 'vitest'

// The auth model pulls in the whole service layer at import time; stub everything the module
// touches so we can exercise the sign-in / sign-out EFFECTS in isolation. Only the two OIDC
// functions the tests assert on carry real spies — declared via vi.hoisted so they exist before
// the hoisted vi.mock factory runs.
const { oidcStart, oidcEndSessionSilently } = vi.hoisted(() => ({
  oidcStart: vi.fn(),
  oidcEndSessionSilently: vi.fn(),
}))

vi.mock('../services/oidc', () => ({ oidcStart, oidcEndSessionSilently }))
vi.mock('../services/Controller', () => ({ default: {}, emit: vi.fn(() => false) }))
vi.mock('../services/CloudSync', () => ({ default: {} }))
vi.mock('../services/cloudController', () => ({ default: {} }))
vi.mock('../services/Network', () => ({ default: {} }))
vi.mock('../services/browser', () => ({ default: { isElectron: false, hasBackend: false } }))
vi.mock('../services/analytics', () => ({ default: {} }))
vi.mock('../services/zendesk', () => ({ default: {} }))
vi.mock('../services/graphQLRequest', () => ({ graphQLLogin: vi.fn() }))
vi.mock('../services/remoteit', () => ({ getToken: vi.fn(), apiAuthHeaders: vi.fn() }))
vi.mock('../selectors/devices', () => ({ selectDeviceModelAttributes: vi.fn() }))
vi.mock('../store', () => ({ persistor: { purge: vi.fn() } }))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))
vi.mock('../constants', () => ({ API_URL: '', DEVELOPER_KEY: '', SIGN_OUT_BACKEND_TIMEOUT: 1000 }))
vi.mock('axios', () => ({ default: {} }))

// The effects are `dispatch => ({...})`; build them against a fake dispatch so each auth.*
// call is an observable spy rather than a real reducer/effect.
function makeDispatch() {
  return { auth: { set: vi.fn(), signedOut: vi.fn(), signOut: vi.fn() } }
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
import authModel from './auth'

const effectsFor = (dispatch: any) => (authModel as any).effects(dispatch)

beforeEach(() => {
  oidcStart.mockReset()
  oidcEndSessionSilently.mockReset()
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
