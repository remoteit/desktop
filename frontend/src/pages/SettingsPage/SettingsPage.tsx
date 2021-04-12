import React, { useEffect } from 'react'
import { emit } from '../../services/Controller'
import { makeStyles, List, Divider, Typography, Tooltip, ButtonBase } from '@material-ui/core'
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
import { Collapsible } from '../../components/Collapsible'
import { isRemoteUI } from '../../helpers/uiHelper'
import { AvatarMenu } from '../../components/AvatarMenu'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { isRemote } from '../../services/Browser'
import { getApi } from '../../services/graphQL'
import { spacing } from '../../styling'
import { Title } from '../../components/Title'
import { Logo } from '../../components/Logo'
import analyticsHelper from '../../helpers/analyticsHelper'

export const SettingsPage: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const { os, installing, cliVersion, preferences, targetDevice, notOwner, remoteUI, user } = useSelector(
    (state: ApplicationState) => ({
      os: state.backend.environment.os,
      installing: state.binaries.installing,
      cliVersion: state.binaries.installedVersion || '(loading...)',
      preferences: state.backend.preferences,
      targetDevice: state.backend.device,
      notOwner: !!state.backend.device.uid && !getOwnDevices(state).find(d => d.id === state.backend.device.uid),
      remoteUI: isRemoteUI(state),
      user: state.auth.user,
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
      gutterBottom
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
            {singlePanel && <AvatarMenu />}
            <OutOfBand inline />
          </Typography>
        </>
      }
    >
      <List>
        <DeviceSetupItem />
        {remoteUI || <AccountLinkingSettings />}
        <ListItemLocation title="Logs" pathname="/settings/logs" icon="file-alt" />
        {preferences.testUI && <ListItemLocation title="Reports" pathname="/settings/reports" icon="chart-line" />}
        {preferences.testUI && (
          <ListItemSetting
            label="Disable Alpha UI"
            subLabel="To re-enable the alpha UI you will have to select the Avatar menu while holding alt-shift."
            icon="vial"
            onClick={() => emit('preferences', { ...preferences, testUI: false, allowPrerelease: false })}
          />
        )}
      </List>
      <Divider variant="inset" />
      <LicensingSetting />
      <Typography variant="subtitle1">Settings</Typography>
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
        <ListItemSetting
          label="Open at login"
          icon="door-open"
          toggle={preferences.openAtLogin}
          onClick={() => emit('preferences', { ...preferences, openAtLogin: !preferences.openAtLogin })}
        />
        <ListItemSetting
          label="HTTPS Certificate"
          subLabel="Use a remote.it certificate to handle https connections"
          icon="file-certificate"
          toggle={preferences.useCertificate}
          onClick={() => emit('preferences', { ...preferences, useCertificate: !preferences.useCertificate })}
        />
        {(os === 'mac' || os === 'windows') && (
          <>
            <ListItemSetting
              label="Auto update"
              icon="chevron-double-up"
              toggle={preferences.autoUpdate}
              onClick={() => emit('preferences', { ...preferences, autoUpdate: !preferences.autoUpdate })}
            />
            {preferences.testUI && (
              <ListItemSetting
                quote
                label="Allow Prerelease"
                toggle={preferences.allowPrerelease}
                onClick={() => emit('preferences', { ...preferences, allowPrerelease: !preferences.allowPrerelease })}
              />
            )}
          </>
        )}
        <UpdateSetting />
      </List>
      {remoteUI || (
        <Collapsible title="Advanced">
          <List>
            {preferences.testUI && (
              <ListItemSetting
                label="Switch GraphQL APIs"
                subLabel={`Using ${getApi()}`}
                icon="database"
                onClick={() => emit('preferences', { ...preferences, switchApi: !preferences.switchApi })}
                toggle={preferences.switchApi}
              />
            )}
            <SettingsDisableNetworkItem />
            <ListItemSetting
              confirm
              label={installing ? 'Installing...' : 'Re-install system service'}
              subLabel={`Version ${cliVersion}`}
              disabled={installing}
              icon="terminal"
              confirmTitle="Are you sure?"
              confirmMessage="This will stop and attempt to re-install the system service."
              onClick={() => binaries.install()}
            />
            {!notOwner && (
              <ListItemSetting
                confirm
                label="Uninstall"
                subLabel={`De-register this device, completely remove all saved data, and uninstall the system service and command line tools link. Do this before removing, the application from your system. Can only be done by the device owner.`}
                icon="trash"
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
        </Collapsible>
      )}
    </Container>
  )
}

const useStyles = makeStyles({
  logo: { marginBottom: spacing.xs },
})
