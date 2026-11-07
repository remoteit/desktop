import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { FormControlLabel, ListItem, ListItemButton, ListItemIcon, ListItemText, Switch, Typography } from '@mui/material'
import { useHistory } from 'react-router-dom'
import { DeviceRuns, ExitDevice, ProxyDevice, graphQLSetExitDeviceLan } from '../services/graphQLDeviceRuns'
import { runDetail, runStateLabel } from '../helpers/runsHelper'
import { RunActions } from './RunActions'
import { Confirm } from './Confirm'
import { Link } from './Link'
import { Icon } from './Icon'

type Props = {
  kind: 'proxy' | 'exit'
  run: ProxyDevice | ExitDevice
  name: string // the proxy's or exit's, for its actions
  title?: React.ReactNode // the device's name, unless given
  activation?: string
  to?: string // where its title leads: the device's page, or the proxy's or exit's
  manage?: boolean // its actions offered
  onChanged?: (runs: DeviceRuns, device: { id: string; name: string }) => void
  // An own exit's device: whether its users reach the machine's own network, set here; read again after.
  lan?: boolean
  onRefresh?: () => void
  children?: React.ReactNode // more of what may be done with it, under its actions
}

/* A device in a proxy or an exit it runs: its state there — in service, draining, retired, joining with what it waits
   for, or disabled —, what its machine says of it (a proxy's health, certificate, open connections and whether it is
   safe to stop; why an exit's device takes no traffic), and, for whoever manages both, its actions in it alone and, on
   an own exit, whether its users reach the machine's own network. */
export const RunListItem: React.FC<Props> = ({
  kind,
  run,
  name,
  title,
  activation,
  to,
  manage,
  onChanged,
  lan,
  onRefresh,
  children,
}) => {
  const { t } = useTranslation()
  const history = useHistory()
  const device = { id: run.id, name: run.name || run.id }
  const inactive = run.state !== 'ACTIVE' || run.joining || run.disabled
  const lines = [runDetail(t, run, activation), ...machineLines(t, kind, run)].filter(Boolean)
  // With its actions, the row is no link — each click would take it —: its title is.
  const actions = !!manage && !!onChanged
  const heading = title ?? device.name

  const content = (
    <>
      <ListItemIcon>
        <Icon name={kind === 'proxy' ? 'server' : 'door-open'} size="md" color={inactive ? 'grayDark' : 'primary'} />
      </ListItemIcon>
      <ListItemText
        primary={
          <>
            {to && actions ? <Link to={to}>{heading}</Link> : heading}
            <Typography component="span" variant="caption" color="textSecondary" marginLeft={1} data-run-state>
              {runStateLabel(t, run)}
            </Typography>
          </>
        }
        secondaryTypographyProps={{ component: 'div' }}
        secondary={
          <>
            {lines.map(line => (
              <Typography key={line} component="div" variant="caption" color="textSecondary">
                {line}
              </Typography>
            ))}
            {kind === 'exit' && lan && manage && <ExitLan run={run as ExitDevice} onDone={onRefresh} />}
            {actions && (
              <RunActions device={device} scope={{ kind, name }} run={run} onDone={runs => onChanged?.(runs, device)} />
            )}
            {children}
          </>
        }
      />
    </>
  )

  return to && !actions ? (
    <ListItemButton data-run={run.id} onClick={() => history.push(to)}>
      {content}
    </ListItemButton>
  ) : (
    <ListItem data-run={run.id}>{content}</ListItem>
  )
}

/* Whether the exit's users reach this machine's own network through it (its exit node's lan), set by the cloud: asked
   before it is turned on, since everyone who may use the exit can then reach the devices there. Where it cannot be set
   from here — its administrator keeps its exit node local, or forbids exits — the reason is said in place of the
   switch, with how it stands; a refusal is said in graphql's words. */
const ExitLan: React.FC<{ run: ExitDevice; onDone?: () => void }> = ({ run, onDone }) => {
  const { t } = useTranslation()
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()

  const set = async (on: boolean) => {
    setAsking(false)
    setBusy(true)
    const result = await graphQLSetExitDeviceLan(run.id, on)
    setBusy(false)
    if ('reason' in result) return setRefusal(result.reason || t('runs.lanNotSet', 'It was not changed: try again.'))
    setRefusal(undefined)
    onDone?.()
  }

  if (run.lanRefusal)
    return (
      <Typography component="div" variant="caption" color="textSecondary" data-lan-refusal>
        {run.lan
          ? t('runs.lanOnRefused', 'Its local network too: on — {{reason}}', { reason: run.lanRefusal })
          : t('runs.lanOffRefused', 'Its local network: not reached — {{reason}}', { reason: run.lanRefusal })}
      </Typography>
    )

  return (
    <>
      <FormControlLabel
        data-lan={run.lan ? 'on' : 'off'}
        control={
          <Switch
            size="small"
            checked={run.lan}
            disabled={busy}
            onChange={event => (event.target.checked ? setAsking(true) : set(false))}
          />
        }
        label={
          <Typography variant="caption">
            {t('runs.lan', 'Its local network too: the exit’s users may reach the network this machine is on')}
          </Typography>
        }
      />
      {refusal && (
        <Typography component="div" variant="caption" color="error" data-lan-error>
          {refusal}
        </Typography>
      )}
      <Confirm
        open={asking}
        title={t('runs.lanConfirm', 'Let its local network be reached?')}
        onConfirm={() => set(true)}
        onDeny={() => setAsking(false)}
      >
        {t(
          'runs.lanConfirmBody',
          'Everyone who may use the exit can then reach the devices on the network {{device}} is on.',
          { device: run.name || run.id }
        )}
      </Confirm>
    </>
  )
}

// What its machine says of it beyond its state: a proxy's health, certificate, open connections and drain; an exit's
// device's health.
export function machineLines(t: TFunction, kind: 'proxy' | 'exit', run: ProxyDevice | ExitDevice): string[] {
  const lines: string[] = []
  if (kind === 'proxy') {
    const proxy = run as ProxyDevice
    if (proxy.health && proxy.health.state !== 'healthy')
      lines.push(
        proxy.health.reason
          ? t('runs.healthReason', 'Health: {{state}} — {{reason}}', proxy.health)
          : t('runs.health', 'Health: {{state}}', proxy.health)
      )
    if (proxy.certificate === 'pending')
      lines.push(t('runs.certificatePending', 'Its certificate is issued within a day: until then https names fail'))
    if (proxy.openConnections?.total)
      lines.push(
        t('runs.open', 'Open: https {{https}} · tcp {{tcp}} · udp {{udp}}', {
          https: proxy.openConnections.https,
          tcp: proxy.openConnections.tcp,
          udp: proxy.openConnections.udp,
        })
      )
    if (proxy.drain)
      lines.push(
        proxy.drain.safeToStop
          ? t('runs.safeToStop', 'Safe to stop: {{reason}}', proxy.drain)
          : t('runs.notSafeToStop', 'Not safe to stop yet: {{reason}}', proxy.drain)
      )
  } else {
    const exit = run as ExitDevice
    if (exit.health && exit.health !== 'healthy') lines.push(t('runs.health', 'Health: {{state}}', { state: exit.health }))
  }
  return lines
}
