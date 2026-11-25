import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ overrides: {} as IOverrides, apis: {} as Record<string, unknown> }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: { apis: h.apis }, backend: { environment: { overrides: h.overrides } } }) },
}))
vi.mock('../services/graphQLMutation', () => ({ graphQLRentANode: vi.fn() }))

import { getApiURL, getApiTreeURL } from './apiHelper'
import { GRAPHQL_API } from '../constants'

beforeEach(() => {
  h.overrides = {}
  h.apis = {}
})

describe('getApiURL — CLI config overrides', () => {
  it('ignores a shared-domain override the new login cannot mint for', () => {
    h.overrides = { apiURL: 'https://api.remote.it/graphql/v1' }
    expect(getApiURL()).toBe(GRAPHQL_API)
  })

  it('still honours any other override', () => {
    h.overrides = { apiURL: 'https://cloud.dev.remote.it/api/graphql' }
    expect(getApiURL()).toBe('https://cloud.dev.remote.it/api/graphql')
  })
})

describe('getApiTreeURL — where REST routes live', () => {
  it('is the /api tree on the cloud front, beside /graphql', () => {
    h.overrides = { apiURL: 'https://cloud.remote.it/api/graphql' }
    expect(getApiTreeURL()).toBe('https://cloud.remote.it/api')
  })

  it('is the graphql URL itself on the legacy front', () => {
    h.apis = { switchApi: true, apiGraphqlURL: 'https://api.remote.it/graphql/v1' }
    expect(getApiTreeURL()).toBe('https://api.remote.it/graphql/v1')
  })
})
