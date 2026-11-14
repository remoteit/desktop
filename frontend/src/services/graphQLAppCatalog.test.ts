import { describe, it, expect, vi, beforeEach } from 'vitest'

const { post, reasoned, errors } = vi.hoisted(() => ({ post: vi.fn(), reasoned: vi.fn(), errors: vi.fn() }))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQL', () => ({ graphQLGetErrors: errors, graphQLRequestWithReason: reasoned }))

import {
  graphQLAppCatalog,
  graphQLCatalogApp,
  graphQLSetAccountAppChannel,
  resetAppCatalog,
  UNSERVED,
} from './graphQLAppCatalog'
import { MOCK_CATALOG } from './appCatalogMock'

const answer = (data: any) => ({ data: { data } })
const schema = (...fields: string[]) => answer({ query: { fields: fields.map(name => ({ name })) } })

beforeEach(() => {
  post.mockReset()
  reasoned.mockReset()
  errors.mockReset().mockReturnValue(undefined)
  resetAppCatalog()
  vi.unstubAllEnvs()
})

describe('the catalogue, where graphql serves it', () => {
  it('appCatalog: each app’s publisher, how it runs, platforms, version, the account’s channel and fleet', async () => {
    post.mockResolvedValueOnce(schema('appCatalog', 'catalogApp')).mockResolvedValueOnce(
      answer({
        appCatalog: [
          {
            id: 'acme.backup',
            name: 'Backup',
            publisher: { id: 'acme', name: 'Acme', verifiedDomain: 'acme.com', remoteit: false, own: true },
            root: false,
            runsAs: 'restricted',
            platforms: ['linux-arm64'],
            version: '1.4.0',
            accountChannel: null,
            fleet: { enabled: 2, disabled: 1, upToDate: 1, heldBack: 1, versions: [{ version: '1.4.0', count: 2 }] },
          },
        ],
      })
    )
    const apps = await graphQLAppCatalog('A1')
    const { query, variables } = post.mock.calls[1][0]
    expect(query).toContain('appCatalog(accountId: $accountId)')
    expect(query).toContain('publisher { id name verifiedDomain remoteit own }')
    expect(query).toContain('fleet { enabled disabled upToDate heldBack versions { version count } }')
    expect(variables).toEqual({ accountId: 'A1' })
    expect(apps).toEqual([
      expect.objectContaining({
        id: 'acme.backup',
        publisher: { id: 'acme', name: 'Acme', verifiedDomain: 'acme.com', remoteit: false, own: true },
        description: null,
        accountChannel: null,
        fleet: { enabled: 2, disabled: 1, upToDate: 1, heldBack: 1, versions: [{ version: '1.4.0', count: 2 }] },
      }),
    ])
  })

  it('catalogApp: its channels, releases with notes, and a page of its devices, filtered', async () => {
    post.mockResolvedValueOnce(schema('appCatalog', 'catalogApp')).mockResolvedValueOnce(
      answer({
        catalogApp: {
          id: 'acme.backup',
          name: 'Backup',
          publisher: { id: 'acme', name: 'Acme' },
          channels: [{ channel: 'beta', current: '1.5.0', candidate: '1.5.1', share: 10 }],
          releases: [{ version: '1.5.0', created: '2026-11-12', notes: 'Adds S3', root: false, platforms: [], withdrawn: null, channels: ['beta'] }],
          devices: {
            items: [{ deviceId: 'D1', name: 'nas', enabled: true, state: 'running', upToDate: false, heldBack: { reason: 'daemon', detail: 'x' } }],
            total: 1,
            next: null,
          },
        },
      })
    )
    const app = await graphQLCatalogApp('acme.backup', { heldBack: true })
    const { query, variables } = post.mock.calls[1][0]
    expect(query).toContain('releases(first: $releases) { version created notes root platforms withdrawn channels }')
    expect(query).toContain('devices(first: 100, after: $after, heldBack: $heldBack, version: $version)')
    expect(query).toContain('heldBack { reason detail }')
    expect(variables).toMatchObject({ id: 'acme.backup', heldBack: true, releases: 20 })
    expect(app).toMatchObject({
      channels: [{ channel: 'beta', current: '1.5.0', candidate: '1.5.1', share: 10 }],
      releases: [{ version: '1.5.0', notes: 'Adds S3' }],
      devices: { total: 1, items: [{ deviceId: 'D1', heldBack: { reason: 'daemon', detail: 'x' }, pinned: null }] },
    })
  })

  it('an error is an error; the probe asked again after one', async () => {
    post.mockResolvedValueOnce('ERROR')
    vi.stubEnv('DEV', false)
    expect(await graphQLAppCatalog()).toBe('ERROR')
    post.mockResolvedValueOnce(schema('appCatalog', 'catalogApp')).mockResolvedValueOnce('ERROR')
    expect(await graphQLAppCatalog()).toBe('ERROR')
    expect(post).toHaveBeenCalledTimes(3)
  })
})

describe('until graphql serves it (12e)', () => {
  it('a development build reads the mocks, shaped as graphql will answer', async () => {
    post.mockResolvedValue(schema('devices'))
    vi.stubEnv('DEV', true)
    const apps = await graphQLAppCatalog()
    expect(apps).toHaveLength(MOCK_CATALOG.length)
    expect(post).toHaveBeenCalledTimes(1) // the probe alone
    const backup = await graphQLCatalogApp('acme.backup', { heldBack: true })
    expect(backup !== UNSERVED && backup !== 'ERROR' && backup?.devices?.items.map(d => d.name)).toEqual(['nas', 'kiosk-4'])
    expect(await graphQLCatalogApp('acme.none')).toBeNull()
  })

  it('any other build says the API does not have it', async () => {
    post.mockResolvedValue(schema('devices'))
    vi.stubEnv('DEV', false)
    expect(await graphQLAppCatalog()).toBe(UNSERVED)
    expect(await graphQLCatalogApp('acme.backup')).toBe(UNSERVED)
  })
})

describe('setAccountAppChannel', () => {
  it('the account’s channel for the app, or graphql’s refusal', async () => {
    reasoned.mockResolvedValue(answer({ setAccountAppChannel: { id: 'acme.backup', accountChannel: 'beta' } }))
    expect(await graphQLSetAccountAppChannel('acme.backup', 'beta', 'A1')).toEqual({ accountChannel: 'beta' })
    expect(reasoned.mock.calls[0][0]).toContain('setAccountAppChannel(app: $app, channel: $channel, accountId: $accountId)')
    expect(reasoned.mock.calls[0][1]).toEqual({ app: 'acme.backup', channel: 'beta', accountId: 'A1' })
    reasoned.mockResolvedValue({ reason: 'Only an admin may' })
    expect(await graphQLSetAccountAppChannel('acme.backup', '')).toEqual({ reason: 'Only an admin may' })
  })
})
