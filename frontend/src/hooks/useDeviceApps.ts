import { useCallback, useEffect, useState } from 'react'
import {
  CONSOLE,
  DeviceApp,
  graphQLDeviceApps,
  graphQLSetDeviceApp,
  graphQLSetDeviceAppSetting,
} from '../services/graphQLDeviceApps'

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

// Every part of a page showing a device's apps, told what the device said after one was changed here.
const watchers = new Set<(deviceId: string, apps: DeviceApp[] | null) => void>()
const tell = (deviceId: string, apps: DeviceApp[] | null) => watchers.forEach(watcher => watcher(deviceId, apps))

export type DeviceApps = {
  apps: DeviceApp[] | null | undefined // undefined while read; null where the API has no apps
  console?: DeviceApp
  switching?: string // the app being turned on or off, waited for
  // consentRoot: the person said yes to a root app's full control of the device (components/AppRootConsent)
  turn: (app: DeviceApp, on: boolean, consentRoot?: boolean) => Promise<boolean>
  setSetting: (app: DeviceApp, name: string, value: any) => Promise<boolean>
}

/* A device's apps (services/graphQLDeviceApps): turning one on or off, and setting its settings. The device turns an
   app on or off within seconds: what it says is waited for, up to half a minute. */
export function useDeviceApps(deviceId?: string): DeviceApps {
  const [apps, setApps] = useState<DeviceApp[] | null>()
  const [switching, setSwitching] = useState<string>()

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
    async (app: DeviceApp, on: boolean, consentRoot?: boolean) => {
      if (!deviceId) return false
      setSwitching(app.id)
      const changed = await graphQLSetDeviceApp(deviceId, app.id, on, consentRoot ? { consentRoot } : {})
      if (changed) {
        for (let waited = 0; waited < 30_000; waited += 2_000) {
          const now = await graphQLDeviceApps(deviceId)
          tell(deviceId, now)
          const it = now?.find(a => a.id === app.id)
          if (!it || it.state !== 'starting') break
          await new Promise(resolve => setTimeout(resolve, 2_000))
        }
      }
      setSwitching(undefined)
      return !!changed
    },
    [deviceId]
  )

  const setSetting = useCallback(
    async (app: DeviceApp, name: string, value: any) => {
      if (!deviceId) return false
      const setting = await graphQLSetDeviceAppSetting(deviceId, app.id, name, value)
      if (!setting) return false
      const now = (apps ?? []).map(a =>
        a.id === app.id ? { ...a, settings: a.settings.map(s => (s.name === name ? setting : s)) } : a
      )
      tell(deviceId, now)
      return true
    },
    [deviceId, apps]
  )

  return { apps, console: apps?.find(app => app.id === CONSOLE), switching, turn, setSetting }
}
