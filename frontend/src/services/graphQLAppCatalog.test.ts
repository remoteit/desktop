import { describe, it, expect, vi, beforeEach } from 'vitest'

const { post, reasoned, errors } = vi.hoisted(() => ({ post: vi.fn(), reasoned: vi.fn(), errors: vi.fn() }))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQL', () => ({ graphQLGetErrors: errors, graphQLRequestWithReason: reasoned }))

import {
  graphQLAppCatalog,
  graphQLAppTargets,
  graphQLCatalogApp,
  graphQLSetAccountAppChannel,
  resetAppCatalog,
  UNSERVED,
} from './graphQLAppCatalog'

const answer = (data: any) => ({ data: { data } })
const schema = (...fields: string[]) => answer({ query: { fields: fields.map(name => ({ name })) } })

beforeEach(() => {
  post.mockReset()
  reasoned.mockReset()
  errors.mockReset().mockReturnValue(undefined)
  resetAppCatalog()
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
            fleet: { total: 3, enabled: 2, disabled: 1, upToDate: 1, heldBack: 1, versions: [{ version: '1.4.0', count: 2 }] },
          },
        ],
      })
    )
    const apps = await graphQLAppCatalog('A1')
    const { query, variables } = post.mock.calls[1][0]
    expect(query).toContain('appCatalog(accountId: $accountId)')
    expect(query).toContain('publisher { id name verifiedDomain remoteit own }')
    expect(query).toContain('fleet { total enabled disabled upToDate heldBack versions { version count } }')
    expect(query).not.toContain('heldBackBy') // worked out per held-back device: one app's page only
    expect(variables).toEqual({ accountId: 'A1' })
    expect(apps).toEqual([
      expect.objectContaining({
        id: 'acme.backup',
        publisher: { id: 'acme', name: 'Acme', verifiedDomain: 'acme.com', remoteit: false, own: true },
        description: null,
        accountChannel: null,
        fleet: { total: 3, enabled: 2, disabled: 1, upToDate: 1, heldBack: 1, versions: [{ version: '1.4.0', count: 2 }] },
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
          fleet: { total: 1, enabled: 1, disabled: 0, upToDate: 0, heldBack: 1, versions: [], heldBackBy: [{ reason: 'daemon', count: 1 }] },
          releases: [{ version: '1.5.0', created: '2026-11-12', notes: 'Adds S3', root: false, platforms: [], withdrawn: null, channels: ['beta'] }],
          devices: {
            items: [{ deviceId: 'D1', name: 'nas', enabled: true, state: 'running', upToDate: false, heldBack: { reason: 'daemon', detail: 'x' } }],
            total: 1,
            next: null,
          },
        },
      })
    )
    const app = await graphQLCatalogApp('acme.backup', { heldBack: true, heldBackReason: 'daemon' })
    const { query, variables } = post.mock.calls[1][0]
    expect(query).toContain(
      'releases(first: $releases) { version created notes root capabilities protocol contract platforms withdrawn channels }'
    )
    // Contract 1: how its service opens and the contract it is written to; no kind or serves (run and listen are the
    // daemon's to read).
    expect(query).toMatch(/runsAs root capabilities protocol contract platforms/)
    expect(query).not.toMatch(/\bkind\b|\bserves\b/)
    expect(query).toContain('devices(first: 100, after: $after, heldBack: $heldBack, heldBackReason: $heldBackReason, version: $version)')
    expect(query).toContain('heldBackBy { reason count }')
    expect(query).toContain('heldBack { reason detail }')
    expect(variables).toMatchObject({ id: 'acme.backup', heldBack: true, heldBackReason: 'daemon', releases: 20 })
    expect(app).toMatchObject({
      channels: [{ channel: 'beta', current: '1.5.0', candidate: '1.5.1', share: 10 }],
      releases: [{ version: '1.5.0', notes: 'Adds S3', capabilities: [], protocol: null }],
      capabilities: [],
      protocol: null,
      fleet: { total: 1, heldBack: 1, heldBackBy: [{ reason: 'daemon', count: 1 }] },
      devices: { total: 1, items: [{ deviceId: 'D1', heldBack: { reason: 'daemon', detail: 'x' }, pinned: null }] },
    })
  })

  it('devices reporting no version: version "" sent as itself; any version: none sent', async () => {
    post.mockResolvedValue(answer({ catalogApp: null }))
    post.mockResolvedValueOnce(schema('appCatalog', 'catalogApp'))
    await graphQLCatalogApp('acme.backup', { version: '' })
    expect(post.mock.calls[1][0].variables).toHaveProperty('version', '')
    expect(JSON.stringify(post.mock.calls[1][0].variables)).toContain('"version":""')
    await graphQLCatalogApp('acme.backup', {})
    expect(JSON.stringify(post.mock.calls[2][0].variables)).not.toContain('version')
  })

  it('an error is an error; the probe asked again after one', async () => {
    post.mockResolvedValueOnce('ERROR')
    expect(await graphQLAppCatalog()).toBe('ERROR')
    post.mockResolvedValueOnce(schema('appCatalog', 'catalogApp')).mockResolvedValueOnce('ERROR')
    expect(await graphQLAppCatalog()).toBe('ERROR')
    expect(post).toHaveBeenCalledTimes(3)
  })
})

describe('a server from before graphql served it (12e)', () => {
  it('says the API does not have it — in a development build too: no mock stands in', async () => {
    post.mockResolvedValue(schema('devices'))
    vi.stubEnv('DEV', true)
    expect(await graphQLAppCatalog()).toBe(UNSERVED)
    expect(await graphQLCatalogApp('acme.backup')).toBe(UNSERVED)
    expect(post).toHaveBeenCalledTimes(1) // the probe alone
    vi.unstubAllEnvs()
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

describe('the devices an app may be added to', () => {
  it('each with whether it has the app, and its administrator’s control of it there', async () => {
    post.mockResolvedValue(
      answer({
        login: {
          account: {
            devices: {
              items: [
                { id: 'D1', name: 'pi', permissions: ['MANAGE', 'SCRIPTING'], apps: [{ id: 'acme.backup', enabled: false, adminControl: 'off' }], availableApps: [] },
                { id: 'D2', name: 'nas', permissions: ['MANAGE'], apps: [], availableApps: [{ id: 'acme.backup', refused: null, adminControl: 'cloud+local', version: '1.4.0', needsNewer: false }] },
                // Without the app, its administrator's control read from the offer.
                { id: 'D3', name: 'kiosk', permissions: ['MANAGE', 'SCRIPTING'], apps: [], availableApps: [{ id: 'acme.backup', refused: 'kept local', adminControl: 'local', version: '1.4.0', needsNewer: false }] },
              ],
            },
          },
        },
      })
    )
    const targets = await graphQLAppTargets('acme.backup')
    expect(post.mock.calls[0][0].query).toContain('apps { id enabled adminControl }')
    expect(post.mock.calls[0][0].query).toContain('availableApps { id refused adminControl version needsNewer }')
    expect(targets).toEqual([
      { id: 'D1', name: 'pi', canRun: true, has: 'disabled', adminControl: 'off', offer: null },
      { id: 'D2', name: 'nas', canRun: false, has: null, adminControl: 'cloud+local', offer: { refused: null, version: '1.4.0', needsNewer: false } },
      { id: 'D3', name: 'kiosk', canRun: true, has: null, adminControl: 'local', offer: { refused: 'kept local', version: '1.4.0', needsNewer: false } },
    ])
  })
})
