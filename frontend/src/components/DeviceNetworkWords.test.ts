import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/post', () => ({}))
vi.mock('../services/graphQL', () => ({}))
vi.mock('../services/graphQLDaemon', () => ({}))
vi.mock('../services/productPolicy', () => ({}))

import { networkSummary, ruleSentence } from './DeviceNetworkWords'

const t = ((_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any

const rule = (extra: any = {}) => ({
  tags: ['plant-2'],
  operator: 'ANY' as const,
  initiator: false,
  allServices: false,
  anyPort: false,
  ...extra,
})

describe('tag rule sentences', () => {
  it('says what devices with the tag do', () => {
    expect(ruleSentence(t, rule({ allServices: true }))).toBe('Devices tagged plant-2 can be reached: all services.')
    expect(ruleSentence(t, rule({ allServices: true, anyPort: true }))).toBe(
      'Devices tagged plant-2 can be reached: all services and any port.'
    )
    expect(ruleSentence(t, rule({ initiator: true }))).toBe('Devices tagged plant-2 can reach this network.')
    expect(ruleSentence(t, rule({ initiator: true, allServices: true }))).toBe(
      'Devices tagged plant-2 can reach this network and can be reached: all services.'
    )
    expect(ruleSentence(t, rule())).toBe(
      'Devices tagged plant-2 are on this network, but can’t reach or be reached yet.'
    )
  })

  it('joins several tags as the rule matches them', () => {
    expect(ruleSentence(t, rule({ tags: ['lab', 'laptops'], initiator: true }))).toBe(
      'Devices tagged lab or laptops can reach this network.'
    )
    expect(ruleSentence(t, rule({ tags: ['lab', 'laptops'], operator: 'ALL', initiator: true }))).toBe(
      'Devices tagged lab and laptops can reach this network.'
    )
  })
})

describe('a network’s row in the list', () => {
  const network = (extra: any = {}) => ({
    owner: { id: 'O', email: 'o@x' },
    devices: [],
    deviceRules: [],
    access: [],
    accountAccess: [],
    ...extra,
  })
  it('says how many devices and people', () => {
    expect(networkSummary(t, network())).toBe('No devices yet · 1 person')
    expect(
      networkSummary(
        t,
        network({
          devices: [{ deviceId: 'A' }],
          deviceRules: [{ devices: ['A', 'B', 'C'] }],
          access: [{ user: { id: 'P', email: 'p@x' } }, { user: { id: 'Q', email: 'q@x' } }],
        })
      )
    ).toBe('3 devices · 3 people')
    expect(networkSummary(t, network({ devices: [{ deviceId: 'A' }] }))).toBe('1 device · 1 person')
  })
})
