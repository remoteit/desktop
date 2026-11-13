import { describe, it, expect, vi, beforeEach } from 'vitest'

const { post, errors, withReason } = vi.hoisted(() => ({ post: vi.fn(), errors: vi.fn(), withReason: vi.fn() }))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQL', () => ({
  graphQLGetErrors: errors,
  graphQLRequestWithReason: withReason,
  refusalOf: (result: any) => (result === 'ERROR' ? '' : 'reason' in result ? result.reason : undefined),
}))

import {
  graphQLAddAppPublisherKey,
  graphQLAppPublisher,
  graphQLClaimAppPublisher,
  graphQLRevokeAppPublisherKey,
  releasesSignedBy,
} from './graphQLAppPublishers'

beforeEach(() => {
  post.mockReset()
  errors.mockReset().mockReturnValue(undefined)
  withReason.mockReset()
})

describe('graphQLAppPublishers', () => {
  it('reads the account’s publisher and what the stage offers; null unclaimed, undefined without the API', async () => {
    post.mockResolvedValue({ data: { data: { appPublisher: null, appPublishing: { certifies: true, downloads: 'https://d' } } } })
    expect(await graphQLAppPublisher('ORG1')).toEqual({ publisher: null, publishing: { certifies: true, downloads: 'https://d' } })
    expect(post.mock.calls[0][0].variables).toEqual({ accountId: 'ORG1' })
    expect(post.mock.calls[0][0].query).toContain('keys { keyId publicKey notAfter added revoked }')
    errors.mockReturnValue([new Error('Cannot query field "appPublisher"')])
    expect(await graphQLAppPublisher()).toBeUndefined()
  })

  it('a change gives the publisher back, or graphql’s reason', async () => {
    withReason.mockResolvedValue({ data: { data: { claimAppPublisher: { id: 'acme' } } } })
    expect(await graphQLClaimAppPublisher('acme', 'Acme')).toEqual({ publisher: { id: 'acme' } })
    expect(withReason.mock.calls[0][0]).toContain('claimAppPublisher(id: $id, name: $name, accountId: $accountId)')
    withReason.mockResolvedValue({ reason: 'Acme is taken' })
    expect(await graphQLAddAppPublisherKey('k')).toEqual({ reason: 'Acme is taken' })
    withReason.mockResolvedValue('ERROR')
    expect(await graphQLRevokeAppPublisherKey('0123')).toEqual({ reason: '' })
  })

  it('releasesSignedBy: the standing releases a key signed', () => {
    const app = { id: 'a.b', releases: [{ version: '1', keyId: 'K' }, { version: '2', keyId: 'K', withdrawn: 'x' }, { version: '3', keyId: 'J' }] } as any
    expect(releasesSignedBy({ apps: [app] } as any, 'K').map(({ release }) => release.version)).toEqual(['1'])
  })
})
