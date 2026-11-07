import { post } from './post'
import { graphQLGetErrors } from './graphQL'
import { TransferUsage } from './transferUsage'

/* Every account's public transfer in a month, for remote.it admins (graphql adminTransferUsage, adminExitTransfer): the
   month's totals, the accounts a page at a time with each one's exit and proxy usage against its allowance, and what
   each of remote.it's exits carried. Either read answers 'ERROR' when it fails for any reason — an API without the
   field included — and the page says so quietly where it would have shown it. */

export type AdminTransferSort = 'total' | 'exit' | 'proxy'

export type AdminTransferKindUsage = Omit<TransferUsage, 'devices'>

export type AdminAccountTransfer = {
  accountId: string
  email: string | null
  exit: AdminTransferKindUsage
  proxy: AdminTransferKindUsage
}

export type AdminTransferTotals = { exitBytes: number; proxyBytes: number; exitAccounts: number; proxyAccounts: number }

export type AdminTransferUsagePage = {
  month: string
  months: string[]
  totals: AdminTransferTotals
  accounts: AdminAccountTransfer[]
  next: string | null
}

export type AdminTransferUsageFilter = {
  month?: string
  search?: string
  overOnly?: boolean
  sort?: AdminTransferSort
  limit?: number
  after?: string
}

// What one device of remote.it's public exits carried in a month.
export type AdminExitTotal = { deviceId: string; name: string | null; bytes: number; accounts: number }

const USAGE = 'kind month usedBytes allowanceBytes rateBps over resetsAt'

const PAGE_QUERY = `query AdminTransferUsage($month: String, $search: String, $overOnly: Boolean, $sort: String, $limit: Int, $after: String) {
  adminTransferUsage(month: $month, search: $search, overOnly: $overOnly, sort: $sort, limit: $limit, after: $after) {
    month months
    totals { exitBytes proxyBytes exitAccounts proxyAccounts }
    accounts { accountId email exit { ${USAGE} } proxy { ${USAGE} } }
    next
  }
}`

const EXITS_QUERY = `query AdminExitTransfer($month: String) {
  adminExitTransfer(month: $month) { deviceId name bytes accounts }
}`

async function read<T>(query: string, variables: ILookup<any>, field: string): Promise<T | 'ERROR'> {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR'
  if (graphQLGetErrors(response, true, { query, variables })) return 'ERROR'
  return response.data?.data?.[field] ?? 'ERROR'
}

export const fetchAdminTransferUsage = (filter: AdminTransferUsageFilter) =>
  read<AdminTransferUsagePage>(PAGE_QUERY, filter, 'adminTransferUsage')

export const fetchAdminExitTransfer = (month?: string) =>
  read<AdminExitTotal[]>(EXITS_QUERY, { month }, 'adminExitTransfer')
