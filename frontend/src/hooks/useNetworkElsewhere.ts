import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { selectRow } from '../selectors/accounts'
import { getSignIns } from '../selectors/signIns'
import { DeviceNetwork } from '../services/graphQLDeviceNetworks'
import { findDeviceNetworkElsewhere, findStoredNetworkElsewhere } from '../services/networkElsewhere'
import { primeDeviceNetworks } from './useDeviceNetworks'

/* A network's page opened at its address, the network not among those of the row looked at: looked for in the other
   rows here (services/networkElsewhere), once for each row the page is looked at through. True while it is looked
   for: the page waits rather than say it is not there, then shows it from the row found — or what it shows of a
   network that is nowhere. */
function useElsewhere(
  networkId: string | undefined,
  missing: boolean,
  find: (id: string) => Promise<unknown>
): boolean {
  const row = useSelector((state: State) => selectRow(state))
  const several = useSelector((state: State) => Object.keys(getSignIns(state)).length > 0)
  const looked = useRef(new Set<string>())
  const [looking, setLooking] = useState(false)
  const wanted = !!networkId && missing && several && !looked.current.has(`${row} ${networkId}`)

  useEffect(() => {
    if (!wanted || !networkId) return
    looked.current.add(`${row} ${networkId}`)
    let current = true
    setLooking(true)
    find(networkId).finally(() => current && setLooking(false))
    return () => {
      current = false
    }
  }, [wanted, networkId, row])

  return looking || wanted
}

/** For the device networks' page: `networks` as the row looked at has them (hooks/useDeviceNetworks). */
export const useDeviceNetworkElsewhere = (networkId?: string, networks?: DeviceNetwork[] | string) =>
  useElsewhere(networkId, Array.isArray(networks) && !networks.some(network => network.id === networkId), async id => {
    const theirs = await findDeviceNetworkElsewhere(id)
    // What was read to find it is the list of the row selected by now: kept, not read a second time.
    if (theirs) primeDeviceNetworks(theirs.row, theirs.networks)
  })

/** For the pages that read the store's networks (models/networks): once the row looked at has read them. */
export function useStoredNetworkElsewhere(networkId?: string): boolean {
  const missing = useSelector((state: State) => {
    const stored = state.networks.all[selectRow(state)]
    return state.networks.initialized && !!stored && !stored.some(network => network.id === networkId)
  })
  return useElsewhere(networkId, missing, findStoredNetworkElsewhere)
}
