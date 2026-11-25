import { beforeEach, describe, expect, it, vi } from 'vitest'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQL', () => ({
  graphQLBasicRequest: vi.fn(),
  graphQLRequestWithReason: vi.fn(),
  graphQLGetErrors: (response: any) => response.data?.errors,
}))
vi.mock('../store', () => ({ store: { getState: () => ({}) } }))
vi.mock('./elsewhere', () => ({ FAILED: 'ERROR', findElsewhere: vi.fn() }))

import { graphQLServiceEndpoints, resetEndpointFields } from './graphQLProxy'

const lacks = (field: string, type: string) => ({
  data: { errors: [{ message: `Cannot query field "${field}" on type "${type}".` }] },
})
const answer = (endpoints: unknown) => ({
  data: { data: { login: { device: [{ services: [{ id: 'S1', endpoints }] }] } } },
})
const asked = () => post.mock.calls.map(([{ query }]) => query.includes('webAddress'))

beforeEach(() => {
  post.mockReset()
  resetEndpointFields()
})

describe('a service’s endpoints', () => {
  it('say which is its web address', async () => {
    post.mockResolvedValue(answer([{ id: 'E1', webAddress: true }]))
    expect(await graphQLServiceEndpoints('D1', 'S1')).toEqual([{ id: 'E1', webAddress: true }])
    expect(asked()).toEqual([true])
  })

  it('are read without that from an API that does not say, which is not asked it again', async () => {
    post.mockResolvedValueOnce(lacks('webAddress', 'ProxyEndpoint')).mockResolvedValue(answer([{ id: 'E1' }]))
    expect(await graphQLServiceEndpoints('D1', 'S1')).toEqual([{ id: 'E1' }])
    expect(await graphQLServiceEndpoints('D1', 'S1')).toEqual([{ id: 'E1' }])
    expect(asked()).toEqual([true, false, false])
  })

  it('are none from an API without them, and an error is one', async () => {
    post.mockResolvedValueOnce(lacks('endpoints', 'Service'))
    expect(await graphQLServiceEndpoints('D1', 'S1')).toBe('UNSUPPORTED')
    post.mockResolvedValueOnce({ data: { errors: [{ message: 'no' }] } })
    expect(await graphQLServiceEndpoints('D1', 'S1')).toBe('ERROR')
    post.mockResolvedValueOnce('ERROR')
    expect(await graphQLServiceEndpoints('D1', 'S1')).toBe('ERROR')
  })
})
