import { describe, it, expect, vi, beforeEach } from 'vitest'

const { oidcResourceRequest } = vi.hoisted(() => ({ oidcResourceRequest: vi.fn() }))
vi.mock('./oidc', () => ({ oidcResourceRequest }))
vi.mock('../constants', () => ({
  OAUTH_ACCOUNT_RESOURCE: 'https://login.test/account/api',
  OAUTH_ISSUER: 'https://login.test',
}))

import * as account from './accountSecurity'

const sent = () => {
  const [resource, path, init] = oidcResourceRequest.mock.calls.at(-1)!
  return { resource, path, method: init.method, body: init.body ? JSON.parse(init.body) : undefined }
}

beforeEach(() => oidcResourceRequest.mockReset().mockResolvedValue({ status: 200, body: {} }))

describe('the account API calls', () => {
  it('changes the password on the account API, not on a Passport host', async () => {
    await account.changePassword('old-one', 'new-one')
    expect(sent()).toEqual({
      resource: 'https://login.test/account/api',
      path: '/credential/password',
      method: 'POST',
      body: { current_password: 'old-one', new_password: 'new-one' },
    })
  })

  it('carries a recovery code in the change it pays for, and only then', async () => {
    await account.removeFactor('store-sms', 'ABCD-1234')
    expect(sent()).toMatchObject({
      path: '/elevation/factors/store-sms',
      method: 'DELETE',
      body: { recoveryCode: 'ABCD-1234' },
    })
    await account.preferFactor('f1')
    expect(sent()).toMatchObject({ path: '/elevation/factors/f1/preferred', method: 'PUT', body: {} })
    await account.addTotp('123456', 'ABCD-1234')
    expect(sent()).toMatchObject({ path: '/elevation/totp', body: { code: '123456', recoveryCode: 'ABCD-1234' } })
  })

  it('sends the phone only for a text-message factor the store will hold', async () => {
    await account.addStoreFactor('totp', 'pw')
    expect(sent().body).toEqual({ method: 'totp', password: 'pw' })
    await account.addStoreFactor('sms', 'pw', '+14155550100')
    expect(sent().body).toEqual({ method: 'sms', password: 'pw', phone: '+14155550100' })
  })

  it('answers the AS error code and its sentence', async () => {
    oidcResourceRequest.mockResolvedValue({
      status: 403,
      body: { error: 'elevation_required', error_description: 'confirm it is you' },
    })
    expect(await account.removeFactor('f1')).toEqual({
      ok: false,
      status: 403,
      error: 'elevation_required',
      description: 'confirm it is you',
    })
  })

  it('treats a request made with no token as unauthorized', async () => {
    oidcResourceRequest.mockResolvedValue({ status: 401 })
    expect(await account.elevationStatus()).toMatchObject({ ok: false, error: 'unauthorized' })
  })

  it('points somebody without a password at the AS’s own page', () => {
    expect(account.setPasswordUrl()).toBe('https://login.test/forgot')
  })
})
