import React, { useEffect } from 'react'
import { emit } from '../../services/Controller'
import { version } from '../../../package.json'
import { List, Divider, Typography, Tooltip, ButtonBase } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { DeviceSetupItem } from '../../components/DeviceSetupItem'
import { ApplicationState, Dispatch } from '../../store'
import { SettingsListItem } from '../../components/SettingsListItem'
import { UninstallSetting } from '../../components/UninstallSetting'
import { usePermissions } from '../../hooks/usePermissions'
import { UpdateSetting } from '../../components/UpdateSetting'
import { makeStyles } from '@material-ui/core/styles'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { spacing } from '../../styling'
import { Logo } from '../../components/Logo'
import analytics from '../../helpers/Analytics'

export const SettingsPage = () => {
  const { os, user, installing, cliVersion, preferences } = useSelector((state: ApplicationState) => ({
    os: state.backend.environment.os,
    user: state.auth.user,
    installing: state.binaries.installing,
    cliVersion: state.binaries.installedVersion || 'getting version...',
    preferences: state.backend.preferences,
  }))

  const css = useStyles()

  const [disabledLocalNetwork, setDisabledLocalNetwork] = React.useState(preferences.disabledLocalNetwork)

  const subLevelTextValue = (
    <span>
      This will bind the desktop UI to localhost so that it will only be available through sharing with remote.it
    </span>
  )

  const [sublevelText, setSubLevelText] = React.useState(subLevelTextValue)
  const [wifiConnectionLabel, setWifiConnectionLabel] = React.useState('wifi')
  const { guest, notElevated } = usePermissions()
  const { binaries } = useDispatch<Dispatch>()

  const quitWarning = () =>
    window.confirm('Are you sure? Quitting will close all active connections.') && emit('user/quit')
  const signOutWarning = () => {
    window.confirm(
      'Are you sure?\n\nSigning out will leave all active connections and hosted services running.\n\nIf you wish to transfer the device you must clear your credentials.'
    ) && emit('user/sign-out')
    analytics.track('signOut')
    analytics.clearIdentity()
  }

  const clearWarning = () =>
    window.confirm('Are you sure? The next user that signs in will be able to claim this device as their own.') &&
    emit('user/clear-all')
  const installWarning = () =>
    window.confirm('Are you sure? This will stop all services and re-install the command line utilities.') &&
    binaries.install()

  useEffect(() => {
    const icon = preferences.disabledLocalNetwork ? 'wifi-slash' : 'wifi'
    setWifiConnectionLabel(icon)

    if (disabledLocalNetwork == preferences.disabledLocalNetwork) {
      setSubLevelText(
        <span>
          This will bind the desktop UI to localhost so that it will only be available through sharing with remote.it
        </span>
      )
    } else {
      setSubLevelText(<span className={css.span}>Please restart for changes to take effect.</span>)
    }
  }, [preferences.disabledLocalNetwork])

  useEffect(() => {
    analytics.page('SettingsPage')
  }, [])

  const handleClick = () => {
    emit('preferences', { ...preferences, disabledLocalNetwork: !preferences.disabledLocalNetwork })
  }

  return (
    <Container
      header={
        <>
          <OutOfBand />
          <Typography className={css.header} variant="h1">
            <Tooltip title="Visit remote.it on the web">
              <ButtonBase onClick={() => window.open('https://remote.it')}>
                <Logo width={110} />
              </ButtonBase>
            </Tooltip>
          </Typography>
        </>
      }
    >
      <List>
        <DeviceSetupItem />
      </List>
      <Divider />
      <Typography variant="subtitle1">User</Typography>
      <List>
        <SettingsListItem
          label="Help documentation"
          icon="books"
          onClick={() => window.open('https://docs.remote.it/desktop-help')}
        />
        <SettingsListItem
          label="Send feedback"
          icon="envelope"
          onClick={() =>
            (window.location.href = encodeURI(`mailto:support@remote.it?subject=Desktop v${version} Feedback`))
          }
        />
        <SettingsListItem
          label="Sign out"
          subLabel={`Signed in as ${user && user.username}`}
          icon="sign-out"
          onClick={signOutWarning}
        />
        {!guest && <SettingsListItem label="Quit" icon="times" onClick={quitWarning} />}
      </List>
      <Divider />
      <Typography variant="subtitle1">Application</Typography>
      <List>
        {(os === 'mac' || os === 'windows') && (
          <SettingsListItem
            label="Auto Update"
            icon="chevron-double-up"
            toggle={preferences.autoUpdate}
            onClick={() => emit('preferences', { ...preferences, autoUpdate: !preferences.autoUpdate })}
          />
        )}

        <SettingsListItem
          label="Open at login"
          icon="power-off"
          toggle={preferences.openAtLogin}
          onClick={() => emit('preferences', { ...preferences, openAtLogin: !preferences.openAtLogin })}
        />
        <UpdateSetting />
      </List>
      {!(guest || notElevated) && (
        <>
          <Divider />
          <Typography variant="subtitle1">Advanced</Typography>
          <List>
            <SettingsListItem
              label="Disable local network discovery"
              subLabel={sublevelText}
              icon={preferences.disabledLocalNetwork ? 'wifi-slash' : 'wifi'}
              toggle={preferences.disabledLocalNetwork}
              onClick={() => {
                handleClick()
              }}
            />

            <SettingsListItem
              label={installing ? 'Installing...' : 'Re-install command line tools'}
              subLabel={`Version ${cliVersion}`}
              disabled={installing}
              icon="terminal"
              onClick={installWarning}
            />
            <UninstallSetting />
            <SettingsListItem
              label={'Clear all credentials'}
              subLabel={`This will remove all remote.it user credentials from this device. 
                Credentials should be removed before transferring a device. 
                The next user to sign in with elevated permissions will claim this device. 
                The hosted services will only remain active until the next reboot 
                if another user does not sign in and claim the device.`}
              icon="user-slash"
              onClick={clearWarning}
            />
          </List>
        </>
      )}
    </Container>
  )
}

const useStyles = makeStyles({
  header: { '& img': { marginBottom: spacing.sm } },
  span: { color: 'red' },
})
