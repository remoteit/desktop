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
  it('keeps the orgs that resolved when another account errors', async () => {
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

    await effects.fetch(undefined, {})

    const { accounts } = dispatch.organization.set.mock.calls[0][0]
    expect(Object.keys(accounts)).toEqual(['org-a'])
    expect(accounts['org-a'].name).toBe('Cat Demo')
  })
})
