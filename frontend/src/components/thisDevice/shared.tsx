import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, ListItem, ListItemIcon, ListItemText, MenuItem, Switch, TextField } from '@mui/material'
import { Icon } from '../Icon'
import { DeviceSetting, DeviceStatus, ExitRef, SettingValue } from '../../services/thisDevice'

// What This device's parts share (pages/ThisDevicePage.tsx): the rows, the notes, and the words for each state.

export type T = (k: string, d: string, v?: any) => string

export const SETTING_TITLES: { [name: string]: string } = {
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
export const relayChoices = (t: T): { value: string; title: string; line: string }[] => [
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
export const UNDER_SERVICES = ['console', 'any_port']
// A switch's words keep clear of the switch at the row's end, at a phone's width too.
export const SWITCH_TEXT = { paddingRight: '72px' }

/** Whether a setting's value is on: true, or {on: true}. */
export const settingOn = (value: SettingValue | { on?: boolean }): boolean | undefined => {
  if (typeof value === 'boolean') return value
  if (value && typeof value === 'object' && typeof (value as any).on === 'boolean') return (value as any).on
  return undefined
}
/** The value that turns a setting the other way: a boolean flipped, or {on} flipped with the rest kept. */
export const toggled = (value: any): any => (typeof value === 'boolean' ? !value : { ...value, on: !value.on })

// A line said under a switch or setting: why it is held, what is said of the subnet's range.
export const Note: React.FC<{ id: string; text: string; title?: string; warn?: boolean }> = ({
  id,
  text,
  title,
  warn,
}) => (
  <ListItem data-note={id}>
    <ListItemText
      secondary={text}
      title={title}
      secondaryTypographyProps={warn ? { color: 'warning.main' } : undefined}
    />
  </ListItem>
)

// The icon column's width: narrower at a phone's width, so the words keep their room.
const ICON_COLUMN = { xs: '40px', sm: '56px' }
export const ICON_COLUMN_SX = { minWidth: { xs: ICON_COLUMN.xs, sm: ICON_COLUMN.sm } }

// A part of the main page set apart, so each of its switches reads as its own thing: a rounded box, the same on or off
// (its icon says which; Evan, 2026-10-25).
// inset: what follows the first row (notes, options, the route) lines up with its title, past the icon.
export const Card: React.FC<{ section: string; inset?: boolean; children: React.ReactNode }> = ({
  section,
  inset,
  children,
}) => (
  <Box
    component="ul"
    data-section={section}
    sx={{
      listStyle: 'none',
      padding: 0,
      marginX: { xs: 1, sm: 2 },
      marginTop: 0,
      marginBottom: 2,
      border: 1,
      borderColor: 'grayLighter.main',
      borderRadius: 2,
      overflow: 'hidden',
      ...(inset && { '& > li + li': { paddingLeft: { xs: ICON_COLUMN.xs, sm: ICON_COLUMN.sm } } }),
    }}
  >
    {children}
  </Box>
)

// A card's icon, in the row's first column: the primary color while on.
export const RowIcon: React.FC<{ name: string; on?: boolean }> = ({ name, on }) => (
  <ListItemIcon sx={ICON_COLUMN_SX}>
    <Icon name={name} size="md" color={on ? 'primary' : 'grayDark'} type={on ? 'solid' : 'regular'} fixedWidth />
  </ListItemIcon>
)

export const lockedLine = (t: T) => t('thisDevice.locked', 'Set by this machine’s administrator')

// What is said of the subnet's range, as the menu's Settings says it: off for want of a free range, a range shared with
// another network, a move within the hour (the shell says only those).
export const rangeLines = (s: DeviceStatus | undefined, t: T) => {
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
export const when = (iso: string) => {
  const at = new Date(iso)
  if (isNaN(at.getTime())) return iso
  const today = new Date().toDateString() === at.toDateString()
  return today ? at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : at.toLocaleString()
}

export const SettingRow: React.FC<{
  setting: DeviceSetting
  disabled: boolean
  onSet: (value: any) => void
  title?: string
  // websocket's: whether the relay carries the device's traffic now.
  relayUsing?: boolean
  // Not served while the services are off (console, any port), whatever its own value says.
  notServed?: boolean
  // An option of the switch above it (the printers, Access's): set in under it.
  indent?: boolean
}> = ({ setting, disabled, onSet, title: given, relayUsing, notServed, indent }) => {
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
        sx={indent ? { paddingLeft: 4 } : undefined}
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
        <ListItemText primary={title} secondary={secondary} sx={SWITCH_TEXT} />
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

export const engineLine = (s: DeviceStatus, t: T) =>
  ({
    starting: t('thisDevice.starting', 'Starting'),
    online: t('thisDevice.online', 'Online'),
    offline: t('thisDevice.offline', 'Offline'),
    signedOut: t('thisDevice.signedOut', 'Not signed in'),
    stopped: t('thisDevice.stopped', 'Not running'),
  }[s.engine] ?? s.engine)

export const exitLabel = (x: ExitRef) => (x.kind === 'remoteit' ? `${x.name} (remote.it)` : x.name)

// Access's line: what it does, and the name this machine is reached by while on.
export const accessLine = (s: DeviceStatus | undefined, kind: string, t: T) => {
  if (!s?.access) return ''
  if (s.access.error) return s.access.error
  const what = t('thisDevice.accessLine', 'Reach your devices by name from this {{kind}}.', { kind })
  if (!s.access.on) return what
  const name = s.device?.dnsName || s.subnet?.domain
  return name ? `${what} ${t('thisDevice.reachedAs', 'This {{kind}} is {{name}}.', { kind, name })}` : what
}

// Protect's line, said plainly: everything through the exit, and what happens when it cannot be reached (the kill
// switch) — the same sentence on and off, so the switch says what it will do.
export const protectLine = (s: DeviceStatus | undefined, kind: string, t: T) => {
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
export const servicesLine = (kind: string, phone: boolean, t: T) =>
  phone
    ? t(
        'thisDevice.servicesLinePhone',
        'People you share with can reach devices on the network this {{kind}} is on, through it.',
        { kind }
      )
    : t('thisDevice.servicesLine', 'People you share with can reach this {{kind}}’s services.', { kind })

// What keeps this machine's services from being reached while it is on, a line each, with how to fix it.
export const servicesProblems = (lan: NonNullable<DeviceStatus['services']>, kind: string, t: T) => {
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

export const vpnLine = (s: DeviceStatus | undefined, t: T) => {
  if (!s) return ''
  if (s.vpn.error) return s.vpn.error
  if (!s.vpn.on) return t('thisDevice.vpnOff', 'Off — traffic goes out the usual way')
  if (!s.exit) return t('thisDevice.vpnOn', 'On')
  if (s.exit.error) return s.exit.error
  if (s.exit.state === 'connecting') return t('thisDevice.connecting', 'Connecting to {{name}}…', { name: s.exit.name })
  if (s.exit.state === 'down') return t('thisDevice.exitDown', 'Exit unreachable — traffic blocked')
  return t('thisDevice.through', 'Connected through {{name}}', { name: s.exit.name })
}
