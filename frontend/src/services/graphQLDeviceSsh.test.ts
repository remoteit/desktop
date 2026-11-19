import { describe, it, expect, vi, beforeEach } from 'vitest'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQL', () => ({
  graphQLBasicRequest: vi.fn(),
  graphQLRequestWithReason: vi.fn(),
  refusalOf: vi.fn(),
  graphQLGetErrors: (response: any) => response.data?.errors,
}))

import { graphQLDeviceSsh, graphQLSshHandle, validExistingAccount } from './graphQLDeviceSsh'

const access = {
  fallback: false,
  grants: [{ login: '', account: 'r3-bob', admin: false, user: { id: 'B', email: null } }],
}
const answer = (sshAccess: any) => ({ data: { data: { login: { device: [{ id: 'D', sshAccess }] } } } })
const refused = (field: string) => ({ data: { errors: [{ message: `Cannot query field "${field}" on type "X".` }] } })

beforeEach(() => post.mockReset())

describe('graphQLDeviceSsh', () => {
  it('reads an API from before named accounts without `existing`: the panel keeps working', async () => {
    post.mockResolvedValueOnce(refused('existing')).mockResolvedValueOnce(answer(access))
    expect(await graphQLDeviceSsh('D')).toEqual({ ...access, grants: [{ ...access.grants[0], existing: false }] })
    expect(post.mock.calls[0][0].query).toContain('existing')
    expect(post.mock.calls[1][0].query).not.toContain('existing')
  })

  it('reads `existing` where the API has it', async () => {
    post.mockResolvedValueOnce(
      answer({ ...access, grants: [{ ...access.grants[0], account: 'jsmith', existing: true }] })
    )
    expect((await graphQLDeviceSsh('D'))?.grants[0].existing).toBe(true)
    expect(post).toHaveBeenCalledTimes(1)
  })
})

describe('graphQLSshHandle', () => {
  it('tells an API without handles from one that could not answer', async () => {
    post.mockResolvedValueOnce(refused('sshHandle'))
    expect(await graphQLSshHandle()).toBe('UNSUPPORTED')
    post.mockResolvedValueOnce({ data: { errors: [{ message: 'Internal' }] } })
    expect(await graphQLSshHandle()).toBe('ERROR')
    post.mockResolvedValueOnce({ data: { data: { sshHandle: null } } })
    expect(await graphQLSshHandle()).toBeNull()
  })
})

describe('validExistingAccount', () => {
  it("a local user's name, never one of remote.it's", () => {
    for (const name of ['jsmith', 'Ubuntu', '_svc', 'root'])
      expect([name, validExistingAccount(name)]).toEqual([name, true])
    for (const name of ['r3-bob', 'R3s-bob', 'r3x-1043', 'r3app-acme-x', '1abc', 'a b', ''])
      expect([name, validExistingAccount(name)]).toEqual([name, false])
  })
})
