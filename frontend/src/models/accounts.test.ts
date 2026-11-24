import { describe, it, expect, vi } from 'vitest'

const { graphQLBasicRequest, graphQLLeaveMembership, oidcSignIns } = vi.hoisted(() => ({
  graphQLBasicRequest: vi.fn(),
  graphQLLeaveMembership: vi.fn(),
  oidcSignIns: vi.fn(() => [] as any[]),
}))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest }))
vi.mock('../services/oidc', () => ({ oidcSignIns }))
vi.mock('../services/graphQLMutation', () => ({ graphQLLeaveMembership }))
vi.mock('../selectors/devices', () => ({
  BESIDE_ROWS: ['default', 'connections'],
  deviceRows: (devices: object) => Object.keys(devices),
  getDeviceModelFn: (devices: any, row: string) => devices[row] || devices.default,
}))
vi.mock('./devices', () => ({}))
vi.mock('../selectors/accounts', () => ({
  selectActiveAccountId: (state: any) => state.accounts.activeId || state.auth.user.id,
}))

import accounts from './accounts'
import { accountCache, followAccountsDropped } from '../services/accountCaches'
import { rowKey } from '../helpers/rowKey'

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

  // The same account under another sign-in is another row: its list may not have what was ticked.
  it('is cleared when select() is given the active account under another sign-in', async () => {
    const { dispatch, order } = await run('select', { accountId: 'ORG-A', sub: 'sub-work' })
    expect(dispatch.ui.set).toHaveBeenCalledWith(CLEARED)
    expect(order).toEqual(['ui.set', 'accounts.set'])
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
    accounts: { activeId: undefined, membership: [member('acme')], signIns, ...more },
    devices: {} as Record<string, object>,
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
  // The state as the effects leave it: what accounts.set is given goes into it, as the store's reducer would.
  function effectsWith(state: any) {
    let current = state
    const dispatch: any = {
      accounts: {
        set: vi.fn((params: object) => void (current = { ...current, accounts: { ...current.accounts, ...params } })),
        select: vi.fn(),
        // Accounts that are rows no more, and rows whose sign-in left.
        forgetData: vi.fn(),
        forgetRows: vi.fn(),
      },
      organization: { fetch: vi.fn() },
    }
    const effects = (accounts as any).effects(dispatch)
    dispatch.accounts.setSignIns = vi.fn((signIns: object) => effects.setSignIns(signIns, current))
    dispatch.accounts.readAgain = vi.fn((ids: string[]) => effects.readAgain(ids, current))
    return {
      dispatch,
      effects,
      run: (effect: string, payload?: unknown) => effects[effect](payload, current),
    }
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

  /* Two sign-ins reach Labs, and Work serves it. What is stored for it was read as Work — in Work's role, seeing what
     Work sees — so when Work leaves and Third serves it, it is read again rather than kept. */
  describe('reaching an organization another sign-in also reaches', () => {
    const third = { sub: 'sub-third', id: 'third', email: 'third@x.test', membership: [member('labs')] }

    it('hand it to the other when the one serving it is no longer used, and what was stored for it is read again', async () => {
      inUse('sub-third')
      graphQLBasicRequest.mockReset().mockResolvedValue(answer('third', ['labs']))
      const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work, 'sub-third': third }, { activeId: 'labs' }))
      await run('fetchSignIns')
      expect(dispatch.accounts.forgetData.mock.calls).toEqual([[['work']]])
      expect(dispatch.organization.fetch).toHaveBeenCalledTimes(1)
      // Selected, and still a row: it stays selected, its lists read again as the sign-in that serves it now.
      expect(dispatch.accounts.select.mock.calls).toEqual([['labs']])
    })

    it('read nothing again for a row that is not selected, beyond its organization', async () => {
      inUse('sub-third')
      graphQLBasicRequest.mockReset().mockResolvedValue(answer('third', ['labs']))
      const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work, 'sub-third': third }))
      await run('fetchSignIns')
      expect(dispatch.accounts.readAgain).toHaveBeenCalledWith(['labs'])
      expect(dispatch.accounts.select).not.toHaveBeenCalled()
    })

    it('hand it back to the page’s person when the sign-in whose row of it was selected leaves', async () => {
      inUse()
      const both = { ...work, membership: [member('labs'), member('acme')] }
      const { dispatch, run } = effectsWith(signedIn({ 'sub-work': both }, { activeId: 'acme', activeSub: 'sub-work' }))
      await run('fetchSignIns')
      expect(dispatch.accounts.forgetData.mock.calls).toEqual([[['work', 'labs']]])
      expect(dispatch.accounts.readAgain).toHaveBeenCalledWith(['acme'])
      expect(dispatch.accounts.select.mock.calls).toEqual([['acme']])
    })

    it('hand it over when one joins that is put before the one serving it', async () => {
      const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work }))
      await run('setSignIns', { 'sub-third': third, 'sub-work': work })
      expect(dispatch.accounts.readAgain).toHaveBeenCalledWith(['labs'])
      expect(dispatch.accounts.forgetData).not.toHaveBeenCalled()
      expect(dispatch.organization.fetch).toHaveBeenCalledTimes(1)
    })

    it('keep what is stored for it while the same sign-in serves it', async () => {
      inUse('sub-work')
      graphQLBasicRequest.mockReset().mockResolvedValue(answer('work', ['labs']))
      const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work, 'sub-third': third }))
      await run('fetchSignIns')
      expect(dispatch.accounts.forgetData.mock.calls).toEqual([[['third']]])
      expect(dispatch.accounts.readAgain).not.toHaveBeenCalled()
    })

    it('hand it over when the page’s person is found to belong to it no longer', async () => {
      const both = { ...work, membership: [member('labs'), member('acme')] }
      const { dispatch, effects } = effectsWith(signedIn({ 'sub-work': both }, { activeId: 'acme' }))
      dispatch.ui = { set: vi.fn() }
      await effects.parse(
        { data: { data: { login: { membership: [] } } } },
        signedIn({ 'sub-work': both }, { activeId: 'acme' })
      )
      expect(dispatch.accounts.set).toHaveBeenCalledWith({ membership: [] })
      expect(dispatch.accounts.readAgain).toHaveBeenCalledWith(['acme'])
    })

    it('hand it over when the page’s person leaves it', async () => {
      graphQLLeaveMembership.mockReset().mockResolvedValue({})
      const both = { ...work, membership: [member('labs'), member('acme')] }
      const { dispatch, run } = effectsWith(signedIn({ 'sub-work': both }, { activeId: 'acme' }))
      dispatch.ui = { set: vi.fn() }
      await run('leaveMembership', 'acme')
      expect(dispatch.accounts.set).toHaveBeenCalledWith({ membership: [] })
      // Their row of it goes; the other sign-in's stays.
      expect(dispatch.accounts.forgetRows).toHaveBeenCalledWith(['acme'])
      expect(dispatch.organization.fetch).toHaveBeenCalledTimes(1)
      expect(dispatch.accounts.select.mock.calls).toEqual([['personal']])
    })

    it('leave it as the page’s person, whose membership it is, though the other’s row of it is the selected one', async () => {
      graphQLLeaveMembership.mockReset().mockResolvedValue({})
      const both = { ...work, membership: [member('labs'), member('acme')] }
      const { dispatch, run } = effectsWith(signedIn({ 'sub-work': both }, { activeId: 'acme', activeSub: 'sub-work' }))
      dispatch.ui = { set: vi.fn() }
      await run('leaveMembership', 'acme')
      expect(graphQLLeaveMembership).toHaveBeenCalledWith('acme', '')
      expect(dispatch.accounts.set).toHaveBeenCalledWith({ membership: [] })
      // The other is a member still: its row, and what was read for it as them, stay. Their own row of it goes.
      expect(dispatch.accounts.setSignIns).not.toHaveBeenCalled()
      expect(dispatch.accounts.forgetData).not.toHaveBeenCalled()
      expect(dispatch.accounts.forgetRows.mock.calls).toEqual([[['acme']]])
    })
  })

  it('have the organization one of them has joined since read, as the sign-in that serves it', async () => {
    inUse('sub-work')
    graphQLBasicRequest.mockReset().mockResolvedValue(answer('work', ['labs', 'newly']))
    const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work }))
    await run('fetchSignIns')
    expect(dispatch.organization.fetch).toHaveBeenCalledTimes(1)
    expect(dispatch.accounts.forgetData).not.toHaveBeenCalled()
  })

  it('read nothing more when their rows are as they were', async () => {
    inUse('sub-work')
    graphQLBasicRequest.mockReset().mockResolvedValue(answer('work', ['labs']))
    const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work }))
    await run('fetchSignIns')
    expect(dispatch.organization.fetch).not.toHaveBeenCalled()
  })

  it('are asked before the account fetch is done, so what is read next by account knows their rows', async () => {
    let asked!: () => void
    const dispatch: any = {
      accounts: {
        fetchOrganizationClosures: vi.fn(),
        fetchSignIns: vi.fn(() => new Promise<void>(resolve => (asked = resolve))),
        parse: vi.fn(),
      },
    }
    graphQLBasicRequest.mockReset().mockResolvedValue('ERROR')
    let done = false
    const fetching = (accounts as any)
      .effects(dispatch)
      .fetch()
      .then(() => (done = true))
    await new Promise(resolve => setTimeout(resolve))
    expect(done).toBe(false)
    asked()
    await fetching
    expect(done).toBe(true)
  })

  it('have the selected row’s runs read again with its lists, where they had been read', async () => {
    const both = { ...work, membership: [member('labs'), member('acme')] }
    // Acme's runs were read through Work's row of it; it is looked at through the page's own person's now.
    const state = {
      ...signedIn({ 'sub-work': both }, { activeId: 'acme' }),
      jobs: { all: { [rowKey('acme', 'sub-work')]: [], [rowKey('labs', 'sub-work')]: [] } },
    }
    const { dispatch, run } = effectsWith(state)
    dispatch.jobs = { fetch: vi.fn() }
    await run('readAgain', ['labs'])
    expect(dispatch.jobs.fetch).not.toHaveBeenCalled()
    await run('readAgain', ['acme'])
    expect(dispatch.accounts.select).toHaveBeenCalledWith('acme')
    expect(dispatch.jobs.fetch.mock.calls).toEqual([[{ accountId: 'acme' }]])
  })

  it('are written by the last reading asked for alone: an older one answered late does not take a new account away', async () => {
    const third = { sub: 'sub-third', id: 'third', email: 'third@x.test', membership: [] }
    const answers: Record<string, (value: unknown) => void> = {}
    graphQLBasicRequest
      .mockReset()
      .mockImplementation(
        (_query: string, _variables: object, _silent: boolean, { sub }: { sub: string }) =>
          new Promise(resolve => (answers[sub] ??= resolve))
      )
    const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work }))
    inUse('sub-work')
    const older = run('fetchSignIns')
    const slow = answers['sub-work']
    delete answers['sub-work']
    // Another account is brought into use, and read with the first.
    inUse('sub-work', 'sub-third')
    const newer = run('fetchSignIns')
    answers['sub-work'](answer('work', ['labs']))
    answers['sub-third'](answer('third', []))
    await newer
    slow(answer('work', ['labs']))
    await older
    expect(dispatch.accounts.setSignIns).toHaveBeenCalledTimes(1)
    expect(Object.keys(dispatch.accounts.setSignIns.mock.calls[0][0])).toEqual(['sub-work', 'sub-third'])
    expect(third.sub).toBe('sub-third')
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

  const BY_ROW = [
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

  it('drop every row of the accounts forgotten, out of every model, and what is kept of them outside the store', () => {
    const dispatch: any = Object.fromEntries(BY_ROW.map(model => [model, { forget: vi.fn() }]))
    const outside = vi.fn()
    accountCache(outside)
    ;(accounts as any).effects(dispatch).forgetData(['work', 'labs'])
    BY_ROW.forEach(model => expect(dispatch[model].forget).toHaveBeenCalledWith(['work', 'labs']))
    expect(outside).toHaveBeenCalledWith(['work', 'labs'], [])
  })

  it('drop rows that are no more out of every model, and say them again by new keys in every model', () => {
    const dispatch: any = Object.fromEntries(BY_ROW.map(model => [model, { forgetRows: vi.fn(), rekey: vi.fn() }]))
    const outside = vi.fn()
    accountCache(outside)
    const gone = [rowKey('acme', 'sub-work')]
    ;(accounts as any).effects(dispatch).forgetRows(gone)
    BY_ROW.forEach(model => expect(dispatch[model].forgetRows).toHaveBeenCalledWith(gone))
    expect(outside).toHaveBeenCalledWith([], gone)
    const said = { acme: rowKey('acme', 'sub-a') }
    ;(accounts as any).effects(dispatch).rekey(said)
    BY_ROW.forEach(model => expect(dispatch[model].rekey).toHaveBeenCalledWith(said))
  })

  it('drop the rows of a sign-in that left, of every model, and no other', async () => {
    inUse()
    const both = { ...work, membership: [member('labs'), member('acme')] }
    const state: any = signedIn({ 'sub-work': both }, { activeId: 'acme' })
    const theirs = rowKey('acme', 'sub-work')
    state.devices = { default: {}, acme: {}, [theirs]: {}, personal: {} }
    state.networks = { all: { acme: [], [theirs]: [] } }
    state.organization = { accounts: { acme: {}, [theirs]: {}, [rowKey('labs', 'sub-work')]: {} } }
    state.tags = { all: { [theirs]: [] } }
    const { dispatch, run } = effectsWith(state)
    await run('fetchSignIns')
    // Labs and Work's own account are rows no more (forgetData); Acme is still one, the page's own person's.
    expect(dispatch.accounts.forgetData).toHaveBeenCalledWith(['work', 'labs'])
    expect(dispatch.accounts.forgetRows.mock.calls[0][0].sort()).toEqual([theirs, rowKey('labs', 'sub-work')].sort())
    expect(dispatch.accounts.select).not.toHaveBeenCalled()
  })

  it('select an organization as the account whose row is picked: nothing dropped, that row the selected one', async () => {
    const both = { ...work, membership: [member('labs'), member('acme')] }
    const state: any = signedIn({ 'sub-work': both }, { activeId: 'acme' })
    state.devices = { acme: {}, [rowKey('acme', 'sub-work')]: {} }
    const { dispatch, run } = effectsWith(state)
    await run('selectAs', { accountId: 'acme', sub: 'sub-work' })
    // The row: the account, and the sign-in.
    expect(dispatch.accounts.select.mock.calls).toEqual([[{ accountId: 'acme', sub: 'sub-work' }]])
    // Each row is kept as read: nothing is forgotten, nothing asked again of the organization.
    expect(dispatch.accounts.forgetData).not.toHaveBeenCalled()
    expect(dispatch.accounts.forgetRows).not.toHaveBeenCalled()
    expect(dispatch.organization.fetch).not.toHaveBeenCalled()
    expect(dispatch.accounts.set).not.toHaveBeenCalled()
  })

  it('select an account as it is looked at where the sign-in said does not reach it', async () => {
    const { dispatch, run } = effectsWith(signedIn({ 'sub-work': work }))
    await run('selectAs', { accountId: 'acme', sub: 'sub-work' })
    expect(dispatch.accounts.select.mock.calls).toEqual([['acme']])
  })

  it('tell what a page reads for itself to read again when the row selected is another sign-in’s', async () => {
    const told = vi.fn()
    const stop = followAccountsDropped(told)
    const dispatch: any = {
      logs: { reset: vi.fn() },
      ui: { set: vi.fn() },
      accounts: { set: vi.fn() },
      jobs: { fetch: vi.fn() },
      ...Object.fromEntries(
        ['networks', 'devices', 'files', 'tags', 'products', 'partnerStats'].map(model => [
          model,
          { fetchIfEmpty: vi.fn() },
        ])
      ),
    }
    const both = { ...work, membership: [member('labs'), member('acme')] }
    const state: any = signedIn({ 'sub-work': both }, { activeId: 'acme' })
    state.jobs = { all: { acme: [] } }
    const select = (row: unknown) => (accounts as any).effects(dispatch).select(row, state)
    // From the page's own person's organization to another of theirs: the same sign-in, nothing to read again.
    await select('personal')
    expect(told).not.toHaveBeenCalled()
    // To a row of Work's: another sign-in's.
    await select('labs')
    expect(told).toHaveBeenCalledTimes(1)
    // To the other row of the organization selected: nothing dropped, the page's own reads made again as it — and
    // its runs read for that row, where this one's had been.
    await select({ accountId: 'acme', sub: 'sub-work' })
    expect(dispatch.accounts.set).toHaveBeenLastCalledWith({ activeId: 'acme', activeSub: 'sub-work' })
    expect(told).toHaveBeenCalledTimes(2)
    expect(dispatch.jobs.fetch.mock.calls).toEqual([[{ accountId: 'acme', sub: 'sub-work' }]])
    // Selected again by its id alone: the selected row stays the one picked.
    const picked = { ...state, accounts: { ...state.accounts, activeSub: 'sub-work' } }
    await (accounts as any).effects(dispatch).select('acme', picked)
    expect(dispatch.accounts.set).toHaveBeenLastCalledWith({ activeId: 'acme', activeSub: 'sub-work' })
    expect(told).toHaveBeenCalledTimes(2)
    stop()
  })

  it('drop, once, what state stored before it was kept by row holds of another sign-in under a plain id', () => {
    const both = { ...work, membership: [member('labs'), member('acme')] }
    // As it was stored: every account's devices under its own id — Work's, Labs' and (picked for it) Acme's read as
    // Work. A plain id is the page's own person's row now.
    const state = signedIn({ 'sub-work': both }, { activeId: 'acme', via: { acme: 'sub-work' }, byRow: undefined })
    state.devices = { default: {}, connections: {}, personal: {}, acme: {}, work: {}, labs: {} }
    Object.assign(state, { networks: { all: { acme: [], personal: [] } }, organization: { accounts: { labs: {} } } })
    const { dispatch, run } = effectsWith(state)
    run('keepByRow')
    expect(dispatch.accounts.forgetRows.mock.calls).toEqual([[['acme', 'work', 'labs']]])
    // What was picked for the selected account is the selected row from now on; `via` is kept no more.
    expect(dispatch.accounts.set).toHaveBeenCalledWith({ byRow: 3, activeSub: 'sub-work', via: undefined })
    // Stored by row already: nothing is looked for.
    run('keepByRow')
    expect(dispatch.accounts.forgetRows).toHaveBeenCalledTimes(1)
  })

  it('select a row: the account, and the sign-in it is looked at through', async () => {
    const dispatch: any = {
      logs: { reset: vi.fn() },
      ui: { set: vi.fn() },
      accounts: { set: vi.fn() },
      ...Object.fromEntries(
        ['networks', 'devices', 'files', 'tags', 'products', 'partnerStats'].map(model => [
          model,
          { fetchIfEmpty: vi.fn() },
        ])
      ),
    }
    const state = signedIn({ 'sub-work': work })
    await (accounts as any).effects(dispatch).select('labs', state)
    expect(dispatch.accounts.set).toHaveBeenLastCalledWith({ activeId: 'labs', activeSub: 'sub-work' })
    await (accounts as any).effects(dispatch).select('acme', state)
    expect(dispatch.accounts.set).toHaveBeenLastCalledWith({ activeId: 'acme', activeSub: '' })
  })

  it('keep the selected row through a refresh of the primary’s memberships when another sign-in serves it', async () => {
    const dispatch: any = { ui: { set: vi.fn() }, accounts: { set: vi.fn() } }
    const state = signedIn({ 'sub-work': work }, { activeId: 'labs' })
    await (accounts as any).effects(dispatch).parse({ data: { data: { login: { membership: [] } } } }, state)
    expect(dispatch.accounts.set).toHaveBeenCalledWith({ membership: [] })
    expect(dispatch.ui.set).not.toHaveBeenCalled()
  })
})

/* A device shared with Personal and Work, both signed in here, is in both their lists — and in the list kept for
   connections, which is no account's. */
describe('a device taken out of some accounts’ lists', () => {
  // Work's own account, in its row: under the sign-in that read it (helpers/rowKey).
  const WORK = rowKey('work', 'sub-work')
  const device = (id: string, more: object = {}) => ({ id, ...more })
  const held = () => ({
    auth: { user: { id: 'personal' } },
    user: { id: 'personal' },
    accounts: {
      membership: [],
      signIns: { 'sub-work': { sub: 'sub-work', id: 'work', email: 'work@x.test', membership: [] } },
    },
    devices: {
      personal: { all: [device('D1'), device('D2')], total: 2 },
      [WORK]: { all: [device('D1')], total: 1 },
      connections: { all: [device('D1'), device('D3')], total: 0 },
    },
  })
  function removing(state: object) {
    const dispatch: any = { accounts: { setDevices: vi.fn() }, devices: { set: vi.fn() } }
    const effects = (accounts as any).effects(dispatch)
    dispatch.accounts.removeDeviceFrom = vi.fn((payload: object) => effects.removeDeviceFrom(payload, state))
    return { dispatch, effects }
  }

  it('leaves the other accounts’ lists as they are, says another holds it, and counts one fewer', async () => {
    const { dispatch, effects } = removing(held())
    expect(await effects.removeDeviceFrom({ id: 'D1', accountIds: ['work'] }, held())).toBe(true)
    expect(dispatch.accounts.setDevices.mock.calls).toEqual([[{ devices: [], accountId: 'work', row: WORK }]])
    expect(dispatch.devices.set.mock.calls).toEqual([[{ total: 0, accountId: 'work', row: WORK }]])
  })

  it('says no account holds it when only the list kept for connections does', async () => {
    const state = held()
    state.devices.personal.all = [device('D2')]
    const { effects } = removing(state)
    expect(await effects.removeDeviceFrom({ id: 'D1', accountIds: ['work'] }, state)).toBe(false)
  })

  it('comes out of every list when the device is gone', async () => {
    const { dispatch, effects } = removing(held())
    await effects.removeDevice('D1')
    expect(dispatch.accounts.setDevices.mock.calls.map(([set]: any) => [set.accountId, set.row])).toEqual([
      ['personal', 'personal'],
      ['work', WORK],
      ['connections', 'connections'],
    ])
  })

  it('comes out of one row alone where that row’s sign-in no longer sees it, another row holding it still', async () => {
    const state = held()
    Object.assign(state.devices, { acme: { all: [device('D1')], total: 1 } })
    Object.assign(state.devices, { [rowKey('acme', 'sub-work')]: { all: [device('D1')], total: 1 } })
    state.accounts.membership = [{ account: { id: 'acme' } }] as never[]
    const { dispatch, effects } = removing(state)
    expect(await effects.removeDeviceFrom({ id: 'D1', rows: [rowKey('acme', 'sub-work')] }, state)).toBe(true)
    expect(dispatch.accounts.setDevices.mock.calls.map(([set]: any) => set.row)).toEqual([rowKey('acme', 'sub-work')])
  })
})
