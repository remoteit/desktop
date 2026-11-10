import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  DuplicateCopy,
  IdentityServed,
  deviceIdentityServed,
  duplicateCopies,
  groupCopies,
  requestDuplicateCopies,
  subscribeDuplicateCopies,
} from '../services/deviceIdentity'

/* What this API serves of device identity (services/deviceIdentity): undefined until it has answered. */
export function useDeviceIdentity(): IdentityServed | undefined {
  const [served, setServed] = useState<IdentityServed>()
  useEffect(() => {
    let live = true
    deviceIdentityServed().then(s => live && setServed(s))
    return () => {
      live = false
    }
  }, [])
  return served
}

const NO_COPIES = new Map<string, DuplicateCopy[]>()

/* An account's copies awaiting a decision, by the id of the device each copies: read once where the API serves
   duplicates, and again whenever `refresh` changes — the device list read again. */
export function useDuplicateCopies(accountId?: string, refresh?: unknown): Map<string, DuplicateCopy[]> {
  const served = useDeviceIdentity()?.duplicates
  const list = useSyncExternalStore(subscribeDuplicateCopies, () =>
    accountId ? duplicateCopies(accountId) : undefined
  )
  const read = useRef<string>()

  useEffect(() => {
    if (!served || !accountId) return
    const again = read.current === accountId
    read.current = accountId
    requestDuplicateCopies(accountId, again)
  }, [served, accountId, refresh])

  return useMemo(() => (list ? groupCopies(list) : NO_COPIES), [list])
}
