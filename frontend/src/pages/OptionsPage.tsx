import React from 'react'
import browser from '../services/browser'
import { emit } from '../services/Controller'
import { State, Dispatch } from '../store'
import { List, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { SettingsDisableNetworkItem } from '../components/SettingsDisableNetworkItem'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { selectOwnDevices } from '../selectors/devices'
import { ListItemSetting } from '../components/ListItemSetting'
import { ListItemSelect } from '../components/ListItemSelect'
import { UpdateSetting } from '../components/UpdateSetting'
import { isRemoteUI } from '../helpers/uiHelper'
import { DesktopUI } from '../components/DesktopUI'
import { Container } from '../components/Container'
import { ColorChip } from '../components/ColorChip'
import { Title } from '../components/Title'

export const OptionsPage: React.FC = () => {
  const os = useSelector((state: State) => state.backend.environment.os)
  const installing = useSelector((state: State) => state.binaries.installing)
  const cliVersion = useSelector((state: State) => state.binaries.installedVersion || '(loading...)')
  const preferences = useSelector((state: State) => state.backend.preferences)
  const thisDevice = useSelector((state: State) => selectOwnDevices(state).find(d => d.thisDevice))
  const notOwner = useSelector(
    (state: State) => !!state.backend.thisId && !selectOwnDevices(state).find(d => d.thisDevice)
  )
  const themeMode = useSelector((state: State) => state.ui.themeMode)
  const remoteUI = useSelector((state: State) => isRemoteUI(state))
  const { t } = useTranslation()

  const { binaries, ui } = useDispatch<Dispatch>()

  return (
    <Container
      gutterBottom
      bodyProps={{ gutterTop: true, verticalOverflow: true }}
      header={
        <Typography variant="h1" gutterBottom>
          <Title>{t('options.title', 'Application')}</Title>
        </Typography>
      }
    >
      <List>
        <ListItemSelect
          label={t('options.theme.label', 'Theme')}
          icon="palette"
          value={themeMode}
          options={[
            { label: t('options.theme.system', 'Same as system'), value: 'system' },
            { label: t('options.theme.light', 'Light'), value: 'light' },
            { label: t('options.theme.dark', 'Dark'), value: 'dark' },
          ]}
          onChange={e => ui.setTheme(e.target.value as State['ui']['themeMode'])}
        />
        {browser.isRemote && (
          <ListItemSetting
            confirm={!preferences.remoteUIOverride}
            label={t('options.showFullInterface.label', 'Show full interface')}
            subLabel={t(
              'options.showFullInterface.subLabel',
              'Remote devices only show target configuration options. Enable for full access.'
            )}
            icon="sliders-h"
            toggle={!!preferences.remoteUIOverride}
            onClick={() => emit('preferences', { ...preferences, remoteUIOverride: !preferences.remoteUIOverride })}
            confirmProps={{
              title: t('common.areYouSure', 'Are you sure?'),
              children: t('options.showFullInterface.confirm', {
                device: thisDevice?.name || t('options.thisDevice', 'this device'),
                defaultValue: 'New connections will be from {{device}} and not your local machine.',
              }),
            }}
          />
        )}
        <DesktopUI>
          <ListItemSetting
            label={t('options.openAtLogin', 'Open at login')}
            icon="door-open"
            toggle={!!preferences.openAtLogin}
            onClick={() => emit('preferences', { ...preferences, openAtLogin: !preferences.openAtLogin })}
          />
          <ListItemSetting
            label={t('options.sshConfig.label', 'Managed SSH config')}
            subLabel={t(
              'options.sshConfig.subLabel',
              "Allow Remote.it to include it's managed SSH config file for easier access to your devices."
            )}
            icon="terminal"
            toggle={!!preferences.sshConfig}
            onClick={() => emit('sshConfig', !preferences.sshConfig)}
            secondaryContentWidth="140px"
            secondaryContent={<ColorChip label="BETA" size="small" color="primary" variant="contained" />}
          />
          <ListItemSetting
            confirm
            label={t('options.namedConnections.label', 'Named connections')}
            subLabel={t(
              'options.namedConnections.subLabel',
              'Use a Remote.It HTTPS certificate to handle and name local connections'
            )}
            icon="file-certificate"
            toggle={!!preferences.useCertificate}
            onClick={() => emit('useCertificate', !preferences.useCertificate)}
            confirmProps={{
              title: t('options.namedConnections.confirmTitle', 'Continue?'),
              children: t(
                'options.namedConnections.confirm',
                'Changing the certificate handling will require we restart all connections.'
              ),
            }}
          />
        </DesktopUI>
        <ListItemSetting
          label={t('options.resetGuides.label', 'Reset interactive guides')}
          subLabel={t('options.resetGuides.subLabel', 'Turn back on the in-app help bubbles.')}
          icon="sparkles"
          onClick={() => ui.resetHelp()}
        />
        <UpdateSetting preferences={preferences} os={os} />
      </List>
      {!remoteUI && (
        <DesktopUI>
          <AccordionMenuItem subtitle={t('options.advanced', 'Advanced')} gutters>
            <List>
              <ListItemSetting
                label={t('options.clearErrors.label', 'Clear all connection errors')}
                subLabel={t(
                  'options.clearErrors.subLabel',
                  'Will leave connections all unchanged, but clear the saved error messages.'
                )}
                icon="broom-wide"
                onClick={() => emit('service/clearErrors')}
              />
              <ListItemSetting
                label={t('options.disableDeepLinks.label', 'Disable deep link handling')}
                subLabel={t(
                  'options.disableDeepLinks.subLabel',
                  'You can disable deep link handling to fix a bug in Linux where the desktop app is set to open html file types.'
                )}
                icon={preferences.disableDeepLinks ? 'link-slash' : 'link'}
                toggle={!!preferences.disableDeepLinks}
                onClick={() => emit('preferences', { ...preferences, disableDeepLinks: !preferences.disableDeepLinks })}
                confirm
                confirmProps={{
                  title: t('options.disableDeepLinks.confirmTitle', 'Restart required'),
                  children: t(
                    'options.disableDeepLinks.confirm',
                    'Please restart the desktop application for changes to take affect. You may also have to reset your default file handler on Linux.'
                  ),
                }}
              />
              <SettingsDisableNetworkItem />
              <ListItemSetting
                confirm
                label={
                  installing
                    ? t('options.reinstallAgent.installing', 'Installing...')
                    : t('options.reinstallAgent.label', 'Re-install system agent')
                }
                subLabel={t('options.reinstallAgent.version', { version: cliVersion, defaultValue: 'Version {{version}}' })}
                disabled={installing}
                icon="terminal"
                onClick={() => binaries.install()}
                confirmProps={{
                  title: t('common.areYouSure', 'Are you sure?'),
                  children: t('options.reinstallAgent.confirm', 'This will stop and attempt to re-install the system agent.'),
                }}
              />
              {os !== 'windows' && (
                <ListItemSetting
                  confirm
                  label={t('options.uninstall.label', 'Uninstall')}
                  disabled={notOwner}
                  subLabel={t(
                    'options.uninstall.subLabel',
                    'De-register this device, completely remove all saved data, and uninstall the system agent and command line tools. Do this before removing the application from your system. Can only be done by the device owner.'
                  )}
                  icon="trash"
                  confirmProps={{
                    title: t('common.areYouSure', 'Are you sure?'),
                    children: t(
                      'options.uninstall.confirm',
                      'You will remove this system as a host, your connections and command line utilities.'
                    ),
                  }}
                  onClick={() => {
                    emit('uninstall')
                    ui.set({ waitMessage: 'uninstalling' })
                  }}
                />
              )}
              <ListItemSetting
                label={t('options.showSupportFiles.label', 'Show support files')}
                subLabel={t(
                  'options.showSupportFiles.subLabel',
                  'Will show the folders that contain the application logs and config file.'
                )}
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
