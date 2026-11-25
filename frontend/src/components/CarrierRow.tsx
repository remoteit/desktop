import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material'
import type { DeviceRuns, ExitDevice, ProxyDevice } from '../services/graphQLDeviceRuns'
import { carrying, refusalWhy } from '../helpers/exitWords'
import { failing } from '../helpers/runsHelper'
import { RunActions } from './RunActions'
import { CarrierWhy } from './CarrierWhy'
import { Link } from './Link'
import { Icon } from './Icon'
import { CarrierStateChip } from './CarrierStateChip'

type Props = {
  kind: 'proxy' | 'exit'
  run: ExitDevice | ProxyDevice
  name: string
  of?: string // its id, where its own page shows the device: whose sign-in its actions are asked as
  activation?: string
  manage?: boolean
  // A local network proxy server's device: its private address, where its addresses lead on that network.
  local?: boolean
  onChanged?: (runs: DeviceRuns, device: { id: string; name: string }) => void
}

/* One device of an exit or proxy server: its name, linked to its page, its state in a word, what is wrong when it is not
   carrying traffic, and Pause, Resume, Remove. */
export const CarrierRow: React.FC<Props> = ({ kind, run, name, of, activation, manage, local, onChanged }) => {
  const { t } = useTranslation()
  const device = { id: run.id, name: run.name || run.id }
  const on = carrying(run)
  const refusal = kind === 'exit' ? (run as ExitDevice).refusal : null
  const reachReason =
    kind === 'proxy' && (run as ProxyDevice).reachable === false ? (run as ProxyDevice).reachReason : null
  const problems = !on && !run.disabled ? failing(run.checks).map(check => check.reason) : []
  const why = refusal ? refusalWhy(t, kind, refusal) : undefined

  return (
    <ListItem data-run={run.id} alignItems="flex-start" sx={{ paddingY: 1 }}>
      <ListItemIcon sx={{ marginTop: 0.5 }}>
        <Icon
          name={kind === 'proxy' ? 'server' : 'door-open'}
          size="md"
          color={on ? 'primary' : 'grayDark'}
          fixedWidth
        />
      </ListItemIcon>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Link
              to={`/devices/${run.id}`}
              color="inherit"
              noUnderline
              sx={{ padding: 0, '&:hover': { textDecoration: 'underline' } }}
            >
              {device.name}
            </Link>
            <CarrierStateChip run={run} />
          </Box>
        }
        secondaryTypographyProps={{ component: 'div' }}
        secondary={
          <>
            {local && kind === 'proxy' && (run as ProxyDevice).privateAddress && (
              <Typography variant="caption" component="div" color="textSecondary" data-private-address>
                {t('carry.privateAddress', 'Private address {{address}}', {
                  address: (run as ProxyDevice).privateAddress,
                })}
              </Typography>
            )}
            {run.disabled && (
              <Typography variant="caption" component="div" color="textSecondary">
                {t('carry.disabledHint', 'This device is disabled. Restore it to use it again.')}
              </Typography>
            )}
            {problems.map(problem => (
              <Typography key={problem} variant="caption" component="div" color="textSecondary">
                {problem}
              </Typography>
            ))}
            {reachReason && (
              <Typography variant="caption" component="div" color="textSecondary">
                {t('carry.unreachable', 'Can’t be reached from the internet: {{reason}}', { reason: reachReason })}
              </Typography>
            )}
            {why && <CarrierWhy why={why} />}
            {manage && onChanged && (
              <RunActions
                device={device}
                scope={{ kind, name, ...(of && { id: of }) }}
                run={run}
                activation={activation}
                onDone={runs => onChanged(runs, device)}
              />
            )}
          </>
        }
      />
    </ListItem>
  )
}
