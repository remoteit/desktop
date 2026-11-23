import React, { useState } from 'react'
import {
  Box,
  Button,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { ExitRef, ThisDevice } from '../../services/thisDevice'
import { servingLine } from '../../helpers/exitServingHelper'
import { Icon } from '../Icon'
import { ThisDeviceModel } from './model'
import { CloudExits, ReadCloudExits, useCloudExits } from './cloudExits'
import {
  T,
  Card,
  CARD_SX,
  ICON_COLUMN,
  Note,
  RowIcon,
  SettingRow,
  accessLine,
  engineLine,
  exitLabel,
  lockedLine,
  rangeLines,
  routeState,
  servicesLine,
  servicesProblems,
  when,
} from './shared'

/* This device's home (pages/ThisDevicePage.tsx), top to bottom: the device's name and its state in a word or two; "Your
   devices", what this machine can reach (the page's, signed in) or the sign-in (signed out); the three controls, each
   one row whose state is in words — Access, Route through, Share this <machine>; and Settings, the way to Details and
   Advanced. */

export const ThisDeviceMain: React.FC<{
  device: ThisDevice
  m: ThisDeviceModel
  signedIn: boolean
  // The device's name, editable — the page's, signed in (it renames the device in the account); plain text without.
  nameEditor?: React.ReactNode
  // The account's public-exit transfer, under Route through — the page's, signed in. shown: the exit chosen is one of
  // Remote.It's, the only ones charged. Called whether shown or not, so what it renders keeps what it read.
  renderExitUsage?: (shown: boolean) => React.ReactNode
  // What the account knows of the engine's exits — each one's devices counted, the device of the exit in use — the
  // page's, signed in (components/thisDevice/cloudExits). The engine's list alone without it.
  readExits?: ReadCloudExits
  // "Your devices": the page's — the devices this machine reaches signed in, the sign-in signed out.
  devices?: React.ReactNode
}> = ({ device, m, nameEditor, renderExitUsage, readExits, devices }) => {
  const { t, has, status, kind } = m
  const route = has('protect') || has('exit') || has('vpn')
  const controls = has('access') || route || !!m.servicesVia

  return (
    <>
      {has('status') && status && <DeviceHeader device={device} m={m} nameEditor={nameEditor} />}

      {devices && (
        <Section id="devices" title={t('thisDevice.yourDevices', 'Your devices')}>
          <Box sx={CARD_SX}>{devices}</Box>
        </Section>
      )}

      {controls && (
        <Section id="controls" title={t('thisDevice.onThis', 'On this {{kind}}', { kind })}>
          <Card section="controls">
            {has('access') && <AccessRow device={device} m={m} />}
            {route && <RouteRow device={device} m={m} renderExitUsage={renderExitUsage} readExits={readExits} />}
            {m.servicesVia && <ShareRow device={device} m={m} />}
          </Card>
        </Section>
      )}

      {has('status') && status && (
        <Card section="more">
          <LinkRow
            link="settings"
            href="#/this-device/settings"
            icon="sliders-h"
            primary={t('thisDevice.settings', 'Settings')}
            secondary={t('thisDevice.settingsLine', 'Details, relay, permissions and diagnostics')}
          />
        </Card>
      )}
    </>
  )
}

// A part of the page under its heading.
const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <Box component="section" data-block={id} marginBottom={3}>
    <Typography
      variant="body1"
      component="h2"
      sx={{ marginX: { xs: 2, sm: 3 }, marginBottom: 1, fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}
    >
      {title}
    </Typography>
    {children}
  </Box>
)

// The status dot's color: green while it runs, amber while it starts, red when it can't reach Remote.It.
const ENGINE_COLOR: { [engine: string]: string } = {
  online: 'success',
  starting: 'warning',
  offline: 'danger',
  signedOut: 'warning',
  stopped: 'grayLight',
}

const DeviceHeader: React.FC<{ device: ThisDevice; m: ThisDeviceModel; nameEditor?: React.ReactNode }> = ({
  device,
  m,
  nameEditor,
}) => {
  const { t, status, kind } = m
  if (!status) return null
  const d = status.device
  const word = m.off ? t('thisDevice.offTitle', 'Off') : engineLine(status, t)
  const line =
    status.engine === 'online' && d?.since
      ? t('thisDevice.since', 'Since {{when}}', { when: when(d.since) })
      : m.off
      ? t('thisDevice.offLine', 'Turn on Access, Route through or Share to start Remote.It.')
      : m.stopped
      ? t('thisDevice.stoppedLine', 'No one can reach this {{kind}}, and Access and Route through are off.', { kind })
      : undefined
  return (
    <Box component="section" data-section="device" marginBottom={3}>
      {nameEditor ?? (
        <Box display="flex" alignItems="center" gap={1.5} paddingX={{ xs: 1, sm: 2 }} paddingTop={1}>
          {/* A phone by its permissions, as the services' line says. */}
          <Icon name={m.phoneServices ? 'mobile' : 'laptop'} size="lg" color="grayDarker" fixedWidth />
          <Typography variant="h2" component="p" data-name sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            {d?.name || t('thisDevice.unnamed', 'This device')}
          </Typography>
        </Box>
      )}
      <Box
        display="flex"
        alignItems="center"
        flexWrap="wrap"
        columnGap={1}
        paddingX={{ xs: 1, sm: 2 }}
        paddingTop={1}
        sx={{ paddingLeft: { xs: `calc(${ICON_COLUMN.xs} - 8px)`, sm: `calc(${ICON_COLUMN.sm} - 12px)` } }}
        data-engine={status.engine}
      >
        <Icon name="circle" type="solid" size="xxs" color={m.off ? 'grayLight' : ENGINE_COLOR[status.engine] ?? 'grayLight'} />
        <Typography variant="body2" fontWeight={500} data-state>
          {word}
        </Typography>
        {line && (
          <Typography variant="caption" color="textSecondary">
            {line}
          </Typography>
        )}
      </Box>
      {m.stopped && (
        <Box paddingX={{ xs: 1, sm: 2 }} paddingTop={1.5}>
          <Button
            size="small"
            variant="contained"
            disabled={m.busy}
            data-control="start"
            onClick={() => m.act(async () => m.setStatus(await device.call('device.start', {})))}
          >
            {t('thisDevice.start', 'Start Remote.It')}
          </Button>
        </Box>
      )}
    </Box>
  )
}

// A row that goes to another page, said so by the chevron at its end.
export const LinkRow: React.FC<{ link: string; href: string; primary: string; secondary: string; icon?: string }> = ({
  link,
  href,
  primary,
  secondary,
  icon,
}) => (
  <ListItemButton component="a" href={href} data-link={link}>
    {icon && <RowIcon name={icon} />}
    <ListItemText primary={primary} secondary={secondary} primaryTypographyProps={{ fontWeight: 500 }} />
    <Icon name="chevron-right" size="md" color="grayDark" />
  </ListItemButton>
)

/* One control: its icon, its name and a line of what it does now, and its state in words beside the switch or picker
   at the row's end — under the words at a phone's width for a picker, which needs the room. What follows it (notes,
   options) lines up with its name. */
const ControlRow: React.FC<{
  id: string
  icon: string
  on: boolean
  title: string
  line?: React.ReactNode
  warn?: boolean
  control: React.ReactNode
  wide?: boolean
  state?: string
  children?: React.ReactNode
}> = ({ id, icon, on, title, line, warn, control, wide, state, children }) => (
  <Box component="li" data-section={id} sx={{ '& + li': { borderTop: 1, borderColor: 'grayLighter.main' } }}>
    <Box
      display="flex"
      alignItems="center"
      flexWrap={wide ? { xs: 'wrap', sm: 'nowrap' } : 'nowrap'}
      columnGap={1}
      paddingY={1.5}
      paddingLeft={2}
      paddingRight={2}
    >
      <RowIcon name={icon} on={on} />
      <Box flex={1} minWidth={0}>
        <Typography variant="body1" fontWeight={500}>
          {title}
        </Typography>
        {line && (
          <Typography
            variant="body2"
            color={warn ? 'warning.main' : 'textSecondary'}
            data-line={id}
            sx={{ overflowWrap: 'anywhere' }}
          >
            {line}
          </Typography>
        )}
      </Box>
      <Box
        display="flex"
        alignItems="center"
        gap={0.5}
        flexShrink={0}
        sx={
          wide
            ? {
                flexBasis: { xs: '100%', sm: 260 },
                paddingLeft: { xs: `calc(${ICON_COLUMN.xs} + 8px)`, sm: 0 },
                paddingTop: { xs: 1, sm: 0 },
              }
            : undefined
        }
      >
        {state && (
          <Typography variant="body2" color={on ? 'primary' : 'textSecondary'} fontWeight={500} data-state={id}>
            {state}
          </Typography>
        )}
        {control}
      </Box>
    </Box>
    {children && (
      <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0, marginTop: -1, paddingBottom: 1, paddingLeft: { xs: ICON_COLUMN.xs, sm: ICON_COLUMN.sm } }}>
        {children}
      </Box>
    )}
  </Box>
)

const onOff = (on: boolean, t: T) => (on ? t('thisDevice.on', 'On') : t('thisDevice.off', 'Off'))

const AccessRow: React.FC<{ device: ThisDevice; m: ThisDeviceModel }> = ({ device, m }) => {
  const { t, status, kind } = m
  const access = status?.access
  const on = !!access?.on
  return (
    <ControlRow
      id="access"
      icon="chart-network"
      on={on}
      title={t('thisDevice.access', 'Access')}
      line={<span data-access={on ? 'on' : 'off'}>{accessLine(status, kind, t)}</span>}
      state={onOff(on, t)}
      control={
        <Switch
          edge="end"
          checked={on}
          disabled={m.held || !access || access.changing || access.locked}
          inputProps={{ 'aria-label': t('thisDevice.access', 'Access') }}
          data-control="access"
          onChange={() => m.act(async () => m.setStatus(await device.call('access.set', { on: !on })))}
        />
      }
    >
      {access?.locked && <Note id="access.locked" text={access.lockedWhy || lockedLine(t)} />}
      {rangeLines(status, t).map(line => (
        <Note key={line.key} id={`range.${line.key}`} text={line.text} title={line.title} warn />
      ))}
      {/* An option of Access's: the printers are announced at the subnet's names, so there is nothing to show while it is off. */}
      {m.printers && on && (
        <SettingRow
          setting={m.printers}
          title={t('thisDevice.printers', 'Show remote printers on this {{kind}}', { kind })}
          disabled={m.busy}
          onSet={value => m.setSetting('printers', value)}
        />
      )}
    </ControlRow>
  )
}

/* Route through, one control: Off, or one of the exits. Choosing an exit routes all of this machine's traffic through
   it, Off stops — one call, exit.set, which every shell offers (the menu's, a phone's); a shell with Protect alone does
   it as protect.route then protect.set. A refusal is said under the control, which then shows the machine's state as
   the shell reads it again. Who may not choose the exit here (1.10.0's chooseRefusal) may still choose Off. The exit
   names no device: Remote.It picks which of its devices carries each new connection, so each exit is listed with its
   devices counted, and the device in use is said, where the account says (readExits). */
const RouteRow: React.FC<{
  device: ThisDevice
  m: ThisDeviceModel
  renderExitUsage?: (shown: boolean) => React.ReactNode
  readExits?: ReadCloudExits
}> = ({ device, m, renderExitUsage, readExits }) => {
  const { t, has, status, kind, exits } = m
  const [refusal, setRefusal] = useState<string>()
  const [choosing, setChoosing] = useState(false)
  const state = routeState(status, kind, t, exits.length)
  const protect = status?.protect
  const locked = !!protect?.locked
  const mayChoose = !protect?.chooseRefusal
  const on = state.value !== ''
  const cloud = useCloudExits(readExits, status?.device?.uid, `${state.value}|${on}`)
  const through = on ? throughOf(cloud, state.value) : null
  const listed = state.exit && !exits.some(x => x.id === state.exit!.id) ? [state.exit, ...exits] : exits
  const picker = has('exit') || has('protect')

  const choose = async (id: string) => {
    if (id === state.value || choosing) return
    setChoosing(true)
    setRefusal(undefined)
    try {
      if (has('exit')) m.setStatus(await device.call('exit.set', { id: id || null }))
      else if (id) {
        await device.call('protect.route', { id })
        m.setStatus(await device.call('protect.set', { on: true }))
      } else m.setStatus(await device.call('protect.set', { on: false }))
    } catch (e: any) {
      if (e?.code !== 'cancelled') setRefusal(e?.message || String(e))
      if (has('status')) await device.call('status', {}).then(m.setStatus, () => {})
    } finally {
      setChoosing(false)
    }
  }

  const control = picker ? (
    <TextField
      variant="filled"
      hiddenLabel
      select
      fullWidth
      value={state.value}
      disabled={m.held || choosing || !status || locked || (!on && (!mayChoose || listed.length === 0))}
      SelectProps={{
        displayEmpty: true,
        renderValue: value => {
          const x = listed.find(each => each.id === value)
          return x ? exitLabel(x) : t('thisDevice.off', 'Off')
        },
      }}
      inputProps={{ 'aria-label': t('thisDevice.route', 'Route through'), 'data-control': 'route' }}
      onChange={e => choose(e.target.value)}
    >
      <MenuItem value="" data-exit="">
        <ListItemText primary={t('thisDevice.off', 'Off')} />
      </MenuItem>
      {listed.map(x => exitItem(x, cloud, t, !mayChoose))}
    </TextField>
  ) : (
    <Switch
      edge="end"
      checked={on || !!status?.vpn.on}
      disabled={m.held || choosing || status?.vpn.changing}
      inputProps={{ 'aria-label': t('thisDevice.route', 'Route through') }}
      data-control="vpn"
      onChange={() => m.act(async () => m.setStatus(await device.call('vpn.set', { on: !status?.vpn.on })))}
    />
  )

  return (
    <ControlRow
      id="route"
      icon="route"
      on={on && state.key === 'up'}
      title={t('thisDevice.route', 'Route through')}
      line={<span data-route={state.key}>{state.line}</span>}
      warn={state.warn}
      wide={picker}
      state={picker ? undefined : onOff(!!status?.vpn.on, t)}
      control={control}
    >
      {refusal && (
        <ListItem data-note="route.refused">
          <ListItemText
            secondary={t('thisDevice.routeRefused', 'Couldn’t change Route through. {{why}}', { why: refusal })}
            secondaryTypographyProps={{ color: 'error' }}
          />
        </ListItem>
      )}
      {locked && <Note id="route.locked" text={protect?.lockedWhy || lockedLine(t)} />}
      {protect?.chooseRefusal && <Note id="route.choose" text={protect.chooseRefusal} />}
      {through && <Note id="route.through" text={throughText(t, through)} />}
      {renderExitUsage && (
        <Box component="li" marginX={2} sx={{ '&:empty': { display: 'none' } }}>
          {renderExitUsage(on && state.exit?.kind === 'remoteit')}
        </Box>
      )}
    </ControlRow>
  )
}

const ShareRow: React.FC<{ device: ThisDevice; m: ThisDeviceModel }> = ({ device, m }) => {
  const { t, has, status, kind, lan, servicesVia } = m
  const served = status?.served
  const on = !!lan?.on
  return (
    <ControlRow
      id="services"
      icon="server"
      on={on}
      title={t('thisDevice.share', 'Share this {{kind}}', { kind })}
      line={<span data-services={on ? 'on' : 'off'}>{servicesLine(kind, m.phoneServices, t)}</span>}
      state={onOff(on, t)}
      control={
        <Switch
          edge="end"
          checked={on}
          disabled={m.held || !lan || lan.changing || lan.locked}
          inputProps={{ 'aria-label': t('thisDevice.share', 'Share this {{kind}}', { kind }) }}
          data-control="services"
          onChange={() =>
            m.act(async () => {
              m.setStatus(await device.call(`${servicesVia!}.set`, { on: !on }))
              // Turning it on may have asked for the Local Network permission.
              if (has('permissions')) m.setPermissions(await device.call('permissions.get', {}))
            })
          }
        />
      }
    >
      {lan?.locked && <Note id="services.locked" text={lan.lockedWhy || lockedLine(t)} />}
      {on &&
        servicesProblems(lan!, kind, t).map(line => (
          <ListItem key={line.key} data-services-state={line.key}>
            <ListItemText secondary={line.text} secondaryTypographyProps={{ color: 'warning.main' }} />
          </ListItem>
        ))}
      {on && has('permissions') && ['notAsked', 'unknown'].includes(lan!.localNetworkPermission ?? '') && (
        <ListItem>
          <Button
            size="small"
            disabled={m.busy}
            data-control="localNetwork"
            onClick={() =>
              m.act(async () => {
                const state = await device.call('permissions.request', { name: 'localNetwork' })
                m.setPermissions(p => ({ ...p, localNetwork: state }))
                m.setStatus(await device.call('status', {}))
              })
            }
          >
            {t('thisDevice.allowLocalNetwork', 'Allow Local Network access')}
          </Button>
        </ListItem>
      )}
      {/* What it serves, counted here and listed in Details. */}
      {on && served && served.length > 0 && (
        <ListItemButton component="a" href="#/this-device/details" data-served-summary>
          <ListItemText
            secondary={t('thisDevice.servedSummary', '{{services}} · {{connections}}. See them in Details.', {
              services: servicesCount(served.length, t),
              connections: connectionsCount(served.reduce((n, s) => n + (s.sessions || 0), 0), t),
            })}
          />
        </ListItemButton>
      )}
      {on && served?.length === 0 && (
        <ListItem>
          <ListItemText
            secondary={t('thisDevice.servedNone', 'Nothing shared yet. Add services on this {{kind}}’s device page.', {
              kind,
            })}
          />
        </ListItem>
      )}
    </ControlRow>
  )
}

const servicesCount = (n: number, t: T) =>
  n === 1 ? t('thisDevice.servicesOne', '1 service') : t('thisDevice.servicesCount', '{{n}} services', { n })

const connectionsCount = (n: number, t: T) =>
  n === 1 ? t('thisDevice.connectionsOne', '1 connection') : t('thisDevice.connectionsCount', '{{n}} connections', { n })

// An exit in the picker: its name, and under it its devices counted where the account says. Not chosen by one who may
// not choose the exit here.
const exitItem = (x: ExitRef, cloud: CloudExits | null, t: T, disabled: boolean) => {
  const counted = servingLine(t, cloud?.serving.get(x.id))
  return (
    <MenuItem key={x.id} value={x.id} data-exit={x.id} disabled={disabled}>
      <ListItemText primary={exitLabel(x)} secondary={counted} data-serving={counted ?? undefined} />
    </MenuItem>
  )
}

// The device of the machine's exit its traffic goes through now, where the account says so of the exit chosen here.
const throughOf = (cloud: CloudExits | null, exitId: string) =>
  exitId && cloud?.inUse?.id === exitId && cloud.inUse.through ? cloud.inUse : null

const throughText = (t: T, inUse: NonNullable<CloudExits['inUse']>) => {
  const now = t('thisDevice.throughNow', 'Going out through {{device}} now', { device: inUse.through!.name })
  const counted = servingLine(t, inUse.serving)
  return counted ? `${now} · ${t('thisDevice.throughOf', 'one of {{counted}}', { counted })}` : now
}
