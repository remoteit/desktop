import { describe, it, expect, vi, beforeEach } from 'vitest'

// Whose a change to a network is, with several sign-ins in use (services/graphQLDeviceNetworks, "WHOSE A CHANGE TO A
// NETWORK IS"): graphql takes each from the network's manager, whatever device or account the change names beside it.
const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('./graphQL', () => ({
  graphQLBasicRequest: request,
  graphQLRequestWithReason: request,
  graphQLGetErrors: () => undefined,
}))
const { post } = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED', withoutDeviceSessions: () => false }))
vi.mock('./productPolicy', () => ({ memberPolicyFields: async () => '' }))
vi.mock('./deviceSignIns', () => ({ exitSignInFields: async () => '', exitErrorFields: async () => '' }))
vi.mock('./exitServing', () => ({ exitServingFields: async () => '' }))
vi.mock('../store', () => ({ store: { getState: () => ({}) } }))

import {
  graphQLAddNetworkDevice,
  graphQLCreateNetworkDeviceRule,
  graphQLDeviceNetworks,
  graphQLListNetworkService,
  graphQLNetworkTag,
  graphQLRemoveNetworkDevice,
  graphQLSetNetworkShareRole,
} from './graphQLDeviceNetworks'
import { graphQLSetNetworkExit } from './graphQLExits'
import { noteAccountOf, requestSignIn, resetNotedAccounts } from '../selectors/signIns'

/* Work, signed in beside the page's own person, administers network Y (read with its own account) and the organization
   X. The page's own person belongs to X too, with none of that — and X's row is theirs to serve, as are X's devices. */
const member = (id: string) => ({ account: { id, email: '' }, name: id, roleId: 'MEMBER', roleName: 'Member' })
const state: any = {
  auth: { user: { id: 'me' } },
  accounts: {
    membership: [member('org-x')],
    signIns: { 'sub-work': { sub: 'sub-work', id: 'work', email: 'work@x.test', membership: [member('org-x')] } },
  },
  devices: { 'org-x': { all: [{ id: 'd-x', services: [{ id: 's-x' }] }] } },
}
// The sign-in the last request is made as: 'primary' for the page's own person.
const as = () => {
  const [, variables, third, fourth] = request.mock.calls.at(-1)!
  const requestFor = typeof third === 'object' ? third : fourth
  return requestSignIn(state, requestFor, variables) ?? 'primary'
}

beforeEach(() => {
  request.mockReset().mockResolvedValue({ data: { data: {} } })
  resetNotedAccounts()
  noteAccountOf('work', ['net-y', 'exit-work'])
  noteAccountOf('org-x', ['exit-x'])
})

describe('a change to a network', () => {
  it('a rule taking another account’s devices by tag is the network’s manager’s to make, not that account’s sign-in’s', async () => {
    await graphQLCreateNetworkDeviceRule('net-y', { tags: ['lab'], accountId: 'org-x' })
    expect(request.mock.calls[0][1]).toMatchObject({ networkId: 'net-y', accountId: 'org-x' })
    expect(as()).toBe('sub-work')
  })

  it('a device, a service and a share on it: each as the network’s manager', async () => {
    const made: string[] = []
    await graphQLAddNetworkDevice('net-y', 'd-x', { role: 'TARGET' as any })
    made.push(as())
    await graphQLRemoveNetworkDevice('net-y', 'd-x')
    made.push(as())
    await graphQLListNetworkService('net-y', 's-x', true)
    made.push(as())
    await graphQLSetNetworkShareRole('net-y', 'someone@x.test', 'manage' as any)
    made.push(as())
    expect(made).toEqual(Array(4).fill('sub-work'))
  })

  // graphql takes an account's tags on a network from an administrator of that account (NetworkTag.mayTag), whoever
  // manages the network: the owner's from the owner's sign-in, an organization's from the one serving that organization.
  it('an account’s tags on it: as that account’s sign-in, not the network’s', async () => {
    await graphQLNetworkTag('net-y', 'org-x', 'lab', true)
    expect(as()).toBe('primary')
    await graphQLNetworkTag('net-y', 'work', 'lab', false)
    expect(as()).toBe('sub-work')
  })

  it('an exit on it: as the side whose page asks', async () => {
    await graphQLSetNetworkExit('net-y', 'exit-x', true)
    expect(as()).toBe('sub-work')
    await graphQLSetNetworkExit('net-y', 'exit-x', false, 'exit')
    expect(as()).toBe('primary')
  })
})

// X is looked at through the page's own person; a search of the other rows reads it as Work too.
describe('networks read as a sign-in other than the one the account is looked at through', () => {
  it('are noted under the sign-in that read them, so what is asked of one goes as that sign-in', async () => {
    post.mockResolvedValue({
      data: { data: { login: { account: { networks: [{ id: 'net-b', deviceRules: [{ id: 'rule-b' }] }] } } } },
    })
    expect(await graphQLDeviceNetworks('org-x', { sub: 'sub-work' })).toHaveLength(1)
    expect(requestSignIn(state, { about: ['net-b'] }, {})).toBe('sub-work')
    expect(requestSignIn(state, { about: ['rule-b'] }, {})).toBe('sub-work')
  })
})
