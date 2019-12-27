import React from 'react'
import { List, Divider, Typography, Tooltip, ButtonBase } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { SettingsListItem } from '../../components/SettingsListItem'
import { UpdateSetting } from '../../components/UpdateSetting'
import { makeStyles } from '@material-ui/styles'
import { Container } from '../../components/Container'
import { connect } from 'react-redux'
import { spacing } from '../../styling'
import { Logo } from '../../components/Logo'

const mapState = (state: ApplicationState, props: any) => ({
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
      window.confirm('Are you sure? Signing out will close all active connections.') && signOut()

    return (
      <Container
        header={
          <Typography className={css.header} variant="h1">
            <Tooltip title="Visit remote.it on the web">
              <ButtonBase onClick={() => window.open('https://remote.it')}>
                <Logo width={110} />
              </ButtonBase>
            </Tooltip>
          </Typography>
        }
      >
        <List>
          <SettingsListItem
            label="Send feedback"
            icon="envelope"
            onClick={() =>
              (window.location.href = encodeURI('mailto:support@remote.it?subject=Desktop Application Feedback'))
            }
          />
          <SettingsListItem label="Open at login" icon="power-off" value={openOnLogin} onClick={toggleOpenOnLogin} />
          <SettingsListItem
            label="Search only device list"
            icon="search"
            subLabel="Speed up the application by only showing search results. Use with a very large device list."
            value={searchOnly}
            onClick={toggleSearchOnly}
          />
          <SettingsListItem
            label={installing ? 'Installing...' : (installed ? 'Re-install' : 'Install') + ' command line tools'}
            subLabel={`Version ${remoteitVersion}`}
            disabled={installing}
            icon="terminal"
            onClick={() => install()}
          />
        </List>
        <Divider />
        <List>
          <UpdateSetting />
          <SettingsListItem
            label="Sign out"
            subLabel={`Signed is as ${user && user.username}`}
            icon="sign-out"
            onClick={signOutWarning}
          />
          <SettingsListItem label="Quit" icon="skull-crossbones" onClick={quitWarning} />
        </List>
      </Container>
    )
  }
)

const useStyles = makeStyles({
  header: { '& img': { marginBottom: spacing.sm } },
})
