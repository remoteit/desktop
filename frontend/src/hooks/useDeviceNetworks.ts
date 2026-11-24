import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccountId } from '../selectors/accounts'
import { DeviceNetwork, graphQLDeviceNetworks } from '../services/graphQLDeviceNetworks'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { accountCache } from '../services/accountCaches'

/* The active account's device networks (services/graphQLDeviceNetworks), shared by the Networks list and a network's
   page: read when first asked for, and again after a change (reload). undefined while it is read. Dropped when the
   account's stored data is (services/accountCaches), and read again by whoever shows it. */

type Networks = DeviceNetwork[] | 'ERROR' | typeof UNSUPPORTED

const byAccount = new Map<string, Networks>()
const reading = new Set<string>()
const dropped = new Set<string>()
const listeners = new Set<() => void>()

accountCache(accountIds => {
  accountIds.forEach(id => {
    byAccount.delete(id)
    if (reading.has(id)) dropped.add(id)
  })
  listeners.forEach(listener => listener())
})

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

async function read(accountId: string) {
  if (reading.has(accountId)) return
  reading.add(accountId)
  const networks = await graphQLDeviceNetworks(accountId)
  reading.delete(accountId)
  // Dropped while it was read: read as the sign-in before, so read again, not kept.
  if (dropped.delete(accountId)) return read(accountId)
  byAccount.set(accountId, networks)
  listeners.forEach(listener => listener())
}

export const useDeviceNetworks = () => {
  const accountId = useSelector(selectActiveAccountId)
  const networks = useSyncExternalStore(subscribe, () => byAccount.get(accountId))

  useEffect(() => {
    if (!byAccount.has(accountId)) read(accountId)
  }, [accountId, networks])

  const reload = useCallback(() => read(accountId), [accountId])
  return { networks, reload }
}
