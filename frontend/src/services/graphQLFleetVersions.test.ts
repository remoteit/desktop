import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { graphQLFleetDevices, graphQLFleetFields, graphQLFleetVersions, resetFleetSchema } from './graphQLFleetVersions'

// The fleet calls ask for what a device is (graphql docs/DEVICE-TAXONOMY.md) only where the API serves it: a portal
// ahead of graphql asks exactly what it asked before.

const type = (...names: string[]) => ({ fields: names.map(name => ({ name })) })
const TODAY = {
  query: type('fleetVersions', 'fleetDevices'),
  device: type('id', 'version', 'packageType', 'release', 'managed'),
  column: type('version', 'devices', 'online', 'label', 'behind'),
}
const TAXONOMY = {
  ...TODAY,
  // packageType is deprecated: the probe asks for deprecated fields too, so it is still listed.
  device: type('id', 'version', 'packageType', 'connectdMajorMinor', 'implementation', 'implementationSource', 'controlLink', 'features', 'featuresSource', 'distribution', 'format', 'updatedBy', 'updateState'),
  column: type('version', 'devices', 'online', 'label', 'behind', 'implementation', 'majorMinor'),
}

const answer = (data: object) => ({ data: { data }, headers: {} })
const query = { groupBy: ['implementation' as const], versionOf: 'connectd' as const }

function serve(schema: object) {
  request.mockImplementation(async ({ data }: any) =>
    data.query.includes('FleetVersionFields')
      ? answer(schema)
      : answer({ fleetVersions: { columns: [] }, fleetDevices: { devices: [] } })
  )
}
const call = (operation: string) => request.mock.calls.map(call => call[0].data).find(d => d.query.includes(operation))
const asked = (operation: string) => call(operation)?.query as string | undefined

beforeEach(() => {
  request.mockReset()
  resetFleetSchema()
})

describe('before graphql serves what a device is', () => {
  it('asks what it always asked', async () => {
    serve(TODAY)
    expect([...(await graphQLFleetFields())]).not.toContain('implementation')
    await graphQLFleetVersions(query)
    await graphQLFleetDevices({ ...query, values: [] })
    expect(asked('query FleetVersions')).toContain('columns { version devices online label behind }')
    expect(asked('query FleetDevices')).toContain(
      'devices { id name version online lastSeen packageType package connectd os arch platform accountId account release managed }'
    )
  })

  it('a schema it cannot read offers no new groupings', async () => {
    request.mockResolvedValue({ data: { errors: [{ message: 'nope' }] }, headers: {} })
    expect((await graphQLFleetFields()).size).toBe(0)
  })
})

describe('once it does', () => {
  it("asks for each version's daemon, and each device's taxonomy; the old package type only while served", async () => {
    serve(TAXONOMY)
    expect(await graphQLFleetFields()).toContain('controlLink')
    expect(await graphQLFleetFields()).toContain('packageType')
    expect(asked('FleetVersionFields')).toContain('FleetDevice") { fields(includeDeprecated: true)')
    await graphQLFleetVersions(query)
    await graphQLFleetDevices({ ...query, values: ['go'] })
    expect(asked('query FleetVersions')).toContain('columns { version devices online label behind implementation majorMinor }')
    const devices = asked('query FleetDevices')!
    expect(devices).toContain(
      'implementation implementationSource controlLink features featuresSource distribution format updatedBy updateState connectdMajorMinor'
    )
    expect(devices).not.toContain('packageType')
  })
})

describe('counting by days since seen', () => {
  const takesSeen = {
    fields: ['fleetVersions', 'fleetDevices'].map(name => ({ name, args: [{ name: 'groupBy' }, { name: 'seenWithinDays' }] })),
  }

  it('asks for seenWithinDays where both fleet queries take it', async () => {
    serve({ ...TAXONOMY, query: takesSeen })
    const { graphQLFleetServed } = await import('./graphQLFleetVersions')
    expect((await graphQLFleetServed()).seenWithinDays).toBe(true)
    await graphQLFleetVersions({ ...query, onlineOnly: false, seenWithinDays: 30 })
    await graphQLFleetDevices({ ...query, onlineOnly: false, seenWithinDays: 30, values: [] })
    for (const operation of ['query FleetVersions', 'query FleetDevices']) {
      expect(call(operation).query).toContain('$seenWithinDays: Int')
      expect(call(operation).query).toContain('seenWithinDays: $seenWithinDays')
      expect(call(operation).variables.seenWithinDays).toBe(30)
    }
  })

  it('never names it on an API without it, even when asked', async () => {
    serve(TODAY)
    const { graphQLFleetServed } = await import('./graphQLFleetVersions')
    expect((await graphQLFleetServed()).seenWithinDays).toBe(false)
    await graphQLFleetVersions({ ...query, seenWithinDays: 7 })
    await graphQLFleetDevices({ ...query, seenWithinDays: 7, values: [] })
    for (const operation of ['query FleetVersions', 'query FleetDevices']) {
      expect(call(operation).query).not.toContain('seenWithinDays')
      expect(call(operation).variables).not.toHaveProperty('seenWithinDays')
    }
  })
})
