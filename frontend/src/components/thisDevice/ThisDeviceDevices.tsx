import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, Button, CircularProgress, List, ListItem, ListItemText, Typography } from '@mui/material'
import { getApplicationType } from '@common/applications'
import type { State } from '../../store'
import { selectActiveAccountId } from '../../selectors/accounts'
import { getDeviceModel, selectVisibleDevices } from '../../selectors/devices'
import { selectConnections } from '../../selectors/connections'
import { useDeviceSessions } from '../../hooks/useDeviceSessions'
import { useServiceShortcutsSupport } from '../../hooks/useServiceShortcutsSupport'
import { useLocalSubnetName, useSubnetName } from '../../hooks/useLocalSubnetName'
import { graphQLServiceShortcuts, ServiceShortcut } from '../../services/graphQLServiceShortcuts'
import { openThroughGateway } from '../../services/browserGateway'
import { openServiceURL } from '../../services/browser'
import { subnetWebURL } from '../../services/localSubnet'
import { openTerminal } from '../../helpers/terminalHelper'
import useClipboard from '../../hooks/useClipboard'

/* "Your devices" on This device (pages/ThisDevicePage.tsx), signed in: what this machine can reach, most useful first,
   each with one action. First the services marked "Show in Services" (the account's shortcuts, where the API has
   them), then the devices this machine connected to most recently, then the others online; this machine itself is
   left out. A web service opens, an ssh service opens a terminal, anything else copies its address. Capped, with the
   way to the Devices page for the rest. Only what the store and the shortcuts already hold: nothing is asked per
   device beyond its address. */

export const DEVICES_SHOWN = 5

const SSH = 28

export type DeviceChoice = { kind: 'service'; service: ServiceShortcut } | { kind: 'device'; device: IDevice }

// The rows, most useful first: shortcuts, then devices by their latest connection, then online ones, by name.
export function chooseDevices(
  shortcuts: ServiceShortcut[],
  devices: IDevice[],
  connections: IConnection[],
  thisUid: string | undefined,
  limit = DEVICES_SHOWN
): { shown: DeviceChoice[]; more: number } {
  const others = devices.filter(d => d.id !== thisUid)
  const services = shortcuts.filter(s => s.device.id !== thisUid)
  const covered = new Set(services.map(s => s.device.id))
  const used = new Map<string, number>()
  for (const c of connections) {
    const at = Math.max(c.startTime ?? 0, c.endTime ?? 0, c.createdTime ?? 0)
    if (c.deviceID && at) used.set(c.deviceID, Math.max(used.get(c.deviceID) ?? 0, at))
  }
  const rest = others
    .filter(d => !covered.has(d.id) && (used.has(d.id) || d.state === 'active'))
    .sort(
      (a, b) =>
        (used.get(b.id) ?? 0) - (used.get(a.id) ?? 0) ||
        Number(b.state === 'active') - Number(a.state === 'active') ||
        a.name.localeCompare(b.name)
    )
  const all: DeviceChoice[] = [
    ...services.map(service => ({ kind: 'service' as const, service })),
    ...rest.map(device => ({ kind: 'device' as const, device })),
  ]
  const shown = all.slice(0, limit)
  const seen = new Set(shown.map(c => (c.kind === 'service' ? c.service.device.id : c.device.id)))
  return { shown, more: others.filter(d => !seen.has(d.id)).length }
}

export const ThisDeviceDevices: React.FC<{ uid?: string }> = ({ uid }) => {
  const { t } = useTranslation()
  const accountId = useSelector(selectActiveAccountId)
  const devices = useSelector(selectVisibleDevices)
  const model = useSelector(getDeviceModel)
  const connections = useSelector(selectConnections)
  const deviceSessions = useDeviceSessions()
  const support = useServiceShortcutsSupport(true)
  const available = !!support && support !== 'ERROR' && support.available
  const [shortcuts, setShortcuts] = useState<ServiceShortcut[]>()

  useEffect(() => {
    if (support === undefined) return
    if (!available) return setShortcuts([])
    let current = true
    graphQLServiceShortcuts(accountId, !!support.namedAddress && deviceSessions).then(result => {
      if (current) setShortcuts(result === 'ERROR' ? [] : result)
    })
    return () => {
      current = false
    }
  }, [accountId, available, support, deviceSessions])

  const loading = shortcuts === undefined || (!model.initialized && model.fetching)
  if (loading)
    return (
      <Box display="flex" alignItems="center" gap={1.5} padding={2} data-devices="loading">
        <CircularProgress size={18} />
        <Typography variant="body2" color="textSecondary">
          {t('thisDevice.devicesLoading', 'Finding your devices…')}
        </Typography>
      </Box>
    )

  const { shown, more } = chooseDevices(shortcuts, devices, connections, uid)
  if (!shown.length)
    return (
      <Box padding={2} data-devices="none">
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {t('thisDevice.devicesNone', 'Add a device to reach it from here.')}
        </Typography>
        <Button size="small" variant="contained" href="#/add" data-link="add-device">
          {t('thisDevice.addDevice', 'Add device')}
        </Button>
      </Box>
    )

  return (
    <List disablePadding data-devices="list">
      {shown.map(choice =>
        choice.kind === 'service' ? (
          <ServiceRow key={`s-${choice.service.id}`} service={choice.service} />
        ) : (
          <DeviceRow key={`d-${choice.device.id}`} device={choice.device} />
        )
      )}
      <ListItem sx={{ justifyContent: 'flex-end', paddingY: 0.5 }}>
        <Button size="small" href="#/devices" data-link="devices">
          {more > 0
            ? t('thisDevice.allDevicesMore', 'All devices ({{n}} more)', { n: more })
            : t('thisDevice.allDevices', 'All devices')}
        </Button>
      </ListItem>
    </List>
  )
}

const Row: React.FC<{
  id: string
  href: string
  primary: string
  secondary: string
  action?: React.ReactNode
}> = ({ id, href, primary, secondary, action }) => (
  <ListItem divider data-device-row={id} sx={{ gap: 1.5, paddingX: 2, paddingY: 1 }}>
    <ListItemText
      sx={{ minWidth: 0, marginY: 0 }}
      primary={
        <Box component="a" href={href} sx={{ color: 'text.primary', textDecoration: 'none', overflowWrap: 'anywhere' }}>
          {primary}
        </Box>
      }
      primaryTypographyProps={{ fontWeight: 500 }}
      secondary={secondary}
    />
    {action && <Box flexShrink={0}>{action}</Box>}
  </ListItem>
)

const CopyAddress: React.FC<{ address: string }> = ({ address }) => {
  const { t } = useTranslation()
  const clipboard = useClipboard()
  return (
    <Button size="small" data-action="copy" title={address} onClick={() => clipboard.copy(address)}>
      {clipboard.copied ? t('thisDevice.copied', 'Copied') : t('thisDevice.copyAddress', 'Copy address')}
    </Button>
  )
}

// A service marked "Show in Services": opened as the Services page opens it — a web service in the browser, an ssh
// service in a terminal — else its address copied, or its page where it has none.
const ServiceRow: React.FC<{ service: ServiceShortcut }> = ({ service }) => {
  const { t } = useTranslation()
  const [opening, setOpening] = useState(false)
  const [failed, setFailed] = useState(false)
  const to = `#/devices/${service.device.id}/${service.id}/connect`
  const online = service.enabled && service.state === 'active'
  const type = useSelector((state: State) => state.applicationTypes.all.find(each => each.id === service.application))
  const web =
    getApplicationType(service.application).urlForm ||
    type?.scheme === 'http' ||
    type?.scheme === 'https' ||
    (type?.proxy && !type.scheme)
  const name = service.subnetName ?? undefined
  const port = service.subnetPort ?? undefined
  // Only the default HTTPS port opens through the browser gateway; any other needs this machine's own name for it.
  const needsLocal = online && web && !!name && !!port && port !== 443
  const local = useLocalSubnetName(needsLocal ? service.device.id : undefined, needsLocal ? service.id : undefined)
  const destination = web ? (port === 443 ? name : needsLocal ? local?.name : undefined) : undefined
  const secondary = online
    ? service.device.name
    : `${service.device.name} · ${
        service.enabled ? t('thisDevice.deviceOffline', 'Offline') : t('thisDevice.serviceDisabled', 'Disabled')
      }`

  const open = async () => {
    if (!destination || !port) return
    setOpening(true)
    try {
      if (port === 443) setFailed(!(await openThroughGateway(destination)))
      else await openServiceURL(subnetWebURL(destination, port))
    } catch {
      setFailed(true)
    } finally {
      setOpening(false)
    }
  }

  const action = !online ? undefined : destination && !failed ? (
    <Button size="small" disabled={opening} data-action="open" onClick={open}>
      {t('thisDevice.open', 'Open')}
    </Button>
  ) : service.application === SSH && name ? (
    <Button
      size="small"
      data-action="terminal"
      onClick={() => openTerminal({ name, port: port || 22, title: service.name, service: service.id })}
    >
      {t('thisDevice.openTerminal', 'Open terminal')}
    </Button>
  ) : name ? (
    <CopyAddress address={name} />
  ) : (
    <Button size="small" href={to} data-action="connect">
      {t('thisDevice.connect', 'Connect')}
    </Button>
  )

  return (
    <Row
      id={service.id}
      href={to}
      primary={service.name}
      secondary={failed ? t('thisDevice.openFailed', 'Couldn’t open it. Try Connect on its page.') : secondary}
      action={action}
    />
  )
}

// A device: its address copied where the account says it, else its page opened.
const DeviceRow: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const address = useSubnetName(device.id)
  const online = device.state === 'active'
  const services = device.services?.length ?? 0
  const secondary = [
    online ? t('thisDevice.deviceOnline', 'Online') : t('thisDevice.deviceOffline', 'Offline'),
    services === 1
      ? t('thisDevice.servicesOne', '1 service')
      : services > 1
      ? t('thisDevice.servicesCount', '{{n}} services', { n: services })
      : undefined,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <Row
      id={device.id}
      href={`#/devices/${device.id}`}
      primary={device.name}
      secondary={secondary}
      action={
        address ? (
          <CopyAddress address={address} />
        ) : (
          <Button size="small" href={`#/devices/${device.id}`} data-action="device">
            {t('thisDevice.open', 'Open')}
          </Button>
        )
      }
    />
  )
}
