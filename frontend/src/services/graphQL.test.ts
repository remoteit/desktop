import { describe, it, expect, vi, beforeEach } from 'vitest'

const { state, uiSet, apiHeaders, request } = vi.hoisted(() => ({
  state: { ui: { offline: undefined as object | undefined } },
  uiSet: vi.fn(),
  apiHeaders: vi.fn(),
  request: vi.fn(),
}))
vi.mock('../store', () => ({
  store: { getState: () => state, dispatch: { ui: { set: uiSet, deprecated: vi.fn() }, auth: {} } },
}))
vi.mock('./remoteit', () => ({ apiHeaders }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request, isAxiosError: () => false } }))

import { post } from './post'
import { get } from './get'
import { graphQLBasicRequest } from './graphQL'

const requests = [() => post({}), () => get('/file'), () => graphQLBasicRequest('{ login { id } }')]

beforeEach(() => {
  state.ui.offline = undefined
  apiHeaders.mockReset().mockResolvedValue({ authorization: 'token' })
  request.mockReset()
  uiSet.mockReset()
})

describe('a request that is never sent', () => {
  it('offline: resolves to ERROR, silently', async () => {
    state.ui.offline = { severity: 'warning', title: 'Offline', message: '' }
    for (const send of requests) expect(await send()).toBe('ERROR')
    expect(request).not.toHaveBeenCalled()
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('no auth token: resolves to ERROR, silently', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    apiHeaders.mockResolvedValue(undefined)
    for (const send of requests) expect(await send()).toBe('ERROR')
    expect(request).not.toHaveBeenCalled()
    expect(uiSet).not.toHaveBeenCalled()
  })
})

describe('graphQLBasicRequest', () => {
  it('passes a clean response through', async () => {
    const response = { data: { data: { login: { id: 'u1' } } }, headers: {} }
    request.mockResolvedValue(response)
    expect(await graphQLBasicRequest('{ login { id } }')).toBe(response)
  })

  it('turns a response carrying GraphQL errors into ERROR and shows the first one', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    request.mockResolvedValue({ data: { errors: [{ message: 'denied' }] }, headers: {} })
    expect(await graphQLBasicRequest('{ login { id } }')).toBe('ERROR')
    expect(uiSet).toHaveBeenCalledWith({ errorMessage: 'GraphQL: denied' })
  })
})
