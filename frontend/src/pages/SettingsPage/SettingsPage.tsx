import React from 'react'
import { List, Divider, Typography, Tooltip, ButtonBase } from '@material-ui/core'
import { DeviceSetupItem } from '../../components/DeviceSetupItem'
import { ApplicationState } from '../../store'
import { SettingsListItem } from '../../components/SettingsListItem'
import { UninstallSetting } from '../../components/UninstallSetting'
import { UpdateSetting } from '../../components/UpdateSetting'
import { makeStyles } from '@material-ui/styles'
import { Container } from '../../components/Container'
import { connect } from 'react-redux'
import { spacing } from '../../styling'
import { Logo } from '../../components/Logo'

const mapState = (state: ApplicationState) => ({
  user: state.auth.user,
  installing: state.binaries.installing,
  installed:
    state.binaries.connectdInstalled &&
    state.binaries.muxerInstalled &&
    state.binaries.demuxerInstalled &&
    state.binaries.remoteitInstalled,
  remoteitVersion: state.binaries.remoteitVersion,
  openOnLogin: state.auth.openOnLogin,
  searchOnly: state.devices.searchOnly,
})

const mapDispatch = (dispatch: any) => ({
  quit: dispatch.auth.quit,
  signOut: dispatch.auth.signOut,
  install: dispatch.binaries.install,
  toggleOpenOnLogin: dispatch.auth.toggleOpenOnLogin,
  toggleSearchOnly: dispatch.devices.toggleSearchOnly,
})

export type SettingsPageProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

export const SettingsPage = connect(
  mapState,
  mapDispatch
)(
  ({
    quit,
    user,
    signOut,
    installing,
    installed,
    install,
    searchOnly,
    openOnLogin,
    toggleOpenOnLogin,
    toggleSearchOnly,
    remoteitVersion,
  }: SettingsPageProps) => {
    const css = useStyles()

    const quitWarning = () => window.confirm('Are you sure? Quitting will close all active connections.') && quit()
    const signOutWarning = () =>
      window.confirm(
        'Are you sure? Signing out will close all active connections, but leave the hosted services running.'
      ) && signOut()
    const installWarning = () =>
      window.confirm('Are you sure? This will stop all services and re-install the command line utilities.') &&
      install()

    return (
      <Container
        header={
          <>
            <Typography className={css.header} variant="h1">
              <Tooltip title="Visit remote.it on the web">
                <ButtonBase onClick={() => window.open('https://remote.it')}>
                  <Logo width={110} />
                </ButtonBase>
              </Tooltip>
            </Typography>
            <DeviceSetupItem />
            <Divider />
          </>
        }
      >
        <Typography variant="subtitle1">User</Typography>
        <List>
          <SettingsListItem
            label="Send feedback"
            icon="envelope"
            onClick={() =>
              (window.location.href = encodeURI('mailto:support@remote.it?subject=Desktop Application Feedback'))
            }
          />
          <SettingsListItem
            label="Sign out"
            subLabel={`Signed in as ${user && user.username}`}
            icon="sign-out"
            onClick={signOutWarning}
          />
          <SettingsListItem label="Quit" icon="times" onClick={quitWarning} />
        </List>
        <Divider />
        <Typography variant="subtitle1">Application</Typography>
        <List>
          <SettingsListItem label="Open at login" icon="power-off" toggle={openOnLogin} onClick={toggleOpenOnLogin} />
          <SettingsListItem
            label="Search only device list"
            icon="search"
            subLabel="Speed up the application by only showing search results. Use with a very large device list."
            toggle={searchOnly}
            onClick={toggleSearchOnly}
          />
          <UpdateSetting />
        </List>
        <Divider />
        <Typography variant="subtitle1">Advanced</Typography>
        <List>
          <SettingsListItem
            label={installing ? 'Installing...' : (installed ? 'Re-install' : 'Install') + ' command line tools'}
            subLabel={`Version ${remoteitVersion}`}
            disabled={installing}
            icon="terminal"
            onClick={installWarning}
          />
          <UninstallSetting />
        </List>
      </Container>
    )
  }
)

const useStyles = makeStyles({
  header: { '& img': { marginBottom: spacing.sm } },
})
