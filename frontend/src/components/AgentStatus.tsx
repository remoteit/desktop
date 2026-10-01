import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Tooltip, Typography } from '@mui/material'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { useInterval } from '../hooks/useInterval'
import { requestDeviceSessionInfo } from '../services/deviceSessionInfo'
import { runningVersion, updating } from '../services/graphQLDaemon'
import { Icon } from './Icon'

/* A device's agent in the device list's Agent column: the version its daemon runs, and — while one is under way, or
   when one failed or was refused — where its upgrade stands, the reason on hover. Nothing for a device that has
   reported nothing (a legacy agent, or one not yet signed in). */
export const AgentStatus: React.FC<{ deviceId?: string }> = ({ deviceId }) => {
  const { t } = useTranslation()
  const agent = useDeviceSessionInfo(deviceId)?.agent
  const moving = updating(agent)

  // An upgrade under way is read again until it settles; the rest is read once a session.
  useInterval(() => deviceId && requestDeviceSessionInfo(deviceId, true), moving ? 5000 : undefined)

  if (!agent?.running) return null

  const update = agent.update
  const failed = !!update && ['failed', 'refused'].includes(update.state)
  const label = update
    ? t('agentStatus.update', '{{state}} {{version}}', { state: update.state, version: update.version })
    : undefined

  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      <Typography component="span" variant="caption" noWrap>
        {runningVersion(agent)}
      </Typography>
      {(failed || moving) && (
        <Tooltip title={[label, update?.detail].filter(Boolean).join(' — ')} arrow>
          <span>
            <Icon
              name={failed ? 'exclamation-triangle' : 'spinner-third'}
              spin={moving}
              size="xs"
              color={failed ? 'danger' : 'primary'}
            />
          </span>
        </Tooltip>
      )}
    </Box>
  )
}
