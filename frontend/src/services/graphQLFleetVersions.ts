import { post } from './post'
import { graphQLGetErrors } from './graphQL'
import { UNSUPPORTED } from './graphQLDaemon'

/* The fleet's versions, as an admin reads them (graphql's fleet-versions resolver): the stage's devices counted by the
   version they run, grouped by one dimension or two, and the devices of one cell.

   The portal is released apart from graphql, so whether this API serves them is read from its schema once, as the
   rollout controller's calls are (graphQLDaemonRollout.ts): an API without fleetVersions answers UNSUPPORTED. */

import type { FleetDevices, FleetQuery, FleetVersions } from './fleetVersionsModel'

export * from './fleetVersionsModel'

type Result<T> = T | 'ERROR' | typeof UNSUPPORTED

const PROBE = `query FleetVersionFields { query: __type(name: "Query") { fields { name } } }`

let served: Promise<{ versions: boolean; devices: boolean } | 'ERROR'> | undefined

export function fleetSchema() {
  if (!served)
    served = post({ query: PROBE }).then(response => {
      if (response === 'ERROR' || response.data?.errors) {
        served = undefined
        return 'ERROR' as const
      }
      const names = new Set<string>((response.data?.data?.query?.fields || []).map((f: { name: string }) => f.name))
      return { versions: names.has('fleetVersions'), devices: names.has('fleetDevices') }
    })
  return served
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

export async function graphQLFleetVersions(query: FleetQuery): Promise<Result<FleetVersions>> {
  const schema = await fleetSchema()
  if (schema === 'ERROR') return 'ERROR'
  if (!schema.versions) return UNSUPPORTED
  return read<FleetVersions>(
    `query FleetVersions($groupBy: [String!]!, $versionOf: String, $onlineOnly: Boolean, $accountSearch: String, $accountLimit: Int) {
      fleetVersions(groupBy: $groupBy, versionOf: $versionOf, onlineOnly: $onlineOnly, accountSearch: $accountSearch, accountLimit: $accountLimit) {
        checked groupBy versionOf
        columns { ${COUNT} label behind }
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
        devices { id name version online lastSeen packageType package connectd os arch platform accountId account release managed }
      }
    }`,
    query,
    'fleetDevices'
  )
}
