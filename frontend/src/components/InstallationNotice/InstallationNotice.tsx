import React, { useEffect } from 'react'
import heartbeat from '../../services/Heartbeat'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import { Box, Button, Typography } from '@mui/material'
import { spacing } from '../../styling'
import { Notice } from '../Notice'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { Logo } from '@common/brand/Logo'

const spaceSx = { marginBottom: `${spacing.xl}px` }

export const InstallationNotice: React.FC = () => {
  const { connected, error, installing, reason } = useSelector((state: State) => ({
    error: state.binaries.error,
    installing: state.binaries.installing,
    connected: state.ui.connected,
    reason: state.binaries.reason,
  }))
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    heartbeat.checkAll = true
    return () => (heartbeat.checkAll = undefined)
  }, [])

  if (!connected) return null
  if (error) console.error(error)

  const isError = error && JSON.stringify(error) !== JSON.stringify({})

  return (
    <Body center>
      <Typography sx={{ marginBottom: `${spacing.md}px`, letterSpacing: 3 }} variant="caption" align="center">
        Welcome to
      </Typography>
      <Box sx={spaceSx}>
        <Logo />
      </Box>
      {isError && (
        <Notice onClose={() => dispatch.binaries.clearError()}>
          {error === 'User did not grant permission.'
            ? 'Please grant permissions to install CLI tools'
            : JSON.stringify(error)}
        </Notice>
      )}
      <Typography sx={spaceSx} variant="h3" align="center">
        We need to install our system agent
        <br /> in order to maintain background connections.
      </Typography>
      <Button
        sx={spaceSx}
        variant="contained"
        color="primary"
        size="large"
        disabled={installing}
        onClick={() => dispatch.binaries.install()}
      >
        {installing ? (
          <>
            Installing
            <Icon name="spinner-third" type="regular" spin inline />
          </>
        ) : (
          <>
            Install Agent
            <Icon name="terminal" type="regular" inline />
          </>
        )}
      </Button>
      <Typography sx={spaceSx} variant="caption" align="center">
        <Icon name="info-circle" type="regular" size="xs" inlineLeft />
        You will be prompted for permission to continue the installation.
        <br />
        {reason &&
          (reason.agentStopped
            ? 'The agent is not running.'
            : reason.agentMismatched
            ? 'The running version is incorrect.'
            : reason.binariesOutdated
            ? 'The agent’s version is incorrect.'
            : reason.cliUpdated
            ? 'There is a new version available.'
            : reason.desktopUpdated && 'The desktop app has been updated')}
      </Typography>
    </Body>
  )
}

