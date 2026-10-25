import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useThisDeviceInfo } from '../../hooks/useThisDeviceInfo'
import {
  AppPrefs,
  DeviceSetting,
  DeviceStatus,
  ExitRef,
  LoggingState,
  PermissionName,
  PermissionState,
  StageStatus,
  ThisDevice,
} from '../../services/thisDevice'

/* What This device's parts read and do (pages/ThisDevicePage.tsx): the bridge's state, kept current from its events,
   what follows from it, and the calls. Each part — the page, Details, Advanced — keeps its own: the bridge is the
   machine's, read as a part opens and followed while it is open. */

export const useThisDeviceModel = (device: ThisDevice) => {
  const { t } = useTranslation()
  const has = (c: Parameters<ThisDevice['has']>[0]) => device.has(c)
  // What the shell offers now (1.7.0's info event): the page follows it, and reads again what a change newly offers.
  const offered = [...(useThisDeviceInfo(device)?.capabilities ?? [])].sort().join(' ')
  const [status, setStatus] = useState<DeviceStatus>()
  const [exits, setExits] = useState<ExitRef[]>([])
  const [settings, setSettings] = useState<DeviceSetting[]>([])
  const [permissions, setPermissions] = useState<Partial<Record<PermissionName, PermissionState>>>({})
  const [stages, setStages] = useState<StageStatus[]>([])
  const [logging, setLogging] = useState<LoggingState>()
  const [app, setApp] = useState<AppPrefs>()
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [busy, setBusy] = useState(false)

  const act = useCallback(async (run: () => Promise<unknown>) => {
    setBusy(true)
    setError(undefined)
    try {
      await run()
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (!device.compatible) return
    const offs: (() => void)[] = []
    const fail = (e: any) => setError(e?.message || String(e))
    // What the engine answers and sends no event for (its exits, its logging): read as the page opens and again with
    // each status — a daemon that answers only later (restarting as the page opened), or changes them, is shown as it
    // is, not as it was when the page asked first. Asked again, an exit list the engine cannot give yet is no new
    // error: the status says why.
    const engineReads = (failed: (e: any) => void) => {
      if (device.has('exit')) device.call('exit.list', {}).then(setExits, failed)
      if (device.has('logging')) device.call('logging.get', {}).then(setLogging, () => setLogging(undefined))
    }
    if (device.has('status')) {
      device.call('status', {}).then(setStatus, fail)
      offs.push(
        device.on('status', next => {
          setStatus(next)
          engineReads(() => {})
        })
      )
    }
    engineReads(fail)
    if (device.has('settings')) {
      device.call('settings.get', {}).then(setSettings, fail)
      offs.push(device.on('settings', setSettings))
    }
    if (device.has('permissions')) device.call('permissions.get', {}).then(setPermissions, fail)
    if (device.has('app')) device.call('app.get', {}).then(setApp, fail)
    if (device.has('stages')) {
      device.call('stages.list', {}).then(setStages, fail)
      offs.push(device.on('stages', setStages))
    }
    return () => offs.forEach(off => off())
  }, [device, offered])

  // 1.6.0: stopped on this machine (the menu's Quit and Stop): the switches do nothing until it is started. Only a shell
  // that can be stopped offers `start`; a phone's engine says 'stopped' whenever its tunnel is off, and there the
  // switches are what turn it on, so they are never held for it.
  const stopped = status?.engine === 'stopped' && has('start')
  const off = status?.engine === 'stopped' && !stopped
  const kind = device.info.deviceKind || t('thisDevice.kind', 'device')
  // 1.4.0: Allow remote access to services, every shell's ('services'); a 1.3.0 phone shell's 'lanServices' is the same.
  const servicesVia: 'services' | 'lanServices' | undefined = has('services')
    ? 'services'
    : has('lanServices')
    ? 'lanServices'
    : undefined
  const lan = servicesVia === 'services' ? status?.services : status?.lanServices
  // The printers are under Access, as in the menu's Settings: they are announced at the subnet's names.
  const printers = has('access') ? settings.find(s => s.name === 'printers') : undefined
  // The settings listed under Advanced: the switches on the page in their place — Access is subnet, the services switch
  // services. lan_services is the setting's earlier name, never listed.
  const listed = settings.filter(
    s =>
      !(s.name === 'subnet' && has('access')) &&
      !(s.name === 'services' && servicesVia) &&
      s.name !== 'lan_services' &&
      s !== printers
  )

  const setSetting = (name: string, value: any) =>
    act(async () => {
      const next = await device.call('settings.set', { name, value })
      setSettings(all => all.map(x => (x.name === next.name ? next : x)))
    })

  return {
    t,
    has,
    status,
    setStatus,
    exits,
    settings,
    permissions,
    setPermissions,
    stages,
    logging,
    setLogging,
    app,
    setApp,
    error,
    setError,
    notice,
    setNotice,
    busy,
    act,
    setSetting,
    stopped,
    off,
    held: busy || stopped,
    kind,
    // 1.2.0: Access and Protect, the two switches, where the shell offers them; the 1.0 VPN and exit otherwise.
    switches: has('access') || has('protect'),
    servicesVia,
    lan,
    // A phone's services are hosts on the network it is on, which its Local Network permission reaches; a desktop's
    // are what is defined on it. The shell says which by offering the permission.
    phoneServices: has('permissions'),
    servicesOff: !!servicesVia && !!lan && !lan.on,
    printers,
    listed,
  }
}

export type ThisDeviceModel = ReturnType<typeof useThisDeviceModel>
