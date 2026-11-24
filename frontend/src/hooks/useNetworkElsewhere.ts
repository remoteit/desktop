import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { selectRow } from '../selectors/accounts'
import { getSignIns, selectReachPairs } from '../selectors/signIns'
import { DeviceNetwork } from '../services/graphQLDeviceNetworks'
import { findDeviceNetworkElsewhere, findStoredNetworkElsewhere } from '../services/networkElsewhere'
import { primeDeviceNetworks } from './useDeviceNetworks'

/* A network's page opened at its address, the network not among those of the row looked at: looked for in the other
   rows here (services/networkElsewhere), once for each row the page is looked at through. True while it is looked
   for: the page waits rather than say it is not there, then shows it from the row found — or what it shows of a
   network that is nowhere.

   The search runs to its end whatever is rendered meanwhile: beginning it changes what this hook answers, and so
   renders the page again, which must not be what ends the wait. It ends when the search settles, for as long as the
   page is there. */
export function useElsewhere(
  networkId: string | undefined,
  missing: boolean,
  find: (id: string) => Promise<unknown>
): boolean {
  const row = useSelector((state: State) => selectRow(state))
  const several = useSelector((state: State) => Object.keys(getSignIns(state)).length > 0)
  const looked = useRef(new Set<string>())
  const mounted = useRef(true)
  // How many searches are out: the wait is over when none is.
  const [looking, setLooking] = useState(0)
  // Looked for once for each row, and again when who can be asked changes: a sign-in brought into use since, or one
  // that joined an account, has not been asked.
  const reach = useSelector(selectReachPairs)
  const key = `${row} ${networkId} ${reach}`
  const wanted = !!networkId && missing && several && !looked.current.has(key)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!wanted || !networkId) return
    looked.current.add(key)
    setLooking(count => count + 1)
    find(networkId)
      .catch(() => undefined)
      .then(() => mounted.current && setLooking(count => count - 1))
  }, [wanted, key])

  return looking > 0 || wanted
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
