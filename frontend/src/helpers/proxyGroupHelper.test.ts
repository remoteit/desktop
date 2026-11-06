import { describe, it, expect } from 'vitest'
import {
  deletingLine,
  deletingTakesAway,
  emptyGroup,
  exitOffLine,
  groupOrNone,
  groupUse,
  keepingLines,
  lastInGroup,
  proxyOffLine,
} from './proxyGroupHelper'
import type { ProxyGroup, ProxyGroupMember } from '../services/graphQLProxyGroups'

// As i18next fills a key's English default: a string with its values, or a count's one or other form.
const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
const t = ((_key: string, a: any, b?: any) =>
  typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a)) as any

const member = (id: string, kind: ProxyGroupMember['kind'] = 'exit'): ProxyGroupMember => ({
  id,
  name: id,
  kind,
  state: 'active',
})
const group = (fields: Partial<ProxyGroup> = {}): ProxyGroup => ({
  label: 'gabc123',
  name: 'Office Mac',
  remoteit: false,
  host: null,
  members: [member('MAC')],
  users: 0,
  endpoints: 0,
  ...fields,
})

describe('a group’s last device', () => {
  it('is the one device in it, its case aside; none where its members are not said', () => {
    expect(lastInGroup(group(), 'mac')).toBe(true)
    expect(lastInGroup(group({ members: [member('MAC'), member('PI')] }), 'MAC')).toBe(false)
    expect(lastInGroup(group({ members: [member('PI')] }), 'MAC')).toBe(false)
    expect(lastInGroup(group({ members: null }), 'MAC')).toBe(false)
    expect(lastInGroup(null, 'MAC')).toBe(false)
    expect(lastInGroup(undefined, 'MAC')).toBe(false)
  })

  it('an empty group has none; deleting one needs confirming while it has users or endpoints', () => {
    expect(emptyGroup(group({ members: [] }))).toBe(true)
    expect(emptyGroup(group())).toBe(false)
    expect(emptyGroup(group({ members: null }))).toBe(false)
    expect(deletingTakesAway({ users: 0, endpoints: 0 })).toBe(false)
    expect(deletingTakesAway({ users: 2, endpoints: 0 })).toBe(true)
    expect(deletingTakesAway({ users: 0, endpoints: 1 })).toBe(true)
  })

  it('a device’s group as the API answered: the group, none, or unknown (unsupported, or not read)', () => {
    expect(groupOrNone(group())).toMatchObject({ label: 'gabc123' })
    expect(groupOrNone(null)).toBeNull()
    expect(groupOrNone('UNSUPPORTED')).toBeUndefined()
    expect(groupOrNone('ERROR')).toBeUndefined()
    expect(groupOrNone(undefined)).toBeUndefined()
  })
})

describe('what a group has, and what keeping or deleting it does', () => {
  it('says its users and endpoints, one or many', () => {
    expect(groupUse(t, { users: 0, endpoints: 0 })).toBe('No device uses it as its exit, and it has no endpoints.')
    expect(groupUse(t, { users: 1, endpoints: 1 })).toBe('1 device uses it as its exit, and it has 1 endpoint.')
    expect(groupUse(t, { users: 3, endpoints: 2 })).toBe('3 devices use it as their exit, and it has 2 endpoints.')
  })

  it('kept, it waits for another device: its users’ traffic stops until then, its endpoints keep their addresses', () => {
    expect(keepingLines(t, { users: 0, endpoints: 0 })).toEqual([
      'Kept, it waits for another device to be added to it.',
    ])
    expect(keepingLines(t, { users: 3, endpoints: 2 })).toEqual([
      'Kept, it waits for another device to be added to it.',
      'The devices using it stay on it, and their traffic stops until then.',
      'Its endpoints keep their addresses, and work again then.',
    ])
  })

  it('deleted, its users go their usual way and its endpoints are removed', () => {
    expect(deletingLine(t, { users: 3, endpoints: 2 })).toBe(
      'Deleted, the devices using it go their usual way, and its endpoints are removed.'
    )
    expect(deletingLine(t, { users: 3, endpoints: 0 })).toBe('Deleted, the devices using it go their usual way.')
    expect(deletingLine(t, { users: 0, endpoints: 2 })).toBe('Deleted, its endpoints are removed.')
    expect(deletingLine(t, { users: 0, endpoints: 0 })).toBe('Deleted, nothing else changes: nothing uses it.')
  })
})

describe('turning off a device that is not its group’s last, or stays in it', () => {
  it('a proxy: the others serve its group’s endpoints; alone, it stays as an exit and the group keeps them', () => {
    const office = group({
      name: 'Office gateway',
      host: 'gw.r3proxy.com',
      members: [member('GW', 'own'), member('GW2', 'own')],
    })
    expect(proxyOffLine(t, office, 'GW')).toBe(
      'The other devices in its group, Office gateway, go on serving its endpoints.'
    )
    expect(proxyOffLine(t, { ...office, members: [member('GW', 'own')] }, 'GW')).toBe(
      'It stays in its group, Office gateway, as an exit. The group keeps its endpoints: they work again once a proxy is added to it.'
    )
    // An API without groups said its endpoints went with it.
    expect(proxyOffLine(t, undefined, 'GW')).toBe('Every endpoint on it is removed, for everyone using one.')
  })

  it('an exit: its group’s users go through another; alone, as a proxy still, they wait for it', () => {
    const pair = group({ members: [member('MAC'), member('PI')], users: 2 })
    expect(exitOffLine(t, pair, 'MAC')).toBe(
      'Those using its group, Office Mac, as their exit go out through another exit in it, or wait for one.'
    )
    expect(exitOffLine(t, group({ members: [member('MAC', 'own')], users: 2 }), 'MAC')).toBe(
      'It stays in its group, Office Mac, as a proxy. The devices using the group as their exit have their traffic stopped until it offers itself again, or another exit is added.'
    )
    expect(exitOffLine(t, group({ members: [member('MAC', 'own')] }), 'MAC')).toBe(
      'It stays in its group, Office Mac, as a proxy.'
    )
    expect(exitOffLine(t, undefined, 'MAC')).toBe('Everyone sending their traffic out through it now is cut off.')
    // One of remote.it's: its users are moved off its last exit, as before.
    expect(exitOffLine(t, group({ remoteit: true, members: [member('E1', 'remoteit')], users: 5 }), 'E1')).toBe(
      'Everyone sending their traffic out through it now is cut off.'
    )
  })
})
