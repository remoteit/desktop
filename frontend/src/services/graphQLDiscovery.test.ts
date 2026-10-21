import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request, uiSet } = vi.hoisted(() => ({ request: vi.fn(), uiSet: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: uiSet, deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))
vi.mock('../i18n', () => ({
  default: { t: (_key: string, text: string, values: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '') },
}))

import { UNSUPPORTED } from './graphQLDaemon'
import {
  DiscoveryOffer,
  graphQLDiscover,
  groupDiscovery,
  looksGenerated,
  machineName,
  offerRank,
  offerService, offerServiceName } from './graphQLDiscovery'

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

  it('asks for the ranked fields; an API before them is asked again without', async () => {
    const discovery = { at: null, offers: [offer({})], withheld: [] }
    request
      .mockResolvedValueOnce({
        data: { errors: [{ message: 'Cannot query field "label" on type "DiscoveryOffer".' }] },
      })
      .mockResolvedValueOnce({ data: { data: { discover: discovery } }, headers: {} })
    expect(await graphQLDiscover('D')).toEqual(discovery)
    expect(request.mock.calls[0][0].data.query).toContain('label rank note model')
    expect(request.mock.calls[1][0].data.query).not.toContain('label')
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
      offer({ name: '9cac2320b29b', host: '', addresses: ['fe80::2', '192.168.1.40'], port: 8080, application: 1 }),
    ])
    expect(machines.map(m => [m.key, m.name])).toEqual([
      ['brother.local', 'Brother'],
      ['nas.local', 'NAS ssh'],
      // only a bare socket: nothing likely, so last
      ['fe80::2', 'Device at 192.168.1.40'],
    ])
    const nas = machines[1]
    expect(nas.addresses).toEqual(['192.168.1.20', 'fe80::1'])
    expect(nas.offers.map(o => o.port)).toEqual([22, 443])
    expect(local.map(o => o.name)).toEqual(['sshd'])
  })

  it('machines with a likely offer first, by name; the rest after, by name', () => {
    const { machines } = groupDiscovery([
      offer({ name: 'Zebra', host: 'zebra.local', rank: 'likely' }),
      offer({ name: 'Apple TV', host: 'atv.local', rank: 'other' }),
      offer({ name: 'Alpha', host: 'alpha.local', rank: 'likely' }),
      offer({ name: 'Cast', host: 'cast.local', rank: 'hidden' }),
    ])
    expect(machines.map(m => m.name)).toEqual(['Alpha', 'Zebra', 'Apple TV', 'Cast'])
  })
})

describe('an offer’s rank', () => {
  it('graphql’s, else likely for a type it knows and other for a bare TCP or UDP socket', () => {
    expect(offerRank(offer({ rank: 'hidden' }))).toBe('hidden')
    expect(offerRank(offer({ application: 7 }))).toBe('likely')
    expect(offerRank(offer({ application: 1 }))).toBe('other')
    expect(offerRank(offer({ application: 32769 }))).toBe('other')
  })
})

describe('a machine’s name', () => {
  it('a generated name is not a human one', () => {
    for (const name of [
      '0176601908270003',
      '9cac2320b29b',
      '9CAC2320B29B4F1A',
      'brwa8a795a76b38',
      '123e4567-e89b-12d3-a456-426614174000',
      '123E4567E89B12D3A456426614174000',
      'Printer 0176601908',
      '',
    ])
      expect([name, looksGenerated(name)]).toEqual([name, true])
    for (const name of ['DSM', 'Living Room TV', 'Brother MFC-L2740DW series', 'nas', 'MFCL2740DW', 'Philips Hue'])
      expect([name, looksGenerated(name)]).toEqual([name, false])
  })

  it('the name its instances share, then a model, then its .local name, else its address', () => {
    const brother = (name: string, more: Partial<DiscoveryOffer> = {}) =>
      offer({ name, host: 'brwa8a795a76b38.local', ...more })
    expect(
      machineName(
        'brwa8a795a76b38.local',
        [],
        [brother('Brother MFC-L2740DW series'), brother('Scanner'), brother('Brother MFC-L2740DW series')]
      )
    ).toBe('Brother MFC-L2740DW series')
    expect(
      machineName(
        'brwa8a795a76b38.local',
        [],
        [brother('0176601908270003'), brother('9cac2320b29b', { model: 'Brother MFC-L2740DW series' })]
      )
    ).toBe('Brother MFC-L2740DW series')
    expect(machineName('nas.local', [], [offer({ name: '9cac2320b29b' })])).toBe('nas')
    expect(machineName('brwa8a795a76b38.local', ['fe80::1', '192.168.1.30'], [brother('9cac2320b29b')])).toBe(
      'Device at 192.168.1.30'
    )
    expect(machineName('192.168.1.40', ['192.168.1.40'], [offer({ name: '' })])).toBe('Device at 192.168.1.40')
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

describe('offerServiceName', () => {
  const brother = 'Brother MFC-L2740DW series'
  const o = (fields: any) => ({ kind: 'network', name: brother, label: 'Printer', port: 631, protocol: 'tcp', ...fields })
  it('is the label on a virtual device when the instance only repeats the machine', () => {
    expect(offerServiceName(o({}), brother, { onVirtualDevice: true })).toBe('Printer')
    expect(offerServiceName(o({ label: 'Web admin', port: 80 }), brother, { onVirtualDevice: true })).toBe('Web admin')
  })
  it("is the machine's name and the label on the device that sees it", () => {
    expect(offerServiceName(o({}), brother)).toBe('Brother MFC-L2740DW series Printer')
  })
  it("keeps an instance's own name where it says more", () => {
    expect(offerServiceName(o({ name: 'DSM', label: 'Web admin', port: 5000 }), 'Office NAS', { onVirtualDevice: true })).toBe('DSM')
  })
  it('passes over a generated instance name, and names a listener by its label', () => {
    expect(offerServiceName(o({ name: '0176601908270003', label: 'Web admin' }), 'Hue Bridge', { onVirtualDevice: true })).toBe('Web admin')
    expect(offerServiceName({ kind: 'local', name: 'sshd', label: 'SSH', port: 22 } as any)).toBe('SSH')
    expect(offerServiceName({ kind: 'network', name: '', port: 8080, protocol: 'tcp' } as any)).toBe('TCP 8080')
  })
})
