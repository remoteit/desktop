import { describe, it, expect, vi } from 'vitest'

vi.mock('./post', () => ({}))
vi.mock('./graphQL', () => ({}))
vi.mock('./graphQLDaemon', () => ({}))
vi.mock('./productPolicy', () => ({}))

import {
  NetworkDeviceRole,
  NetworkDeviceScope,
  NetworkMember,
  Reached,
  canReach,
  deviceCount,
  membershipFor,
  peopleCount,
  reachedOf,
  ruleChoicesFor,
  ruleReachedOf,
} from './graphQLDeviceNetworks'

const member = (role: NetworkDeviceRole, scope: NetworkDeviceScope, anyPort: boolean): NetworkMember => ({
  deviceId: 'D1',
  role,
  scope,
  anyPort,
})

// What a membership does, as the network enforces it: whether it initiates, and what a target exposes.
const effect = (m: { role: NetworkDeviceRole; scope: NetworkDeviceScope; anyPort: boolean }, listed: number) => {
  const target = m.role !== 'INITIATOR'
  return {
    initiates: m.role !== 'TARGET',
    exposes: !target
      ? 'NOTHING'
      : m.anyPort
      ? 'ALL+PORT'
      : m.scope === 'ALL'
      ? 'ALL'
      : listed > 0
      ? 'LISTED'
      : 'NOTHING',
  }
}

describe('the two controls, read from a stored membership', () => {
  it.each`
    role           | scope       | anyPort  | listed | reach    | reached
    ${'INITIATOR'} | ${'LISTED'} | ${false} | ${0}   | ${true}  | ${'NOTHING'}
    ${'INITIATOR'} | ${'ALL'}    | ${true}  | ${2}   | ${true}  | ${'NOTHING'}
    ${'TARGET'}    | ${'LISTED'} | ${false} | ${0}   | ${false} | ${'NOTHING'}
    ${'TARGET'}    | ${'LISTED'} | ${false} | ${2}   | ${false} | ${'CHOSEN'}
    ${'TARGET'}    | ${'ALL'}    | ${false} | ${0}   | ${false} | ${'ALL'}
    ${'TARGET'}    | ${'ALL'}    | ${true}  | ${0}   | ${false} | ${'ALL_ANY_PORT'}
    ${'TARGET'}    | ${'LISTED'} | ${true}  | ${1}   | ${false} | ${'ALL_ANY_PORT'}
    ${'BOTH'}      | ${'LISTED'} | ${false} | ${1}   | ${true}  | ${'CHOSEN'}
    ${'BOTH'}      | ${'ALL'}    | ${false} | ${0}   | ${true}  | ${'ALL'}
    ${'BOTH'}      | ${'ALL'}    | ${true}  | ${0}   | ${true}  | ${'ALL_ANY_PORT'}
  `('$role $scope anyPort=$anyPort listed=$listed reads as reach=$reach, reached=$reached', (row: any) => {
    const m = member(row.role, row.scope, row.anyPort)
    expect(canReach(m)).toBe(row.reach)
    expect(reachedOf(m, row.listed)).toBe(row.reached)
  })

  it('every stored combination saves back to one that does the same', () => {
    for (const role of ['INITIATOR', 'TARGET', 'BOTH'] as NetworkDeviceRole[])
      for (const scope of ['LISTED', 'ALL'] as NetworkDeviceScope[])
        for (const anyPort of [false, true])
          for (const listed of [0, 2]) {
            const m = member(role, scope, anyPort)
            const saved = membershipFor(canReach(m), reachedOf(m, listed))
            expect(effect(saved, listed)).toEqual(effect(m, listed))
          }
  })
})

describe('the two controls, saved', () => {
  it.each`
    reach    | reached           | role           | scope       | anyPort
    ${false} | ${'NOTHING'}      | ${'TARGET'}    | ${'LISTED'} | ${false}
    ${true}  | ${'NOTHING'}      | ${'INITIATOR'} | ${'LISTED'} | ${false}
    ${false} | ${'ALL'}          | ${'TARGET'}    | ${'ALL'}    | ${false}
    ${true}  | ${'ALL'}          | ${'BOTH'}      | ${'ALL'}    | ${false}
    ${false} | ${'ALL_ANY_PORT'} | ${'TARGET'}    | ${'ALL'}    | ${true}
    ${true}  | ${'ALL_ANY_PORT'} | ${'BOTH'}      | ${'ALL'}    | ${true}
    ${false} | ${'CHOSEN'}       | ${'TARGET'}    | ${'LISTED'} | ${false}
    ${true}  | ${'CHOSEN'}       | ${'BOTH'}      | ${'LISTED'} | ${false}
  `('reach=$reach reached=$reached saves $role $scope anyPort=$anyPort', (row: any) => {
    expect(membershipFor(row.reach, row.reached as Reached)).toEqual({
      role: row.role,
      scope: row.scope,
      anyPort: row.anyPort,
    })
  })

  it('reads back as the controls that saved it', () => {
    for (const reach of [false, true])
      for (const reached of ['NOTHING', 'ALL', 'ALL_ANY_PORT', 'CHOSEN'] as Reached[]) {
        const saved = { deviceId: 'D1', ...membershipFor(reach, reached) }
        expect(canReach(saved)).toBe(reach)
        expect(reachedOf(saved, reached === 'CHOSEN' ? 1 : 0)).toBe(reached)
      }
  })
})

describe('a tag rule’s controls', () => {
  it('reads and saves all services and any port', () => {
    expect(ruleReachedOf({ allServices: false, anyPort: false })).toBe('NOTHING')
    expect(ruleReachedOf({ allServices: true, anyPort: false })).toBe('ALL')
    expect(ruleReachedOf({ allServices: true, anyPort: true })).toBe('ALL_ANY_PORT')
    expect(ruleReachedOf({ allServices: false, anyPort: true })).toBe('ALL_ANY_PORT')
    for (const reached of ['NOTHING', 'ALL', 'ALL_ANY_PORT'] as const)
      expect(ruleReachedOf(ruleChoicesFor(reached))).toBe(reached)
  })
})

describe('counts', () => {
  const network = {
    owner: { id: 'O', email: 'o@x' },
    devices: [member('TARGET', 'ALL', false), { ...member('BOTH', 'LISTED', false), deviceId: 'D2' }],
    deviceRules: [{ devices: ['D2', 'D3', 'D4'] }] as any,
    access: [{ user: { id: 'P1', email: 'p1@x' }, role: 'CONNECT' as const }],
    accountAccess: [
      {
        accountId: 'O',
        roles: [
          {
            members: [
              { id: 'P2', email: 'p2@x' },
              { id: 'P1', email: 'p1@x' },
            ],
          },
        ],
      },
    ] as any,
  }
  it('counts each device once, listed or by tag', () => expect(deviceCount(network)).toBe(4))
  it('counts each person once', () => expect(peopleCount(network)).toBe(3))
})
