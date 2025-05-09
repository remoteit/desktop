import React, { useEffect } from 'react'
import heartbeat from '../../services/Heartbeat'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import { Button, Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { spacing } from '../../styling'
import { Notice } from '../Notice'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { Logo } from '@common/brand/Logo'

export const InstallationNotice: React.FC = () => {
  const { connected, error, installing, reason } = useSelector((state: State) => ({
    error: state.binaries.error,
    installing: state.binaries.installing,
    connected: state.ui.connected,
    reason: state.binaries.reason,
  }))
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  useEffect(() => {
    heartbeat.checkAll = true
    return () => (heartbeat.checkAll = undefined)
  }, [])

  if (!connected) return null
  if (error) console.error(error)

  const isError = error && JSON.stringify(error) !== JSON.stringify({})

  return (
    <Body center>
      <Typography className={css.welcome} variant="caption" align="center">
        Welcome to
      </Typography>
      <Logo className={css.space} />
      {isError && (
        <Notice onClose={() => dispatch.binaries.clearError()}>
          {error === 'User did not grant permission.'
            ? 'Please grant permissions to install CLI tools'
            : JSON.stringify(error)}
        </Notice>
      )}
      <Typography className={css.space} variant="h3" align="center">
        We need to install our system agent
        <br /> in order to maintain background connections.
      </Typography>
      <Button
        className={css.space}
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
      <Typography className={css.space} variant="caption" align="center">
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

const useStyles = makeStyles({
  welcome: { marginBottom: spacing.md, letterSpacing: 3 },
  space: { marginBottom: spacing.xl },
})
