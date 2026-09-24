import { describe, it, expect, vi, beforeEach } from 'vitest'

const { graphQLFetchOrganizations } = vi.hoisted(() => ({ graphQLFetchOrganizations: vi.fn() }))
vi.mock('../services/graphQLRequest', () => ({
  graphQLFetchOrganizations,
  graphQLFetchGuests: vi.fn(),
  graphQLGetResellerReportUrl: vi.fn(),
}))
vi.mock('../services/graphQLMutation', () => ({}))
vi.mock('./accounts', () => ({
  getAccountIds: (state: any) => [state.auth.user.id, ...state.accounts.membership.map((m: any) => m.account.id)],
}))
vi.mock('../selectors/organizations', () => ({ selectOrganization: vi.fn(), selectOrganizationReseller: vi.fn() }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: vi.fn() }))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))

import organization from './organization'

const model = organization as any

const org = (id: string, name: string) => ({
  organization: { id, name, created: '2026-01-01', members: [], roles: [], reseller: null },
  licenses: [],
  limits: [],
})

const state = {
  auth: { user: { id: 'me' } },
  accounts: { membership: [{ account: { id: 'org-a' } }, { account: { id: 'org-b' } }] },
  organization: { accounts: { 'org-b': { id: 'org-b', name: 'Stale B' } } },
}

describe('organization.fetch', () => {
  let dispatch: any
  let effects: any

  beforeEach(() => {
    graphQLFetchOrganizations.mockReset()
    dispatch = { organization: { set: vi.fn(), clearActive: vi.fn() } }
    effects = model.effects(dispatch)
    dispatch.organization.parse = (params: any) => effects.parse(params)
  })

  it('keeps the orgs that resolved when another account errors', async () => {
    graphQLFetchOrganizations.mockResolvedValue({
      data: {
        data: { login: { _0: null, _1: org('org-a', 'Cat Demo'), _2: null } },
        errors: [{ message: 'forbidden' }],
      },
    })

    await effects.fetch(undefined, state)

    const { accounts } = dispatch.organization.set.mock.calls[0][0]
    expect(Object.keys(accounts)).toEqual(['org-a'])
    expect(accounts['org-a'].name).toBe('Cat Demo')
  })

  it('leaves the loaded orgs alone when nothing came back', async () => {
    graphQLFetchOrganizations.mockResolvedValue({ data: { errors: [{ message: 'Cannot query field' }] } })

    await effects.fetch(undefined, state)

    expect(dispatch.organization.set).not.toHaveBeenCalled()
  })
})
