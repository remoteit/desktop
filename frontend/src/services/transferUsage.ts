import { post } from './post'
import { graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* An account's public transfer this month (graphql transferUsage): what its devices sent through public exits and
   public proxies, each against its allowance where the plan has one. Past it, the account is slowed to rateBps until
   resetsAt. Read silently: an API without the field answers UNSUPPORTED, and the page shows nothing of it. */

export { UNSUPPORTED }

export type TransferUsageDevice = { deviceId: string; name: string | null; usedBytes: number }

export type TransferUsage = {
  kind: string // 'exit' | 'proxy'
  month: string
  usedBytes: number
  allowanceBytes: number | null // none: no limit
  rateBps: number | null // bits per second once over
  over: boolean
  resetsAt: string
  devices: TransferUsageDevice[]
}

const QUERY = `query TransferUsage($accountId: String) {
  transferUsage(accountId: $accountId) {
    kind month usedBytes allowanceBytes rateBps over resetsAt
    devices { deviceId name usedBytes }
  }
}`

export async function fetchTransferUsage(accountId?: string): Promise<TransferUsage[] | 'ERROR' | typeof UNSUPPORTED> {
  const variables = { accountId }
  const response = await post({ query: QUERY, variables })
  if (response === 'ERROR') return 'ERROR'
  const errors = graphQLGetErrors(response, true, { query: QUERY, variables })
  if (withoutDeviceSessions(errors, 'transferUsage')) return UNSUPPORTED
  if (errors) return 'ERROR'
  return response.data?.data?.transferUsage ?? []
}
