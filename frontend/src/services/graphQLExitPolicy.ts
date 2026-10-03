import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* remote.it's exit nodes' policy (graphql resolvers/exit-policy-resolver.ts, presence-server docs/proxy-plan.md §8,
   phase 5): what they refuse beyond what every exit refuses, how many new flows one account may open a second, how
   long they keep their flow log, and the accounts stopped from using them. Remote.it admins only; device-session API
   only — an API without it answers UNSUPPORTED. */

export type ExitSuspension = {
  accountId: string
  reason: string
  suspended: string
  suspendedBy: string
}

export type ExitPolicy = {
  blockTcp: number[]
  blockUdp: number[]
  flowsPerSecond: number
  logDays: number
  updated: string | null
  updatedBy: string | null
  suspensions: ExitSuspension[]
}

export type ExitPolicyChange = Partial<Pick<ExitPolicy, 'blockTcp' | 'blockUdp' | 'flowsPerSecond' | 'logDays'>>

const POLICY_FIELDS =
  'blockTcp blockUdp flowsPerSecond logDays updated updatedBy suspensions { accountId reason suspended suspendedBy }'

export async function graphQLExitPolicy() {
  const query = `query ExitPolicy { exitPolicy { ${POLICY_FIELDS} } }`
  const response = await post({ query, variables: {} })
  if (response === 'ERROR') return 'ERROR' as const
  const errors = graphQLGetErrors(response, true, { query, variables: {} })
  if (withoutDeviceSessions(errors, 'exitPolicy')) return UNSUPPORTED
  if (errors) return 'ERROR' as const
  return (response.data?.data?.exitPolicy ?? null) as ExitPolicy | null
}

export const graphQLSetExitPolicy = (change: ExitPolicyChange) =>
  graphQLBasicRequest(
    ` mutation SetExitPolicy($blockTcp: [Int!], $blockUdp: [Int!], $flowsPerSecond: Int, $logDays: Int) {
        setExitPolicy(blockTcp: $blockTcp, blockUdp: $blockUdp, flowsPerSecond: $flowsPerSecond, logDays: $logDays) {
          ${POLICY_FIELDS}
        }
      }`,
    change
  )

// Stops an account using remote.it's exits, with a reason; no reason lets it again.
export const graphQLSetExitSuspended = (accountId: string, reason: string | null) =>
  graphQLBasicRequest(
    ` mutation SetExitSuspended($accountId: String!, $reason: String) {
        setExitSuspended(accountId: $accountId, reason: $reason)
      }`,
    { accountId, reason }
  )
