import { describe, it, expect, vi } from 'vitest'

const { graphQLBasicRequest, oidcSignIns } = vi.hoisted(() => ({
  graphQLBasicRequest: vi.fn(),
  oidcSignIns: vi.fn(() => [] as any[]),
}))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest }))
vi.mock('../services/oidc', () => ({ oidcSignIns }))
vi.mock('../services/graphQLMutation', () => ({}))
vi.mock('../selectors/devices', () => ({}))
vi.mock('./devices', () => ({}))
vi.mock('../selectors/accounts', () => ({
  selectActiveAccountId: (state: any) => state.accounts.activeId || state.auth.user.id,
}))

import accounts from './accounts'

const CLEARED = { selected: [], selectionAnchor: undefined }
const state = { accounts: { activeId: 'ORG-A', membership: [] }, auth: { user: { id: 'USER' } }, user: { id: 'USER' } }

async function run(effect: 'select' | 'parse', payload: unknown) {
  const order: string[] = []
  const dispatch = {
    logs: { reset: vi.fn() },
    ui: { set: vi.fn(() => order.push('ui.set')) },
    accounts: { set: vi.fn(() => order.push('accounts.set')) },
    networks: { fetchIfEmpty: vi.fn() },
    devices: { fetchIfEmpty: vi.fn() },
    files: { fetchIfEmpty: vi.fn() },
    tags: { fetchIfEmpty: vi.fn() },
    products: { fetchIfEmpty: vi.fn() },
    partnerStats: { fetchIfEmpty: vi.fn() },
  }
  await (accounts as any).effects(dispatch)[effect](payload, state)
  return { dispatch, order }
}

describe('the device selection belongs to the account it was made in', () => {
  it('is cleared before select() changes the account', async () => {
    const { dispatch, order } = await run('select', 'ORG-B')
    expect(dispatch.ui.set).toHaveBeenCalledWith(CLEARED)
    expect(order).toEqual(['ui.set', 'accounts.set'])
  })

  it('is kept when select() is given the account already active', async () => {
    const { dispatch } = await run('select', 'ORG-A')
    expect(dispatch.ui.set).not.toHaveBeenCalled()
  })

  it('is cleared before parse() drops an organization the user has left', async () => {
    const { dispatch, order } = await run('parse', { data: { data: { login: { membership: [] } } } })
    expect(dispatch.ui.set).toHaveBeenCalledWith(CLEARED)
    expect(dispatch.accounts.set).toHaveBeenCalledWith({ membership: [], activeId: undefined })
    expect(order).toEqual(['ui.set', 'accounts.set'])
  })
})

/* Personal is the page's own person, a member of Acme. Work is signed in beside them: its own account, and Labs. */
describe('the sign-ins beside the page’s own person', () => {
  const member = (id: string) => ({ account: { id, email: '' }, name: id, roleId: 'MEMBER', roleName: 'Member' })
  const work = { sub: 'sub-work', id: 'work', email: 'work@x.test', membership: [member('labs')] }
  const signedIn = (signIns: object = {}, more: object = {}) => ({
    auth: { user: { id: 'personal' } },
    user: { id: 'personal', email: 'personal@x.test' },
    accounts: { activeId: undefined, membership: [member('acme')], signIns, via: {}, ...more },
  })
  const answer = (id: string, orgs: string[]) => ({
    data: {
      data: {
        login: {
          id,
          email: `${id}@x.test`,
          membership: orgs.map(org => ({
            created: '2026-01-01',
            customRole: { id: 'MEMBER', name: 'Member' },
            license: 'LICENSED',
            organization: { name: org, account: { id: org, email: null } },
          })),
        },
      },
    },
  })
  function effectsWith(state: object) {
    const dispatch: any = {
      accounts: { set: vi.fn(), select: vi.fn(), forgetData: vi.fn() },
      organization: { fetch: vi.fn() },
    }
    const effects = (accounts as any).effects(dispatch)
    dispatch.accounts.setSignIns = vi.fn((signIns: object) => effects.setSignIns(signIns, state))
    return { dispatch, effects, run: (effect: string, payload?: unknown) => effects[effect](payload, state) }
  }
  const inUse = (...subs: string[]) =>
    oidcSignIns.mockReturnValue([
      { sub: 'sub-personal', primary: true },
      ...subs.map(sub => ({ sub, email: `${sub}@registry.test`, primary: false })),
    ])

  it('are each asked, with their own token, for their account and organizations', async () => {
    inUse('sub-work')
    graphQLBasicRequest.mockReset().mockResolvedValue(answer('work', ['labs']))
    const { dispatch, run } = effectsWith(signedIn())
    await run('fetchSignIns')
    expect(graphQLBasicRequest).toHaveBeenCalledTimes(1)
    expect(graphQLBasicRequest.mock.calls[0].slice(1)).toEqual([{}, true, { sub: 'sub-work' }])
    const [signIns] = dispatch.accounts.setSignIns.mock.calls[0]
    expect(signIns['sub-work']).toMatchObject({ sub: 'sub-work', id: 'work', email: 'work@x.test' })
    expect(signIns['sub-work'].membership.map((m: IMembership) => m.account.id)).toEqual(['labs'])
    // New rows: their organizations are read, as the sign-in that serves them.
    expect(dispatch.organization.fetch).toHaveBeenCalledTimes(1)
    expect(dispatch.accounts.forgetData).not.toHaveBeenCalled()
  })

  it('ask nothing with one sign-in in use', async () => {
    inUse()
    graphQLBasicRequest.mockReset()
    const { dispatch, run } = effectsWith(signedIn())
    await run('fetchSignIns')
    expect(graphQLBasicRequest).not.toHaveBeenCalled()
    expect(dispatch.accounts.setSignIns).not.toHaveBeenCalled()
  })

  it('keep what was known of one that could not be asked this time', async () => {
    inUse('sub-work')
    graphQLBasicRequest.mockReset().mockResolvedValue('ERROR')
    const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work }))
    await run('fetchSignIns')
    expect(dispatch.accounts.setSignIns).toHaveBeenCalledWith({ 'sub-work': work })
    expect(dispatch.accounts.forgetData).not.toHaveBeenCalled()
  })

  it('lose their rows, and what was stored for them, when one signs out', async () => {
    inUse()
    graphQLBasicRequest.mockReset()
    const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work }))
    await run('fetchSignIns')
    expect(dispatch.accounts.set).toHaveBeenCalledWith({ signIns: {} })
    expect(dispatch.accounts.forgetData).toHaveBeenCalledWith(['work', 'labs'])
    expect(dispatch.accounts.select).not.toHaveBeenCalled()
  })

  it('lose every row but the page’s own, and what was stored for them, when several are no longer used at once', async () => {
    inUse()
    graphQLBasicRequest.mockReset()
    const third = { sub: 'sub-third', id: 'third', email: 'third@x.test', membership: [member('acme')] }
    const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work, 'sub-third': third }, { activeId: 'work' }))
    await run('fetchSignIns')
    expect(graphQLBasicRequest).not.toHaveBeenCalled()
    expect(dispatch.accounts.set).toHaveBeenCalledWith({ signIns: {} })
    // An organization the page's person reaches too stays a row, and keeps what is stored for it.
    expect(dispatch.accounts.forgetData).toHaveBeenCalledWith(['work', 'labs', 'third'])
    expect(dispatch.accounts.select).toHaveBeenCalledWith('personal')
  })

  it('send the person back to their own account when the selected row was the one that left', async () => {
    inUse()
    const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work }, { activeId: 'labs' }))
    await run('fetchSignIns')
    expect(dispatch.accounts.select).toHaveBeenCalledWith('personal')
  })

  it('keep the rows another sign-in still reaches, and what is stored for them', async () => {
    inUse()
    const both = { ...work, membership: [member('labs'), member('acme')] }
    const { dispatch, run } = effectsWith(signedIn({ 'sub-work': both }))
    await run('fetchSignIns')
    expect(dispatch.accounts.forgetData).toHaveBeenCalledWith(['work', 'labs'])
  })

  it('do not put back one that signed out while it was being asked', async () => {
    inUse('sub-work')
    graphQLBasicRequest.mockReset().mockImplementation(async () => {
      inUse()
      return answer('work', ['labs'])
    })
    const { dispatch, run } = effectsWith(signedIn())
    await run('fetchSignIns')
    expect(dispatch.accounts.setSignIns).toHaveBeenCalledWith({})
  })

  it('drop every list kept by account id for the accounts forgotten', () => {
    const models = [
      'devices',
      'products',
      'partnerStats',
      'networks',
      'files',
      'jobs',
      'tags',
      'organization',
      'applicationTypes',
    ]
    const dispatch: any = Object.fromEntries(models.map(model => [model, { forget: vi.fn() }]))
    ;(accounts as any).effects(dispatch).forgetData(['work', 'labs'])
    models.forEach(model => expect(dispatch[model].forget).toHaveBeenCalledWith(['work', 'labs']))
  })

  it('serve an organization both reach through the one the person picks, reading it again as that sign-in', async () => {
    const both = { ...work, membership: [member('labs'), member('acme')] }
    const { dispatch, run } = effectsWith(signedIn({ 'sub-work': both }, { activeId: 'acme' }))
    await run('setVia', { accountId: 'acme', sub: 'sub-work' })
    expect(dispatch.accounts.set).toHaveBeenCalledWith({ via: { acme: 'sub-work' } })
    expect(dispatch.accounts.forgetData).toHaveBeenCalledWith(['acme'])
    expect(dispatch.organization.fetch).toHaveBeenCalledTimes(1)
    expect(dispatch.accounts.select).toHaveBeenCalledWith('acme')
  })

  it('change nothing when the organization is already served by that sign-in', async () => {
    const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work }))
    await run('setVia', { accountId: 'acme', sub: '' })
    expect(dispatch.accounts.set).not.toHaveBeenCalled()
    expect(dispatch.accounts.forgetData).not.toHaveBeenCalled()
  })

  it('keep the selected row through a refresh of the primary’s memberships when another sign-in serves it', async () => {
    const dispatch: any = { ui: { set: vi.fn() }, accounts: { set: vi.fn() } }
    const state = signedIn({ 'sub-work': work }, { activeId: 'labs' })
    await (accounts as any).effects(dispatch).parse({ data: { data: { login: { membership: [] } } } }, state)
    expect(dispatch.accounts.set).toHaveBeenCalledWith({ membership: [] })
    expect(dispatch.ui.set).not.toHaveBeenCalled()
  })
})
