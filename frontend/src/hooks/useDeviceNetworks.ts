import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccountId } from '../selectors/accounts'
import { DeviceNetwork, graphQLDeviceNetworks } from '../services/graphQLDeviceNetworks'
import { UNSUPPORTED } from '../services/graphQLDaemon'

/* The active account's device networks (services/graphQLDeviceNetworks), shared by the Networks list and a network's
   page: read when first asked for, and again after a change (reload). undefined while it is read. */

type Networks = DeviceNetwork[] | 'ERROR' | typeof UNSUPPORTED

const byAccount = new Map<string, Networks>()
const reading = new Set<string>()
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

async function read(accountId: string) {
  if (reading.has(accountId)) return
  reading.add(accountId)
  byAccount.set(accountId, await graphQLDeviceNetworks(accountId))
  reading.delete(accountId)
  listeners.forEach(listener => listener())
}

export const useDeviceNetworks = () => {
  const accountId = useSelector(selectActiveAccountId)
  const networks = useSyncExternalStore(subscribe, () => byAccount.get(accountId))

  useEffect(() => {
    if (!byAccount.has(accountId)) read(accountId)
  }, [accountId])

  const reload = useCallback(() => read(accountId), [accountId])
  return { networks, reload }
}
