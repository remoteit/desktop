import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  DuplicateCopy,
  IdentityServed,
  copiesByOriginal,
  deviceIdentityServed,
  duplicateCopies,
  groupCopies,
  requestCopiesOf,
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
const NONE: DuplicateCopy[] = []

/* The copies read so far — of an account, and by the device each copies — without asking for them: what a page that
   names devices can link. */
export function useKnownCopies(accountId?: string): DuplicateCopy[] {
  const list = useSyncExternalStore(subscribeDuplicateCopies, () =>
    accountId ? duplicateCopies(accountId) : undefined
  )
  const byOriginal = useSyncExternalStore(subscribeDuplicateCopies, copiesByOriginal)
  return useMemo(() => {
    const read = [...(list || []), ...[...byOriginal.values()].flat()]
    return read.length ? read : NONE
  }, [list, byOriginal])
}

/* The copies awaiting a decision, by the id of the device each copies, read where the API serves duplicates. Where it
   counts each device's copies (Device.copyCount), those of the `listed` devices with any — one read for them all,
   whichever page of a list they are on —; otherwise an account's, read once. Read again each time `reading` — the
   device list being read — ends. */
export function useDuplicateCopies(
  accountId?: string,
  reading?: boolean,
  listed?: Pick<IDevice, 'id' | 'copyCount'>[]
): Map<string, DuplicateCopy[]> {
  const identity = useDeviceIdentity()
  const served = identity?.duplicates
  const counted = !!identity?.copyCount && !!listed
  const list = useSyncExternalStore(subscribeDuplicateCopies, () =>
    accountId ? duplicateCopies(accountId) : undefined
  )
  const byOriginal = useSyncExternalStore(subscribeDuplicateCopies, copiesByOriginal)
  const originals = (
    counted ? listed!.filter(device => (device.copyCount || 0) > 0).map(device => device.id) : []
  ).join(' ')
  const read = useRef<string>()

  useEffect(() => {
    if (!served || !accountId || reading) return
    const key = counted ? `${accountId} ${originals}` : accountId
    const again = read.current === key
    read.current = key
    if (!counted) requestDuplicateCopies(accountId, again)
    else if (originals) requestCopiesOf(originals.split(' '), again)
  }, [served, accountId, reading, counted, originals])

  return useMemo(() => {
    if (!counted) return list ? groupCopies(list) : NO_COPIES
    const groups = new Map<string, DuplicateCopy[]>()
    for (const id of originals ? originals.split(' ') : []) {
      const group = byOriginal.get(id)
      if (group?.length) groups.set(id, group)
    }
    return groups.size ? groups : NO_COPIES
  }, [counted, list, byOriginal, originals])
}
