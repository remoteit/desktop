import { describe, it, expect, vi } from 'vitest'

const { post, graphQLGetErrors } = vi.hoisted(() => ({ post: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors }))

import { graphQLFetchOrganizations } from './graphQLRequest'

describe('graphQLFetchOrganizations', () => {
  it('returns the orgs that resolved alongside the errors', async () => {
    const response = { data: { data: { login: { _0: { organization: { id: 'org-a' } }, _1: null } }, errors: [{}] } }
    post.mockResolvedValue(response)
    graphQLGetErrors.mockReturnValue([{}])

    expect(await graphQLFetchOrganizations(['org-a', 'org-b'])).toBe(response)
    expect(graphQLGetErrors).toHaveBeenCalledWith(response, false, expect.anything())
  })
})
