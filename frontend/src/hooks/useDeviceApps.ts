import { useCallback, useEffect, useState } from 'react'
import { DeviceApp, graphQLDeviceApps, graphQLSetDeviceApp } from '../services/graphQLDeviceApps'
import { DeviceSetting, settingOn } from '../services/graphQLDeviceSettings'
import { DeviceSettings, useDeviceSettings } from './useDeviceSettings'

type Read = ReturnType<typeof graphQLDeviceApps>

// One read per device for every part of a page that asks in the same moment: its Apps section, the console's row in
// its services and the console's connect panel.
const reading = new Map<string, Read>()
function read(deviceId: string): Read {
  let answer = reading.get(deviceId)
  if (!answer) {
    answer = graphQLDeviceApps(deviceId).finally(() => reading.delete(deviceId))
    reading.set(deviceId, answer)
  }
  return answer
}

// Every part of a page showing a device's apps, told what the device said after one was turned on or off here.
const watchers = new Set<(deviceId: string, apps: DeviceApp[] | null) => void>()

export type DeviceApps = {
  apps: DeviceApp[] | null | undefined // undefined while read; null where the API has no apps
  console?: DeviceApp
  switching?: string // the app being turned on or off, waited for
  turn: (app: DeviceApp, on: boolean) => Promise<void>
  isOn: (app: DeviceApp) => boolean
  consoleSetting?: DeviceSetting
  settings: DeviceSettings
}

/* A device's apps (services/graphQLDeviceApps) and turning one on or off: the console's on or off is its device setting
   where the API has device settings — so who set it on the device, or the administrator's refusal of it, holds — and
   the app's otherwise. The device turns it on or off within seconds: what it says is waited for, up to half a minute. */
export function useDeviceApps(deviceId?: string): DeviceApps {
  const [apps, setApps] = useState<DeviceApp[] | null>()
  const [switching, setSwitching] = useState<string>()
  const settings = useDeviceSettings(deviceId)
  const consoleSetting = settings.setting('console')

  useEffect(() => {
    setApps(undefined)
    if (!deviceId) return
    let current = true
    read(deviceId).then(result => {
      if (current) setApps(result)
    })
    const watcher = (changed: string, now: DeviceApp[] | null) => changed === deviceId && setApps(now)
    watchers.add(watcher)
    return () => {
      current = false
      watchers.delete(watcher)
    }
  }, [deviceId])

  const turn = useCallback(
    async (app: DeviceApp, on: boolean) => {
      if (!deviceId) return
      setSwitching(app.id)
      const changed =
        app.id === 'console' && consoleSetting
          ? await settings.set('console', on)
          : await graphQLSetDeviceApp(deviceId, app.id, on)
      if (changed) {
        for (let waited = 0; waited < 30_000; waited += 2_000) {
          const now = await graphQLDeviceApps(deviceId)
          watchers.forEach(watcher => watcher(deviceId, now))
          const it = now?.find(a => a.id === app.id)
          if (!it || it.state !== 'starting') break
          await new Promise(resolve => setTimeout(resolve, 2_000))
        }
      }
      setSwitching(undefined)
    },
    [deviceId, consoleSetting, settings.set]
  )

  // The administrator's override holds over what is set here: under off the console is off, whatever apps says.
  const isOn = useCallback(
    (app: DeviceApp) =>
      app.id === 'console' && consoleSetting && ['off', 'on'].includes(consoleSetting.control)
        ? settingOn(consoleSetting)
        : app.on,
    [consoleSetting]
  )

  return { apps, console: apps?.find(app => app.id === 'console'), switching, turn, isOn, consoleSetting, settings }
}
