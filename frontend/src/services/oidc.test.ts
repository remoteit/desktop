import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./browser', () => ({ default: {}, leaveTo: vi.fn() }))
vi.mock('./chatPopout', () => ({ isChatPopout: false }))
vi.mock('../i18n', () => ({ default: { language: 'en' } }))
vi.stubGlobal(
  'fetch',
  vi.fn(() => Promise.reject(new Error('offline')))
)

import { oidcReconcileIssuer, oidcSignedIn, oidcAccounts, oidcStart, oidcReopen, oidcCompleteFromUrl } from './oidc'
import { leaveTo } from './browser'
import { OAUTH_ISSUER } from '../constants'

const OTHER = 'https://login.other.test'
const idToken = (sub: string, iss: string | null) =>
  ['e30', btoa(JSON.stringify({ sub, iss: iss ?? undefined, email: `${sub}@x.test` })).replace(/=+$/, ''), 'sig'].join(
    '.'
  )
const signIn = (active: string | null = OAUTH_ISSUER, saved: string | null = OAUTH_ISSUER) => {
  window.localStorage.setItem('oidc.tokens', JSON.stringify({ refresh_token: 'r1', id_token: idToken('a', active) }))
  window.localStorage.setItem(
    'oidc.accounts',
    JSON.stringify({
      a: { refresh_token: 'r1', id_token: idToken('a', active) },
      b: { refresh_token: 'r2', id_token: idToken('b', saved) },
    })
  )
}

describe('oidcReconcileIssuer', () => {
  beforeEach(() => window.localStorage.clear())

  it('keeps a session across boots on the same login server', () => {
    signIn()
    oidcReconcileIssuer()
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(true)
    expect(oidcAccounts()).toHaveLength(2)
  })

  it('adopts an install that predates the record, without signing it out', () => {
    signIn()
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(true)
    expect(oidcAccounts()).toHaveLength(2)
    expect(window.localStorage.getItem('oidc.issuer')).toBe(OAUTH_ISSUER)
  })

  it('adopts tokens that carry no issuer at all', () => {
    signIn(null, null)
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(true)
    expect(oidcAccounts()).toHaveLength(2)
  })

  it('judges a session stored before the record by its own issuer', () => {
    signIn(OTHER, OTHER)
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(false)
    expect(oidcAccounts()).toHaveLength(0)
  })

  it('drops only the saved accounts another login server issued', () => {
    signIn(OAUTH_ISSUER, OTHER)
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(true)
    expect(oidcAccounts().map(account => account.sub)).toEqual(['a'])
  })

  it('drops the session and every saved account once the marker names another login server', () => {
    signIn()
    window.localStorage.setItem('oidc.issuer', OTHER)
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(false)
    expect(oidcAccounts()).toHaveLength(0)
    expect(window.localStorage.getItem('oidc.issuer')).toBe(OAUTH_ISSUER)
  })
})

describe('oidcReopen', () => {
  const sharedFlows = () => Object.keys(window.localStorage).filter(key => key.startsWith('oidc.flow:'))

  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    vi.mocked(leaveTo).mockClear()
    vi.mocked(fetch).mockImplementation(url =>
      String(url).endsWith('/.well-known/openid-configuration')
        ? Promise.resolve(new Response(JSON.stringify({ authorization_endpoint: 'https://login.test/authorize' })))
        : Promise.reject(new Error('offline'))
    )
  })
  afterEach(() => vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error('offline'))))

  it('sends the person back to the outstanding authorize without starting another flow', async () => {
    expect(await oidcStart()).toBe(true)
    const flows = sharedFlows()

    expect(await oidcReopen()).toBe(true)
    expect(leaveTo).toHaveBeenCalledTimes(2)
    expect(vi.mocked(leaveTo).mock.calls[1][0]).toBe(vi.mocked(leaveTo).mock.calls[0][0])
    expect(sharedFlows()).toEqual(flows)
  })

  it('resolves false when no flow is outstanding', async () => {
    expect(await oidcReopen()).toBe(false)
    expect(leaveTo).not.toHaveBeenCalled()
  })
})

describe('oidcCompleteFromUrl with no flow for the callback', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    vi.mocked(fetch).mockClear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.history.replaceState({}, '', '/?code=c2&state=already-used')
  })

  it('ignores the callback when a session is already stored, so the first tab’s sign-in stands', async () => {
    signIn()
    await expect(oidcCompleteFromUrl()).resolves.toBeUndefined()
    expect(window.location.search).toBe('')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('still fails as expired when no session is stored', async () => {
    await expect(oidcCompleteFromUrl()).rejects.toMatchObject({ code: 'expired' })
    expect(window.location.search).toBe('')
  })
})
