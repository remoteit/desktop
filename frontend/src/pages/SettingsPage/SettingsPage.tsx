import React, { useEffect } from 'react'
import { emit } from '../../services/Controller'
import { version } from '../../../package.json'
import { List, Divider, Typography, Tooltip, ButtonBase } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { DeviceSetupItem } from '../../components/DeviceSetupItem'
import { ApplicationState, Dispatch } from '../../store'
import { SettingsDisableNetworkItem } from '../../components/SettingsDisableNetworkItem'
import { AccountLinkingSettings } from '../../components/AccountLinkingSettings'
import { UninstallSetting } from '../../components/UninstallSetting'
import { ListItemSetting } from '../../components/ListItemSetting'
import { usePermissions } from '../../hooks/usePermissions'
import { UpdateSetting } from '../../components/UpdateSetting'
import { makeStyles } from '@material-ui/core/styles'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { isRemote } from '../../services/Browser'
import { spacing } from '../../styling'
import { Avatar } from '../../components/Avatar'
import { Title } from '../../components/Title'
import { Logo } from '../../components/Logo'
import analyticsHelper from '../../helpers/analyticsHelper'

export const SettingsPage: React.FC = () => {
  const { os, user, target, installing, cliVersion, preferences, targetDevice } = useSelector(
    (state: ApplicationState) => ({
      os: state.backend.environment.os,
      user: state.auth.user,
      target: state.backend.device,
      installing: state.binaries.installing,
      cliVersion: state.binaries.installedVersion || '(loading...)',
      preferences: state.backend.preferences,
      targetDevice: state.backend.device,
    })
  )
  const css = useStyles()
  const { guest, notElevated } = usePermissions()
  const { binaries } = useDispatch<Dispatch>()

  const quitWarning = () =>
    window.confirm('Are you sure? Quitting will not close your connections.') && emit('user/quit')
  const signOutWarning = () => {
    if (
      window.confirm(
        'Are you sure?\n\nSigning out will leave all active connections and hosted services running.\n\nIf you wish to transfer the device you must clear your credentials.'
      )
    ) {
      emit('user/sign-out')
      analyticsHelper.track('signOut')
    }
  }

  const clearWarning = () => {
    let message = 'Are you sure? This remove all your connections.'
    if (target.uid)
      message =
        'Are you sure? This will remove all your connections and let the next user that signs claim this device.'
    window.confirm(message) && emit('user/clear-all')
  }

  const installWarning = () =>
    window.confirm('Are you sure? This will stop all services and re-install the command line utilities.') &&
    binaries.install(true)

  useEffect(() => {
    analyticsHelper.page('SettingsPage')
  }, [])

  if (!preferences) return null

  return (
    <Container
      header={
        <>
          <OutOfBand />
          <Typography variant="h1">
            <Title>
              <Tooltip title="Visit remote.it on the web">
                <ButtonBase onClick={() => window.open('https://remote.it')}>
                  <Logo className={css.logo} width={110} />
                </ButtonBase>
              </Tooltip>
            </Title>
            <Typography className={css.user} variant="caption">
              {user?.email}
            </Typography>
            <Avatar email={user?.email} button />
          </Typography>
        </>
      }
    >
      <List>
        <DeviceSetupItem />
      </List>
      <Divider />
      <Typography variant="subtitle1">Sharing</Typography>
      <List>
        <AccountLinkingSettings />
      </List>
      <Divider />
      <Typography variant="subtitle1">User</Typography>
      <List>
        <ListItemSetting
          label="Help documentation"
          icon="books"
          onClick={() => window.open('https://docs.remote.it/desktop-help')}
        />
        <ListItemSetting
          label="Send feedback"
          icon="envelope"
          onClick={() =>
            (window.location.href = encodeURI(`mailto:support@remote.it?subject=Desktop v${version} Feedback`))
          }
        />
        <ListItemSetting
          label="Sign out"
          subLabel="Sign out and lock this system installation."
          icon="sign-out"
          onClick={signOutWarning}
        />
        <ListItemSetting
          label={'Sign out and clear device credentials'}
          subLabel={
            <>
              This will remove all user credentials from this device, allowing the device to be transferred or another
              user to log in.
              <br />
              The next user to sign in will claim this device.
            </>
          }
          icon="user-slash"
          onClick={clearWarning}
        />
      </List>
      <Divider />
      <Typography variant="subtitle1">Application</Typography>
      <List>
        {(os === 'mac' || os === 'windows') && (
          <ListItemSetting
            label="Auto update"
            icon="chevron-double-up"
            toggle={preferences.autoUpdate}
            onClick={() => emit('preferences', { ...preferences, autoUpdate: !preferences.autoUpdate })}
          />
        )}
        <ListItemSetting
          label="Open at login"
          icon="door-open"
          toggle={preferences.openAtLogin}
          onClick={() => emit('preferences', { ...preferences, openAtLogin: !preferences.openAtLogin })}
        />
        {isRemote() && (
          <ListItemSetting
            label="Show connect interface"
            subLabel="Remote devices only show target configuration options. Enable for full access."
            icon="dot-circle"
            toggle={preferences.remoteUIOverride}
            onClick={() => {
              if (
                preferences.remoteUIOverride ||
                window.confirm(
                  `Are you sure? \nNew connections will be from ${targetDevice.name} and not your local machine.`
                )
              )
                emit('preferences', { ...preferences, remoteUIOverride: !preferences.remoteUIOverride })
            }}
          />
        )}
        {!guest && <ListItemSetting label="Quit" icon="power-off" onClick={quitWarning} />}
        <UpdateSetting />
      </List>
      {!(guest || notElevated) && (
        <>
          <Divider />
          <Typography variant="subtitle1">Advanced</Typography>
          <List>
            <SettingsDisableNetworkItem />
            <ListItemSetting
              label={installing ? 'Installing...' : 'Re-install command line tools'}
              subLabel={`Version ${cliVersion}`}
              disabled={installing}
              icon="terminal"
              onClick={installWarning}
            />
            <UninstallSetting />
            <ListItemSetting
              label="Show application logs"
              subLabel="Will show the folders that contain the application logs and config file."
              icon="folder"
              onClick={() => emit('showFolder')}
            />
          </List>
        </>
      )}
    </Container>
  )
}

const useStyles = makeStyles({
  logo: { marginBottom: spacing.xs },
  user: { marginRight: spacing.sm, fontFamily: 'Roboto Mono' },
})
