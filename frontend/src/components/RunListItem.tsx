import React from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { useHistory } from 'react-router-dom'
import { DeviceRuns, ExitDevice, ProxyDevice } from '../services/graphQLDeviceRuns'
import { lanLine, runDetail, runStateLabel } from '../helpers/runsHelper'
import { RunActions } from './RunActions'
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
  // An own exit's device: its local network said closed too. remote.it's exits reach no network of their machines, so
  // without it a device says its own only where it is open or not the cloud's to set.
  lan?: boolean
  // Where its exit is, to say there that its local network is set: from the device's page, not the exit's own.
  lanSetOn?: string
  children?: React.ReactNode // more of what may be done with it, under its actions
}

/* A device in a proxy or an exit it runs: its state there — in service, draining, retired, joining with what it waits
   for, or disabled —, what its machine says of it (a proxy's health, certificate, open connections and whether it is
   safe to stop; why an exit's device takes no traffic), an exit's device's local network as its machine has it — the
   exit's setting, read here, with why where it is not as the exit says —, and, for whoever manages both, its actions in
   it alone. */
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
  lanSetOn,
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
  const exitRun = kind === 'exit' ? (run as ExitDevice) : undefined
  const lanSaid = exitRun ? lanLine(t, exitRun, !!lan) : ''
  // Where it follows its exit, the exit sets it: said, linked unless the row is the link already.
  const setOn = lanSetOn && !exitRun?.lanReason ? t('runs.lanSetOnExit', 'Set on the exit') : ''
  const rowLink = !!to && !actions

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
            {lanSaid && (
              <Typography
                component="div"
                variant="caption"
                color="textSecondary"
                data-lan={exitRun?.lan ? 'open' : 'closed'}
              >
                {lanSaid}
                {setOn && (
                  <>
                    {' · '}
                    {rowLink ? setOn : <Link to={lanSetOn}>{setOn}</Link>}
                  </>
                )}
              </Typography>
            )}
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
