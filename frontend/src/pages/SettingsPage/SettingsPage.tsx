import React from 'react'
import { List, Divider, Typography, Tooltip, ButtonBase } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { SettingsListItem } from '../../components/SettingsListItem'
import { makeStyles } from '@material-ui/styles'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { connect } from 'react-redux'
import { version } from '../../../package.json'
import { Logo } from '../../components/Logo'
import { spacing } from '../../styling'

const mapState = (state: ApplicationState, props: any) => ({
  user: state.auth.user,
  installing: state.binaries.installing,
  installed:
    state.binaries.connectdInstalled &&
    state.binaries.muxerInstalled &&
    state.binaries.demuxerInstalled &&
    state.binaries.remoteitInstalled,
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
                <Logo width={95} />
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
            disabled={installing}
            icon="terminal"
            onClick={() => install()}
          />
        </List>
        <Divider />
        <List>
          <SettingsListItem
            label="Sign out"
            subLabel={`Signed is as ${user && user.username}`}
            icon="sign-out"
            onClick={signOutWarning}
          />
          <SettingsListItem label="Quit" icon="skull-crossbones" onClick={quitWarning} />
        </List>
        <Divider />
        <Columns inset>
          <Typography variant="caption">Version: v{version} &nbsp; — &nbsp; © remot3.it inc.</Typography>
        </Columns>
      </Container>
    )
  }
)

const useStyles = makeStyles({
  header: { '& img': { marginBottom: spacing.sm } },
})
