import React from 'react'
import { emit } from '../services/Controller'
import { List, Typography } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { SettingsDisableNetworkItem } from '../components/SettingsDisableNetworkItem'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { ListItemSetting } from '../components/ListItemSetting'
import { ListItemSelect } from '../components/ListItemSelect'
import { UpdateSetting } from '../components/UpdateSetting'
import { getOwnDevices } from '../models/accounts'
import { isRemoteUI } from '../helpers/uiHelper'
import { DesktopUI } from '../components/DesktopUI'
import { Container } from '../components/Container'
import { isRemote } from '../services/Browser'
import { TestUI } from '../components/TestUI'
import { Title } from '../components/Title'

export const OptionsPage: React.FC = () => {
  const { os, installing, cliVersion, preferences, thisDevice, notOwner, themeMode, remoteUI } = useSelector(
    (state: ApplicationState) => ({
      os: state.backend.environment.os,
      installing: state.binaries.installing,
      cliVersion: state.binaries.installedVersion || '(loading...)',
      preferences: state.backend.preferences,
      thisDevice: getOwnDevices(state).find(d => d.thisDevice),
      notOwner: !!state.backend.thisId && !getOwnDevices(state).find(d => d.thisDevice),
      themeMode: state.ui.themeMode,
      remoteUI: isRemoteUI(state),
    })
  )

  const { binaries, ui } = useDispatch<Dispatch>()

  return (
    <Container
      gutterBottom
      bodyProps={{ gutterTop: true }}
      header={
        <Typography variant="h1" gutterBottom>
          <Title>Application</Title>
        </Typography>
      }
    >
      <List>
        <ListItemSelect
          label="Theme"
          icon="palette"
          value={themeMode}
          options={[
            { label: 'Same as system', value: 'system' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]}
          onChange={e => ui.setTheme(e.target.value as ApplicationState['ui']['themeMode'])}
        />
        {isRemote() && (
          <ListItemSetting
            confirm={!preferences.remoteUIOverride}
            label="Show full interface"
            subLabel="Remote devices only show target configuration options. Enable for full access."
            icon="sliders-h"
            toggle={!!preferences.remoteUIOverride}
            confirmTitle="Are you sure?"
            confirmMessage={`New connections will be from ${
              thisDevice?.name || 'this device'
            } and not your local machine.`}
            onClick={() => emit('preferences', { ...preferences, remoteUIOverride: !preferences.remoteUIOverride })}
          />
        )}
        <DesktopUI>
          <ListItemSetting
            label="Open at login"
            icon="door-open"
            toggle={!!preferences.openAtLogin}
            onClick={() => emit('preferences', { ...preferences, openAtLogin: !preferences.openAtLogin })}
          />
          <ListItemSetting
            label="Named connections"
            subLabel="Use a remote.it HTTPS certificate to handle and name local connections"
            icon="file-certificate"
            toggle={!!preferences.useCertificate}
            onClick={() => emit('useCertificate', !preferences.useCertificate)}
            confirmMessage="Changing the certificate handling will require we restart the system agent. You will see a system prompt."
            confirmTitle="Continue?"
            confirm
          />
        </DesktopUI>
        <ListItemSetting
          label="Reset interactive guides"
          subLabel="Turn back on the in-app help bubbles."
          icon="sparkles"
          onClick={() => ui.resetHelp()}
        />
        {(os === 'mac' || os === 'windows') && (
          <DesktopUI>
            <ListItemSetting
              label="Auto update"
              icon="chevron-double-up"
              toggle={!!preferences.autoUpdate}
              onClick={() => emit('preferences', { ...preferences, autoUpdate: !preferences.autoUpdate })}
            />
            <TestUI>
              <ListItemSetting
                quote
                label="Update to pre-release builds"
                toggle={!!preferences.allowPrerelease}
                onClick={() => emit('preferences', { ...preferences, allowPrerelease: !preferences.allowPrerelease })}
              />
            </TestUI>
          </DesktopUI>
        )}
        <UpdateSetting />
      </List>
      {!remoteUI && (
        <DesktopUI>
          <AccordionMenuItem subtitle="Advanced" gutters>
            <List>
              <ListItemSetting
                label="Disable deep link handling"
                subLabel="You can disable deep link handling to fix a bug in Linux where the desktop app is set to open html file types."
                icon={preferences.disableDeepLinks ? 'link-slash' : 'link'}
                toggle={!!preferences.disableDeepLinks}
                onClick={() => emit('preferences', { ...preferences, disableDeepLinks: !preferences.disableDeepLinks })}
                confirm
                confirmMessage="Please restart the desktop application for changes to take affect. You may also have to reset your default file handler on Linux."
                confirmTitle="Restart required"
              />
              <SettingsDisableNetworkItem />
              <ListItemSetting
                confirm
                label={installing ? 'Installing...' : 'Re-install system agent'}
                subLabel={`Version ${cliVersion}`}
                disabled={installing}
                icon="terminal"
                confirmTitle="Are you sure?"
                confirmMessage="This will stop and attempt to re-install the system agent."
                onClick={() => binaries.install()}
              />
              <ListItemSetting
                confirm
                label="Uninstall"
                disabled={notOwner}
                subLabel={
                  'De-register this device, completely remove all saved data, and uninstall the system agent and command line tools. Do this before removing the application from your system. Can only be done by the device owner.'
                }
                icon="trash"
                confirmTitle="Are you sure?"
                confirmMessage="You will remove this system as a host, your connections and command line utilities."
                onClick={() => {
                  emit('uninstall')
                  ui.set({ waitMessage: 'uninstalling' })
                }}
              />
              <ListItemSetting
                label="Show support files"
                subLabel="Will show the folders that contain the application logs and config file."
                icon="folder"
                onClick={() => emit('showFolder', 'logs')}
              />
            </List>
          </AccordionMenuItem>
        </DesktopUI>
      )}
    </Container>
  )
}
