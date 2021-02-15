import React, { useEffect } from 'react'
import { emit } from '../../services/Controller'
import { List, Divider, Typography, Tooltip, ButtonBase } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { SettingsDisableNetworkItem } from '../../components/SettingsDisableNetworkItem'
import { AccountLinkingSettings } from '../../components/AccountLinkingSettings'
import { ListItemLocation } from '../../components/ListItemLocation'
import { LicensingSetting } from '../../components/LicensingSetting'
import { ListItemSetting } from '../../components/ListItemSetting'
import { DeviceSetupItem } from '../../components/DeviceSetupItem'
import { UpdateSetting } from '../../components/UpdateSetting'
import { getOwnDevices } from '../../models/accounts'
import { makeStyles } from '@material-ui/core/styles'
import { isRemoteUI } from '../../helpers/uiHelper'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { isRemote } from '../../services/Browser'
import { spacing } from '../../styling'
import { Title } from '../../components/Title'
import { Logo } from '../../components/Logo'
import analyticsHelper from '../../helpers/analyticsHelper'

export const SettingsPage: React.FC = () => {
  const { showReports, os, installing, cliVersion, preferences, targetDevice, notOwner, remoteUI } = useSelector(
    (state: ApplicationState) => ({
      showReports: state.auth.user?.email.includes('@remote.it'),
      os: state.backend.environment.os,
      installing: state.binaries.installing,
      cliVersion: state.binaries.installedVersion || '(loading...)',
      preferences: state.backend.preferences,
      targetDevice: state.backend.device,
      notOwner: !!state.backend.device.uid && !getOwnDevices(state).find(d => d.id === state.backend.device.uid),
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
          <Typography variant="h1">
            <Title>
              <Tooltip title="Visit remote.it on the web">
                <ButtonBase onClick={() => window.open('https://remote.it')}>
                  <Logo className={css.logo} width={110} />
                </ButtonBase>
              </Tooltip>
            </Title>
            <OutOfBand inline />
          </Typography>
        </>
      }
    >
      <List>
        <DeviceSetupItem />
      </List>
      <Divider />
      {showReports && (
        <>
          <List>
            <ListItemLocation title="Reports" pathname="/settings/reports" icon="chart-line" />
          </List>
          <Divider />
        </>
      )}
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
        <ListItemSetting
          label="System notifications"
          icon="bell"
          toggle={preferences.showNotifications}
          onClick={() => emit('preferences', { ...preferences, showNotifications: !preferences.showNotifications })}
        />
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
              onClick={() => binaries.install()}
            />
            {!notOwner && (
              <ListItemSetting
                confirm
                label="Uninstall"
                subLabel={`De-register this device, completely remove all saved data, and uninstall the system service and command line tools link. Do this before removing, the application from your system. Can only be done by the device owner.`}
                icon="trash-alt"
                confirmTitle="Are you sure?"
                confirmMessage="You will remove this system as a host, your connections and command line utilities."
                onClick={() => {
                  emit('uninstall')
                  ui.set({ uninstalling: true })
                  analyticsHelper.track('uninstall')
                }}
              />
            )}
            <ListItemSetting
              label="Show application logs"
              subLabel="Will show the folders that contain the application logs and config file."
              icon="folder"
              onClick={() => emit('showFolder', 'logs')}
            />
          </List>
        </>
      )}
    </Container>
  )
}

const useStyles = makeStyles({
  logo: { marginBottom: spacing.xs },
})
