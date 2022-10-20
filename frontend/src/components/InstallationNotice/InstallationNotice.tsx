import React, { useEffect } from 'react'
import heartbeat from '../../services/Heartbeat'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import { Button, Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { spacing } from '../../styling'
import { Notice } from '../Notice'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { Logo } from '../Logo'

const mapState = (state: ApplicationState, props: any) => ({
  error: state.binaries.error,
  installing: state.binaries.installing,
  connected: state.ui.connected,
})

const mapDispatch = (dispatch: any) => ({
  install: dispatch.binaries.install,
  clearError: dispatch.binaries.clearError,
})

export type InstallationNoticeProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

export const InstallationNotice = connect(
  mapState,
  mapDispatch
)(({ connected, clearError, error, installing, install }: InstallationNoticeProps) => {
  const css = useStyles()

  if (!connected) return null
  if (error) console.error(error)

  const isError = error && JSON.stringify(error) !== JSON.stringify({})

  useEffect(() => {
    heartbeat.checkAll = true
    return () => (heartbeat.checkAll = undefined)
  }, [])

  return (
    <Body center>
      <Typography className={css.welcome} variant="caption" align="center">
        Welcome to
      </Typography>
      <Logo className={css.space} />
      {isError && (
        <Notice onClose={() => clearError()}>
          {error === 'User did not grant permission.'
            ? 'Please grant permissions to install CLI tools'
            : JSON.stringify(error)}
        </Notice>
      )}
      <Typography className={css.space} variant="h3" align="center">
        We need to install or update our system
        <br />
        agent in order to maintain background connections.
      </Typography>
      <Button
        className={css.space}
        variant="contained"
        color="primary"
        size="large"
        disabled={installing}
        onClick={() => install()}
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
      </Typography>
    </Body>
  )
})

const useStyles = makeStyles({
  welcome: { marginBottom: spacing.md, letterSpacing: 3 },
  space: { marginBottom: spacing.xl },
})
