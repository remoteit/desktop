import React from 'react'
import { Box, Button, Divider, List, ListItem, ListItemText, Switch, Typography } from '@mui/material'
import { PermissionName, ThisDevice } from '../../services/thisDevice'
import { ThisDeviceModel } from './model'
import { SettingRow, SWITCH_TEXT, UNDER_SERVICES } from './shared'

/* This device's Advanced (pages/ThisDevicePage.tsx, /this-device/advanced): what is changed seldom — what the device
   offers beyond the three switches (exit node, console, any port, proxy, AI commands, the relay), a phone's permissions,
   the app's own Open at login, the detailed logging and the diagnostics, and last its removal. */

export const ThisDeviceAdvanced: React.FC<{ device: ThisDevice; m: ThisDeviceModel }> = ({ device, m }) => {
  const { t, has, status, kind, permissions, logging, app } = m
  const d = status?.device
  const heading = (text: string) => (
    <Typography variant="subtitle1" paddingX={2}>
      {text}
    </Typography>
  )

  return (
    <>
      {has('settings') && m.listed.length > 0 && (
        <List data-section="settings">
          {heading(t('thisDevice.features', 'Features'))}
          {m.listed.map(s => (
            <SettingRow
              key={s.name}
              setting={s}
              relayUsing={s.name === 'websocket' ? status?.relay?.using : undefined}
              notServed={m.servicesOff && UNDER_SERVICES.includes(s.name)}
              disabled={m.busy}
              onSet={value => m.setSetting(s.name, value)}
            />
          ))}
        </List>
      )}

      {has('permissions') && (
        <List data-section="permissions">
          {heading(t('thisDevice.permissions', 'Permissions'))}
          {(['localNetwork', 'vpnConfiguration', ...(has('notifications') ? ['notifications'] : [])] as PermissionName[]).map(
            name => (
              <ListItem
                key={name}
                secondaryAction={
                  permissions[name] !== 'granted' && (
                    <Button
                      size="small"
                      disabled={m.busy}
                      onClick={() =>
                        m.act(async () => {
                          const state = await device.call('permissions.request', { name })
                          m.setPermissions(p => ({ ...p, [name]: state }))
                        })
                      }
                    >
                      {t('thisDevice.allow', 'Allow')}
                    </Button>
                  )
                }
              >
                <ListItemText
                  primary={
                    name === 'localNetwork'
                      ? t('thisDevice.localNetwork', 'Local network')
                      : name === 'notifications'
                      ? t('thisDevice.notifications', 'Notifications')
                      : t('thisDevice.vpnConfiguration', 'VPN configuration')
                  }
                  secondary={permissions[name] ?? 'unknown'}
                />
              </ListItem>
            )
          )}
        </List>
      )}

      {has('app') && app?.openAtLogin && (
        <List data-section="app">
          {heading(t('thisDevice.machine', 'This {{kind}}', { kind }))}
          <ListItem
            secondaryAction={
              <Switch
                edge="end"
                checked={app.openAtLogin.on}
                disabled={m.busy}
                inputProps={{ 'aria-label': t('thisDevice.openAtLogin', 'Open at login') }}
                data-control="openAtLogin"
                onChange={() => m.act(async () => m.setApp(await device.call('app.set', { openAtLogin: !app.openAtLogin?.on })))}
              />
            }
          >
            <ListItemText
              primary={t('thisDevice.openAtLogin', 'Open at login')}
              secondary={
                app.openAtLogin.error ||
                (app.openAtLogin.pending
                  ? t('thisDevice.openAtLoginPending', 'Waiting for you to allow it in System Settings → General → Login Items')
                  : t('thisDevice.openAtLoginLine', 'remote.it opens when you log in; quitting it leaves connections on.'))
              }
              sx={SWITCH_TEXT}
              data-open-at-login={app.openAtLogin.on ? 'on' : 'off'}
            />
          </ListItem>
        </List>
      )}

      {((has('logging') && logging) || has('diagnostics')) && (
        <List data-section="diagnostics">
          {heading(t('thisDevice.diagnosticsTitle', 'Diagnostics'))}
          {has('logging') && logging && (
            <ListItem
              data-logging-row
              secondaryAction={
                <Switch
                  edge="end"
                  checked={logging.detailed}
                  disabled={m.busy}
                  inputProps={{ 'aria-label': t('thisDevice.detailedLogging', 'Detailed connection logging') }}
                  data-control="logging"
                  onChange={() => m.act(async () => m.setLogging(await device.call('logging.set', { detailed: !logging.detailed })))}
                />
              }
            >
              <ListItemText
                primary={t('thisDevice.detailedLogging', 'Detailed connection logging')}
                secondary={
                  logging.error ||
                  t('thisDevice.detailedLoggingLine', 'A line a second for each connection in the log, until remote.it restarts.')
                }
                sx={SWITCH_TEXT}
                data-logging={logging.detailed ? 'on' : 'off'}
              />
            </ListItem>
          )}
          {has('diagnostics') && (
            <ListItem>
              <Button
                variant="outlined"
                size="small"
                disabled={m.busy}
                data-control="diagnostics"
                onClick={() =>
                  m.act(async () => {
                    const r = await device.call('diagnostics.save', {})
                    if (r.saved) m.setNotice(t('thisDevice.saved', 'Saved {{where}}', { where: r.where ?? '' }))
                  })
                }
              >
                {t('thisDevice.diagnostics', 'Save diagnostics…')}
              </Button>
            </ListItem>
          )}
        </List>
      )}

      {has('remove') && d?.removal && (
        <Box data-section="remove" paddingTop={2}>
          <Divider />
          <List>
            <ListItem>
              <ListItemText
                primary={
                  d.removal === 'uninstall'
                    ? t('thisDevice.uninstallTitle', 'Uninstall remote.it')
                    : t('thisDevice.removeTitle', 'Remove remote.it')
                }
                secondary={
                  d.removal === 'uninstall'
                    ? t('thisDevice.uninstallLine', 'The remote.it app and this device come off this {{kind}}.', { kind })
                    : t('thisDevice.removeLine', 'This device comes off this {{kind}}; the remote.it app stays.', { kind })
                }
              />
            </ListItem>
            <ListItem>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={m.busy}
                data-control="remove"
                onClick={() =>
                  m.act(async () => {
                    const r = await device.call('device.remove', {})
                    if (r.removed) m.setNotice(t('thisDevice.removed', 'Removed from this {{kind}}', { kind }))
                  })
                }
              >
                {d.removal === 'uninstall'
                  ? t('thisDevice.uninstall', 'Uninstall remote.it from this {{kind}}…', { kind })
                  : t('thisDevice.remove', 'Remove from this {{kind}}…', { kind })}
              </Button>
            </ListItem>
          </List>
        </Box>
      )}
    </>
  )
}
