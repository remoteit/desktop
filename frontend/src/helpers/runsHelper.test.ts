import { describe, it, expect } from 'vitest'
import {
  availabilityLabel,
  availabilityLine,
  deleteExitLines,
  deleteProxyLine,
  effectLines,
  endpointsLine,
  runDetail,
  runStateLabel,
  runsOnLine,
  stillRunsLine,
  usersLine,
} from './runsHelper'
import type { DeviceActionEffect, DeviceRuns } from '../services/graphQLDeviceRuns'

// As i18next fills a key's English default: a string with its values, or a count's one or other form.
const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
const t = ((_key: string, a: any, b?: any) =>
  typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a)) as any

const run = (fields: any = {}) => ({ state: 'ACTIVE' as const, joining: false, checks: [], ...fields })
const effect = (fields: Partial<DeviceActionEffect> = {}): DeviceActionEffect => ({
  kind: 'exit',
  id: 'xmac',
  name: 'Office Mac',
  state: 'ACTIVE',
  after: 'retired',
  sessions: 0,
  ends: true,
  endpoints: 0,
  users: 0,
  moved: 0,
  inService: 1,
  dormant: false,
  refusal: null,
  ...fields,
})

describe('a device’s state in what it runs', () => {
  it('in a word: disabled before anything else, then joining, in service, draining or retired', () => {
    expect(runStateLabel(t, run())).toBe('In service')
    expect(runStateLabel(t, run({ state: 'DRAINING' }))).toBe('Draining')
    expect(runStateLabel(t, run({ state: 'RETIRED' }))).toBe('Retired')
    expect(runStateLabel(t, run({ state: 'RETIRED', joining: true }))).toBe('Joining')
    expect(runStateLabel(t, run({ joining: true, disabled: true }))).toBe('Disabled')
  })

  it('what a joining device waits for: its checks failed, apart from those pending — waiting, nothing to put right', () => {
    const checks = [
      { name: 'health', passed: true, pending: false, reason: 'online' },
      { name: 'nat', passed: false, pending: false, reason: 'its NAT rewrites ports' },
      { name: 'policy', passed: false, pending: true, reason: 'the machine turns its exit node on itself' },
    ]
    expect(runDetail(t, run({ joining: true, checks }))).toBe(
      'Its checks fail: its NAT rewrites ports · Waiting: the machine turns its exit node on itself'
    )
    expect(runDetail(t, run({ joining: true, checks: [checks[0], checks[2]] }))).toBe(
      'Waiting: the machine turns its exit node on itself'
    )
    expect(runDetail(t, run({ joining: true, checks: [checks[0], checks[1]] }))).toBe(
      'Its checks fail: its NAT rewrites ports'
    )
    expect(runDetail(t, run({ joining: true, checks: [checks[0]] }), 'admin')).toBe(
      'Its checks pass: it waits for an admin to put it in service'
    )
    expect(runDetail(t, run({ joining: true }), 'auto')).toBe('Its checks pass: it goes into service by itself')
  })

  it('a disabled device serves nothing, whatever its state there', () => {
    expect(runDetail(t, run({ disabled: true }))).toBe('Its device is disabled: it serves nothing until it is restored')
  })

  it('what a draining or retired device does, and why a device in service takes no traffic', () => {
    expect(runDetail(t, run({ state: 'DRAINING' }))).toBe('Takes nothing new, and serves what it has')
    expect(runDetail(t, run({ state: 'RETIRED' }))).toBe('Serves nothing')
    expect(runDetail(t, run({ refusal: 'nat-rewrites-ports' }))).toBe('Takes no traffic now: nat-rewrites-ports')
    expect(runDetail(t, run())).toBe('')
  })
})

describe('an exit or a proxy in a line', () => {
  it('the devices it runs on, by name; none for one the reader does not manage', () => {
    expect(runsOnLine(t, [{ id: 'A', name: 'Office Mac' }, { id: 'B', name: null }])).toBe('Runs on Office Mac, B')
    expect(runsOnLine(t, [])).toBe('Runs on no device')
    expect(runsOnLine(t, null)).toBe('')
  })

  it('an exit’s users and a proxy’s endpoints, counted', () => {
    expect(usersLine(t, 1)).toBe('1 device uses it as its exit')
    expect(usersLine(t, 3)).toBe('3 devices use it as their exit')
    expect(usersLine(t, 0)).toBe('No device uses it as its exit')
    expect(usersLine(t, null)).toBe('')
    expect(endpointsLine(t, 2)).toBe('2 endpoints')
    expect(endpointsLine(t, 0)).toBe('No endpoints')
  })

  it('no device available for an exit none of whose devices carries its traffic; nothing to say of one offered', () => {
    expect(availabilityLabel(t, { offered: false, dormant: true })).toBe('No device available')
    expect(availabilityLine(t, { offered: false, dormant: true })).toBe(
      'No device available: none of its devices carries its traffic, so the devices using it go their usual way until one does.'
    )
    expect(availabilityLabel(t, { offered: false, dormant: false })).toBe('Not taking traffic now')
    expect(availabilityLabel(t, { offered: true, dormant: false })).toBe('')
    expect(availabilityLine(t, { offered: true, dormant: false })).toBe('')
  })
})

describe('what an action does to each proxy and exit, said first', () => {
  it('its state before and after, and the connections it ends or keeps', () => {
    expect(effectLines(t, effect({ sessions: 2 }))).toEqual([
      'Exit Office Mac: in service → retired',
      'The 2 connections open through it end.',
    ])
    expect(effectLines(t, effect({ after: 'draining', ends: false, sessions: 1 }))).toEqual([
      'Exit Office Mac: in service → draining',
      'The 1 connection open through it is kept until it closes.',
    ])
    expect(effectLines(t, effect({ sessions: null }))[1]).toBe('Its daemon does not say what is open through it.')
    expect(effectLines(t, effect({ after: 'gone' }))[0]).toBe('Exit Office Mac: in service → taken out of it')
    expect(effectLines(t, effect({ state: 'RETIRED', after: 'retired' }))[0]).toBe('Exit Office Mac: retired → unchanged')
  })

  it('a deleted device keeps its place, serving nothing while it is disabled', () => {
    expect(effectLines(t, effect({ after: 'disabled' }))[0]).toBe(
      'Exit Office Mac: in service → serving nothing while it is disabled'
    )
  })

  it('a proxy’s endpoints stay on it, served by its other devices in service, or by none until one is', () => {
    const proxy = effect({ kind: 'proxy', name: 'remote.it pdx1a', endpoints: 4 })
    expect(effectLines(t, proxy)).toEqual([
      'Proxy remote.it pdx1a: in service → retired',
      'Its 4 endpoints stay on the proxy, served by its other devices in service.',
    ])
    expect(effectLines(t, { ...proxy, inService: 0 })[1]).toBe(
      'Its 4 endpoints stay on the proxy, served by no device until one is in service.'
    )
    // Undrained, it serves them itself.
    expect(effectLines(t, { ...proxy, state: 'DRAINING', after: 'active' })).toEqual([
      'Proxy remote.it pdx1a: draining → in service',
    ])
  })

  it('an exit’s users going through the device move to another of its devices, or wait; one left with none is said', () => {
    expect(effectLines(t, effect({ users: 5, moved: 2 }))[1]).toBe(
      '2 devices going out through it now move to another of its devices.'
    )
    const last = effectLines(t, effect({ users: 5, moved: 2, inService: 0, dormant: true }))
    expect(last[1]).toBe('2 devices going out through it now wait for another of its devices.')
    expect(last[2]).toBe(
      'No device available after: the 5 devices using it go their usual way until one of its devices carries traffic again.'
    )
    expect(effectLines(t, effect({ inService: 0, dormant: true }))[1]).toBe(
      'No device available after, until one of its devices carries traffic again.'
    )
  })

  it('a refusal, in graphql’s words', () => {
    const lines = effectLines(
      t,
      effect({ after: 'gone', refusal: 'it runs Office Mac, which serves others: drain it there first, then retire it' })
    )
    expect(lines.at(-1)).toBe(
      'Refused: it runs Office Mac, which serves others: drain it there first, then retire it.'
    )
  })
})

describe('what the device runs after an action', () => {
  const runs = (proxy?: string, exit?: string): DeviceRuns => ({
    proxy: proxy ? ({ state: 'DRAINING', joining: false, proxy: { name: proxy } } as any) : null,
    exit: exit ? ({ state: 'ACTIVE', joining: false, exit: { name: exit } } as any) : null,
  })

  it('each it runs with its state there, or nothing', () => {
    expect(stillRunsLine(t, 'e1', runs('remote.it pdx1a', 'remote.it pdx1a'))).toBe(
      'e1 runs the proxy remote.it pdx1a (draining) and the exit remote.it pdx1a (in service).'
    )
    expect(stillRunsLine(t, 'e1', runs('remote.it pdx1a'))).toBe('e1 runs the proxy remote.it pdx1a (draining).')
    expect(stillRunsLine(t, 'Mac', runs(undefined, 'Office'))).toBe('Mac runs the exit Office (in service).')
    expect(stillRunsLine(t, 'Mac', runs())).toBe('Mac runs no proxy or exit now.')
  })
})

describe('what deleting takes away', () => {
  it('an exit: its users’ exit, its shares, its offers on networks — or nothing', () => {
    expect(
      deleteExitLines(t, {
        users: 2,
        access: [{ user: { id: 'S', email: 'sam@example.com' } }] as any,
        networks: [{ id: 'N', name: 'Office' }],
      })
    ).toEqual([
      'The 2 devices using it as their exit lose it, and go their usual way.',
      'Its shares with sam@example.com end.',
      'It is no longer offered on Office.',
    ])
    expect(deleteExitLines(t, { users: 0, access: [], networks: [] })).toEqual([
      'Nothing else changes: nothing uses it.',
    ])
  })

  it('a proxy: its endpoints, for everyone using one', () => {
    expect(deleteProxyLine(t, 3)).toBe('Its 3 endpoints are removed, for everyone using one.')
    expect(deleteProxyLine(t, 1)).toBe('Its endpoint is removed, for everyone using it.')
    expect(deleteProxyLine(t, 0)).toBe('It has no endpoints: nothing else changes.')
  })
})
