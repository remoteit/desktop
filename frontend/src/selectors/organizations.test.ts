import { describe, it, expect, vi } from 'vitest'

vi.mock('../models/backend', () => ({ NOTICE_VERSION_ID: 'notice' }))
vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn() }))
vi.mock('../models/plans', () => ({ REMOTEIT_PRODUCT_ID: 'remoteit' }))
vi.mock('../models/organization', () => ({ defaultState: { id: '', name: '' } }))

import { selectOrganizationOptions, selectUserLimitsLookup } from './organizations'

const member = (id: string, name: string) => ({ account: { id, email: `${id}@example.com` }, name, roleName: 'Member' })

describe('selectOrganizationOptions', () => {
  it('names and sorts every membership, and disables orgs whose details have not loaded', () => {
    const state: any = {
      accounts: { membership: [member('org-h', 'Cat Demo'), member('org-g', 'Beta')] },
      organization: { accounts: { 'org-g': { id: 'org-g', name: 'Beta' } } },
    }

    expect(selectOrganizationOptions(state).map(o => [o.name, o.disabled])).toEqual([
      ['Beta', false],
      ['Cat Demo', true],
    ])
  })
})

describe('selectUserLimitsLookup', () => {
  const state = (limitsOverride = {}): any => ({
    auth: { user: { id: 'me' } },
    user: { id: 'me', email: 'me@example.com' },
    accounts: { activeId: 'org', membership: [member('org', 'Acme')] },
    organization: {
      accounts: {
        me: { id: 'me', limits: [{ name: 'ai-agent', value: true }] },
        org: { id: 'org', limits: [{ name: 'tagging', value: true }] },
      },
    },
    ui: { limitsOverride },
  })

  it("reads the signed-in user's own limits while an organization is active", () => {
    expect(selectUserLimitsLookup(state())).toEqual({ 'ai-agent': true })
  })

  it("applies the user's Test page overrides while an organization is active", () => {
    expect(selectUserLimitsLookup(state({ 'ai-agent': false }))['ai-agent']).toBe(false)
  })
})
