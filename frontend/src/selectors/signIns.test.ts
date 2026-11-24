import { describe, it, expect, vi } from 'vitest'

vi.mock('../models/backend', () => ({ NOTICE_VERSION_ID: 'notice' }))
vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn() }))
vi.mock('../models/plans', () => ({ REMOTEIT_PRODUCT_ID: 'remoteit' }))
vi.mock('../models/organization', () => ({ defaultState: { id: '', name: '' } }))

import {
  noteAccountOf,
  requestServing,
  requestSignIn,
  selectPersonEmailFor,
  servingChanged,
  resetNotedAccounts,
  selectAccountRoutes,
  selectPersonFor,
  selectSignInSub,
} from './signIns'
import { selectMemberships, selectActiveUser, selectShowOrganizations } from './accounts'
import { selectOrganizationOptions, selectServingAccount, selectSwitcherRows } from './organizations'

/* Personal is the page's own person: a member of Acme and of Shared. Work is signed in beside them: its own account,
   a member of Labs and of Shared too. Each account holds a device with one service. */
const member = (id: string, name: string, roleName = 'Member') => ({
  account: { id, email: '' },
  name,
  roleId: 'MEMBER',
  roleName,
  created: new Date(1),
  license: 'UNKNOWN',
  standalone: true,
})
const device = (id: string) => ({ id, services: [{ id: `${id}-svc` }] })
const state = (accounts: object = {}): any => ({
  auth: { user: { id: 'personal' } },
  user: { id: 'personal', email: 'personal@x.test' },
  accounts: {
    activeId: undefined,
    membership: [member('acme', 'Acme'), member('shared', 'Shared', 'Admin')],
    signIns: {
      'sub-work': {
        sub: 'sub-work',
        id: 'work',
        email: 'work@x.test',
        membership: [member('labs', 'Labs'), member('shared', 'Shared', 'Guest')],
      },
    },
    via: {},
    ...accounts,
  },
  devices: {
    personal: { all: [device('d-personal')] },
    acme: { all: [device('d-acme')] },
    shared: { all: [device('d-shared')] },
    work: { all: [device('d-work')] },
    labs: { all: [device('d-labs'), device('d-acme')] },
  },
  networks: { all: { labs: [{ id: 'net-labs' }] } },
  jobs: { all: { work: [{ id: 'job-work' }] } },
  files: { all: { labs: [{ id: 'file-labs' }] } },
  products: {},
  organization: { accounts: { acme: { id: 'acme', name: 'Acme' }, labs: { id: 'labs', name: 'Labs' } } },
})
const single = (): any => ({ ...state({ signIns: {} }) })

describe('the sign-in that serves an account', () => {
  it('is the primary for the person’s own account and organizations, and the other sign-in for its own', () => {
    const s = state()
    expect(selectSignInSub(s, 'personal')).toBeUndefined()
    expect(selectSignInSub(s, 'acme')).toBeUndefined()
    expect(selectSignInSub(s, 'work')).toBe('sub-work')
    expect(selectSignInSub(s, 'labs')).toBe('sub-work')
    expect(selectSignInSub(s, 'no-such-account')).toBeUndefined()
    expect(selectSignInSub(s, undefined)).toBeUndefined()
  })

  it('is the primary for an organization both reach, unless the person picked the other', () => {
    expect(selectSignInSub(state(), 'shared')).toBeUndefined()
    expect(selectAccountRoutes(state()).shared.reach).toEqual([
      { sub: '', email: 'personal@x.test' },
      { sub: 'sub-work', email: 'work@x.test' },
    ])
    expect(selectSignInSub(state({ via: { shared: 'sub-work' } }), 'shared')).toBe('sub-work')
    expect(selectSignInSub(state({ via: { shared: '' } }), 'shared')).toBeUndefined()
  })

  it('ignores a pick for a sign-in that no longer reaches the organization', () => {
    expect(selectSignInSub(state({ via: { shared: 'sub-gone', acme: 'sub-work' } }), 'shared')).toBeUndefined()
    expect(selectSignInSub(state({ via: { acme: 'sub-work' } }), 'acme')).toBeUndefined()
  })
})

describe('the switcher’s rows', () => {
  it('are the primary’s memberships as they are with one sign-in', () => {
    const s = single()
    expect(selectMemberships(s)).toBe(s.accounts.membership)
  })

  it('are every sign-in’s account and organizations, one row per id, saying how each is available', () => {
    const rows = selectMemberships(state()).map(row => [row.account.id, row.via?.email, row.signIn, row.roleName])
    expect(rows).toEqual([
      ['acme', undefined, undefined, 'Member'],
      ['shared', undefined, undefined, 'Admin'],
      ['work', 'work@x.test', true, 'Owner'],
      ['labs', 'work@x.test', undefined, 'Member'],
    ])
    expect(selectMemberships(state()).find(row => row.account.id === 'shared')?.reach).toHaveLength(2)
  })

  it('serve a shared organization through the sign-in the person picked, with that sign-in’s role', () => {
    const shared = selectMemberships(state({ via: { shared: 'sub-work' } })).find(row => row.account.id === 'shared')
    expect([shared?.via?.sub, shared?.roleName]).toEqual(['sub-work', 'Guest'])
  })

  it('are options of the switcher: another sign-in’s account by its email, never disabled for having no organization', () => {
    const options = selectOrganizationOptions(state()).map(o => [o.id, o.name, o.disabled, o.via?.email, !!o.reach])
    expect(options).toEqual([
      ['acme', 'Acme', false, undefined, false],
      ['labs', 'Labs', false, 'work@x.test', false],
      ['shared', 'Shared', true, undefined, true],
      ['work', 'work@x.test', false, 'work@x.test', false],
    ])
  })

  /* An organization two accounts belong to is a row under each: the page's own person's organizations, then each
     further sign-in's own account and its organizations. Picking a row is choosing who to act as there. */
  describe('one for each account an organization is reached through', () => {
    const rows = (s: any) =>
      selectSwitcherRows(s).map(r => [r.key, r.account, r.roleName, r.shared, r.serving] as const)

    it('the shared organization under both accounts, each in that account’s role, the page’s own person’s serving', () => {
      expect(rows(state())).toEqual([
        [':acme', 'personal@x.test', 'Member', false, true],
        [':shared', 'personal@x.test', 'Admin', true, true],
        ['sub-work:work', 'work@x.test', 'Owner', false, true],
        ['sub-work:labs', 'work@x.test', 'Member', false, true],
        ['sub-work:shared', 'work@x.test', 'Guest', true, false],
      ])
      const keys = selectSwitcherRows(state()).map(r => r.key)
      expect(new Set(keys).size).toBe(keys.length)
      expect(selectServingAccount(state(), 'shared')).toBe('personal@x.test')
      expect(selectServingAccount(state(), 'acme')).toBeUndefined()
    })

    it('the other account’s row picked: served as that account, and only that row is the serving one — kept as stored', () => {
      // What picking the row stores (accounts.via), as it is read back after a reload.
      const picked = JSON.parse(JSON.stringify(state({ via: { shared: 'sub-work' } })))
      const shared = selectSwitcherRows(picked).filter(r => r.id === 'shared')
      expect(shared.map(r => [r.sub, r.serving])).toEqual([
        ['', false],
        ['sub-work', true],
      ])
      expect(selectSignInSub(picked, 'shared')).toBe('sub-work')
      expect(selectServingAccount(picked, 'shared')).toBe('work@x.test')
    })

    it('that account unchecked or signed out: its rows are gone, and the organization is the other’s to serve', () => {
      const left = state({ via: { shared: 'sub-work' }, signIns: {} })
      expect(rows(left)).toEqual([
        [':acme', 'personal@x.test', 'Member', false, true],
        [':shared', 'personal@x.test', 'Admin', false, true],
      ])
      expect(selectSignInSub(left, 'shared')).toBeUndefined()
    })
  })

  it('show the rail for a person with no organizations once another account is signed in', () => {
    expect(selectShowOrganizations(state({ membership: [] }))).toBe(true)
    expect(selectShowOrganizations(state({ membership: [], signIns: {} }))).toBe(false)
  })

  it('name the selected row’s account: another sign-in’s own account by its email', () => {
    expect(selectActiveUser(state({ activeId: 'work' }))).toMatchObject({ id: 'work', email: 'work@x.test' })
  })
})

describe('the sign-in a request is made as', () => {
  it('is always the primary with one sign-in in use', () => {
    expect(requestSignIn(single(), { account: 'labs' }, { accountId: 'work', deviceId: 'd-labs' })).toBeUndefined()
  })

  it('is the one the caller names, by sub or by account', () => {
    expect(requestSignIn(state(), { sub: 'sub-work' })).toBe('sub-work')
    expect(requestSignIn(state(), { sub: '' }, { accountId: 'labs' })).toBeUndefined()
    expect(requestSignIn(state(), { account: 'labs' })).toBe('sub-work')
    expect(requestSignIn(state(), { account: 'acme' }, { accountId: 'labs' })).toBeUndefined()
    // Asked by sub before any account is known for it (reading a new sign-in's rows).
    expect(requestSignIn(single(), { sub: 'sub-new' })).toBe('sub-new')
  })

  it('is the one that serves the account the variables name', () => {
    expect(requestSignIn(state(), undefined, { accountId: 'labs', size: 10 })).toBe('sub-work')
    expect(requestSignIn(state(), undefined, { accountId: 'work' })).toBe('sub-work')
    expect(requestSignIn(state(), undefined, { accountId: 'acme' })).toBeUndefined()
    expect(requestSignIn(state(), undefined, { accountId: 'someone-an-admin-looks-up' })).toBeUndefined()
  })

  it('is the one that serves the account holding what the variables name', () => {
    const s = state()
    expect(requestSignIn(s, undefined, { deviceId: 'd-labs' })).toBe('sub-work')
    expect(requestSignIn(s, undefined, { serviceId: 'd-work-svc' })).toBe('sub-work')
    expect(requestSignIn(s, undefined, { serviceId: ['x', 'd-labs-svc'], name: ['tag'] })).toBe('sub-work')
    expect(requestSignIn(s, undefined, { networkId: 'net-labs' })).toBe('sub-work')
    expect(requestSignIn(s, undefined, { jobId: 'job-work' })).toBe('sub-work')
    expect(requestSignIn(s, undefined, { id: 'labs' })).toBe('sub-work')
    expect(requestSignIn(s, undefined, { deviceId: 'd-personal' })).toBeUndefined()
    expect(requestSignIn(s, { about: ['file-labs'] })).toBe('sub-work')
  })

  it('is the one that serves the account something no list holds was made or read under', () => {
    resetNotedAccounts()
    const s = state()
    // A service just added to Labs' device, an exit read with Labs' exits: neither is in a stored list.
    expect(requestSignIn(s, undefined, { serviceId: 'svc-new' })).toBeUndefined()
    noteAccountOf('labs', ['svc-new', 'exit-1', undefined])
    expect(requestSignIn(s, undefined, { serviceId: 'svc-new', attributes: {} })).toBe('sub-work')
    expect(requestSignIn(s, undefined, { exit: 'exit-1', confirm: false })).toBe('sub-work')
    expect(requestSignIn(s, { about: ['exit-1'] })).toBe('sub-work')
    // What a list holds says first; an account that is no row here says nothing; with one sign-in, nothing to decide.
    expect(requestSignIn(s, undefined, { exit: 'exit-1', deviceId: 'd-personal' })).toBeUndefined()
    noteAccountOf('someone-else', ['exit-2'])
    expect(requestSignIn(s, undefined, { exit: 'exit-2' })).toBeUndefined()
    noteAccountOf('work', ['exit-2'])
    expect(requestSignIn(s, undefined, { exit: 'exit-2' })).toBe('sub-work')
    expect(requestSignIn(single(), undefined, { exit: 'exit-1' })).toBeUndefined()
    noteAccountOf(undefined, ['exit-3'])
    expect(requestSignIn(s, undefined, { exit: 'exit-3' })).toBeUndefined()
    resetNotedAccounts()
  })

  it('is the selected account’s, where the caller says so, for something nothing known says whose it is', () => {
    resetNotedAccounts()
    // An exit's page opened at its address: no list read yet.
    expect(requestSignIn(state({ activeId: 'labs' }), undefined, { id: 'exit-9' })).toBeUndefined()
    expect(requestSignIn(state({ activeId: 'labs' }), { orAccount: 'labs' }, { id: 'exit-9' })).toBe('sub-work')
    expect(requestSignIn(state(), { orAccount: 'acme' }, { id: 'exit-9' })).toBeUndefined()
    // What is known says first.
    noteAccountOf('acme', ['exit-9'])
    expect(requestSignIn(state({ activeId: 'labs' }), { orAccount: 'labs' }, { id: 'exit-9' })).toBeUndefined()
    expect(requestSignIn(state(), { orAccount: 'labs' }, { deviceId: 'd-personal' })).toBeUndefined()
    resetNotedAccounts()
  })

  it('takes an accountId among the variables as data where the caller says what the request is about', () => {
    resetNotedAccounts()
    // Work administers a network (read with Labs') and takes Shared's devices into it by tag. Shared is the page's own
    // person's to serve, who may not: the rule is the network's manager's to make.
    noteAccountOf('labs', ['net-y'])
    const rule = { networkId: 'net-y', tags: ['lab'], accountId: 'shared' }
    expect(requestSignIn(state(), undefined, rule)).toBeUndefined()
    expect(requestSignIn(state(), { about: ['net-y'] }, rule)).toBe('sub-work')
    // Where nothing known says whose the network is, the account named still says.
    expect(requestSignIn(state(), { about: ['net-unknown'] }, { ...rule, accountId: 'labs' })).toBe('sub-work')
    // A stored list's word comes first, as ever.
    expect(requestSignIn(state(), { about: ['net-labs'] }, { accountId: 'acme' })).toBe('sub-work')
    resetNotedAccounts()
  })

  it('prefers the selected account, then any the primary serves, for something read under more than one', () => {
    resetNotedAccounts()
    // An exit of Acme's, shared with Labs: listed for Labs first, then for Acme.
    noteAccountOf('labs', ['exit-shared'])
    noteAccountOf('acme', ['exit-shared'])
    expect(requestSignIn(state({ activeId: 'labs' }), undefined, { id: 'exit-shared' })).toBe('sub-work')
    expect(requestSignIn(state({ activeId: 'acme' }), undefined, { id: 'exit-shared' })).toBeUndefined()
    expect(requestSignIn(state({ activeId: 'personal' }), undefined, { id: 'exit-shared' })).toBeUndefined()
    noteAccountOf('work', ['exit-theirs'])
    noteAccountOf('labs', ['exit-theirs'])
    expect(requestSignIn(state({ activeId: 'acme' }), undefined, { id: 'exit-theirs' })).toBe('sub-work')
    resetNotedAccounts()
  })

  it('prefers the selected account, then any the primary serves, for something more than one account holds', () => {
    expect(requestSignIn(state(), undefined, { deviceId: 'd-acme' })).toBeUndefined()
    expect(requestSignIn(state({ activeId: 'labs' }), undefined, { deviceId: 'd-acme' })).toBe('sub-work')
    expect(requestSignIn(state({ activeId: 'acme' }), undefined, { deviceId: 'd-acme' })).toBeUndefined()
  })

  it('reads what the caller says it is about instead of the variables, and one level into an input object', () => {
    const s = state()
    // A local port: the variables name this machine's device too, which another account may hold.
    expect(requestSignIn(s, { about: ['d-labs-svc'] }, { deviceId: 'd-personal', serviceId: 'd-labs-svc' })).toBe(
      'sub-work'
    )
    expect(requestSignIn(s, { about: ['d-personal-svc'] }, { deviceId: 'd-labs' })).toBeUndefined()
    expect(requestSignIn(s, undefined, { input: { productId: 'x', deviceId: 'd-work' } })).toBe('sub-work')
  })

  it('names the person signed in for what a request is about: whose a local port opened for it is', () => {
    const s = state()
    expect(selectPersonFor(s, ['d-labs-svc'])).toBe('work')
    expect(selectPersonFor(s, ['d-acme-svc'])).toBe('personal')
    expect(selectPersonFor(s, [undefined])).toBe('personal')
    expect(selectPersonFor(single(), ['d-labs-svc'])).toBe('personal')
  })

  it('is the primary for a request about the person themselves, whichever row is selected', () => {
    const s = state({ activeId: 'labs' })
    expect(requestSignIn(s, undefined, {})).toBeUndefined()
    expect(requestSignIn(s, undefined, undefined)).toBeUndefined()
    expect(requestSignIn(s, undefined, { email: 'someone@x.test', quantity: 3 })).toBeUndefined()
    expect(requestSignIn(s, undefined, { deviceId: 'not-stored-anywhere' })).toBeUndefined()
  })
})

/* A read answers for the sign-ins that served its accounts when it was asked: one answered after another serves them
   is the sign-in before's, and is not kept (services/post). */
describe('the sign-ins a read was asked as', () => {
  it('are those serving the accounts it names, and those holding what it names', () => {
    expect(requestServing(state(), undefined, { accountId: 'labs', size: 10 })).toEqual([['labs', 'sub-work']])
    expect(requestServing(state(), { account: 'acme' })).toEqual([['acme', undefined]])
    expect(requestServing(state(), undefined, { deviceId: 'd-work' })).toEqual([['work', 'sub-work']])
    expect(requestServing(state(), { sub: 'sub-work', about: ['work', 'labs'] })).toEqual([
      ['work', 'sub-work'],
      ['labs', 'sub-work'],
    ])
    expect(requestServing(state(), undefined, { email: 'someone@x.test' })).toEqual([])
    expect(requestServing(single(), undefined, { accountId: 'labs' })).toEqual([])
  })

  it('have changed when another serves one of them, or none does — and not while each still does', () => {
    const asked = requestServing(state(), undefined, { accountId: 'shared' })
    expect(asked).toEqual([['shared', undefined]])
    expect(servingChanged(state(), asked)).toBe(false)
    expect(servingChanged(state({ activeId: 'labs' }), asked)).toBe(false)
    // The person picks the other sign-in for it.
    expect(servingChanged(state({ via: { shared: 'sub-work' } }), asked)).toBe(true)
    // The sign-in that served it leaves.
    const labs = requestServing(state(), undefined, { accountId: 'labs' })
    expect(servingChanged(state({ signIns: {} }), labs)).toBe(true)
    expect(servingChanged(state({ signIns: {} }), [])).toBe(false)
  })

  it('names the person a sign-in serving an account is', () => {
    expect(
      selectPersonEmailFor({ ...state(), auth: { user: { id: 'personal', email: 'personal@x.test' } } }, 'work')
    ).toBe('work@x.test')
    expect(
      selectPersonEmailFor({ ...state(), auth: { user: { id: 'personal', email: 'personal@x.test' } } }, 'acme')
    ).toBe('personal@x.test')
  })
})
