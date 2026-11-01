import { post } from './post'
import { graphQLGetErrors } from './graphQL'
import { UNSUPPORTED } from './graphQLDaemon'

/* The fleet's versions, as an admin reads them (graphql's fleet-versions resolver): the stage's devices counted by the
   version they run, grouped by one dimension or two, and the devices of one cell.

   The portal is released apart from graphql, so whether this API serves them is read from its schema once, as the
   rollout controller's calls are (graphQLDaemonRollout.ts): an API without fleetVersions answers UNSUPPORTED. So are the
   fields of what a device is (graphql docs/DEVICE-TAXONOMY.md): asked for, and grouped by, only once the API has them. */

import type { FleetDevices, FleetQuery, FleetVersions } from './fleetVersionsModel'

export * from './fleetVersionsModel'

type Result<T> = T | 'ERROR' | typeof UNSUPPORTED

const PROBE = `query FleetVersionFields {
  query: __type(name: "Query") { fields { name } }
  device: __type(name: "FleetDevice") { fields { name } }
  column: __type(name: "FleetVersionColumn") { fields { name } }
}`

type Served = {
  versions: boolean
  devices: boolean
  deviceFields: Set<string> // FleetDevice's: what the drill asks for, and which groupings the API serves
  columnFields: Set<string> // FleetVersionColumn's
}

let served: Promise<Served | 'ERROR'> | undefined

const fieldNames = (type: any) => new Set<string>((type?.fields || []).map((f: { name: string }) => f.name))

export function fleetSchema() {
  if (!served)
    served = post({ query: PROBE }).then(response => {
      if (response === 'ERROR' || response.data?.errors) {
        served = undefined
        return 'ERROR' as const
      }
      const data = response.data?.data
      const names = fieldNames(data?.query)
      return {
        versions: names.has('fleetVersions'),
        devices: names.has('fleetDevices'),
        deviceFields: fieldNames(data?.device),
        columnFields: fieldNames(data?.column),
      }
    })
  return served
}

// The FleetDevice fields this API serves, for the tab to offer the groupings they stand for; none where it cannot say.
export async function graphQLFleetFields(): Promise<Set<string>> {
  const schema = await fleetSchema()
  return schema === 'ERROR' ? new Set() : schema.deviceFields
}

// For tests, and for a change of API or sign-in.
export function resetFleetSchema() {
  served = undefined
}

async function read<T>(query: string, variables: ILookup<any>, field: string): Promise<Result<T>> {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (errors) return 'ERROR'
  return response.data?.data?.[field] ?? 'ERROR'
}

const COUNT = 'version devices online'
const COLUMN_EXTRAS = ['implementation', 'majorMinor']
const DEVICE = 'id name version online lastSeen packageType package connectd os arch platform accountId account release managed'
// What the device is (DEVICE-TAXONOMY's build contract), asked for only where the API serves it.
const DEVICE_EXTRAS = [
  'implementation',
  'implementationSource',
  'controlLink',
  'features',
  'featuresSource',
  'distribution',
  'format',
  'updatedBy',
  'updateState',
]
const pick = (wanted: string[], fields: Set<string>) => wanted.filter(name => fields.has(name))
// The old package type for as long as the API serves it: it goes a release after the taxonomy arrives.
const deviceSelection = (fields: Set<string>) =>
  [
    ...DEVICE.split(' ').filter(name => name !== 'packageType' || !fields.size || fields.has(name)),
    ...pick(DEVICE_EXTRAS, fields),
  ].join(' ')

export async function graphQLFleetVersions(query: FleetQuery): Promise<Result<FleetVersions>> {
  const schema = await fleetSchema()
  if (schema === 'ERROR') return 'ERROR'
  if (!schema.versions) return UNSUPPORTED
  return read<FleetVersions>(
    `query FleetVersions($groupBy: [String!]!, $versionOf: String, $onlineOnly: Boolean, $accountSearch: String, $accountLimit: Int) {
      fleetVersions(groupBy: $groupBy, versionOf: $versionOf, onlineOnly: $onlineOnly, accountSearch: $accountSearch, accountLimit: $accountLimit) {
        checked groupBy versionOf
        columns { ${[COUNT, 'label behind', ...pick(COLUMN_EXTRAS, schema.columnFields)].join(' ')} }
        rows { key values label dimension depth parentKey total online cells { ${COUNT} } }
        totals { devices online }
      }
    }`,
    { accountSearch: undefined, accountLimit: undefined, ...query },
    'fleetVersions'
  )
}

export async function graphQLFleetDevices(
  query: FleetQuery & { values: string[]; versions?: string[]; limit?: number }
): Promise<Result<FleetDevices>> {
  const schema = await fleetSchema()
  if (schema === 'ERROR') return 'ERROR'
  if (!schema.devices) return UNSUPPORTED
  return read<FleetDevices>(
    `query FleetDevices($groupBy: [String!]!, $values: [String!]!, $versions: [String!], $versionOf: String, $onlineOnly: Boolean,
      $accountSearch: String, $accountLimit: Int, $limit: Int) {
      fleetDevices(groupBy: $groupBy, values: $values, versions: $versions, versionOf: $versionOf, onlineOnly: $onlineOnly,
        accountSearch: $accountSearch, accountLimit: $accountLimit, limit: $limit) {
        checked total
        devices { ${deviceSelection(schema.deviceFields)} }
      }
    }`,
    query,
    'fleetDevices'
  )
}
