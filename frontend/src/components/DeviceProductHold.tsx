import React, { useEffect, useState } from 'react'
import { graphQLHeldByProduct } from '../services/productMaxDevices'

/* Why a disabled device does not come back on (graphql-api docs/PROXY-GROUPS.md §11, "A product's maximum of devices"):
   its product has the devices it may hold, so the expiry's restore at its sign-in is refused, and so would a restore by
   hand be, until one of them is removed or disabled or the maximum is raised. graphql's words, read on their own where the
   API has them (Device.heldByProduct); nothing otherwise. */
export const DeviceProductHold: React.FC<{ deviceId: string; accountId?: string }> = ({ deviceId, accountId }) => {
  const [held, setHeld] = useState<string | null>()

  useEffect(() => {
    let current = true
    setHeld(undefined)
    graphQLHeldByProduct(deviceId, accountId).then(result => {
      if (current) setHeld(result ?? null)
    })
    return () => {
      current = false
    }
  }, [deviceId, accountId])

  if (!held) return null
  return <em data-held-by-product>{held}</em>
}
