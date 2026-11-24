import { describe, it, expect, vi } from 'vitest'

vi.mock('../models/backend', () => ({ NOTICE_VERSION_ID: 'notice' }))
vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn() }))
vi.mock('../models/plans', () => ({ REMOTEIT_PRODUCT_ID: 'remoteit' }))
vi.mock('../models/organization', () => ({ defaultState: { id: '', name: '' } }))

import { selectOrganizationOptions, selectPrimaryOrganizationOptions, selectUserLimitsLookup } from './organizations'

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

/* The page's own person belongs to Acme as an Admin; so does Work, signed in beside them, as a Guest — and Work is the
   one picked to serve Acme's row ("Open as"). */
describe('selectPrimaryOrganizationOptions', () => {
  const state: any = {
    auth: { user: { id: 'me' } },
    user: { id: 'me', email: 'me@example.com' },
    accounts: {
      membership: [{ ...member('acme', 'Acme'), roleId: 'ADMIN', roleName: 'Admin' }],
      signIns: {
        'sub-work': {
          sub: 'sub-work',
          id: 'work',
          email: 'work@example.com',
          membership: [
            { ...member('acme', 'Acme'), roleId: 'GUEST', roleName: 'Guest' },
            { ...member('labs', 'Labs'), roleId: 'ADMIN', roleName: 'Admin' },
          ],
        },
      },
      via: { acme: 'sub-work' },
    },
    organization: {
      accounts: {
        acme: {
          id: 'acme',
          name: 'Acme',
          roles: [
            { id: 'ADMIN', permissions: ['VIEW', 'MANAGE'] },
            { id: 'GUEST', permissions: ['VIEW'] },
          ],
        },
        labs: { id: 'labs', name: 'Labs', roles: [{ id: 'ADMIN', permissions: ['MANAGE'] }] },
      },
    },
  }

  it('lists the organizations the person belongs to, in their own role, whichever sign-in serves each row', () => {
    // The row is the other sign-in's to serve, in its role.
    expect(selectOrganizationOptions(state).find(o => o.id === 'acme')).toMatchObject({
      roleName: 'Guest',
      via: { sub: 'sub-work' },
    })
    expect(selectPrimaryOrganizationOptions(state)).toEqual([
      expect.objectContaining({ id: 'acme', name: 'Acme', roleName: 'Admin', disabled: false, canRegister: true }),
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

  it("has no limits without a signed-in user, rather than the active account's", () => {
    expect(selectUserLimitsLookup({ ...state(), auth: {} })).toEqual({})
  })
})
