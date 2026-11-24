import { describe, it, expect, vi, beforeEach } from 'vitest'

// Whose a request about a device in a proxy or an exit is, with several sign-ins in use (services/graphQLDeviceRuns):
// graphql takes an add only from someone who manages the run and the device both — the run's sign-in.
const { request, post } = vi.hoisted(() => ({ request: vi.fn(), post: vi.fn() }))
vi.mock('./graphQL', () => ({ graphQLRequestWithReason: request, graphQLGetErrors: () => undefined }))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED', withoutDeviceSessions: () => false }))

import {
  graphQLActionEffects,
  graphQLAddExitDevice,
  graphQLAddProxyDevice,
  graphQLRunAction,
  graphQLRunCandidates,
} from './graphQLDeviceRuns'
import { noteAccountOf, requestSignIn, resetNotedAccounts } from '../selectors/signIns'

/* Work is signed in beside the page's own person and has an exit. The device to add is in no stored list (an account of
   many devices), or in the list of an account the page's own person serves. */
const state: any = {
  auth: { user: { id: 'me' } },
  accounts: {
    membership: [],
    signIns: { 'sub-work': { sub: 'sub-work', id: 'work', email: 'work@x.test', membership: [] } },
  },
  devices: { me: { all: [{ id: 'd-mine', services: [] }] } },
}
const asked = (call: number) => {
  const [, variables, requestFor] = request.mock.calls[call]
  return requestSignIn(state, requestFor, variables)
}

beforeEach(() => {
  request.mockReset().mockResolvedValue({ data: { data: {} } })
  post.mockReset().mockResolvedValue({ data: { data: {} } })
  resetNotedAccounts()
  noteAccountOf('work', ['exit-1', 'proxy-1'])
})

describe('a device and the proxy or exit it runs', () => {
  it('is added as the run’s sign-in, whichever list holds the device, or none', async () => {
    await graphQLAddExitDevice('exit-1', 'd-unlisted')
    await graphQLAddExitDevice('exit-1', 'd-mine')
    await graphQLAddProxyDevice('proxy-1', 'd-unlisted')
    expect([asked(0), asked(1), asked(2)]).toEqual(['sub-work', 'sub-work', 'sub-work'])
  })

  it('has its candidates weighed as the run’s sign-in, the devices named or not', async () => {
    await graphQLRunCandidates('exit', { id: 'exit-1' })
    await graphQLRunCandidates('exit', { id: 'exit-1' }, ['d-mine'])
    expect([asked(0), asked(1)]).toEqual(['sub-work', 'sub-work'])
    // A new one, of an account: the account says.
    await graphQLRunCandidates('proxy', { accountId: 'work' })
    expect(asked(2)).toBe('sub-work')
  })

  it('is acted on from the run’s page as the device’s own sign-in where a list holds it, else as the run’s', async () => {
    await graphQLRunAction('exit', 'd-unlisted', 'DRAIN', { maxWaitMinutes: 5, run: 'exit-1' })
    await graphQLRunAction('exit', 'd-mine', 'REMOVE', { run: 'exit-1' })
    await graphQLRunAction('device', 'd-unlisted', 'RETIRE', { force: true })
    expect([asked(0), asked(1), asked(2)]).toEqual(['sub-work', undefined, undefined])
    expect(request.mock.calls[0][1]).toEqual({ deviceId: 'd-unlisted', maxWaitMinutes: 5 })

    await graphQLActionEffects('d-unlisted', 'RETIRE', false, 'exit-1')
    const [{ variables }, , , , requestFor] = post.mock.calls[0]
    expect(requestSignIn(state, requestFor, variables)).toBe('sub-work')
  })
})
