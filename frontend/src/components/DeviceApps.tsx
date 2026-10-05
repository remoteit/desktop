import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Switch,
  Typography,
} from '@mui/material'
import { DeviceApp, graphQLDeviceApps, graphQLSetDeviceApp } from '../services/graphQLDeviceApps'
import { settingLocked, settingOn } from '../services/graphQLDeviceSettings'
import { useSubnetReach } from '../hooks/useLocalSubnetName'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { settingNote } from './DeviceSettingRow'
import { Icon } from './Icon'

/* A device's apps (services/graphQLDeviceApps) on its Configure page: the console first — SSH by OpenSSH, run by the
   device's daemon, nothing listening. Its switch turns it on or off for whoever manages the device; its state is what
   the device says, waited for after a change — a device setting (console) where the API has device settings, so who set
   it on the device, or the administrator's refusal of it, is said and holds. Open terminal logs in by certificate, the
   host key checked against the one the device reports. Nothing where the API has no apps. */
export const DeviceApps: React.FC<{ deviceId: string; canManage: boolean }> = ({ deviceId, canManage }) => {
  const { t } = useTranslation()
  const [apps, setApps] = useState<DeviceApp[] | null>()
  const [switching, setSwitching] = useState<string>()
  const reach = useSubnetReach(deviceId)
  const settings = useDeviceSettings(deviceId)
  const consoleSetting = settings.setting('console')

  useEffect(() => {
    setApps(undefined)
    graphQLDeviceApps(deviceId).then(setApps)
  }, [deviceId])

  if (!apps?.length) return null

  // The device turns it on or off within seconds: wait for what it says, up to half a minute.
  const turn = async (app: DeviceApp, on: boolean) => {
    setSwitching(app.id)
    const changed =
      app.id === 'console' && consoleSetting
        ? await settings.set('console', on)
        : await graphQLSetDeviceApp(deviceId, app.id, on)
    if (changed) {
      for (let waited = 0; waited < 30_000; waited += 2_000) {
        const now = await graphQLDeviceApps(deviceId)
        setApps(now)
        const it = now?.find(a => a.id === app.id)
        if (!it || it.state !== 'starting') break
        await new Promise(resolve => setTimeout(resolve, 2_000))
      }
    }
    setSwitching(undefined)
  }

  const openTerminal = (app: DeviceApp) => {
    if (!reach.name || !app.serviceId || !app.port) return
    const query = new URLSearchParams({
      name: reach.name,
      port: String(app.port),
      title: t('deviceApps.console', 'Console'),
      service: app.serviceId,
    })
    window.open(`${location.origin}${location.pathname}#/terminal?${query}`, '_blank')
  }

  const status = (app: DeviceApp) => {
    if (switching === app.id) return t('deviceApps.switching', 'Waiting for the device…')
    switch (app.state) {
      case 'running':
        return t('deviceApps.running', 'Running — logins by certificate, nothing listening on the device')
      case 'starting':
        return app.detail
          ? t('deviceApps.startingDetail', 'Starting — {{detail}}', { detail: app.detail })
          : t('deviceApps.starting', 'Starting — waiting for the device to say so')
      case 'unavailable':
        return t('deviceApps.unavailable', 'Not available here: {{detail}}', { detail: app.detail })
      default:
        return t('deviceApps.off', 'Off — a terminal on this device, from this app, by certificate')
    }
  }

  // The administrator's override holds over what is set here: under off the console is off, whatever apps says.
  const isOn = (app: DeviceApp) =>
    consoleSetting && ['off', 'on'].includes(consoleSetting.control) ? settingOn(consoleSetting) : app.on
  const note = settingNote(t, consoleSetting)

  return (
    <List dense sx={{ paddingBottom: 1 }}>
      <ListSubheader disableGutters>{t('deviceApps.title', 'Apps')}</ListSubheader>
      {apps
        .filter(app => app.id === 'console')
        .map(app => (
          <ListItem key={app.id} disableGutters sx={{ alignItems: 'flex-start' }}>
            <ListItemIcon sx={{ marginTop: 0.5 }}>
              <Icon name="terminal" size="md" fixedWidth />
            </ListItemIcon>
            <ListItemText
              primary={
                app.version
                  ? `${t('deviceApps.console', 'Console')} ${app.version}`
                  : t('deviceApps.console', 'Console')
              }
              secondary={
                <>
                  <Typography
                    variant="caption"
                    component="div"
                    color={app.state === 'unavailable' ? 'error' : 'textSecondary'}
                  >
                    {status(app)}
                  </Typography>
                  {note && (
                    <Typography variant="caption" component="div" color="textSecondary">
                      {note}
                    </Typography>
                  )}
                  {app.state === 'running' && app.hostKey && (
                    <Typography variant="caption" component="div" color="textSecondary" sx={{ wordBreak: 'break-all' }}>
                      {t('deviceApps.hostKey', 'Host key {{key}}', { key: app.hostKey })}
                    </Typography>
                  )}
                </>
              }
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {app.state === 'running' && reach.name && (
                <Button size="small" variant="contained" onClick={() => openTerminal(app)}>
                  {t('deviceApps.openTerminal', 'Open terminal')}
                </Button>
              )}
              <Switch
                checked={switching === app.id ? !isOn(app) : isOn(app)}
                disabled={!canManage || switching !== undefined || settingLocked(consoleSetting)}
                onChange={e => turn(app, e.target.checked)}
                inputProps={{ 'aria-label': t('deviceApps.switch', 'Console on') }}
              />
            </Box>
          </ListItem>
        ))}
    </List>
  )
}
