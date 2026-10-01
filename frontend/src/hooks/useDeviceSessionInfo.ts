import { useEffect, useMemo, useSyncExternalStore } from 'react'
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

// Whom each of these devices acts for in user mode (an email), for the ones that are in it: read in the same batch.
export const useActsFor = (deviceIds: string[]): Map<string, string> => {
  const ids = deviceIds.join('|')
  // A string snapshot, so the store sees no change until one of these devices' user mode does.
  const snapshot = useSyncExternalStore(subscribeDeviceSessionInfo, () =>
    deviceIds.map(id => `${id}=${deviceSessionInfo(id)?.actsFor ?? ''}`).join('|')
  )

  useEffect(() => {
    if (ids) ids.split('|').forEach(id => requestDeviceSessionInfo(id))
  }, [ids])

  return useMemo(
    () =>
      new Map(
        snapshot
          .split('|')
          .map(pair => pair.split('='))
          .filter(([, email]) => email)
          .map(([id, email]) => [id, email] as [string, string])
      ),
    [snapshot]
  )
}
