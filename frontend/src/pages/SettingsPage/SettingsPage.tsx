import React from 'react'
import { emit } from '../../services/Controller'
import { List, Divider, Typography, Tooltip, ButtonBase } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { DeviceSetupItem } from '../../components/DeviceSetupItem'
import { ApplicationState, Dispatch } from '../../store'
import { SettingsListItem } from '../../components/SettingsListItem'
import { UninstallSetting } from '../../components/UninstallSetting'
import { UpdateSetting } from '../../components/UpdateSetting'
import { makeStyles } from '@material-ui/styles'
import { Container } from '../../components/Container'
import { spacing } from '../../styling'
import { Logo } from '../../components/Logo'

export const SettingsPage = () => {
  const { user, installing, remoteitVersion, preferences } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
    installing: state.binaries.installing,
    remoteitVersion: state.binaries.remoteitVersion,
    preferences: state.backend.preferences,
  }))

  const { auth, binaries } = useDispatch<Dispatch>()
  const css = useStyles()

  const quitWarning = () => window.confirm('Are you sure? Quitting will close all active connections.') && auth.quit()
  const signOutWarning = () =>
    window.confirm(
      'Are you sure? Signing out will close all active connections, but leave the hosted services running.'
    ) && auth.signOut()
  const installWarning = () =>
    window.confirm('Are you sure? This will stop all services and re-install the command line utilities.') &&
    binaries.install()

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
        <SettingsListItem
          label="Auto Update"
          icon="chevron-double-up"
          toggle={preferences.autoUpdate}
          onClick={() => emit('preferences', { ...preferences, autoUpdate: !preferences.autoUpdate })}
        />
        <SettingsListItem
          label="Open at login"
          icon="power-off"
          toggle={preferences.openAtLogin}
          onClick={() => emit('preferences', { ...preferences, openAtLogin: !preferences.openAtLogin })}
        />
        {/* <SettingsListItem
          label="Search only device list"
          icon="search"
          subLabel="Speed up the application by only showing search results. Use with a very large device list."
          toggle={searchOnly}
          onClick={devices.toggleSearchOnly}
        /> */}
        <UpdateSetting />
      </List>
      <Divider />
      <Typography variant="subtitle1">Advanced</Typography>
      <List>
        <SettingsListItem
          label={installing ? 'Installing...' : 'Re-install command line tools'}
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

const useStyles = makeStyles({
  header: { '& img': { marginBottom: spacing.sm } },
})
