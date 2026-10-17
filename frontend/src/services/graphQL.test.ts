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

  it('leaves pictures alone when the response it rejects nulled one', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const query = '{ login { contacts { id email picture } } }'
    const contacts = (picture: string | null) => ({ login: { contacts: [{ id: 'u4', email: 'joy@x.test', picture }] } })
    request.mockResolvedValueOnce({ data: { data: contacts('https://login.test/avatar/u4') }, headers: {} })
    await graphQLBasicRequest(query)
    request.mockResolvedValueOnce({
      data: { data: contacts(null), errors: [{ message: 'picture failed' }] },
      headers: {},
    })
    expect(await graphQLBasicRequest(query)).toBe('ERROR')
    expect(userPicture('joy@x.test')).toBe('https://login.test/avatar/u4')
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

  it('never forgets a picture on a response that carried errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const members = (picture: string | null) => [{ user: { id: 'u5', email: 'ida@x.test', picture } }]
    const respond = (picture: string | null, errors?: object[]) =>
      request.mockResolvedValueOnce({
        data: { data: { login: { _0: { organization: { members: members(picture) } }, _1: null } }, errors },
        headers: {},
      })
    const membersQuery = '{ login { _0: account { organization { members { user { id email picture } } } } } }'
    respond('https://login.test/avatar/u5')
    await graphQLPartialRequest(membersQuery)
    respond(null, [{ message: 'forbidden' }])
    await graphQLPartialRequest(membersQuery)
    expect(userPicture('ida@x.test')).toBe('https://login.test/avatar/u5')
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
