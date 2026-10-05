import { useCallback, useEffect, useState } from 'react'
import {
  DeviceSetting,
  DeviceSettingName,
  graphQLDeviceSettings,
  graphQLSetDeviceSetting,
} from '../services/graphQLDeviceSettings'
import { useDeviceSessions } from './useDeviceSessions'

type Read = ReturnType<typeof graphQLDeviceSettings>

// One read per device for every row that asks in the same moment: a page shows several of its settings.
const reading = new Map<string, Read>()
function read(deviceId: string): Read {
  let answer = reading.get(deviceId)
  if (!answer) {
    answer = graphQLDeviceSettings(deviceId).finally(() => reading.delete(deviceId))
    reading.set(deviceId, answer)
  }
  return answer
}

export type DeviceSettings = {
  // undefined while read; null where the API has no settings (or could not say), for the caller's own controls
  settings: DeviceSetting[] | null | undefined
  setting: (name: DeviceSettingName) => DeviceSetting | undefined
  set: (name: DeviceSettingName, value: any) => Promise<boolean>
}

/* A device's settings (services/graphQLDeviceSettings), behind the device-sessions gate: null with the gate off, as
   for an API without them. A change here is the answer's to show — each row owns its own setting. */
export function useDeviceSettings(deviceId?: string): DeviceSettings {
  const enabled = useDeviceSessions()
  const [settings, setSettings] = useState<DeviceSetting[] | null>()

  useEffect(() => {
    if (!enabled || !deviceId) {
      setSettings(null)
      return
    }
    setSettings(undefined)
    let current = true
    read(deviceId).then(result => {
      if (current) setSettings(Array.isArray(result) ? result : null)
    })
    return () => {
      current = false
    }
  }, [enabled, deviceId])

  const setting = useCallback((name: DeviceSettingName) => settings?.find(s => s.name === name), [settings])

  const set = useCallback(
    async (name: DeviceSettingName, value: any) => {
      if (!deviceId) return false
      const result = await graphQLSetDeviceSetting(deviceId, name, value)
      if (result === 'ERROR') return false
      setSettings(list => (list ? [...list.filter(s => s.name !== name), result] : list))
      return true
    },
    [deviceId]
  )

  return { settings, setting, set }
}
