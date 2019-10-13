import React from 'react'
import { List, Divider } from '@material-ui/core'
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
    installing,
    installed,
    install,
    searchOnly,
    openOnLogin,
    toggleOpenOnLogin,
    toggleSearchOnly,
  }: SettingsPageProps) => {
    return (
      <div>
        <h2>Settings</h2>
        <List>
          <SettingsListItem
            button
            label="Send feedback"
            icon="envelope"
            onClick={() =>
              (window.location.href = encodeURI('mailto:support@remote.it?subject=Desktop Application Feedback'))
            }
          />
          <SettingsListItem
            button
            label="Open at login"
            icon="rocket"
            value={openOnLogin}
            onClick={toggleOpenOnLogin}
          />
          <SettingsListItem
            button
            label="Search only device list"
            icon="search"
            subLabel="Speed up the application by only showing search results. Use with a very large device list."
            value={searchOnly}
            onClick={toggleSearchOnly}
          />
        </List>
        <Divider />
        <List>
          <SettingsListItem
            button
            label={installing ? 'Installing...' : (installed ? 'Re-install' : 'Install') + ' command line tools'}
            color={installed ? 'default' : 'primary'}
            icon="terminal"
            disabled={installing}
            onClick={() => install()}
          />
        </List>
        <Divider />
        <List>
          <SettingsListItem button label="Sign out" icon="sign-out" />
          <SettingsListItem button label="Quit" icon="skull-crossbones" />
        </List>
      </div>
    )
  }
)
