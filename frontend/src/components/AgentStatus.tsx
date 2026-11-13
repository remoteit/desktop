import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Tooltip, Typography } from '@mui/material'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { useInterval } from '../hooks/useInterval'
import { requestDeviceSessionInfo } from '../services/deviceSessionInfo'
import { belowMinimum, held, managedElsewhere, runningVersion, updating } from '../services/graphQLDaemon'
import { belowMinimumText, upkeepText, withAvailable } from '../services/upkeepText'
import { Icon } from './Icon'

/* A device's agent in the device list's Agent column: the version its daemon runs, and — while one is under way, or
   when one failed, was refused or is held by the device's admin — where its upgrade stands, the reason on hover. A
   device something else upgrades (its image, Home Assistant, its store) shows a grey mark saying who, never a failure.
   Nothing for a device that has reported nothing (a legacy agent, or one not yet signed in). */
export const AgentStatus: React.FC<{ deviceId?: string }> = ({ deviceId }) => {
  const { t } = useTranslation()
  const agent = useDeviceSessionInfo(deviceId)?.agent
  const moving = updating(agent)

  // An upgrade under way is read again until it settles; the rest is read once a session.
  useInterval(() => deviceId && requestDeviceSessionInfo(deviceId, true), moving ? 5000 : undefined)

  if (!agent?.running) return null

  const update = agent.update
  const elsewhere = managedElsewhere(agent)
  // Held by the device's admin (a package hold or lock): blocked, not failed.
  const blocked = !elsewhere && held(agent)
  const failed = !elsewhere && !blocked && !!update && ['failed', 'refused'].includes(update.state)
  const upkeep = elsewhere && upkeepText(t, elsewhere, agent.package?.format)
  const label = upkeep
    ? withAvailable(t, upkeep.label, agent.available)
    : blocked
    ? t('agentStatus.held', "Blocked — held by the device's admin")
    : update
    ? t('agentStatus.update', '{{state}} {{version}}', { state: update.state, version: update.version })
    : undefined

  // Below its kind's minimum build: to be updated, said before anything else.
  const tooOld = belowMinimum(agent) && belowMinimumText(t, agent.supported!, elsewhere, agent.package?.format)

  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      <Typography component="span" variant="caption" noWrap>
        {runningVersion(agent)}
      </Typography>
      {tooOld ? (
        <Tooltip title={`${tooOld.label} — ${tooOld.hint}`} arrow>
          <span data-agent-state="too-old">
            <Icon name="exclamation-triangle" size="xs" color="warning" />
          </span>
        </Tooltip>
      ) : upkeep ? (
        <Tooltip title={`${label} — ${upkeep.hint}`} arrow>
          <span data-agent-state="managed">
            <Icon name={upkeep.icon} size="xs" color="grayDark" />
          </span>
        </Tooltip>
      ) : (
        (failed || moving || blocked) && (
          <Tooltip title={[label, update?.detail].filter(Boolean).join(' — ')} arrow>
            <span data-agent-state={blocked ? 'held' : failed ? 'failed' : 'updating'}>
              <Icon
                name={blocked ? 'lock' : failed ? 'exclamation-triangle' : 'spinner-third'}
                spin={moving && !blocked}
                size="xs"
                color={blocked ? 'warning' : failed ? 'danger' : 'primary'}
              />
            </span>
          </Tooltip>
        )
      )}
    </Box>
  )
}
