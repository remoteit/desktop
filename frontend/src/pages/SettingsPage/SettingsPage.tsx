import React from 'react'
import { List, Divider, Typography } from '@material-ui/core'
import { Container } from '../../components/Container'
import { SettingsListItem } from '../../components/SettingsListItem'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'

const mapState = (state: ApplicationState, props: any) => ({
  installing: state.binaries.installing,
  installed: state.binaries.connectdInstalled && state.binaries.muxerInstalled && state.binaries.demuxerInstalled,
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
    signOut,
    installing,
    installed,
    install,
    searchOnly,
    openOnLogin,
    toggleOpenOnLogin,
    toggleSearchOnly,
  }: SettingsPageProps) => {
    const quitWarning = () => window.confirm('Are you sure? Quitting will close all active connections.') && quit()

    const signOutWarning = () =>
      window.confirm(
        'Are you sure? Signing out will close all active connections and remove your connection history.'
      ) && signOut()

    installed = false
    return (
      <Container header={<Typography variant="h1">Settings</Typography>}>
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
          <SettingsListItem label="Sign out" icon="sign-out" onClick={signOutWarning} />
          <SettingsListItem label="Quit" icon="skull-crossbones" onClick={quitWarning} />
        </List>
      </Container>
    )
  }
)
