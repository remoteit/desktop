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

const idToken = (sub: string) =>
  ['e30', btoa(JSON.stringify({ sub, email: `${sub}@x.test` })).replace(/=+$/, ''), 'sig'].join('.')
const signIn = () => {
  window.localStorage.setItem('oidc.tokens', JSON.stringify({ refresh_token: 'r1', id_token: idToken('a') }))
  window.localStorage.setItem(
    'oidc.accounts',
    JSON.stringify({
      a: { refresh_token: 'r1', id_token: idToken('a') },
      b: { refresh_token: 'r2', id_token: idToken('b') },
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
    expect(window.localStorage.getItem('oidc.issuer')).toBe(OAUTH_ISSUER)
  })

  it('drops the session and every saved account another login server issued', () => {
    signIn()
    window.localStorage.setItem('oidc.issuer', 'https://login.other.test')
    oidcReconcileIssuer()
    expect(oidcSignedIn()).toBe(false)
    expect(oidcAccounts()).toHaveLength(0)
    expect(window.localStorage.getItem('oidc.issuer')).toBe(OAUTH_ISSUER)
  })
})
