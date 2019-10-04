import React from 'react'
import { ApplicationState } from '../../store'
import { connect } from 'react-redux'
import { Button } from '@material-ui/core'
import { Icon } from '../Icon'
import { Alert } from '../Alert'
import { Logo } from '../Logo'

const mapState = (state: ApplicationState, props: any) => ({
  error: state.binaries.error,
  installing: state.binaries.installing,
  connected: state.ui.connected,
  installed:
    state.binaries.connectdInstalled &&
    state.binaries.muxerInstalled &&
    state.binaries.demuxerInstalled,
})

const mapDispatch = (dispatch: any) => ({
  install: dispatch.binaries.install,
  clearError: dispatch.binaries.clearError,
})

export type InstallationNoticeProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>

export const InstallationNotice = connect(
  mapState,
  mapDispatch
)(
  ({
    connected,
    clearError,
    error,
    installing,
    installed,
    install,
  }: InstallationNoticeProps) => {
    if (!connected) return null
    if (installed) return null
    return (
      <div className="h-100 bg-gray-lightest gray-dark df ai-center jc-center">
        <div
          className="df ai-center jc-center fd-col p-sm mx-auto center"
          style={{ maxWidth: '400px' }}
        >
          <Logo />
          <h2 className="mt-lg gray-darkest upper ls-lg fw-lighter txt-lg">
            Welcome to remote.it Desktop!
          </h2>

          {error && (
            <Alert onClose={() => clearError()}>
              {error === 'User did not grant permission.'
                ? 'Please grant permissions to install CLI tools to continue'
                : error}
            </Alert>
          )}

          <div className="my-md lh-md">
            To get started with the remote.it Desktop, please install our
            command line tools so you can make peer-to-peer connections to your
            services!
          </div>
          <div className="mt-md">
            <Button
              variant="contained"
              className="ml-auto"
              color="primary"
              size="large"
              disabled={installing}
              onClick={() => install()}
            >
              {installing ? 'Installing...' : 'Install Now'}
              <Icon name="cloud-download" className="ml-sm" />
            </Button>
          </div>
          <div className="mt-sm gray center lh-md txt-sm">
            You will be prompted to login so we can configure our command line
            tools on your system.
          </div>
        </div>
      </div>
    )
  }
)
