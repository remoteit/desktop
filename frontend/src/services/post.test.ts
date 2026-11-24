import { describe, it, expect, vi, beforeEach } from 'vitest'

// A read asked as one sign-in and answered after another serves its account is not kept (selectors/signIns
// requestServing): the stored data it would fill has been dropped, to be read again as the sign-in that serves it now.

const { request, state } = vi.hoisted(() => ({ request: vi.fn(), state: {} as Record<string, any> }))
vi.mock('../store', () => ({
  // A new object each time, as the store's state is after a change: selectors remember by it.
  store: { getState: () => ({ ...state }), dispatch: { ui: { set: vi.fn() }, auth: {} } },
}))
vi.mock('./remoteit', () => ({
  apiRequest: vi.fn((_method, _url, send, sub) => send({ authorization: `token-of:${sub ?? 'primary'}` })),
}))
vi.mock('../helpers/apiHelper', () => ({
  getApiURL: () => 'https://api.test/graphql',
  getApiRestURL: () => 'https://api.test',
}))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request, isAxiosError: (error: any) => !!error?.isAxiosError } }))
vi.mock('../helpers/sleep', () => ({ default: async () => {} }))

import { post } from './post'

const member = (id: string) => ({ account: { id, email: '' }, name: id, roleId: 'MEMBER', roleName: 'Member' })
const work = { sub: 'sub-work', id: 'work', email: 'work@x.test', membership: [member('shared'), member('labs')] }
const READ = 'query Devices($accountId: String) { login { account(id: $accountId) { id } } }'
const CHANGE = 'mutation Rename($accountId: String) { rename(accountId: $accountId) }'

let answer!: (value: unknown) => void
beforeEach(() => {
  Object.keys(state).forEach(key => delete state[key])
  Object.assign(state, {
    ui: {},
    auth: { user: { id: 'me' } },
    user: { id: 'me', email: 'me@x.test' },
    accounts: { membership: [member('shared')], signIns: { 'sub-work': work }, via: {} },
  })
  request.mockReset().mockImplementation(() => new Promise(resolve => (answer = resolve)))
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
const asked = () => request.mock.calls.map(([sent]) => sent.headers.authorization)

describe('a read answered after another sign-in serves its account', () => {
  it('is kept while the same sign-in serves it', async () => {
    const reading = post({ query: READ, variables: { accountId: 'labs' } })
    await vi.waitFor(() => expect(asked()).toEqual(['token-of:sub-work']))
    answer({ data: { data: {} } })
    expect(await reading).toEqual({ data: { data: {} } })
  })

  it('is asked again as the sign-in the person has picked for the account, and that answer is the one given', async () => {
    const reading = post({ query: READ, variables: { accountId: 'shared' } })
    await vi.waitFor(() => expect(asked()).toEqual(['token-of:primary']))
    const old = answer
    state.accounts = { ...state.accounts, via: { shared: 'sub-work' } }
    old({ data: { data: { as: 'primary' } } })
    await vi.waitFor(() => expect(asked()).toEqual(['token-of:primary', 'token-of:sub-work']))
    answer({ data: { data: { as: 'work' } } })
    // Whoever waited for the first read has the newer answer: never the old one's, nor an error landing over it.
    expect(await reading).toEqual({ data: { data: { as: 'work' } } })
  })

  it('fails once the sign-in that served it has left and no one serves the account — and one asked once per sign-in', async () => {
    const byAccount = post({ query: READ, variables: { accountId: 'labs' } })
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    const first = answer
    const perSignIn = post({ query: 'query Organizations { login { id } }' }, '', false, false, {
      sub: 'sub-work',
      about: ['work', 'shared'],
    })
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2))
    state.accounts = { ...state.accounts, signIns: {} }
    first({ data: {} })
    answer({ data: {} })
    expect(await byAccount).toBe('ERROR')
    expect(await perSignIn).toBe('ERROR')
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('is not asked again without end while the account keeps changing hands', async () => {
    request.mockReset().mockImplementation(async () => {
      // Each answer finds another sign-in serving the account.
      const now = state.accounts.via.shared ? {} : { shared: 'sub-work' }
      state.accounts = { ...state.accounts, via: now }
      return { data: {} }
    })
    expect(await post({ query: READ, variables: { accountId: 'shared' } })).toBe('ERROR')
    expect(request).toHaveBeenCalledTimes(3)
  })

  it('a change made meanwhile is still answered for: it happened', async () => {
    const changing = post({ query: CHANGE, variables: { accountId: 'shared' } })
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    state.accounts = { ...state.accounts, via: { shared: 'sub-work' } }
    answer({ data: { data: { rename: true } } })
    expect(await changing).toEqual({ data: { data: { rename: true } } })
  })

  it('nothing is looked at with one sign-in in use', async () => {
    state.accounts = { membership: [member('shared')], signIns: {}, via: {} }
    const reading = post({ query: READ, variables: { accountId: 'shared' } })
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    state.accounts = { ...state.accounts, signIns: { 'sub-work': work }, via: { shared: 'sub-work' } }
    answer({ data: {} })
    expect(await reading).toEqual({ data: {} })
  })

  // The connection dropped under a read (ERR_NETWORK), which is sent once more: the same read, as the same sign-in.
  it('a read sent again after its connection dropped is good only while the sign-in it was first asked as still serves', async () => {
    const dropped = Object.assign(new Error('Network Error'), { isAxiosError: true, code: 'ERR_NETWORK' })
    let fail!: (error: unknown) => void
    request.mockReset().mockImplementationOnce(() => new Promise((_resolve, reject) => (fail = reject)))
    request.mockImplementation(() => new Promise(resolve => (answer = resolve)))
    const reading = post({ query: READ, variables: { accountId: 'shared' } }, '', false, true)
    await vi.waitFor(() => expect(asked()).toEqual(['token-of:primary']))
    // The person picks the other sign-in for the account while it is out, and then the connection drops.
    state.accounts = { ...state.accounts, via: { shared: 'sub-work' } }
    fail(dropped)
    await vi.waitFor(() => expect(asked()).toEqual(['token-of:primary', 'token-of:primary']))
    // The retry's answer is the sign-in before's, judged by who served the account when the read was first asked:
    // not kept, and the read asked again as the one serving it now.
    answer({ data: { data: { as: 'primary' } } })
    await vi.waitFor(() => expect(asked()).toHaveLength(3))
    expect(asked()[2]).toBe('token-of:sub-work')
    answer({ data: { data: { as: 'work' } } })
    expect(await reading).toEqual({ data: { data: { as: 'work' } } })
  })
})
