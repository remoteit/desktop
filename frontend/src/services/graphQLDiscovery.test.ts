import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request, uiSet } = vi.hoisted(() => ({ request: vi.fn(), uiSet: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: uiSet, deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { UNSUPPORTED } from './graphQLDaemon'
import { DiscoveryOffer, graphQLDiscover, groupDiscovery, offerService } from './graphQLDiscovery'

const offer = (more: Partial<DiscoveryOffer>): DiscoveryOffer => ({
  kind: 'network',
  type: '_http._tcp',
  name: 'Web',
  host: 'nas.local',
  addresses: ['192.168.1.20'],
  port: 80,
  protocol: 'tcp',
  application: 7,
  process: null,
  tls: null,
  txt: null,
  ...more,
})

beforeEach(() => {
  request.mockReset()
  uiSet.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('asking a device what it sees', () => {
  it('returns what graphql answers, for the device asked', async () => {
    const discovery = { at: '2026-10-21T17:00:00Z', offers: [offer({})], withheld: [] }
    request.mockResolvedValue({ data: { data: { discover: discovery } }, headers: {} })
    expect(await graphQLDiscover('80:00:00:00:0F:0D:00:02')).toEqual(discovery)
    expect(request.mock.calls[0][0].data.variables).toEqual({ deviceId: '80:00:00:00:0F:0D:00:02' })
  })

  it('an offline device or no answer: said for the page, with no error banner', async () => {
    request.mockResolvedValue({
      data: {
        errors: [
          {
            message: 'Invalid Arguments: deviceId',
            extensions: { code: 'INVALID_ARGUMENT', args: ['deviceId'], reason: 'the device is offline' },
          },
        ],
      },
      headers: {},
    })
    expect(await graphQLDiscover('D')).toMatchObject({ error: 'OFFLINE' })
    request.mockResolvedValue({
      data: {
        errors: [
          {
            message: 'Invalid Arguments: deviceId',
            extensions: { code: 'INVALID_ARGUMENT', args: ['deviceId'], reason: 'the device did not answer' },
          },
        ],
      },
      headers: {},
    })
    expect(await graphQLDiscover('D')).toMatchObject({ error: 'NO_ANSWER' })
    request.mockResolvedValue({ data: { errors: [{ message: 'Forbidden' }] }, headers: {} })
    expect(await graphQLDiscover('D')).toMatchObject({ error: 'ERROR' })
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('an API without discover: UNSUPPORTED', async () => {
    request.mockResolvedValue({
      data: { errors: [{ message: 'Cannot query field "discover" on type "Query".' }] },
      headers: {},
    })
    expect(await graphQLDiscover('D')).toBe(UNSUPPORTED)
  })
})

describe('the answer grouped by machine', () => {
  it('network instances under the host that advertises them, listeners on their own', () => {
    const { machines, local } = groupDiscovery([
      offer({ name: 'NAS web', port: 443, application: 8 }),
      offer({ kind: 'local', type: 'tcp', name: 'sshd', host: '127.0.0.1', addresses: ['0.0.0.0'], port: 22 }),
      offer({ name: 'Brother', host: 'brother.local', addresses: ['192.168.1.30'], port: 631, application: 50 }),
      offer({ name: 'NAS ssh', addresses: ['192.168.1.20', 'fe80::1'], port: 22, application: 28 }),
      offer({ name: 'Bare', host: '', addresses: ['192.168.1.40'], port: 8080 }),
    ])
    expect(machines.map(m => [m.key, m.name])).toEqual([
      ['192.168.1.40', '192.168.1.40'],
      ['brother.local', 'brother'],
      ['nas.local', 'nas'],
    ])
    const nas = machines[2]
    expect(nas.addresses).toEqual(['192.168.1.20', 'fe80::1'])
    expect(nas.offers.map(o => o.port)).toEqual([22, 443])
    expect(local.map(o => o.name)).toEqual(['sshd'])
  })
})

describe('an offer as the service it adds', () => {
  it('its suggested type, host, port and a name the form takes', () => {
    expect(
      offerService(offer({ name: "Brother HL-L2350 (Kitchen's)", host: 'brother.local', port: 631, application: 50 }))
    ).toEqual({
      typeID: 50,
      host: 'brother.local',
      port: 631,
      name: 'Brother HL-L2350 Kitchens',
    })
  })
})
