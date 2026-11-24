import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccountId, selectRow } from '../selectors/accounts'
import { accountCache, forgotten, rowNow } from '../services/accountCaches'
import { RowKey } from '../helpers/rowKey'
import { RequestFor, asRow } from '../selectors/signIns'
import { State } from '../store'

/* Something of the active account read once and shared — by a list and the page beside it, where a change made on the
   page is read again for the list (reload) — as hooks/useDeviceNetworks.ts shares the networks. undefined while it is
   first read. A reload asked for during a read reads again once that read is done, so the last change is never
   missed. Kept by ROW (services/accountCaches): the account as the sign-in whose row is looked at sees it, each row
   of an organization keeping its own. A read is made for a row — asked as its sign-in — and its answer is kept under
   that row whichever row is looked at by the time it answers; not one whose row is gone by then. */
export function accountStore<T>(read: (accountId: string, requestFor?: RequestFor) => Promise<T>) {
  const byRow = new Map<string, T>()
  const reading = new Set<string>()
  const again = new Set<string>()
  const dropped = new Set<string>()
  const listeners = new Set<() => void>()

  accountCache((accountIds, rows) => {
    for (const row of new Set([...byRow.keys(), ...reading])) {
      if (!forgotten(row, accountIds, rows)) continue
      byRow.delete(row)
      if (reading.has(row)) dropped.add(row)
    }
    listeners.forEach(listener => listener())
  })

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  async function load(accountId: string, row: RowKey): Promise<void> {
    if (reading.has(row)) {
      again.add(row)
      return
    }
    reading.add(row)
    const value = await read(accountId, asRow(row))
    reading.delete(row)
    // Dropped while it was read: read again where it is the row looked at still (its account's data was dropped, not
    // the row), and not kept.
    if (dropped.delete(row)) rowNow(accountId) === row ? again.add(row) : again.delete(row)
    else {
      byRow.set(row, value)
      listeners.forEach(listener => listener())
    }
    if (again.delete(row)) await load(accountId, row)
  }

  return function useAccountStore() {
    const accountId = useSelector(selectActiveAccountId)
    const row = useSelector((state: State) => selectRow(state))
    const value = useSyncExternalStore(subscribe, () => byRow.get(row))

    useEffect(() => {
      if (!byRow.has(row) && !reading.has(row)) load(accountId, row)
    }, [row, value])

    const reload = useCallback(() => load(accountId, row), [row])
    return { value, reload }
  }
}
