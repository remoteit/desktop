import { describe, it, expect, vi } from 'vitest'

vi.mock('../models/backend', () => ({ NOTICE_VERSION_ID: 'notice' }))
vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn() }))

import { selectShowOrganizations } from './accounts'

const state = (accounts: object): any => ({ accounts: { membership: [], ...accounts } })

describe('selectShowOrganizations', () => {
  it('shows the organization rail for a member of an organization', () => {
    expect(selectShowOrganizations(state({ membership: [{ account: { id: 'org' } }] }))).toBe(true)
  })

  it('shows the organization rail where standalone organizations can be created, with no memberships', () => {
    expect(selectShowOrganizations(state({ standaloneOrganizations: true }))).toBe(true)
  })

  it('hides the organization rail with neither', () => {
    expect(selectShowOrganizations(state({}))).toBe(false)
  })
})
