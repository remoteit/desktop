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
  accountIdsBySignIn: (_state: unknown, ids: string[]) => [
    ['', ids.filter(id => !['work', 'org-w'].includes(id))],
    ['sub-work', ids.filter(id => ['work', 'org-w'].includes(id))],
  ],
}))
vi.mock('../selectors/organizations', () => ({ selectOrganization, selectOrganizationReseller: vi.fn() }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId }))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))

import organization from './organization'

describe('organization.fetch', () => {
  it('applies the orgs that resolved and keeps what the failed ones had', async () => {
    const dispatch: any = { organization: { set: vi.fn() } }
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

    const { accounts } = dispatch.organization.set.mock.calls[0][0]
    expect(Object.keys(accounts).sort()).toEqual(['org-a', 'org-b', 'org-w', 'work'])
    expect(accounts['org-a'].name).toBe('Cat Demo')
    expect(accounts['org-b']).toBe(loaded)
    // Each sign-in is asked about the accounts it serves, in a request of its own.
    const asked = graphQLFetchOrganizations.mock.calls.map(([ids, requestFor]) => [ids, requestFor])
    expect(asked).toEqual([
      [['me', 'org-a', 'org-b'], { sub: '' }],
      [['work', 'org-w'], { sub: 'sub-work' }],
    ])
  })
})

/* Work is signed in beside the page's own person and has no organization: its row is selected. A request that names
   no account is the page's own person's, so what is made or changed here names the selected account. */
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
    expect(dispatch.organization.setActive).toHaveBeenCalledWith({ name: 'Work Org', id: 'work' })
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
