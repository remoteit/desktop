import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request, isAxiosError: () => false } }))

import { deviceSignInsServed, graphQLDeviceSignIns, resetDeviceSignIns } from './deviceSignIns'
import { personName, signInByName } from '../helpers/signInHelper'

// Sign-ins per OS account (graphql-api docs/PROXY-GROUPS.md §15): Device.signIns, asked only where the schema has it.
const schema = (fields: string[]) => ({ data: { data: { device: { fields: fields.map(name => ({ name })) } } } })
const pat = { account: '501', name: 'pat', person: { id: 'PAT', email: 'pat@example.com' }, since: '2026-11-10T20:00:00Z', manages: true }
const sam = { account: 'S-1-5-21-1-2-3-1013', name: 'DESKTOP-7\\sam', person: { id: 'SAM', email: null }, since: null, manages: false }
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

describe('the sign-in an OS name says', () => {
  it('by its account’s name, either case, with or without a Windows domain on either side', () => {
    expect(signInByName([pat, sam], 'pat')).toBe(pat)
    expect(signInByName([pat, sam], 'PAT')).toBe(pat)
    expect(signInByName([pat, sam], 'sam')).toBe(sam)
    expect(signInByName([pat, sam], 'desktop-7\\Sam')).toBe(sam)
    expect(signInByName([pat, sam], 'root')).toBeUndefined()
    expect(signInByName(null, 'pat')).toBeUndefined()
    expect(signInByName([pat], null)).toBeUndefined()
  })

  it('named by the person’s email, else the account’s name', () => {
    expect(personName(pat)).toBe('pat@example.com')
    expect(personName(sam)).toBe('DESKTOP-7\\sam')
    expect(personName(undefined)).toBeUndefined()
  })
})
