import { describe, it, expect, vi, beforeEach } from 'vitest'

// Whose a change to a network is, with several sign-ins in use (services/graphQLDeviceNetworks, "WHOSE A CHANGE TO A
// NETWORK IS"): graphql takes each from the network's manager, whatever device or account the change names beside it.
const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('./graphQL', () => ({
  graphQLBasicRequest: request,
  graphQLRequestWithReason: request,
  graphQLGetErrors: () => undefined,
}))
vi.mock('./post', () => ({ post: vi.fn() }))
vi.mock('./graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED', withoutDeviceSessions: () => false }))
vi.mock('./productPolicy', () => ({ memberPolicyFields: async () => '' }))
vi.mock('./deviceSignIns', () => ({ exitSignInFields: async () => '', exitErrorFields: async () => '' }))
vi.mock('./exitServing', () => ({ exitServingFields: async () => '' }))
vi.mock('../store', () => ({ store: { getState: () => ({}) } }))

import {
  graphQLAddNetworkDevice,
  graphQLCreateNetworkDeviceRule,
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

  it('a device, a service, a share and an account’s tags on it: each as the network’s manager', async () => {
    const made: string[] = []
    await graphQLAddNetworkDevice('net-y', 'd-x', { role: 'TARGET' as any })
    made.push(as())
    await graphQLRemoveNetworkDevice('net-y', 'd-x')
    made.push(as())
    await graphQLListNetworkService('net-y', 's-x', true)
    made.push(as())
    await graphQLSetNetworkShareRole('net-y', 'someone@x.test', 'manage' as any)
    made.push(as())
    await graphQLNetworkTag('net-y', 'org-x', 'lab', true)
    made.push(as())
    expect(made).toEqual(Array(5).fill('sub-work'))
  })

  it('an exit on it: as the side whose page asks', async () => {
    await graphQLSetNetworkExit('net-y', 'exit-x', true)
    expect(as()).toBe('sub-work')
    await graphQLSetNetworkExit('net-y', 'exit-x', false, 'exit')
    expect(as()).toBe('primary')
  })
})
