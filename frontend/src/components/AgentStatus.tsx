import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Tooltip, Typography } from '@mui/material'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { useInterval } from '../hooks/useInterval'
import { requestDeviceSessionInfo } from '../services/deviceSessionInfo'
import { held, runningVersion, updating } from '../services/graphQLDaemon'
import { Icon } from './Icon'

/* A device's agent in the device list's Agent column: the version its daemon runs, and — while one is under way, or
   when one failed, was refused or is held by the device's admin — where its upgrade stands, the reason on hover. Nothing for a device that has
   reported nothing (a legacy agent, or one not yet signed in). */
export const AgentStatus: React.FC<{ deviceId?: string }> = ({ deviceId }) => {
  const { t } = useTranslation()
  const agent = useDeviceSessionInfo(deviceId)?.agent
  const moving = updating(agent)

  // An upgrade under way is read again until it settles; the rest is read once a session.
  useInterval(() => deviceId && requestDeviceSessionInfo(deviceId, true), moving ? 5000 : undefined)

  if (!agent?.running) return null

  const update = agent.update
  // Held by the device's admin (a package hold or lock): blocked, not failed.
  const blocked = held(agent)
  const failed = !blocked && !!update && ['failed', 'refused'].includes(update.state)
  const label = blocked
    ? t('agentStatus.held', "Blocked — held by the device's admin")
    : update
    ? t('agentStatus.update', '{{state}} {{version}}', { state: update.state, version: update.version })
    : undefined

  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      <Typography component="span" variant="caption" noWrap>
        {runningVersion(agent)}
      </Typography>
      {(failed || moving || blocked) && (
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
      )}
    </Box>
  )
}
