import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { state, uiSet, apiHeaders, request } = vi.hoisted(() => ({
  state: { ui: { offline: undefined as object | undefined } },
  uiSet: vi.fn(),
  apiHeaders: vi.fn(),
  request: vi.fn(),
}))
vi.mock('../store', () => ({
  store: { getState: () => state, dispatch: { ui: { set: uiSet } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { post } from './post'
import { get } from './get'
import { graphQLBasicRequest, graphQLPartialRequest } from './graphQL'
import { userPicture } from './userPictures'

const requests = [
  () => post({}),
  () => get('/file'),
  () => graphQLBasicRequest('{ login { id } }'),
  () => graphQLPartialRequest('{ login { _0: account { id } } }'),
]

beforeEach(() => {
  state.ui.offline = undefined
  apiHeaders.mockReset().mockResolvedValue({ authorization: 'token' })
  request.mockReset()
  uiSet.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
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

  it('remembers the picture of each user the query asked it for', async () => {
    const contacts = [{ id: 'u2', email: 'ada@x.test', picture: 'https://login.test/avatar/u2' }]
    request.mockResolvedValue({ data: { data: { login: { contacts } } }, headers: {} })
    await graphQLBasicRequest('{ login { contacts { id email picture } } }')
    expect(userPicture('ada@x.test')).toBe('https://login.test/avatar/u2')
  })
})

describe('graphQLPartialRequest', () => {
  const query = '{ login { _0: account { id } _1: account { id } } }'

  it('keeps the account aliases that resolved alongside the errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = {
      data: { data: { login: { _0: { id: 'a' }, _1: null } }, errors: [{ message: 'forbidden' }] },
      headers: {},
    }
    request.mockResolvedValue(response)
    expect(await graphQLPartialRequest(query)).toBe(response)
  })

  it('remembers the pictures in the account aliases that resolved', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const member = { user: { id: 'u3', email: 'grace@x.test', picture: 'https://login.test/avatar/u3' } }
    request.mockResolvedValue({
      data: {
        data: { login: { _0: { organization: { members: [member] } }, _1: null } },
        errors: [{ message: 'forbidden' }],
      },
      headers: {},
    })
    await graphQLPartialRequest('{ login { _0: account { organization { members { user { id email picture } } } } } }')
    expect(userPicture('grace@x.test')).toBe('https://login.test/avatar/u3')
  })

  it('fails when every account alias errored', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    request.mockResolvedValue({
      data: { data: { login: { _0: null, _1: null } }, errors: [{ message: 'forbidden' }] },
      headers: {},
    })
    expect(await graphQLPartialRequest(query)).toBe('ERROR')
  })

  it('fails when the whole query errored', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    request.mockResolvedValue({ data: { data: { login: null }, errors: [{ message: 'unauthorized' }] }, headers: {} })
    expect(await graphQLPartialRequest(query)).toBe('ERROR')
  })
})
