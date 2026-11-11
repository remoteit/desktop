import { useEffect, useState } from 'react'
import { DeviceSignIn, graphQLDeviceSignIns } from '../services/deviceSignIns'
import { useDeviceSessions } from './useDeviceSessions'

/* A device's sign-ins per account (services/deviceSignIns), behind the device-sessions gate: undefined while read, null
   where the API has none (or the gate is off). */
export function useDeviceSignIns(deviceId?: string): DeviceSignIn[] | null | undefined {
  const enabled = useDeviceSessions()
  const [signIns, setSignIns] = useState<DeviceSignIn[] | null>()

  useEffect(() => {
    if (!enabled || !deviceId) {
      setSignIns(null)
      return
    }
    let current = true
    graphQLDeviceSignIns(deviceId).then(result => {
      if (current) setSignIns(result)
    })
    return () => {
      current = false
    }
  }, [enabled, deviceId])

  return signIns
}
