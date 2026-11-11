import { useEffect, useState } from 'react'
import type { ExitServing } from '../../helpers/exitServingHelper'

/* What the account knows of the exits this machine's engine lists (the page's, signed in): each exit's devices counted
   (Exit.serving) — the engine names an exit, and remote.it picks which of its devices carries each new connection — and
   the device of the machine's exit its traffic goes through now (Device.usesExitThrough). The bridge says neither; This
   device reads them through the page (pages/ThisDevicePage.tsx), and shows the engine's list alone without them. */

export type CloudExits = {
  serving: Map<string, ExitServing | null | undefined>
  // The exit the account says the machine uses, with the device of it in use (none while Protect is off).
  inUse: { id: string; through: { id: string; name: string } | null; serving?: ExitServing | null } | null
}

export type ReadCloudExits = (deviceId: string) => Promise<CloudExits | null>

// Read as the device is known and again whenever `key` changes (the route, Protect on or off): the device in use moves
// with them. Nothing without a reader or a device.
export function useCloudExits(read: ReadCloudExits | undefined, deviceId: string | undefined, key: string) {
  const [exits, setExits] = useState<CloudExits | null>(null)
  useEffect(() => {
    if (!read || !deviceId) return setExits(null)
    let current = true
    read(deviceId).then(
      next => current && setExits(next),
      () => current && setExits(null)
    )
    return () => {
      current = false
    }
  }, [read, deviceId, key])
  return exits
}
