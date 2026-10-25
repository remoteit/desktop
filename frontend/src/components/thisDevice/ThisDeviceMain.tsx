import React from 'react'
import { Button, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, MenuItem, Switch, TextField } from '@mui/material'
import { ThisDevice } from '../../services/thisDevice'
import { Icon } from '../Icon'
import { ThisDeviceModel } from './model'
import {
  T,
  Card,
  ICON_COLUMN_SX,
  Note,
  RowIcon,
  SettingRow,
  SWITCH_TEXT,
  accessLine,
  engineLine,
  exitLabel,
  lockedLine,
  protectLine,
  rangeLines,
  servicesLine,
  servicesProblems,
  vpnLine,
  when,
} from './shared'

/* This device's page itself (pages/ThisDevicePage.tsx): what is used most, at once — the device's name and whether
   remote.it runs here, the three switches (Access remote devices, remote.it Protect, Allow remote access to services;
   a 1.0 shell's VPN and exit in their place), and the way to Details and Advanced. */

export const ThisDeviceMain: React.FC<{
  device: ThisDevice
  m: ThisDeviceModel
  signedIn: boolean
  // The device's name, editable — the page's, signed in (it renames the device in the account); plain text without.
  nameEditor?: React.ReactNode
}> = ({ device, m, signedIn, nameEditor }) => {
  const { t, has, status, kind } = m
  const d = status?.device
  const advanced =
    (has('settings') && m.listed.length > 0) ||
    has('permissions') ||
    (has('logging') && !!m.logging) ||
    has('diagnostics') ||
    (has('app') && !!m.app?.openAtLogin) ||
    (has('remove') && !!d?.removal)

  return (
    <>
      {has('status') && status && (
        <List data-section="device">
          {nameEditor ?? (
            <ListItem>
              {/* The machine's kind in the first column, where the name's editor keeps its icon signed in: a phone by its permissions, as the services' line says. */}
              <RowIcon name={m.phoneServices ? 'mobile' : 'laptop'} />
              <ListItemText
                primary={d?.name || t('thisDevice.unnamed', 'This device')}
                primaryTypographyProps={{ variant: 'h2' }}
                data-name
              />
            </ListItem>
          )}
          <ListItem>
            <ListItemIcon sx={ICON_COLUMN_SX}>
              <Icon name="circle" type="solid" size="xs" color={m.off ? 'grayLight' : ENGINE_COLOR[status.engine] ?? 'grayLight'} />
            </ListItemIcon>
            <ListItemText
              primary={m.off ? t('thisDevice.offTitle', 'Off') : engineLine(status, t)}
              primaryTypographyProps={{ fontWeight: 500 }}
              secondary={
                status.engine === 'online' && d?.since
                  ? t('thisDevice.since', 'Since {{when}}', { when: when(d.since) })
                  : m.off
                  ? t('thisDevice.offLine', 'Turn on Access, Protect or remote access to services to start it')
                  : m.stopped
                  ? t(
                      'thisDevice.stoppedLine',
                      'This {{kind}} is offline — no one can reach its services, and Protect and Access are off',
                      { kind }
                    )
                  : undefined
              }
              data-engine={status.engine}
            />
          </ListItem>
          {m.stopped && (
            <ListItem>
              <Button
                size="small"
                variant="contained"
                disabled={m.busy}
                data-control="start"
                onClick={() => m.act(async () => m.setStatus(await device.call('device.start', {})))}
              >
                {t('thisDevice.start', 'Start remote.it')}
              </Button>
            </ListItem>
          )}
        </List>
      )}

      {has('access') && <AccessPart device={device} m={m} />}
      {has('protect') && <ProtectPart device={device} m={m} />}
      {m.servicesVia && <ServicesPart device={device} m={m} />}
      {!m.switches && (has('vpn') || has('exit')) && <VpnPart device={device} m={m} />}

      {has('status') && status && (
        <Card section="more">
          <LinkRow
            link="details"
            href="#/this-device/details"
            primary={t('thisDevice.details', 'Details')}
            secondary={t('thisDevice.detailsLine', 'Its address, UID, versions and services')}
          />
          {advanced && <Divider component="li" />}
          {advanced && (
            <LinkRow
              link="advanced"
              href="#/this-device/advanced"
              primary={t('thisDevice.advanced', 'Advanced')}
              secondary={t('thisDevice.advancedLine', 'Features, relay, permissions and diagnostics')}
            />
          )}
          {signedIn && d?.uid && <Divider component="li" />}
          {signedIn && d?.uid && (
            <LinkRow
              link="device-page"
              href={`#/devices/${d.uid}`}
              primary={t('thisDevice.devicePage', 'Its page in remote.it')}
              secondary={t('thisDevice.devicePageLine', 'Its services, sharing and logs')}
            />
          )}
        </Card>
      )}
    </>
  )
}

// The status dot's color: green while it runs, amber while it starts, red when it can't reach remote.it.
const ENGINE_COLOR: { [engine: string]: string } = {
  online: 'success',
  starting: 'warning',
  offline: 'danger',
  signedOut: 'warning',
  stopped: 'grayLight',
}

const servicesCount = (n: number, t: T) =>
  n === 1 ? t('thisDevice.servicesOne', '1 service') : t('thisDevice.servicesCount', '{{n}} services', { n })

const connectionsCount = (n: number, t: T) =>
  n === 1 ? t('thisDevice.connectionsOne', '1 connection') : t('thisDevice.connectionsCount', '{{n}} connections', { n })

// A row that goes to another page, said so by the chevron at its end.
const LinkRow: React.FC<{ link: string; href: string; primary: string; secondary: string }> = ({
  link,
  href,
  primary,
  secondary,
}) => (
  <ListItemButton component="a" href={href} data-link={link}>
    <ListItemText primary={primary} secondary={secondary} primaryTypographyProps={{ fontWeight: 500 }} />
    <Icon name="chevron-right" size="md" color="grayDark" />
  </ListItemButton>
)

// A card's title: a little heavier than the lines under it.
const TITLE = { fontWeight: 500, fontSize: '1.05rem' }

const AccessPart: React.FC<{ device: ThisDevice; m: ThisDeviceModel }> = ({ device, m }) => {
  const { t, status, kind } = m
  const access = status?.access
  return (
    <Card inset section="access">
      <ListItem
        secondaryAction={
          <Switch
            edge="end"
            checked={!!access?.on}
            disabled={m.held || !access || access.changing || access.locked}
            inputProps={{ 'aria-label': t('thisDevice.access', 'Access remote devices') }}
            data-control="access"
            onChange={() => m.act(async () => m.setStatus(await device.call('access.set', { on: !access?.on })))}
          />
        }
      >
        <RowIcon name="chart-network" on={!!access?.on} />
        <ListItemText
          primary={t('thisDevice.access', 'Access remote devices')}
          primaryTypographyProps={TITLE}
          secondary={accessLine(status, kind, t)}
          sx={SWITCH_TEXT}
          data-access={access?.on ? 'on' : 'off'}
        />
      </ListItem>
      {access?.locked && <Note id="access.locked" text={access.lockedWhy || lockedLine(t)} />}
      {rangeLines(status, t).map(line => (
        <Note key={line.key} id={`range.${line.key}`} text={line.text} title={line.title} warn />
      ))}
      {/* An option of Access's: the printers are announced at the subnet's names, so there is nothing to show while it is off. */}
      {m.printers && access?.on && (
        <SettingRow
          setting={m.printers}
          title={t('thisDevice.printers', 'Show remote printers on this {{kind}}', { kind })}
          indent
          disabled={m.busy}
          onSet={value => m.setSetting('printers', value)}
        />
      )}
    </Card>
  )
}

const ProtectPart: React.FC<{ device: ThisDevice; m: ThisDeviceModel }> = ({ device, m }) => {
  const { t, status, kind, exits } = m
  const protect = status?.protect
  const protectOn = !!protect?.on
  const routeValue = protect?.route?.id ?? ''
  return (
    <Card inset section="protect">
      <ListItem
        secondaryAction={
          <Switch
            edge="end"
            checked={protectOn}
            disabled={
              m.held || !protect || protect.changing || protect.locked || (!protectOn && !protect.route && exits.length !== 1)
            }
            inputProps={{ 'aria-label': t('thisDevice.protect', 'remote.it Protect') }}
            data-control="protect"
            onChange={() => m.act(async () => m.setStatus(await device.call('protect.set', { on: !protectOn })))}
          />
        }
      >
        <RowIcon name="shield" on={protectOn} />
        <ListItemText
          primary={t('thisDevice.protect', 'remote.it Protect')}
          primaryTypographyProps={TITLE}
          secondary={protectLine(status, kind, t)}
          sx={SWITCH_TEXT}
          data-protect={protectOn ? 'on' : 'off'}
        />
      </ListItem>
      {protect?.locked && <Note id="protect.locked" text={protect.lockedWhy || lockedLine(t)} />}
      {protect?.on && (protect.error || protect.changing) && (
        <ListItem>
          <ListItemText
            secondary={protect.error || t('thisDevice.connecting', 'Connecting to {{name}}…', { name: protect.route?.name })}
            data-protect-state
          />
        </ListItem>
      )}
      {/* The device it goes through, always shown, on or off (Evan, 2026-10-25). */}
      <ListItem>
          <TextField
            select
            fullWidth
            size="small"
            label={t('thisDevice.route', 'Route through')}
            value={routeValue}
            disabled={m.held || !protect || protect.locked}
            InputLabelProps={{ shrink: true }}
            SelectProps={{ displayEmpty: true }}
            inputProps={{ 'data-control': 'route' }}
            onChange={e =>
              e.target.value &&
              m.act(async () => m.setStatus(await device.call('protect.route', { id: e.target.value })))
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
    </Card>
  )
}

const ServicesPart: React.FC<{ device: ThisDevice; m: ThisDeviceModel }> = ({ device, m }) => {
  const { t, has, status, kind, lan, servicesVia } = m
  const served = status?.served
  return (
    <Card inset section="services">
      <ListItem
        secondaryAction={
          <Switch
            edge="end"
            checked={!!lan?.on}
            disabled={m.held || !lan || lan.changing || lan.locked}
            inputProps={{ 'aria-label': t('thisDevice.services', 'Allow remote access to services') }}
            data-control="services"
            onChange={() =>
              m.act(async () => {
                m.setStatus(await device.call(`${servicesVia!}.set`, { on: !lan?.on }))
                // Turning it on may have asked for the Local Network permission.
                if (has('permissions')) m.setPermissions(await device.call('permissions.get', {}))
              })
            }
          />
        }
      >
        <RowIcon name="server" on={!!lan?.on} />
        <ListItemText
          primary={t('thisDevice.services', 'Allow remote access to services')}
          primaryTypographyProps={TITLE}
          secondary={
            lan?.locked
              ? `${servicesLine(kind, m.phoneServices, t)} ${lan.lockedWhy || lockedLine(t)}`
              : servicesLine(kind, m.phoneServices, t)
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
      {lan?.on && served && served.length > 0 && (
        <ListItemButton component="a" href="#/this-device/details" data-served-summary>
          <ListItemText
            secondary={t('thisDevice.servedSummary', '{{services}} · {{connections}} — see them in Details', {
              services: servicesCount(served.length, t),
              connections: connectionsCount(served.reduce((n, s) => n + (s.sessions || 0), 0), t),
            })}
          />
        </ListItemButton>
      )}
      {lan?.on && served?.length === 0 && (
        <ListItem>
          <ListItemText
            secondary={t('thisDevice.servedNone', 'No services on this {{kind}} yet: add them on its page in remote.it.', {
              kind,
            })}
          />
        </ListItem>
      )}
    </Card>
  )
}

const VpnPart: React.FC<{ device: ThisDevice; m: ThisDeviceModel }> = ({ device, m }) => {
  const { t, has, status, exits } = m
  const vpnOn = !!status?.vpn.on
  return (
    <List data-section="vpn">
      {has('vpn') && (
        <ListItem
          secondaryAction={
            <Switch
              edge="end"
              checked={vpnOn}
              disabled={m.held || status?.vpn.changing}
              inputProps={{ 'aria-label': t('thisDevice.vpn', 'VPN') }}
              data-control="vpn"
              onChange={() => m.act(async () => m.setStatus(await device.call('vpn.set', { on: !vpnOn })))}
            />
          }
        >
          <ListItemText primary={t('thisDevice.vpn', 'VPN')} secondary={vpnLine(status, t)} sx={SWITCH_TEXT} data-vpn={vpnOn ? 'on' : 'off'} />
        </ListItem>
      )}
      {has('exit') && (
        <ListItem>
          <TextField
            select
            fullWidth
            size="small"
            label={t('thisDevice.exit', 'Exit')}
            value={status?.exit?.id ?? ''}
            disabled={m.busy}
            // "None" is a choice like the others: shown, and the label kept above it, in every engine
            InputLabelProps={{ shrink: true }}
            SelectProps={{ displayEmpty: true }}
            inputProps={{ 'data-control': 'exit' }}
            onChange={e => m.act(async () => m.setStatus(await device.call('exit.set', { id: e.target.value || null })))}
          >
            <MenuItem value="">{t('thisDevice.exitNone', 'None — the usual way out')}</MenuItem>
            {exits.map(x => (
              <MenuItem key={x.id} value={x.id}>
                {exitLabel(x)}
              </MenuItem>
            ))}
          </TextField>
        </ListItem>
      )}
    </List>
  )
}
