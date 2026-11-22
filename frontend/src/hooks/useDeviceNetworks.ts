import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccountId } from '../selectors/accounts'
import { DeviceNetwork, graphQLDeviceNetworks } from '../services/graphQLDeviceNetworks'
import { UNSUPPORTED } from '../services/graphQLDaemon'

/* The active account's device networks (services/graphQLDeviceNetworks), shared by the Networks list and a network's
   page: read when first asked for, and again after a change (reload). undefined while it is read. */

type Networks = DeviceNetwork[] | 'ERROR' | typeof UNSUPPORTED

const byAccount = new Map<string, Networks>()
const reads = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Reads run one after another, so a read asked for after a change always starts after it and its answer is the last.
export function reloadDeviceNetworks(accountId: string) {
  const read = (reads.get(accountId) ?? Promise.resolve()).then(async () => {
    byAccount.set(accountId, await graphQLDeviceNetworks(accountId))
    listeners.forEach(listener => listener())
  })
  reads.set(
    accountId,
    read.catch(() => undefined)
  )
  return read
}

export const useDeviceNetworks = () => {
  const accountId = useSelector(selectActiveAccountId)
  const networks = useSyncExternalStore(subscribe, () => byAccount.get(accountId))

  useEffect(() => {
    if (!byAccount.has(accountId) && !reads.has(accountId)) reloadDeviceNetworks(accountId)
  }, [accountId])

  const reload = useCallback(() => reloadDeviceNetworks(accountId), [accountId])
  return { networks, reload }
}
