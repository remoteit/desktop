import { useCallback, useEffect, useState } from 'react'
import {
  AppChange,
  AppRelease,
  AvailableApp,
  DeviceApp,
  DeviceAppService,
  graphQLAddDeviceApp,
  graphQLAvailableApps,
  graphQLDeviceApps,
  graphQLRemoveDeviceApp,
  graphQLSetDeviceAppEnabled,
  graphQLSetDeviceAppRelease,
  graphQLSetDeviceAppSetting,
  refused,
} from '../services/graphQLDeviceApps'
import { appServiceOf, isAppService, serviceApp } from '../helpers/appsHelper'

type Read = ReturnType<typeof graphQLDeviceApps>

// One read per device for every part of a page that asks in the same moment: its Apps section, and an app's service's
// row in its services and connect panel.
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
  // What it may add (the device's catalogue): read once its apps are, and again after one is added or removed.
  available?: AvailableApp[]
  switching?: string // the app being changed, waited for
  // Enabled or disabled; an app the device has no row for (one offered) is added. consentRoot: the person said yes to a
  // root app's full control of the device (components/AppRootConsent).
  turn: (app: DeviceApp, enabled: boolean, consentRoot?: boolean) => Promise<AppChange<true>>
  // Its channel and pin; consentRoot alone is Update now, to a release waiting for root consent.
  setRelease: (app: DeviceApp, release: AppRelease) => Promise<AppChange<true>>
  // Removed from the device, its files and data with it.
  remove: (app: DeviceApp) => Promise<AppChange<true>>
  setSetting: (app: DeviceApp, name: string, value: any) => Promise<boolean>
}

// An app the device still has to act on: started, or removed.
const waiting = (app?: DeviceApp) => app?.state === 'starting' || app?.state === 'removing'

/* A device's apps (services/graphQLDeviceApps): added, enabled or disabled, its channel and pin, removed, and its
   settings. The device acts within seconds: what it says is waited for, up to half a minute — while it starts the app,
   or until it says the app is gone. What it may add is read too, unless the part asking does not offer any (offers
   false). */
export function useDeviceApps(deviceId?: string, { offers = true }: { offers?: boolean } = {}): DeviceApps {
  const [apps, setApps] = useState<DeviceApp[] | null>()
  const [switching, setSwitching] = useState<string>()
  const [available, setAvailable] = useState<AvailableApp[]>()
  const ids = apps?.map(app => app.id).join(',')

  useEffect(() => {
    setAvailable(undefined)
    if (!offers || !deviceId || apps === undefined || apps === null) return
    let current = true
    graphQLAvailableApps(deviceId).then(result => current && setAvailable(result))
    return () => {
      current = false
    }
  }, [offers, deviceId, ids, apps === null])

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

  // A change, then what the device says of it, every part of the page told.
  const change = useCallback(
    async (app: DeviceApp, call: () => Promise<AppChange<unknown>>): Promise<AppChange<true>> => {
      if (!deviceId) return { reason: '' }
      setSwitching(app.id)
      const answer = await call()
      if (!refused(answer)) {
        for (let waited = 0; waited < 30_000; waited += 2_000) {
          const now = await graphQLDeviceApps(deviceId)
          tell(deviceId, now)
          if (!waiting(now?.find(a => a.id === app.id))) break
          await new Promise(resolve => setTimeout(resolve, 2_000))
        }
      }
      setSwitching(undefined)
      return refused(answer) ? answer : true
    },
    [deviceId]
  )

  const turn = useCallback(
    (app: DeviceApp, enabled: boolean, consentRoot?: boolean) =>
      change(app, () =>
        apps?.some(a => a.id === app.id)
          ? graphQLSetDeviceAppEnabled(deviceId!, app.id, enabled, consentRoot || undefined)
          : graphQLAddDeviceApp(deviceId!, app.id, consentRoot ? { consentRoot } : {})
      ),
    [change, deviceId, apps]
  )

  const setRelease = useCallback(
    (app: DeviceApp, release: AppRelease) => change(app, () => graphQLSetDeviceAppRelease(deviceId!, app.id, release)),
    [change, deviceId]
  )

  const remove = useCallback(
    (app: DeviceApp) => change(app, () => graphQLRemoveDeviceApp(deviceId!, app.id)),
    [change, deviceId]
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

  return {
    apps,
    available,
    switching,
    turn,
    setRelease,
    remove,
    setSetting,
  }
}

/* The app a service of a device belongs to (helpers/appsHelper serviceApp) and which of its services it is
   (appServiceOf), with its device's apps to turn it on: read only for a service at an app's host, so a device's other
   services ask nothing. */
export type ServiceApp = DeviceApps & { app?: DeviceApp; appService?: DeviceAppService }
export function useServiceApp(device?: IDevice, service?: IService): ServiceApp {
  const deviceApps = useDeviceApps(isAppService(service) ? device?.id : undefined, { offers: false })
  const app = serviceApp(deviceApps.apps, service)
  return { ...deviceApps, app, appService: appServiceOf(app, service) }
}
