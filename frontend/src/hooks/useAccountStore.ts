import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccountId } from '../selectors/accounts'

/* Something of the active account read once and shared — by a list and the page beside it, where a change made on the
   page is read again for the list (reload) — as hooks/useDeviceNetworks.ts shares the networks. undefined while it is
   first read. A reload asked for during a read reads again once that read is done, so the last change is never
   missed. */
export function accountStore<T>(read: (accountId: string) => Promise<T>) {
  const byAccount = new Map<string, T>()
  const reading = new Set<string>()
  const again = new Set<string>()
  const listeners = new Set<() => void>()

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
    byAccount.set(accountId, await read(accountId))
    reading.delete(accountId)
    listeners.forEach(listener => listener())
    if (again.delete(accountId)) await load(accountId)
  }

  return function useAccountStore() {
    const accountId = useSelector(selectActiveAccountId)
    const value = useSyncExternalStore(subscribe, () => byAccount.get(accountId))

    useEffect(() => {
      if (!byAccount.has(accountId)) load(accountId)
    }, [accountId])

    const reload = useCallback(() => load(accountId), [accountId])
    return { value, reload }
  }
}
