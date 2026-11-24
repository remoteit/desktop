import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requestSignIn } from '../selectors/signIns'

const { graphQLFetchOrganizations, mutations, selectOrganization, selectActiveAccountId } = vi.hoisted(() => ({
  graphQLFetchOrganizations: vi.fn(),
  mutations: { graphQLSetOrganization: vi.fn(), graphQLSetMembers: vi.fn(), graphQLRemoveMembers: vi.fn() },
  selectOrganization: vi.fn(),
  selectActiveAccountId: vi.fn(),
}))
vi.mock('../services/graphQLRequest', () => ({
  graphQLFetchOrganizations,
  graphQLFetchGuests: vi.fn(),
  graphQLGetResellerReportUrl: vi.fn(),
}))
vi.mock('../services/graphQLMutation', () => mutations)
vi.mock('./accounts', () => ({
  getAccountIds: () => ['me', 'org-a', 'org-b', 'work', 'org-w'],
  // work and org-w are another sign-in's: asked as that sign-in, apart from the page's own person's accounts.
  accountIdsByReach: (_state: unknown, ids: string[]) => [
    ['', ids.filter(id => !['work', 'org-w'].includes(id))],
    ['sub-work', ids.filter(id => ['work', 'org-w'].includes(id))],
  ],
}))
vi.mock('../selectors/organizations', () => ({ selectOrganization, selectOrganizationReseller: vi.fn() }))
vi.mock('../selectors/accounts', () => ({
  selectActiveAccountId,
  // The row looked at: the account's, under the sign-in that serves it (work's are sub-work's).
  selectRow: (_state: unknown, accountId?: string) => `row of ${accountId || selectActiveAccountId()}`,
  rowSaid: () => ({ accountId: selectActiveAccountId(), row: `row of ${selectActiveAccountId()}` }),
}))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))

import organization from './organization'
import { rowKey } from '../helpers/rowKey'

describe('organization.fetch', () => {
  it('applies the orgs that resolved and keeps what the failed ones had', async () => {
    const dispatch: any = { organization: { merge: vi.fn() } }
    const effects = (organization as any).effects(dispatch)
    dispatch.organization.parse = (params: any) => effects.parse(params)
    graphQLFetchOrganizations.mockImplementation(async (ids: string[]) =>
      ids.includes('work')
        ? {
            data: {
              data: {
                login: {
                  _0: { organization: null },
                  _1: {
                    organization: { id: 'org-w', name: 'Work Org', created: '2026-01-01', members: [], roles: [] },
                  },
                },
              },
            },
          }
        : own
    )
    const own = {
      data: {
        data: {
          login: {
            _0: null,
            _1: { organization: { id: 'org-a', name: 'Cat Demo', created: '2026-01-01', members: [], roles: [] } },
            _2: null,
          },
        },
        errors: [{ message: 'forbidden' }],
      },
    }

    const loaded = { id: 'org-b', name: 'Press Demo' }
    await effects.fetch(undefined, { organization: { accounts: { 'org-b': loaded } } })

    // Only what was answered is written, beside what is stored: what failed keeps what it had (the reducer below).
    const [accounts] = dispatch.organization.merge.mock.calls[0]
    // Each under its row (helpers/rowKey): the account, and the sign-in that was asked.
    const WORKS = [rowKey('org-w', 'sub-work'), rowKey('work', 'sub-work')]
    expect(Object.keys(accounts).sort()).toEqual(['org-a', ...WORKS].sort())
    expect(accounts['org-a'].name).toBe('Cat Demo')
    const merged = (organization as any).reducers.merge({ initialized: false, accounts: { 'org-b': loaded } }, accounts)
    expect(Object.keys(merged.accounts).sort()).toEqual(['org-a', 'org-b', ...WORKS].sort())
    expect(merged.accounts['org-b']).toBe(loaded)
    expect(merged.initialized).toBe(true)
    // Each sign-in is asked about the accounts it serves, in a request of its own.
    const asked = graphQLFetchOrganizations.mock.calls.map(([ids, requestFor]) => [ids, requestFor])
    expect(asked).toEqual([
      [['me', 'org-a', 'org-b'], { sub: '', about: ['me', 'org-a', 'org-b'], row: true }],
      [['work', 'org-w'], { sub: 'sub-work', about: ['work', 'org-w'], row: true }],
    ])
  })
})

/* Work is signed in beside the page's own person and has no organization: its row is selected. A request that names
   no account is the page's own person's, so what is made or changed here names the selected account. */
describe('organization.fetch — two readings that overlap', () => {
  it('each keep what they found: the one asked first, answered last, does not take the newer rows away', async () => {
    const stored = { initialized: true, accounts: {} as Record<string, any> }
    const dispatch: any = {
      organization: {
        merge: (accounts: object) => Object.assign(stored, (organization as any).reducers.merge(stored, accounts)),
      },
    }
    const effects = (organization as any).effects(dispatch)
    dispatch.organization.parse = (params: any) => effects.parse(params)
    const org = (id: string) => ({ organization: { id, name: id, created: '2026-01-01', members: [], roles: [] } })
    const answers: ((value: unknown) => void)[] = []
    graphQLFetchOrganizations.mockReset().mockImplementation(() => new Promise(resolve => answers.push(resolve)))
    const state = { organization: { accounts: {} } }
    const older = effects.fetch(undefined, state)
    const newer = effects.fetch(undefined, state)
    await vi.waitFor(() => expect(answers).toHaveLength(4))
    const answered = (login: object) => ({ data: { data: { login } } })
    // The newer reading answers first, with an organization the other sign-in has joined since the older was asked.
    answers[2](answered({ _0: null, _1: org('org-a'), _2: null }))
    answers[3](answered({ _0: null, _1: org('org-w') }))
    await newer
    expect(Object.keys(stored.accounts).sort()).toEqual(['org-a', rowKey('org-w', 'sub-work')])
    answers[0](answered({ _0: null, _1: org('org-a'), _2: null }))
    answers[1](answered({ _0: null, _1: null }))
    await older
    expect(Object.keys(stored.accounts).sort()).toEqual(['org-a', rowKey('org-w', 'sub-work')])
  })
})

describe('an account with no organization yet', () => {
  const state = {
    auth: { user: { id: 'me' } },
    user: { id: 'me', email: 'me@x.test' },
    accounts: {
      activeId: 'work',
      membership: [],
      signIns: { 'sub-work': { sub: 'sub-work', id: 'work', email: 'work@x.test', membership: [] } },
    },
  }
  const dispatch: any = { organization: { setActive: vi.fn(), fetch: vi.fn() }, ui: { set: vi.fn() } }
  const effects = (organization as any).effects(dispatch)

  beforeEach(() => {
    vi.clearAllMocks()
    selectActiveAccountId.mockReturnValue('work')
    selectOrganization.mockReturnValue({ id: '', members: [] })
    Object.values(mutations).forEach(mutation => mutation.mockResolvedValue({}))
  })

  it('has its organization made for it, as the sign-in that serves it', async () => {
    await effects.setOrganization({ name: 'Work Org' }, state)
    expect(dispatch.organization.setActive).toHaveBeenCalledWith({ name: 'Work Org', id: 'work', row: 'row of work' })
    const [variables] = mutations.graphQLSetOrganization.mock.calls[0]
    expect(variables).toEqual({ name: 'Work Org', accountId: 'work' })
    expect(requestSignIn(state as any, undefined, variables)).toBe('sub-work')
  })

  it('has its members set and removed as that sign-in too', async () => {
    const member = { user: { email: 'new@x.test', id: '' }, roleId: 'MEMBER', license: 'LICENSED' }
    await effects.setMembers([member], state)
    expect(mutations.graphQLSetMembers).toHaveBeenCalledWith(['new@x.test'], 'work', 'MEMBER', 'LICENSED')
    await effects.removeMember(member, state)
    expect(mutations.graphQLRemoveMembers).toHaveBeenCalledWith(['new@x.test'], 'work')
  })

  it('an organization there already is changed by its own id', async () => {
    selectOrganization.mockReturnValue({ id: 'org-w', members: [] })
    await effects.setOrganization({ name: 'Renamed' }, state)
    expect(mutations.graphQLSetOrganization).toHaveBeenCalledWith({ name: 'Renamed', accountId: 'org-w' })
    expect(dispatch.ui.set).not.toHaveBeenCalled()
  })
})
