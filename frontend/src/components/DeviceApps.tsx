import React from 'react'
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
import { DeviceApp } from '../services/graphQLDeviceApps'
import { settingLocked } from '../services/graphQLDeviceSettings'
import { useSubnetName } from '../hooks/useLocalSubnetName'
import { useDeviceApps } from '../hooks/useDeviceApps'
import { openTerminal } from '../helpers/terminalHelper'
import { settingNote } from './DeviceSettingRow'
import { DeviceMcpExecSetting } from './DeviceMcpExecSetting'
import { Icon } from './Icon'

/* A device's apps (services/graphQLDeviceApps) on its Configure page: the console first — SSH by OpenSSH, run by the
   device's daemon, nothing listening. Its switch turns it on or off for whoever manages the device; its state is what
   the device says, waited for after a change — a device setting (console) where the API has device settings, so who set
   it on the device, or the administrator's refusal of it, is said and holds. Open terminal logs in by certificate, the
   host key checked against the one the device reports. Under it, whether AI commands may use the console. Nothing where
   the API has no apps. */
export const DeviceApps: React.FC<{ deviceId: string; canManage: boolean }> = ({ deviceId, canManage }) => {
  const { t } = useTranslation()
  const { apps, switching, turn, isOn, consoleSetting, settings } = useDeviceApps(deviceId)
  const name = useSubnetName(deviceId)

  if (!apps?.length) return null

  const openConsole = (app: DeviceApp) =>
    name && app.serviceId && app.port
      ? openTerminal({ name, port: app.port, title: t('deviceApps.console', 'Console'), service: app.serviceId })
      : undefined

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
              {app.state === 'running' && name && (
                <Button size="small" variant="contained" onClick={() => openConsole(app)}>
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
      {apps.some(app => app.id === 'console') && <DeviceMcpExecSetting settings={settings} canManage={canManage} />}
    </List>
  )
}
