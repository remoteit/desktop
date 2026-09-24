import { describe, it, expect, vi, beforeEach } from 'vitest'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('./post', () => ({ post, resetErrorCount: vi.fn() }))
vi.mock('../store', () => ({ store: { dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } } }))

import { graphQLPartialRequest } from './graphQL'

describe('graphQLPartialRequest', () => {
  beforeEach(() => post.mockReset())

  it('keeps the data that resolved alongside the errors', async () => {
    const response = { data: { data: { login: { _0: { id: 'a' }, _1: null } }, errors: [{ message: 'forbidden' }] } }
    post.mockResolvedValue(response)

    expect(await graphQLPartialRequest('query')).toBe(response)
  })

  it('fails when nothing resolved', async () => {
    post.mockResolvedValue({ data: { data: { login: null }, errors: [{ message: 'unauthorized' }] } })

    expect(await graphQLPartialRequest('query')).toBe('ERROR')
  })

  it('fails when there was no response at all', async () => {
    post.mockResolvedValue(undefined)

    expect(await graphQLPartialRequest('query')).toBe('ERROR')
  })
})
