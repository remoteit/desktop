import { describe, expect, it, vi } from 'vitest'
import type { State } from '../store'

const create = vi.hoisted(() => vi.fn())
vi.mock('../services/graphQLMutation', () => ({ graphQLCreateOrganization: create }))
vi.mock('../services/graphQL', () => ({}))
vi.mock('../selectors/devices', () => ({}))
vi.mock('../models/devices', () => ({}))
vi.mock('../models/backend', () => ({}))
vi.mock('../services/browser', () => ({}))
vi.mock('../i18n', () => ({}))

import accounts from './accounts'
import { selectActiveAccountId, selectDefaultAccountId } from '../selectors/accounts'

describe('standalone organization creation', () => {
  it('adds the first org to membership without selecting it or making it the default account', async () => {
    const initial = { membership: [], activeId: undefined }
    const membership = vi.fn<typeof accounts.reducers.addMembership>()
    membership.mockImplementation(accounts.reducers.addMembership)
    const select = vi.fn()
    const dispatch = {
      accounts: { addMembership: (member: IMembership) => membership(initial, member), select },
      organization: { setActive: vi.fn(), fetch: vi.fn() },
    }
    const state = {
      accounts: initial,
      auth: { user: { id: 'PERSONAL' } },
      user: { id: 'PERSONAL' },
    } as unknown as State
    create.mockResolvedValue({
      data: {
        data: {
          createOrganization: {
            created: '2026-11-20T00:00:00Z',
            customRole: { id: 'ADMIN', name: 'Admin' },
            license: 'NON_COMMERCIAL',
            organization: { name: 'Field ops', standalone: true, account: { id: 'ORG', email: null } },
          },
        },
      },
    })

    await expect(
      (accounts as any).effects(dispatch).createOrganization({ name: 'Field ops', submissionId: 'request' })
    ).resolves.toBeUndefined()
    expect(state.accounts.membership).toMatchObject([{ account: { id: 'ORG', email: '' }, roleName: 'Admin' }])
    expect(select).not.toHaveBeenCalled()
    expect(selectActiveAccountId(state)).toBe('PERSONAL')
    expect(selectDefaultAccountId(state)).toBeUndefined()
    expect(dispatch.organization.setActive).toHaveBeenCalledWith({ id: 'ORG', name: 'Field ops' })
  })

  it('keeps the default behavior for a login-backed org', () => {
    const state = {
      accounts: {
        membership: [
          { account: { id: 'ORG' }, standalone: true, created: new Date(1) },
          { account: { id: 'LEGACY' }, created: new Date(2) },
        ],
      },
    } as State
    expect(selectDefaultAccountId(state)).toBe('LEGACY')
  })
})
