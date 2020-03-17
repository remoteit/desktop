import React from 'react'
import { ApplicationState } from '../../store'
import { connect } from 'react-redux'
import { Button, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { Alert } from '../Alert'
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
  return (
    <Body center>
      <Typography className={css.welcome} variant="caption" align="center">
        Welcome to
      </Typography>
      <Logo className={css.space} />
      {error && (
        <Alert onClose={() => clearError()}>
          {error === 'User did not grant permission.'
            ? 'Please grant permissions to install CLI tools'
            : JSON.stringify(error)}
        </Alert>
      )}
      <Typography className={css.space} variant="h2" align="center">
        We need to install our service onto your machine
        <br />
        in order to maintain background connections.
      </Typography>
      <Button
        className={css.space}
        variant="contained"
        color="primary"
        size="large"
        disabled={installing}
        onClick={() => install()}
      >
        {installing ? 'Installing...' : 'Install Service'}
        <Icon name="arrow-to-bottom" weight="regular" inline />
      </Button>
      <Typography className={css.space} variant="caption" align="center">
        <Icon name="info-circle" weight="regular" size="xs" inlineLeft />
        You will be prompted for permission to continue the installation.
        <br />
        Run remote.it as an administrator to avoid future prompting.
      </Typography>
    </Body>
  )
})

const useStyles = makeStyles({
  welcome: { marginBottom: spacing.md, letterSpacing: 3 },
  space: { marginBottom: spacing.xl },
})
