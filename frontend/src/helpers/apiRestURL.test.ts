import { describe, it, expect, vi } from 'vitest'

const { apis } = vi.hoisted(() => ({ apis: { apiGraphqlURL: '', switchApi: true } }))
vi.mock('../store', () => ({ store: { getState: () => ({ ui: { apis }, backend: { environment: {} } }) } }))

import { getApiRestURL } from './apiHelper'

// The API's REST routes (/job/log/all, /file/upload, /file/download): beside graphql on a legacy host; on the unified
// front, its /api tree — /api/graphql/job/log/all is a 404 there.
describe('getApiRestURL', () => {
  it('the unified front: /api, not /api/graphql', () => {
    apis.apiGraphqlURL = 'https://cloud.solo.remote.it/api/graphql'
    expect(getApiRestURL()).toBe('https://cloud.solo.remote.it/api')
    apis.apiGraphqlURL = 'https://cloud.remote.it/api/graphql'
    expect(getApiRestURL()).toBe('https://cloud.remote.it/api')
  })
  it('a legacy host: its graphql URL, as before', () => {
    apis.apiGraphqlURL = 'https://api.remote.it/graphql/v1'
    expect(getApiRestURL()).toBe('https://api.remote.it/graphql/v1')
  })
})
