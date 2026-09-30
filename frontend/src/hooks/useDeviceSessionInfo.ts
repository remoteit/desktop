import { useEffect, useSyncExternalStore } from 'react'
import {
  DeviceSessionInfo,
  deviceSessionInfo,
  requestDeviceSessionInfo,
  subscribeDeviceSessionInfo,
} from '../services/deviceSessionInfo'

// A device's name in device subnets and who it acts for (services/deviceSessionInfo): undefined while it is read.
export const useDeviceSessionInfo = (deviceId?: string): DeviceSessionInfo | undefined => {
  const value = useSyncExternalStore(subscribeDeviceSessionInfo, () =>
    deviceId ? deviceSessionInfo(deviceId) : undefined
  )

  useEffect(() => {
    if (deviceId) requestDeviceSessionInfo(deviceId)
  }, [deviceId])

  return value
}
