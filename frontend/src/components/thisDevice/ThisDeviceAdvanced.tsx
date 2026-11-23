import React from 'react'
import { Box, Button, Divider, List, ListItem, ListItemText, Switch, Typography } from '@mui/material'
import { PermissionName, ThisDevice } from '../../services/thisDevice'
import { useDeviceApps } from '../../hooks/useDeviceApps'
import { ThisDeviceModel } from './model'
import { appSettings, SettingRow, SWITCH_TEXT } from './shared'
import { ThisDeviceExitNode } from './ThisDeviceExitNode'

/* This device's Advanced (pages/ThisDevicePage.tsx, /this-device/advanced): what is changed seldom — what the device
   offers beyond the three switches (exit node, its apps and their settings, any port, proxy, the relay), whether it
   shares its connection as an exit and the person's ssh (1.12.0), a phone's permissions, the app's own Open at login,
   the detailed logging and the diagnostics, and last its removal. */

export const ThisDeviceAdvanced: React.FC<{
  device: ThisDevice
  m: ThisDeviceModel
  exitRunsHref?: (uid: string) => string
}> = ({ device, m, exitRunsHref }) => {
  const { t, has, status, kind, permissions, logging, app } = m
  const ssh = status?.ssh
  const d = status?.device
  // Its apps' words, as the API says them (the device by its UID): its settings name none (shared appSettings).
  const { apps } = useDeviceApps(d?.uid, { offers: false })
  const words = appSettings(m.listed, apps)
  // An option is listed under the app it belongs to; one whose app is not listed stands on its own.
  const options = (name: string) => m.listed.filter(s => words.of(s) === name)
  const standing = m.listed.filter(s => !words.of(s))
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
          {standing.map(s => (
            <React.Fragment key={s.name}>
              <SettingRow
                setting={s}
                title={words.title(s)}
                relayUsing={s.name === 'websocket' ? status?.relay?.using : undefined}
                notServed={m.servicesOff && words.underServices(s)}
                disabled={m.busy}
                onSet={value => m.setSetting(s.name, value)}
              />
              {options(s.name).map(o => (
                <SettingRow
                  key={o.name}
                  setting={o}
                  title={words.title(o)}
                  indent
                  disabled={m.busy}
                  onSet={value => m.setSetting(o.name, value)}
                />
              ))}
            </React.Fragment>
          ))}
        </List>
      )}

      {has('exitNode') && status?.exitNode && (
        <ThisDeviceExitNode
          device={device}
          m={m}
          status={status.exitNode}
          leaveHref={d?.uid && exitRunsHref ? exitRunsHref(d.uid) : undefined}
        />
      )}

      {has('ssh') && ssh && (
        <List data-section="ssh">
          {heading(t('thisDevice.sshTitle', 'SSH'))}
          <ListItem
            secondaryAction={
              <Switch
                edge="end"
                checked={ssh.on}
                disabled={m.busy || !!ssh.needsSignIn}
                inputProps={{ 'aria-label': t('thisDevice.useForSsh', 'Use Remote.It for ssh') }}
                data-control="ssh"
                onChange={() =>
                  m.act(async () => {
                    const next = await device.call('ssh.set', { on: !ssh.on })
                    m.setStatus(s => s && { ...s, ssh: next })
                  })
                }
              />
            }
          >
            <ListItemText
              primary={t('thisDevice.useForSsh', 'Use Remote.It for ssh')}
              secondary={
                ssh.needsSignIn
                  ? t('thisDevice.sshSignIn', 'Sign in to change it.')
                  : t(
                      'thisDevice.sshLine',
                      'Connect with plain ssh to your devices’ addresses. Remote.It signs you in with short-lived certificates.'
                    )
              }
              sx={SWITCH_TEXT}
              data-ssh={ssh.on ? 'on' : 'off'}
            />
          </ListItem>
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
                  : t('thisDevice.openAtLoginLine', 'Remote.It opens when you log in. Quitting it leaves connections on.'))
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
                  t('thisDevice.detailedLoggingLine', 'Logs a line a second for each connection, until Remote.It restarts.')
                }
                sx={SWITCH_TEXT}
                data-logging={logging.detailed ? 'on' : 'off'}
              />
            </ListItem>
          )}
          {has('diagnostics') && (
            <ListItem>
              <Button
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
                    ? t('thisDevice.uninstallTitle', 'Uninstall Remote.It')
                    : t('thisDevice.removeTitle', 'Remove Remote.It')
                }
                secondary={
                  d.removal === 'uninstall'
                    ? t('thisDevice.uninstallLine', 'Removes the Remote.It app and this device from this {{kind}}.', { kind })
                    : t('thisDevice.removeLine', 'Removes this device from this {{kind}}. The Remote.It app stays.', { kind })
                }
              />
            </ListItem>
            <ListItem>
              <Button
                size="small"
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
                  ? t('thisDevice.uninstall', 'Uninstall Remote.It from this {{kind}}…', { kind })
                  : t('thisDevice.remove', 'Remove from this {{kind}}…', { kind })}
              </Button>
            </ListItem>
          </List>
        </Box>
      )}
    </>
  )
}
