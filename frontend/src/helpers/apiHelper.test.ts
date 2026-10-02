import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ version: '3.49.2', overrides: {} as IOverrides }))
vi.mock('./versionHelper', () => ({
  get version() {
    return h.version
  },
}))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: { apis: {} }, backend: { environment: { overrides: h.overrides } } }) },
}))
vi.mock('../services/graphQLMutation', () => ({ graphQLRentANode: vi.fn() }))

import { getApiURL } from './apiHelper'
import { GRAPHQL_API, GRAPHQL_BETA_API } from '../constants'

describe('getApiURL — CLI config overrides', () => {
  beforeEach(() => {
    h.version = '3.49.2'
    h.overrides = {}
  })

  it('ignores a shared-domain override the new login cannot mint for', () => {
    h.overrides = { apiURL: 'https://api.remote.it/graphql/v1' }
    expect(getApiURL()).toBe(GRAPHQL_API)
  })

  it('ignores a shared-domain beta override on a beta build', () => {
    h.version = '3.50.0-beta.1'
    h.overrides = { betaApiURL: 'https://api.remote.it/graphql/beta' }
    expect(getApiURL()).toBe(GRAPHQL_BETA_API)
  })

  it('still honours any other override', () => {
    h.overrides = { apiURL: 'https://cloud.dev.remote.it/api/graphql' }
    expect(getApiURL()).toBe('https://cloud.dev.remote.it/api/graphql')
  })
})
