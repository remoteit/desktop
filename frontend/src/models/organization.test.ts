import { describe, it, expect, vi } from 'vitest'

const { graphQLFetchOrganizations } = vi.hoisted(() => ({ graphQLFetchOrganizations: vi.fn() }))
vi.mock('../services/graphQLRequest', () => ({
  graphQLFetchOrganizations,
  graphQLFetchGuests: vi.fn(),
  graphQLGetResellerReportUrl: vi.fn(),
}))
vi.mock('../services/graphQLMutation', () => ({}))
vi.mock('./accounts', () => ({ getAccountIds: () => ['me', 'org-a', 'org-b'] }))
vi.mock('../selectors/organizations', () => ({ selectOrganization: vi.fn(), selectOrganizationReseller: vi.fn() }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: vi.fn() }))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))

import organization from './organization'

describe('organization.fetch', () => {
  it('applies the orgs that resolved and keeps what the failed ones had', async () => {
    const dispatch: any = { organization: { set: vi.fn() } }
    const effects = (organization as any).effects(dispatch)
    dispatch.organization.parse = (params: any) => effects.parse(params)
    graphQLFetchOrganizations.mockResolvedValue({
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
    })

    const loaded = { id: 'org-b', name: 'Press Demo' }
    await effects.fetch(undefined, { organization: { accounts: { 'org-b': loaded } } })

    const { accounts } = dispatch.organization.set.mock.calls[0][0]
    expect(Object.keys(accounts).sort()).toEqual(['org-a', 'org-b'])
    expect(accounts['org-a'].name).toBe('Cat Demo')
    expect(accounts['org-b']).toBe(loaded)
  })
})
