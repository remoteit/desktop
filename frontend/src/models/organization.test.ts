import { describe, it, expect, vi } from 'vitest'

const { graphQLFetchOrganizations } = vi.hoisted(() => ({ graphQLFetchOrganizations: vi.fn() }))
vi.mock('../services/graphQLRequest', () => ({
  graphQLFetchOrganizations,
  graphQLFetchGuests: vi.fn(),
  graphQLGetResellerReportUrl: vi.fn(),
}))
vi.mock('../services/graphQLMutation', () => ({}))
vi.mock('./accounts', () => ({
  getAccountIds: () => ['me', 'org-a', 'org-b', 'work', 'org-w'],
  // work and org-w are another sign-in's: asked as that sign-in, apart from the page's own person's accounts.
  accountIdsBySignIn: (_state: unknown, ids: string[]) => [
    ['', ids.filter(id => !['work', 'org-w'].includes(id))],
    ['sub-work', ids.filter(id => ['work', 'org-w'].includes(id))],
  ],
}))
vi.mock('../selectors/organizations', () => ({ selectOrganization: vi.fn(), selectOrganizationReseller: vi.fn() }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: vi.fn() }))
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
