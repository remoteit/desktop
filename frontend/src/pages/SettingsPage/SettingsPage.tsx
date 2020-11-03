import React, { useEffect } from 'react'
import { emit } from '../../services/Controller'
import { version } from '../../../package.json'
import { List, Divider, Typography, Tooltip, ButtonBase } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { DeviceSetupItem } from '../../components/DeviceSetupItem'
import { ApplicationState, Dispatch } from '../../store'
import { SettingsDisableNetworkItem } from '../../components/SettingsDisableNetworkItem'
import { AccountLinkingSettings } from '../../components/AccountLinkingSettings'
import { LicensingSetting } from '../../components/LicensingSetting'
import { ListItemSetting } from '../../components/ListItemSetting'
import { UpdateSetting } from '../../components/UpdateSetting'
import { makeStyles } from '@material-ui/core/styles'
import { isRemoteUI } from '../../helpers/uiHelper'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { isRemote } from '../../services/Browser'
import { spacing } from '../../styling'
import { Avatar } from '../../components/Avatar'
import { Title } from '../../components/Title'
import { Logo } from '../../components/Logo'
import analyticsHelper from '../../helpers/analyticsHelper'

export const SettingsPage: React.FC = () => {
  const { os, user, target, installing, cliVersion, preferences, targetDevice, remoteUI } = useSelector(
    (state: ApplicationState) => ({
      os: state.backend.environment.os,
      user: state.auth.user,
      target: state.backend.device,
      installing: state.binaries.installing,
      cliVersion: state.binaries.installedVersion || '(loading...)',
      preferences: state.backend.preferences,
      targetDevice: state.backend.device,
      remoteUI: isRemoteUI(state),
    })
  )
  const css = useStyles()
  const { binaries, ui } = useDispatch<Dispatch>()

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
      {remoteUI || (
        <>
          <Typography variant="subtitle1">Sharing</Typography>
          <List>
            <AccountLinkingSettings />
          </List>
          <Divider />
        </>
      )}
      <LicensingSetting />
      <Typography variant="subtitle1">User</Typography>
      <List>
        <ListItemSetting
          label="Help documentation"
          icon="books"
          onClick={() =>
            window.open('https://support.remote.it/hc/en-us/sections/360010275391-The-remote-it-Desktop-App')
          }
        />
        <ListItemSetting
          label="Send feedback"
          icon="envelope"
          onClick={() =>
            (window.location.href = encodeURI(`mailto:support@remote.it?subject=Desktop v${version} Feedback`))
          }
        />
        <ListItemSetting
          confirm
          label="Sign out"
          subLabel="Sign out and lock this system installation."
          icon="sign-out"
          confirmTitle="Are you sure?"
          confirmMessage="Signing out will leave all active connections and hosted services running and prevent others from signing in."
          onClick={() => {
            emit('user/sign-out')
            analyticsHelper.track('signOut')
          }}
        />
        <ListItemSetting
          confirm
          label={'Sign out and clear device credentials'}
          subLabel="This will remove all user credentials from this device, allowing the device to be transferred or another user to log in."
          confirmTitle="Are you sure?"
          confirmMessage={
            target.uid
              ? 'This will remove all your connections and let another user who sign in.'
              : 'This will remove all your connections.'
          }
          icon="user-slash"
          onClick={() => emit('user/clear-all')}
        />
      </List>
      <Divider />
      <Typography variant="subtitle1">Application</Typography>
      <List>
        {isRemote() && (
          <ListItemSetting
            confirm={!preferences.remoteUIOverride}
            label="Show full interface"
            subLabel="Remote devices only show target configuration options. Enable for full access."
            icon="sliders-h"
            toggle={preferences.remoteUIOverride}
            confirmTitle="Are you sure?"
            confirmMessage={`New connections will be from ${
              targetDevice.name || 'this device'
            } and not your local machine.`}
            onClick={() => {
              analyticsHelper.track('enabledRemoteConnectUI')
              emit('preferences', { ...preferences, remoteUIOverride: !preferences.remoteUIOverride })
            }}
          />
        )}
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
        {remoteUI || (
          <ListItemSetting
            confirm
            label="Quit"
            icon="power-off"
            confirmTitle="Are you sure?"
            confirmMessage="Quitting will not close your connections."
            onClick={() => emit('user/quit')}
          />
        )}
        <UpdateSetting />
      </List>
      {remoteUI || (
        <>
          <Divider />
          <Typography variant="subtitle1">Advanced</Typography>
          <List>
            <SettingsDisableNetworkItem />
            <ListItemSetting
              confirm
              label={installing ? 'Installing...' : 'Re-install command line tools'}
              subLabel={`Version ${cliVersion}`}
              disabled={installing}
              icon="terminal"
              confirmTitle="Are you sure?"
              confirmMessage="This will stop all services and re-install the command line utilities."
              onClick={() => binaries.install(true)}
            />
            <ListItemSetting
              confirm
              label="Uninstall command line tools"
              subLabel={`De-register this device, completely remove all saved data, and uninstall the command line tools. Do this before removing, or uninstalling the application from your system.`}
              icon="trash-alt"
              confirmTitle="Are you sure?"
              confirmMessage="You will remove this system as a host, your connections and command line utilities."
              onClick={() => {
                emit('uninstall')
                ui.set({ uninstalling: true })
                analyticsHelper.track('uninstall')
              }}
            />
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
