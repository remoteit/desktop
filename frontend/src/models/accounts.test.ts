import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/graphQL', () => ({}))
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
