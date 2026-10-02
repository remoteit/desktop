import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./browser', () => ({ default: {}, leaveTo: vi.fn() }))
vi.mock('./chatPopout', () => ({ isChatPopout: false }))
vi.mock('../i18n', () => ({ default: { language: 'en' } }))
vi.stubGlobal(
  'fetch',
  vi.fn(() => Promise.reject(new Error('offline')))
)

import { oidcReconcileIssuer, oidcSignedIn, oidcAccounts } from './oidc'
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

  it('keeps a session the running login server issued', () => {
    signIn()
    window.localStorage.setItem('oidc.issuer', OAUTH_ISSUER)
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
