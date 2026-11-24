import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccountId } from '../selectors/accounts'
import { accountCache } from '../services/accountCaches'

/* Something of the active account read once and shared — by a list and the page beside it, where a change made on the
   page is read again for the list (reload) — as hooks/useDeviceNetworks.ts shares the networks. undefined while it is
   first read. A reload asked for during a read reads again once that read is done, so the last change is never
   missed. Dropped when the account's stored data is (services/accountCaches) — another sign-in serves it — and read
   again by whoever shows it; a read still out then was made as the sign-in before, and is not kept. */
export function accountStore<T>(read: (accountId: string) => Promise<T>) {
  const byAccount = new Map<string, T>()
  const reading = new Set<string>()
  const again = new Set<string>()
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

  async function load(accountId: string): Promise<void> {
    if (reading.has(accountId)) {
      again.add(accountId)
      return
    }
    reading.add(accountId)
    const value = await read(accountId)
    reading.delete(accountId)
    if (dropped.delete(accountId)) again.add(accountId)
    else {
      byAccount.set(accountId, value)
      listeners.forEach(listener => listener())
    }
    if (again.delete(accountId)) await load(accountId)
  }

  return function useAccountStore() {
    const accountId = useSelector(selectActiveAccountId)
    const value = useSyncExternalStore(subscribe, () => byAccount.get(accountId))

    useEffect(() => {
      if (!byAccount.has(accountId) && !reading.has(accountId)) load(accountId)
    }, [accountId, value])

    const reload = useCallback(() => load(accountId), [accountId])
    return { value, reload }
  }
}
