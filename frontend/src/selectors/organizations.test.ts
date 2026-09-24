import { describe, it, expect, vi } from 'vitest'

vi.mock('../models/backend', () => ({ NOTICE_VERSION_ID: 'notice' }))
vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn() }))
vi.mock('../models/plans', () => ({ REMOTEIT_PRODUCT_ID: 'remoteit' }))
vi.mock('../models/organization', () => ({ defaultState: { id: '', name: '' } }))

import { selectOrganizationOptions } from './organizations'

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
