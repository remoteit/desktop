import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { Container } from '../components/Container'
import { useThisDevice } from '../hooks/useThisDevice'
import {
  BRIDGE_VERSION,
  DeviceSetting,
  DeviceStatus,
  ExitRef,
  PermissionName,
  PermissionState,
  SettingValue,
  StageStatus,
  ThisDevice,
} from '../services/thisDevice'

/* "This device" (device-package docs/one-app-plan.md): the machine this page runs on, the same page on every
   platform. What it shows comes from the shell's capabilities only (thisDevice.info().capabilities) — never from which
   platform it is — so the menu on a Mac and the phone's app draw it alike, each with what it can do. */

export const ThisDevicePage: React.FC = () => {
  const { t } = useTranslation()
  const device = useThisDevice()
  return (
    <Container gutterBottom header={<Typography variant="h1">{t('thisDevice.title', 'This device')}</Typography>}>
      {device === undefined ? (
        <Box display="flex" justifyContent="center" padding={4}>
          <CircularProgress size={28} />
        </Box>
      ) : device === null ? (
        <Box paddingX={4} paddingY={2}>
          <Typography variant="body2" color="textSecondary">
            {t('thisDevice.absent', 'This page shows the machine the remote.it app runs on. Open it in the app.')}
          </Typography>
        </Box>
      ) : (
        <ThisDeviceView device={device} />
      )}
    </Container>
  )
}

const SETTING_TITLES: { [name: string]: string } = {
  subnet: 'Reach devices by name',
  exit_node: 'Offer this device as an exit',
  lan_services: 'Allow connections through this device',
  printers: 'Show remote printers',
  websocket: 'Relay',
  console: 'Console',
  any_port: 'Connections to any port',
  proxy: 'Proxy',
  mcp_exec: 'AI commands',
}
const WEBSOCKET_CHOICES = ['auto', 'on', 'off']

/** Whether a setting's value is on: true, or {on: true}. */
const settingOn = (value: SettingValue | { on?: boolean }): boolean | undefined => {
  if (typeof value === 'boolean') return value
  if (value && typeof value === 'object' && typeof (value as any).on === 'boolean') return (value as any).on
  return undefined
}
/** The value that turns a setting the other way: a boolean flipped, or {on} flipped with the rest kept. */
const toggled = (value: any): any => (typeof value === 'boolean' ? !value : { ...value, on: !value.on })

export const ThisDeviceView: React.FC<{ device: ThisDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const has = (c: Parameters<ThisDevice['has']>[0]) => device.has(c)
  const [status, setStatus] = useState<DeviceStatus>()
  const [exits, setExits] = useState<ExitRef[]>([])
  const [settings, setSettings] = useState<DeviceSetting[]>([])
  const [permissions, setPermissions] = useState<Partial<Record<PermissionName, PermissionState>>>({})
  const [stages, setStages] = useState<StageStatus[]>([])
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
    if (device.has('status')) {
      device.call('status', {}).then(setStatus, fail)
      offs.push(device.on('status', setStatus))
    }
    if (device.has('exit')) device.call('exit.list', {}).then(setExits, fail)
    if (device.has('settings')) {
      device.call('settings.get', {}).then(setSettings, fail)
      offs.push(device.on('settings', setSettings))
    }
    if (device.has('permissions')) device.call('permissions.get', {}).then(setPermissions, fail)
    if (device.has('stages')) {
      device.call('stages.list', {}).then(setStages, fail)
      offs.push(device.on('stages', setStages))
    }
    return () => offs.forEach(off => off())
  }, [device])

  if (!device.compatible)
    return (
      <Box paddingX={4} paddingY={2}>
        <Alert severity="warning">
          {t(
            'thisDevice.update',
            'This page needs a newer remote.it app (bridge {{page}}; the app has {{app}}). Update the app to use it.',
            { page: BRIDGE_VERSION, app: device.info.bridgeVersion }
          )}
        </Alert>
      </Box>
    )

  const vpnOn = !!status?.vpn.on
  const exitValue = status?.exit?.id ?? ''

  return (
    <Box paddingX={2} data-this-device>
      {error && (
        <Alert severity="error" onClose={() => setError(undefined)} sx={{ marginX: 2, marginBottom: 1 }}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" onClose={() => setNotice(undefined)} sx={{ marginX: 2, marginBottom: 1 }}>
          {notice}
        </Alert>
      )}

      {has('status') && status && (
        <List data-section="device">
          <ListItem>
            <ListItemText
              primary={status.device?.name || t('thisDevice.unnamed', 'This device')}
              secondary={[status.device?.dnsName, status.stage].filter(Boolean).join(' · ')}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t('thisDevice.engine', 'remote.it here')}
              secondary={engineLine(status, t)}
              data-engine={status.engine}
            />
          </ListItem>
          {status.signedIn && (
            <ListItem>
              <ListItemText
                primary={t('thisDevice.signedIn', 'Signed in on this device')}
                secondary={status.signedIn.email || status.signedIn.sub}
              />
            </ListItem>
          )}
          {status.subnet && (
            <ListItem>
              <ListItemText
                primary={t('thisDevice.subnet', 'Reach devices by name')}
                secondary={
                  status.subnet.on
                    ? [status.subnet.domain, status.subnet.ipv4, status.subnet.ipv6].filter(Boolean).join(' · ') ||
                      t('thisDevice.on', 'On')
                    : t('thisDevice.off', 'Off')
                }
              />
            </ListItem>
          )}
          {status.device?.uid && (
            <ListItem>
              <Button size="small" href={`#/devices/${status.device.uid}`}>
                {t('thisDevice.devicePage', 'Its page in remote.it')}
              </Button>
            </ListItem>
          )}
        </List>
      )}

      {(has('vpn') || has('exit')) && (
        <List data-section="vpn">
          <Typography variant="subtitle1" paddingX={2}>
            {t('thisDevice.vpnTitle', 'VPN')}
          </Typography>
          {has('vpn') && (
            <ListItem
              secondaryAction={
                <Switch
                  edge="end"
                  checked={vpnOn}
                  disabled={busy || status?.vpn.changing}
                  inputProps={{ 'aria-label': t('thisDevice.vpn', 'VPN') }}
                  data-control="vpn"
                  onChange={() => act(async () => setStatus(await device.call('vpn.set', { on: !vpnOn })))}
                />
              }
            >
              <ListItemText
                primary={t('thisDevice.vpn', 'VPN')}
                secondary={vpnLine(status, t)}
                data-vpn={vpnOn ? 'on' : 'off'}
              />
            </ListItem>
          )}
          {has('exit') && (
            <ListItem>
              <TextField
                select
                fullWidth
                size="small"
                label={t('thisDevice.exit', 'Exit')}
                value={exitValue}
                disabled={busy}
                // "None" is a choice like the others: shown, and the label kept above it, in every engine
                InputLabelProps={{ shrink: true }}
                SelectProps={{ displayEmpty: true }}
                inputProps={{ 'data-control': 'exit' }}
                onChange={e =>
                  act(async () => setStatus(await device.call('exit.set', { id: e.target.value || null })))
                }
              >
                <MenuItem value="">{t('thisDevice.exitNone', 'None — the usual way out')}</MenuItem>
                {exits.map(x => (
                  <MenuItem key={x.id} value={x.id}>
                    {x.kind === 'remoteit' ? `${x.name} (remote.it)` : x.name}
                  </MenuItem>
                ))}
              </TextField>
            </ListItem>
          )}
        </List>
      )}

      {has('settings') && settings.length > 0 && (
        <List data-section="settings">
          <Typography variant="subtitle1" paddingX={2}>
            {t('thisDevice.settings', 'Settings')}
          </Typography>
          {settings.map(s => (
            <SettingRow
              key={s.name}
              setting={s}
              disabled={busy}
              onSet={value =>
                act(async () => {
                  const next = await device.call('settings.set', { name: s.name, value })
                  setSettings(all => all.map(x => (x.name === next.name ? next : x)))
                })
              }
            />
          ))}
        </List>
      )}

      {has('permissions') && (
        <List data-section="permissions">
          <Typography variant="subtitle1" paddingX={2}>
            {t('thisDevice.permissions', 'Permissions')}
          </Typography>
          {(['localNetwork', 'vpnConfiguration'] as PermissionName[]).map(name => (
            <ListItem
              key={name}
              secondaryAction={
                permissions[name] !== 'granted' && (
                  <Button
                    size="small"
                    disabled={busy}
                    onClick={() =>
                      act(async () => {
                        const state = await device.call('permissions.request', { name })
                        setPermissions(p => ({ ...p, [name]: state }))
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
                    : t('thisDevice.vpnConfiguration', 'VPN configuration')
                }
                secondary={permissions[name] ?? 'unknown'}
              />
            </ListItem>
          ))}
        </List>
      )}

      {has('stages') && stages.length > 0 && (
        <List data-section="stages">
          <Typography variant="subtitle1" paddingX={2}>
            {t('thisDevice.stages', 'Stages')}
          </Typography>
          {stages.map(s => (
            <ListItem key={s.stage}>
              <ListItemText primary={s.stage} secondary={s.signedIn?.email ?? s.engine} />
            </ListItem>
          ))}
        </List>
      )}

      {has('diagnostics') && (
        <Box paddingX={2} paddingY={1} data-section="diagnostics">
          <Button
            variant="outlined"
            size="small"
            disabled={busy}
            onClick={() =>
              act(async () => {
                const r = await device.call('diagnostics.save', {})
                if (r.saved) setNotice(t('thisDevice.saved', 'Saved {{where}}', { where: r.where ?? '' }))
              })
            }
          >
            {t('thisDevice.diagnostics', 'Save diagnostics…')}
          </Button>
        </Box>
      )}
    </Box>
  )
}

const SettingRow: React.FC<{ setting: DeviceSetting; disabled: boolean; onSet: (value: any) => void }> = ({
  setting,
  disabled,
  onSet,
}) => {
  const { t } = useTranslation()
  const title = SETTING_TITLES[setting.name] ?? setting.name
  const on = settingOn(setting.value)
  const locked = !!setting.locked
  const from =
    setting.source === 'cloud'
      ? t('thisDevice.fromCloud', 'Set in the portal')
      : setting.source === 'machine'
      ? t('thisDevice.fromMachine', 'Set on this device')
      : t('thisDevice.fromDefault', 'Default')
  const secondary = locked ? `${from} · ${t('thisDevice.locked', 'Set by this machine’s administrator')}` : from

  if (on !== undefined)
    return (
      <ListItem
        data-setting={setting.name}
        secondaryAction={
          <Switch
            edge="end"
            checked={on}
            disabled={disabled || locked}
            inputProps={{ 'aria-label': title }}
            onChange={() => onSet(toggled(setting.value))}
          />
        }
      >
        <ListItemText primary={title} secondary={secondary} />
      </ListItem>
    )
  if (setting.name === 'websocket' && typeof setting.value === 'string')
    return (
      <ListItem data-setting={setting.name}>
        <TextField
          select
          fullWidth
          size="small"
          label={title}
          value={setting.value}
          disabled={disabled || locked}
          InputLabelProps={{ shrink: true }}
          helperText={secondary}
          onChange={e => onSet(e.target.value)}
        >
          {WEBSOCKET_CHOICES.map(c => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
      </ListItem>
    )
  return (
    <ListItem data-setting={setting.name}>
      <ListItemText primary={title} secondary={`${JSON.stringify(setting.value)} · ${secondary}`} />
    </ListItem>
  )
}

const engineLine = (s: DeviceStatus, t: (k: string, d: string) => string) =>
  ({
    starting: t('thisDevice.starting', 'Starting'),
    online: t('thisDevice.online', 'Online'),
    offline: t('thisDevice.offline', 'Offline'),
    signedOut: t('thisDevice.signedOut', 'Not signed in'),
    stopped: t('thisDevice.stopped', 'Not running'),
  }[s.engine] ?? s.engine)

const vpnLine = (s: DeviceStatus | undefined, t: (k: string, d: string, v?: any) => string) => {
  if (!s) return ''
  if (s.vpn.error) return s.vpn.error
  if (!s.vpn.on) return t('thisDevice.vpnOff', 'Off — traffic goes out the usual way')
  if (!s.exit) return t('thisDevice.vpnOn', 'On')
  if (s.exit.error) return s.exit.error
  if (s.exit.state === 'connecting') return t('thisDevice.connecting', 'Connecting to {{name}}…', { name: s.exit.name })
  if (s.exit.state === 'down') return t('thisDevice.exitDown', 'Exit unreachable — traffic blocked')
  return t('thisDevice.through', 'Connected through {{name}}', { name: s.exit.name })
}
