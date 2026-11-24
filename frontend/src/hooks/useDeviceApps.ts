import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import type { Dispatch } from '../store'
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
import { useReadCallback, useReadEffect } from './useReadAgain'
import { sharedRead } from '../services/accountCaches'

// One read per device for every part of a page that asks in the same moment: its Apps section, and an app's service's
// row in its services and connect panel.
const read = sharedRead(graphQLDeviceApps)

// Every part of a page showing a device's apps, told what the device said after one was changed here.
const watchers = new Set<(deviceId: string, apps: DeviceApp[] | null) => void>()
const tell = (deviceId: string, apps: DeviceApp[] | null) => watchers.forEach(watcher => watcher(deviceId, apps))

export type DeviceApps = {
  apps: DeviceApp[] | null | undefined // undefined while read; null where the API has no apps
  // What it may add (the device's catalogue): read once its apps are, and again after one is added or removed.
  available?: AvailableApp[]
  switching?: string // the app being changed, waited for
  // Enabled or disabled; an app the device has no row for (one offered) is added. consentRoot: the person said yes to
  // what its release asks — root's full control of the device, its capabilities (components/AppRootConsent).
  turn: (app: DeviceApp, enabled: boolean, consentRoot?: boolean) => Promise<AppChange<true>>
  // Its channel and pin; consentRoot alone is Update now, to a release waiting for a consent.
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
   false). accountId: the account the device is read under (IDevice.accountId).

   An app's services are its device's services, and the device's services (its IDevice in the store) are where every
   part of the portal finds them: their rows, connect panels, Open and Open terminal, and the app's page. A change that
   went through, or a setting that is a port, may add, remove or move them, and nothing else says so while the service
   stays online: the device is read again after one. */
export function useDeviceApps(
  deviceId?: string,
  { offers = true, accountId }: { offers?: boolean; accountId?: string } = {}
): DeviceApps {
  const dispatch = useDispatch<Dispatch>()
  const [apps, setApps] = useState<DeviceApp[] | null>()
  const [switching, setSwitching] = useState<string>()
  const [available, setAvailable] = useState<AvailableApp[]>()
  const ids = apps?.map(app => app.id).join(',')

  useReadEffect(
    again => {
      if (!again) setAvailable(undefined)
      if (!offers || !deviceId || apps === undefined || apps === null) return
      let current = true
      graphQLAvailableApps(deviceId).then(result => current && setAvailable(result))
      return () => {
        current = false
      }
    },
    [offers, deviceId, ids, apps === null]
  )

  useReadEffect(
    again => {
      if (!again) setApps(undefined)
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
    },
    [deviceId]
  )

  const readDevice = useReadCallback(async () => {
    if (deviceId) await dispatch.devices.fetchSingleFull({ id: deviceId, accountId, hidden: true, silent: true })
  }, [dispatch, deviceId, accountId])

  // A change, then what the device says of it, every part of the page told; then the device, its services as they are.
  const change = useReadCallback(
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
        await readDevice()
      }
      setSwitching(undefined)
      return refused(answer) ? answer : true
    },
    [deviceId, readDevice]
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

  const setSetting = useReadCallback(
    async (app: DeviceApp, name: string, value: any) => {
      if (!deviceId) return false
      const setting = await graphQLSetDeviceAppSetting(deviceId, app.id, name, value)
      if (!setting) return false
      const now = (apps ?? []).map(a =>
        a.id === app.id ? { ...a, settings: a.settings.map(s => (s.name === name ? setting : s)) } : a
      )
      tell(deviceId, now)
      // A port setting moves its service's port, which graphql keeps in step before it answers.
      if (isPortSetting(app, name)) await readDevice()
      return true
    },
    [deviceId, apps, readDevice]
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

// Whether a setting is one of an app's ports: a service's (portSetting), or a listener's.
const isPortSetting = (app: DeviceApp, name: string) =>
  app.portSetting === name ||
  app.services.some(service => service.portSetting === name || service.listeners.some(l => l.portSetting === name))

/* The app a service of a device belongs to (helpers/appsHelper serviceApp) and which of its services it is
   (appServiceOf), with its device's apps to turn it on: read only for a service at an app's host, so a device's other
   services ask nothing. */
export type ServiceApp = DeviceApps & { app?: DeviceApp; appService?: DeviceAppService }
export function useServiceApp(device?: IDevice, service?: IService): ServiceApp {
  const deviceApps = useDeviceApps(isAppService(service) ? device?.id : undefined, {
    offers: false,
    accountId: device?.accountId,
  })
  const app = serviceApp(deviceApps.apps, service)
  return { ...deviceApps, app, appService: appServiceOf(app, service) }
}
