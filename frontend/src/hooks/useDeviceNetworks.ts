import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccountId, selectRow } from '../selectors/accounts'
import { RowKey } from '../helpers/rowKey'
import { asRow } from '../selectors/signIns'
import { State } from '../store'
import { DeviceNetwork, graphQLDeviceNetworks } from '../services/graphQLDeviceNetworks'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { accountCache, forgotten, rowNow } from '../services/accountCaches'

/* The active account's device networks (services/graphQLDeviceNetworks), shared by the Networks list and a network's
   page: read when first asked for, and again after a change (reload). undefined while it is read. Kept by ROW
   (services/accountCaches): the account as the sign-in whose row is looked at sees it. A read is made for a row —
   asked as its sign-in — and kept under it whichever row is looked at by the time it answers. */

type Networks = DeviceNetwork[] | 'ERROR' | typeof UNSUPPORTED

const byRow = new Map<string, Networks>()
const reading = new Set<string>()
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

async function read(accountId: string, row: RowKey) {
  if (reading.has(row)) return
  reading.add(row)
  const networks = await graphQLDeviceNetworks(accountId, asRow(row))
  reading.delete(row)
  // Dropped while it was read: not kept, and read again where it is the row looked at still.
  if (dropped.delete(row)) return rowNow(accountId) === row ? read(accountId, row) : undefined
  byRow.set(row, networks)
  listeners.forEach(listener => listener())
}

export const useDeviceNetworks = () => {
  const accountId = useSelector(selectActiveAccountId)
  const row = useSelector((state: State) => selectRow(state))
  const networks = useSyncExternalStore(subscribe, () => byRow.get(row))

  useEffect(() => {
    if (!byRow.has(row)) read(accountId, row)
  }, [row, networks])

  const reload = useCallback(() => read(accountId, row), [row])
  return { networks, reload }
}
