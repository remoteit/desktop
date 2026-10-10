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
import { useSelector } from 'react-redux'
import { State } from '../store'
import { Container } from '../components/Container'
import { ThisDeviceSignIn } from '../components/ThisDeviceSignIn'
import { useThisDevice } from '../hooks/useThisDevice'
import {
  AppPrefs,
  BRIDGE_VERSION,
  DeviceSetting,
  DeviceStatus,
  ExitRef,
  LoggingState,
  PermissionName,
  PermissionState,
  SettingValue,
  StageStatus,
  ThisDevice,
} from '../services/thisDevice'

/* "This device" (device-package docs/one-app-plan.md): the machine this page runs on, the same page on every
   platform. What it shows comes from the shell's capabilities only (thisDevice.info().capabilities) — never from which
   platform it is — so the menu on a Mac and the phone's app draw it alike, each with what it can do.

   Signed out, or offline, in an app it is the whole portal (components/ThisDeviceApp): the bridge is the machine's own,
   so everything from it works; what is the account's — the device's page in remote.it — waits for the sign-in, which
   is offered at the top.

   1.5.0: everything the menu's own Settings window shows is here too (device-package docs/one-app-plan.md, "Settings →
   This device") — the menu's Settings… opens this page: the device's details and its removal; under Access, what is
   said of the subnet's range and the printers; the administrator's reasons; what the device offers, the relay in use
   and what is not served while the services are off; the detailed connection logging and the logs; and the app's own
   preferences, the machine's, in one "This <device kind>" part every stage's page shows alike. */

export const ThisDevicePage: React.FC = () => {
  const { t } = useTranslation()
  const device = useThisDevice()
  const signedIn = useSelector((state: State) => state.auth.authenticated)
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
        <>
          {!signedIn && (
            <Box paddingX={2}>
              <ThisDeviceSignIn />
            </Box>
          )}
          <ThisDeviceView device={device} signedIn={signedIn} />
        </>
      )}
    </Container>
  )
}

const SETTING_TITLES: { [name: string]: string } = {
  subnet: 'Access remote devices',
  exit_node: 'Exit node',
  printers: 'Show remote printers',
  services: 'Allow remote access to services',
  websocket: 'Relay',
  console: 'Console',
  any_port: 'Connections to any port',
  proxy: 'Proxy',
  mcp_exec: 'AI commands',
}
// The relay's three ways, in the menu's words (connectd's websocket values).
const relayChoices = (t: T): { value: string; title: string; line: string }[] => [
  {
    value: 'auto',
    title: t('thisDevice.relayAuto', 'Automatic'),
    line: t('thisDevice.relayAutoLine', 'Through remote.it’s relay only while this device’s UDP to remote.it fails'),
  },
  {
    value: 'on',
    title: t('thisDevice.relayOn', 'Always'),
    line: t('thisDevice.relayOnLine', 'Everything through remote.it’s relay: for a network known to block UDP'),
  },
  {
    value: 'off',
    title: t('thisDevice.relayOff', 'Never'),
    line: t(
      'thisDevice.relayOffLine',
      'Never through remote.it’s relay: on a network that blocks UDP, this device stays offline'
    ),
  },
]
// Settings served only while the services are: not served while they are off, whatever their own value says.
const UNDER_SERVICES = ['console', 'any_port']
// A switch's words keep clear of the switch at the row's end, at a phone's width too.
const SWITCH_TEXT = { paddingRight: '56px' }

/** Whether a setting's value is on: true, or {on: true}. */
const settingOn = (value: SettingValue | { on?: boolean }): boolean | undefined => {
  if (typeof value === 'boolean') return value
  if (value && typeof value === 'object' && typeof (value as any).on === 'boolean') return (value as any).on
  return undefined
}
/** The value that turns a setting the other way: a boolean flipped, or {on} flipped with the rest kept. */
const toggled = (value: any): any => (typeof value === 'boolean' ? !value : { ...value, on: !value.on })

// signedIn false: nothing of the account's (the device's page in remote.it) — the bridge's parts alone.
export const ThisDeviceView: React.FC<{ device: ThisDevice; signedIn?: boolean }> = ({ device, signedIn = true }) => {
  const { t } = useTranslation()
  const has = (c: Parameters<ThisDevice['has']>[0]) => device.has(c)
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
    if (device.has('logging')) device.call('logging.get', {}).then(setLogging, () => setLogging(undefined))
    if (device.has('app')) device.call('app.get', {}).then(setApp, fail)
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
  // 1.2.0: Access and Protect, the two switches, where the shell offers them; the 1.0 VPN and exit otherwise.
  const switches = has('access') || has('protect')
  const kind = device.info.deviceKind || t('thisDevice.kind', 'device')
  const access = status?.access
  const protect = status?.protect
  const protectOn = !!protect?.on
  const routeValue = protect?.route?.id ?? ''
  // 1.4.0: Allow remote access to services, every shell's ('services'); a 1.3.0 phone shell's 'lanServices' is the same.
  const servicesVia = has('services') ? 'services' : has('lanServices') ? 'lanServices' : undefined
  const lan = servicesVia === 'services' ? status?.services : status?.lanServices
  // A phone's services are hosts on the network it is on, which its Local Network permission reaches; a desktop's are
  // what is defined on it. The shell says which by offering the permission.
  const phoneServices = has('permissions')
  // The settings listed: the switches above in their place — Access is subnet, the services switch services.
  // lan_services is the setting's earlier name, never listed.
  // The printers are under Access, as in the menu's Settings: they are announced at the subnet's names.
  const printers = has('access') ? settings.find(s => s.name === 'printers') : undefined
  const servicesOff = !!servicesVia && !!lan && !lan.on
  const listed = settings.filter(
    s =>
      !(s.name === 'subnet' && has('access')) &&
      !(s.name === 'services' && servicesVia) &&
      s.name !== 'lan_services' &&
      s !== printers
  )
  const d = status?.device

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
              secondary={
                status.engine === 'online' && d?.since
                  ? t('thisDevice.onlineSince', 'Online since {{when}}', { when: when(d.since) })
                  : engineLine(status, t)
              }
              data-engine={status.engine}
            />
          </ListItem>
          {d?.owner && (
            <ListItem data-detail="owner">
              <ListItemText primary={t('thisDevice.owner', 'Owner')} secondary={d.owner} />
            </ListItem>
          )}
          {status.subnet?.on && (status.subnet.ipv4 || status.subnet.ipv6) && (
            <ListItem data-detail="address">
              <ListItemText
                primary={t('thisDevice.address', 'Address')}
                secondary={[status.subnet.ipv4, status.subnet.ipv6].filter(Boolean).join(' · ')}
                secondaryTypographyProps={{ sx: { userSelect: 'all' } }}
              />
            </ListItem>
          )}
          {d?.uid && (
            <ListItem data-detail="uid">
              <ListItemText
                primary={t('thisDevice.uid', 'UID')}
                secondary={d.uid}
                secondaryTypographyProps={{ sx: { userSelect: 'all' } }}
              />
            </ListItem>
          )}
          {(d?.package || d?.connectd) && (
            <ListItem data-detail="versions">
              <ListItemText
                primary={t('thisDevice.versions', 'Versions')}
                secondary={[
                  d.package && t('thisDevice.package', 'Package {{v}}', { v: d.package }),
                  d.connectd && `connectd ${d.connectd}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            </ListItem>
          )}
          {status.signedIn && (
            <ListItem>
              <ListItemText
                primary={t('thisDevice.signedIn', 'Signed in on this device')}
                secondary={status.signedIn.email || status.signedIn.sub}
              />
            </ListItem>
          )}
          {status.subnet && !has('access') && (
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
          {signedIn && status.device?.uid && (
            <ListItem>
              <Button size="small" href={`#/devices/${status.device.uid}`}>
                {t('thisDevice.devicePage', 'Its page in remote.it')}
              </Button>
            </ListItem>
          )}
          {has('remove') && d?.removal && (
            <ListItem>
              <Button
                size="small"
                color="error"
                disabled={busy}
                data-control="remove"
                onClick={() =>
                  act(async () => {
                    const r = await device.call('device.remove', {})
                    if (r.removed) setNotice(t('thisDevice.removed', 'Removed from this {{kind}}', { kind }))
                  })
                }
              >
                {d.removal === 'uninstall'
                  ? t('thisDevice.uninstall', 'Uninstall remote.it from this {{kind}}…', { kind })
                  : t('thisDevice.remove', 'Remove from this {{kind}}…', { kind })}
              </Button>
            </ListItem>
          )}
        </List>
      )}

      {has('access') && (
        <List data-section="access">
          <ListItem
            secondaryAction={
              <Switch
                edge="end"
                checked={!!access?.on}
                disabled={busy || !access || access.changing || access.locked}
                inputProps={{ 'aria-label': t('thisDevice.access', 'Access remote devices') }}
                data-control="access"
                onChange={() => act(async () => setStatus(await device.call('access.set', { on: !access?.on })))}
              />
            }
          >
            <ListItemText
              primary={t('thisDevice.access', 'Access remote devices')}
              secondary={accessLine(status, kind, t)}
              sx={SWITCH_TEXT}
              data-access={access?.on ? 'on' : 'off'}
            />
          </ListItem>
          {access?.locked && <Note id="access.locked" text={access.lockedWhy || lockedLine(t)} />}
          {rangeLines(status, t).map(line => (
            <Note key={line.key} id={`range.${line.key}`} text={line.text} title={line.title} warn />
          ))}
          {printers && (
            <SettingRow
              setting={printers}
              title={t('thisDevice.printers', 'Show remote printers on this {{kind}}', { kind })}
              disabled={busy}
              onSet={value =>
                act(async () => {
                  const next = await device.call('settings.set', { name: 'printers', value })
                  setSettings(all => all.map(x => (x.name === next.name ? next : x)))
                })
              }
            />
          )}
        </List>
      )}

      {has('protect') && (
        <List data-section="protect">
          <ListItem
            secondaryAction={
              <Switch
                edge="end"
                checked={protectOn}
                disabled={
                  busy ||
                  !protect ||
                  protect.changing ||
                  protect.locked ||
                  (!protectOn && !protect.route && exits.length !== 1)
                }
                inputProps={{ 'aria-label': t('thisDevice.protect', 'remote.it Protect') }}
                data-control="protect"
                onChange={() => act(async () => setStatus(await device.call('protect.set', { on: !protectOn })))}
              />
            }
          >
            <ListItemText
              primary={t('thisDevice.protect', 'remote.it Protect')}
              secondary={protectLine(status, kind, t)}
              sx={SWITCH_TEXT}
              data-protect={protectOn ? 'on' : 'off'}
            />
          </ListItem>
          {protect?.locked && <Note id="protect.locked" text={protect.lockedWhy || lockedLine(t)} />}
          {protect?.on && (protect.error || protect.changing) && (
            <ListItem>
              <ListItemText
                secondary={
                  protect.error || t('thisDevice.connecting', 'Connecting to {{name}}…', { name: protect.route?.name })
                }
                data-protect-state
              />
            </ListItem>
          )}
          <ListItem>
            <TextField
              select
              fullWidth
              size="small"
              label={t('thisDevice.route', 'Route through')}
              value={routeValue}
              disabled={busy || !protect || protect.locked}
              InputLabelProps={{ shrink: true }}
              SelectProps={{ displayEmpty: true }}
              inputProps={{ 'data-control': 'route' }}
              onChange={e =>
                e.target.value && act(async () => setStatus(await device.call('protect.route', { id: e.target.value })))
              }
            >
              {!routeValue && (
                <MenuItem value="" disabled>
                  {t('thisDevice.chooseRoute', 'Choose a device')}
                </MenuItem>
              )}
              {protect?.route && !exits.some(x => x.id === protect.route!.id) && (
                <MenuItem value={protect.route.id}>{exitLabel(protect.route)}</MenuItem>
              )}
              {exits.map(x => (
                <MenuItem key={x.id} value={x.id}>
                  {exitLabel(x)}
                </MenuItem>
              ))}
            </TextField>
          </ListItem>
        </List>
      )}

      {servicesVia && (
        <List data-section="services">
          <ListItem
            secondaryAction={
              <Switch
                edge="end"
                checked={!!lan?.on}
                disabled={busy || !lan || lan.changing || lan.locked}
                inputProps={{ 'aria-label': t('thisDevice.services', 'Allow remote access to services') }}
                data-control="services"
                onChange={() =>
                  act(async () => {
                    setStatus(await device.call(`${servicesVia}.set`, { on: !lan?.on }))
                    // Turning it on may have asked for the Local Network permission.
                    if (has('permissions')) setPermissions(await device.call('permissions.get', {}))
                  })
                }
              />
            }
          >
            <ListItemText
              primary={t('thisDevice.services', 'Allow remote access to services')}
              secondary={
                lan?.locked
                  ? `${servicesLine(kind, phoneServices, t)} ${lan.lockedWhy || lockedLine(t)}`
                  : servicesLine(kind, phoneServices, t)
              }
              sx={SWITCH_TEXT}
              data-services={lan?.on ? 'on' : 'off'}
            />
          </ListItem>
          {lan?.on &&
            servicesProblems(lan, kind, t).map(line => (
              <ListItem key={line.key} data-services-state={line.key}>
                <ListItemText secondary={line.text} secondaryTypographyProps={{ color: 'warning.main' }} />
              </ListItem>
            ))}
          {lan?.on && has('permissions') && ['notAsked', 'unknown'].includes(lan.localNetworkPermission ?? '') && (
            <ListItem>
              <Button
                size="small"
                disabled={busy}
                data-control="localNetwork"
                onClick={() =>
                  act(async () => {
                    const state = await device.call('permissions.request', { name: 'localNetwork' })
                    setPermissions(p => ({ ...p, localNetwork: state }))
                    setStatus(await device.call('status', {}))
                  })
                }
              >
                {t('thisDevice.allowLocalNetwork', 'Allow Local Network access')}
              </Button>
            </ListItem>
          )}
          {lan?.on &&
            status?.served?.map(s => (
              <ListItem key={s.service} data-served={s.service}>
                <ListItemText
                  primary={s.target}
                  secondary={[
                    t('thisDevice.servedConnections', 'Connections: {{n}}', { n: s.sessions }),
                    s.lastError &&
                      t('thisDevice.servedFailed', 'Last connection failed: {{error}}', { error: s.lastError }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
              </ListItem>
            ))}
          {lan?.on && status?.served?.length === 0 && (
            <ListItem>
              <ListItemText
                secondary={t(
                  'thisDevice.servedNone',
                  'No services on this {{kind}} yet: add them on its page in remote.it.',
                  { kind }
                )}
              />
            </ListItem>
          )}
        </List>
      )}

      {!switches && (has('vpn') || has('exit')) && (
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
                sx={SWITCH_TEXT}
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

      {has('settings') && listed.length > 0 && (
        <List data-section="settings">
          <Typography variant="subtitle1" paddingX={2}>
            {t('thisDevice.offers', 'What this device offers')}
          </Typography>
          {listed.map(s => (
            <SettingRow
              key={s.name}
              setting={s}
              relayUsing={s.name === 'websocket' ? status?.relay?.using : undefined}
              notServed={servicesOff && UNDER_SERVICES.includes(s.name)}
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

      {has('logging') && logging && (
        <List data-section="logging">
          <Typography variant="subtitle1" paddingX={2}>
            {t('thisDevice.diagnosticsTitle', 'Diagnostics')}
          </Typography>
          <ListItem
            secondaryAction={
              <Switch
                edge="end"
                checked={logging.detailed}
                disabled={busy}
                inputProps={{ 'aria-label': t('thisDevice.detailedLogging', 'Detailed connection logging') }}
                data-control="logging"
                onChange={() =>
                  act(async () => setLogging(await device.call('logging.set', { detailed: !logging.detailed })))
                }
              />
            }
          >
            <ListItemText
              primary={t('thisDevice.detailedLogging', 'Detailed connection logging')}
              secondary={
                logging.error ||
                t(
                  'thisDevice.detailedLoggingLine',
                  'A line a second for each connection in the log, until remote.it restarts.'
                )
              }
              sx={SWITCH_TEXT}
              data-logging={logging.detailed ? 'on' : 'off'}
            />
          </ListItem>
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

      {has('app') && app?.openAtLogin && (
        <List data-section="app">
          <Typography variant="subtitle1" paddingX={2}>
            {t('thisDevice.machine', 'This {{kind}}', { kind })}
          </Typography>
          <ListItem
            secondaryAction={
              <Switch
                edge="end"
                checked={app.openAtLogin.on}
                disabled={busy}
                inputProps={{ 'aria-label': t('thisDevice.openAtLogin', 'Open at login') }}
                data-control="openAtLogin"
                onChange={() =>
                  act(async () => setApp(await device.call('app.set', { openAtLogin: !app.openAtLogin?.on })))
                }
              />
            }
          >
            <ListItemText
              primary={t('thisDevice.openAtLogin', 'Open at login')}
              secondary={
                app.openAtLogin.error ||
                (app.openAtLogin.pending
                  ? t(
                      'thisDevice.openAtLoginPending',
                      'Waiting for you to allow it in System Settings → General → Login Items'
                    )
                  : t(
                      'thisDevice.openAtLoginLine',
                      'remote.it opens when you log in; quitting it leaves connections on.'
                    ))
              }
              sx={SWITCH_TEXT}
              data-open-at-login={app.openAtLogin.on ? 'on' : 'off'}
            />
          </ListItem>
        </List>
      )}
    </Box>
  )
}

// A line said under a switch or setting: why it is held, what is said of the subnet's range.
const Note: React.FC<{ id: string; text: string; title?: string; warn?: boolean }> = ({ id, text, title, warn }) => (
  <ListItem data-note={id}>
    <ListItemText
      secondary={text}
      title={title}
      secondaryTypographyProps={warn ? { color: 'warning.main' } : undefined}
    />
  </ListItem>
)

const lockedLine = (t: T) => t('thisDevice.locked', 'Set by this machine’s administrator')

// What is said of the subnet's range, as the menu's Settings says it: off for want of a free range, a range shared with
// another network, a move within the hour (the shell says only those).
const rangeLines = (s: DeviceStatus | undefined, t: T) => {
  const r = s?.subnet?.range
  const lines: { key: string; text: string; title?: string }[] = []
  if (!r) return lines
  if (r.noRange)
    lines.push({
      key: 'norange',
      text: t('thisDevice.noRange', 'Subnet off: no free address range on this machine'),
      title: r.noRange,
    })
  else if (r.warning)
    lines.push({
      key: 'warning',
      text: t('thisDevice.rangeShared', 'Address range shared with another network'),
      title: r.warning,
    })
  if (r.moved)
    lines.push({
      key: 'moved',
      text: t('thisDevice.rangeMoved', 'Moved to {{to}}: another network took {{from}} ({{when}})', {
        to: r.moved.to,
        from: r.moved.from,
        when: when(r.moved.at),
      }),
      title: r.moved.why,
    })
  return lines
}

// A time as the person reads it: today's by its clock, another day's with its date.
const when = (iso: string) => {
  const at = new Date(iso)
  if (isNaN(at.getTime())) return iso
  const today = new Date().toDateString() === at.toDateString()
  return today ? at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : at.toLocaleString()
}

const SettingRow: React.FC<{
  setting: DeviceSetting
  disabled: boolean
  onSet: (value: any) => void
  title?: string
  // websocket's: whether the relay carries the device's traffic now.
  relayUsing?: boolean
  // Not served while the services are off (console, any port), whatever its own value says.
  notServed?: boolean
}> = ({ setting, disabled, onSet, title: given, relayUsing, notServed }) => {
  const { t } = useTranslation()
  const title = given ?? SETTING_TITLES[setting.name] ?? setting.name
  const on = settingOn(setting.value)
  const locked = !!setting.locked
  const from =
    setting.source === 'cloud'
      ? t('thisDevice.fromCloud', 'Set in the portal')
      : setting.source === 'machine'
      ? t('thisDevice.fromMachine', 'Set on this device')
      : t('thisDevice.fromDefault', 'Default')
  const secondary = [
    locked ? setting.lockedWhy || lockedLine(t) : from,
    setting.overridden,
    on && notServed && t('thisDevice.notServed', 'Not served: remote access to services is off'),
  ]
    .filter(Boolean)
    .join(' · ')

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
          helperText={[
            relayChoices(t).find(c => c.value === setting.value)?.line,
            relayUsing && t('thisDevice.relayInUse', 'In use now'),
            secondary,
          ]
            .filter(Boolean)
            .join(' · ')}
          inputProps={{ 'data-relay-using': relayUsing ? 'yes' : 'no' }}
          onChange={e => onSet(e.target.value)}
        >
          {relayChoices(t).map(c => (
            <MenuItem key={c.value} value={c.value}>
              {c.title}
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

const exitLabel = (x: ExitRef) => (x.kind === 'remoteit' ? `${x.name} (remote.it)` : x.name)

type T = (k: string, d: string, v?: any) => string

// Access's line: what it does, and the name this machine is reached by while on.
const accessLine = (s: DeviceStatus | undefined, kind: string, t: T) => {
  if (!s?.access) return ''
  if (s.access.error) return s.access.error
  const what = t('thisDevice.accessLine', 'Reach your devices by name from this {{kind}}.', { kind })
  if (!s.access.on) return what
  const name = s.device?.dnsName || s.subnet?.domain
  return name ? `${what} ${t('thisDevice.reachedAs', 'This {{kind}} is {{name}}.', { kind, name })}` : what
}

// Protect's line, said plainly: everything through the exit, and what happens when it cannot be reached (the kill
// switch) — the same sentence on and off, so the switch says what it will do.
const protectLine = (s: DeviceStatus | undefined, kind: string, t: T) => {
  const p = s?.protect
  if (!p) return ''
  const exit = p.route?.name
  if (!exit)
    return t('thisDevice.protectChoose', 'Send all of this {{kind}}’s internet traffic through a device you choose.', {
      kind,
    })
  const through = t('thisDevice.protectThrough', 'All traffic from this {{kind}} goes through {{exit}}.', {
    kind,
    exit,
  })
  const stops =
    p.killSwitch === false
      ? t('thisDevice.protectFallsBack', 'If {{exit}} can’t be reached, traffic goes out the usual way meanwhile.', {
          exit,
        })
      : t('thisDevice.protectStops', 'If {{exit}} can’t be reached, traffic stops rather than going out unprotected.', {
          exit,
        })
  return `${through} ${stops}`
}

// The services switch's line: who can reach what, through this machine — a phone's services are hosts on the network
// it is on.
const servicesLine = (kind: string, phone: boolean, t: T) =>
  phone
    ? t(
        'thisDevice.servicesLinePhone',
        'People you share with can reach devices on the network this {{kind}} is on, through it.',
        { kind }
      )
    : t('thisDevice.servicesLine', 'People you share with can reach this {{kind}}’s services.', { kind })

// What keeps this machine's services from being reached while it is on, a line each, with how to fix it.
const servicesProblems = (lan: NonNullable<DeviceStatus['services']>, kind: string, t: T) => {
  const lines: { key: string; text: string }[] = []
  if (lan.error) lines.push({ key: 'error', text: lan.error })
  if (lan.localNetworkPermission === 'denied')
    lines.push({
      key: 'permission',
      text: t(
        'thisDevice.servicesPermission',
        'Needs Local Network access: turn on Local Network for remote.it in this {{kind}}’s Settings.',
        { kind }
      ),
    })
  if (lan.onLocalNetwork === false)
    lines.push({
      key: 'network',
      text: t(
        'thisDevice.servicesNoNetwork',
        'Not on a local network: this {{kind}} is on cellular or offline, so its services can’t be reached.',
        { kind }
      ),
    })
  return lines
}

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
