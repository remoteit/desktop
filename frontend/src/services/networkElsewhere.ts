import { store } from '../store'
import { RowKey, rowKey } from '../helpers/rowKey'
import { FAILED, findElsewhere } from './elsewhere'
import { DeviceNetwork, graphQLDeviceNetworks } from './graphQLDeviceNetworks'
import { graphQLPreloadNetworks } from './graphQLRequest'
import { selectRowOf } from '../selectors/signIns'
import { selectActiveAccountId } from '../selectors/accounts'

/* A NETWORK'S PAGE OPENED AT ITS ADDRESS. A network is read with its account's list, never by its id alone: where the
   row looked at has read its networks and this one is not among them, it may be another row's here — so each other
   row's list is read, as that row's sign-in, and the first that has it is selected (services/elsewhere): the page
   then shows it from that row's list. With one sign-in in use nothing is asked; found nowhere, it is asked once. */

// The built-in groups of the classic network pages: no account's, and never looked for.
const BUILT_IN = ['local', 'recent', 'public']

const rowLooked = (): RowKey => {
  const state = store.getState()
  return selectRowOf(state, selectActiveAccountId(state))
}

/** Among the device networks (services/graphQLDeviceNetworks): the row that has it, where one does — selected by
 *  then — with its list as just read. */
export async function findDeviceNetworkElsewhere(
  networkId: string
): Promise<{ row: RowKey; networks: DeviceNetwork[] } | undefined> {
  const found = await findElsewhere<DeviceNetwork[]>({
    ids: [networkId],
    asked: rowLooked(),
    byAccount: true,
    read: async (accountId, requestFor) => {
      const networks = await graphQLDeviceNetworks(accountId, requestFor)
      // Not asked — a failure, or an API without them — is not the same as asked and not there.
      if (!Array.isArray(networks)) return FAILED
      return networks.some(network => network.id === networkId) ? networks : undefined
    },
  })
  return found && { row: rowKey(found.accountId, found.sub), networks: found.answer }
}

/** Among the networks the store keeps (models/networks): true where a row has it — that row is selected by then, and
 *  its networks are read into the store as any selected row's are. */
export async function findStoredNetworkElsewhere(networkId: string): Promise<boolean> {
  if (BUILT_IN.includes(networkId)) return false
  const found = await findElsewhere<true>({
    ids: [networkId],
    asked: rowLooked(),
    byAccount: true,
    read: async (accountId, requestFor) => {
      const response = await graphQLPreloadNetworks(accountId, requestFor)
      if (response === 'ERROR') return FAILED
      const networks: { id: string }[] = response?.data?.data?.login?.account?.networks || []
      return networks.some(network => network.id === networkId) || undefined
    },
  })
  return !!found
}
