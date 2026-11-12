import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request, isAxiosError: () => false } }))

import {
  deviceSignInsServed,
  exitErrorFields,
  exitSignInFields,
  graphQLDeviceSignIns,
  resetDeviceSignIns,
  settingSignInFields,
} from './deviceSignIns'

// Sign-ins per OS account (graphql-api docs/PROXY-GROUPS.md §15): Device.signIns, asked only where the schema has it.
const named = (names: string[]) => ({ fields: names.map(name => ({ name })) })
const schema = (device: string[], setting: string[] = ['name', 'value']) => ({
  data: { data: { device: named(device), setting: named(setting) } },
})
const pat = {
  account: '501',
  name: 'pat',
  person: { id: 'PAT', email: 'pat@example.com' },
  since: '2026-11-10T20:00:00Z',
  manages: true,
}
const sam = {
  account: 'S-1-5-21-1-2-3-1013',
  name: 'DESKTOP-7\\sam',
  person: { id: 'SAM', email: null },
  since: null,
  manages: false,
}
const sent = (call: number) => request.mock.calls[call][0].data

beforeEach(() => {
  request.mockReset()
  resetDeviceSignIns()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('a device’s sign-ins per account', () => {
  it('an API without Device.signIns: none, and the device is never asked', async () => {
    request.mockResolvedValueOnce(schema(['id', 'actsFor']))
    expect(await deviceSignInsServed()).toBe(false)
    expect(await graphQLDeviceSignIns('LAPTOP')).toBeNull()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('one with it: each account, its name, the person, since when, and whether they manage the device', async () => {
    request
      .mockResolvedValueOnce(schema(['id', 'signIns']))
      .mockResolvedValueOnce({ data: { data: { login: { device: [{ id: 'LAPTOP', signIns: [pat, sam] }] } } } })
    expect(await graphQLDeviceSignIns('LAPTOP')).toEqual([pat, sam])
    expect(sent(1).query).toContain('signIns { account name person { id email } since manages }')
    expect(sent(1).variables).toEqual({ id: ['LAPTOP'] })
  })

  it('every part of a page asking at once: one read', async () => {
    request
      .mockResolvedValueOnce(schema(['signIns']))
      .mockResolvedValueOnce({ data: { data: { login: { device: [{ id: 'LAPTOP', signIns: [] }] } } } })
    const [a, b] = await Promise.all([graphQLDeviceSignIns('LAPTOP'), graphQLDeviceSignIns('LAPTOP')])
    expect(a).toEqual([])
    expect(b).toEqual([])
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('a probe that failed is asked again', async () => {
    request.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(schema(['signIns']))
    expect(await deviceSignInsServed()).toBe(false)
    expect(await deviceSignInsServed()).toBe(true)
  })

  it('a device not managed, or an error: none', async () => {
    request
      .mockResolvedValueOnce(schema(['signIns']))
      .mockResolvedValueOnce({ data: { data: { login: { device: [{ id: 'LAPTOP', signIns: null }] } } } })
    expect(await graphQLDeviceSignIns('LAPTOP')).toBeNull()
  })
})

describe('who set the exit and Protect on the machine', () => {
  it('asked for only where the API has each', async () => {
    request.mockResolvedValueOnce(
      schema(
        ['signIns', 'exitSetOnDeviceSignedIn', 'exitSetOnDeviceAdmin', 'exitThroughPerson'],
        ['name', 'signedIn', 'admin']
      )
    )
    expect(await exitSignInFields()).toBe(
      'exitSetOnDeviceSignedIn { id email } exitSetOnDeviceAdmin exitThroughPerson { id email }'
    )
    expect(await settingSignInFields()).toBe('signedIn { id email } admin')
    resetDeviceSignIns()
    request.mockResolvedValueOnce(schema(['signIns', 'exitThroughPerson']))
    expect(await exitSignInFields()).toBe('exitThroughPerson { id email }')
    expect(await settingSignInFields()).toBe('')
    resetDeviceSignIns()
    request.mockResolvedValueOnce(schema(['id']))
    expect(await exitSignInFields()).toBe('')
    expect(await settingSignInFields()).toBe('')
    expect(request).toHaveBeenCalledTimes(3)
  })
})

describe('why the exit is not working on the device', () => {
  it('asked for only where the API has Device.exitError, from the same probe', async () => {
    request.mockResolvedValueOnce(schema(['signIns', 'exitError']))
    expect(await exitErrorFields()).toBe('exitError { code message at }')
    expect(await exitSignInFields()).toBe('')
    resetDeviceSignIns()
    request.mockResolvedValueOnce(schema(['signIns']))
    expect(await exitErrorFields()).toBe('')
    expect(request).toHaveBeenCalledTimes(2)
  })
})
