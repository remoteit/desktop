import React from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Typography } from '@mui/material'
import browser from '../services/browser'
import { DeviceApp } from '../services/graphQLDeviceApps'
import { settingLocked } from '../services/graphQLDeviceSettings'
import { useDeviceApps } from '../hooks/useDeviceApps'
import { useSubnetName } from '../hooks/useLocalSubnetName'
import { isConsoleService } from '../helpers/sshHelper'
import { openTerminal } from '../helpers/terminalHelper'
import { IconButton } from '../buttons/IconButton'
import { Link } from './Link'
import { Icon } from './Icon'

/* The console's service opened in our web SSH (pages/TerminalPage) from wherever it is picked — its row in the device's
   services and its connect panel — as the device's Apps section opens it: the device's name in device subnets, the
   console's port, its login by certificate and the host key the device reports. An option beside the service's own
   ways to connect, which stay as they are. The service is the console's when its host is the console's (graphql
   CONSOLE_HOST, helpers/sshHelper) and, once the device's apps are read, it is the service the console app names.
   Nothing where the device has no name in device subnets or the API has no apps — as in the Apps section. From the
   desktop and mobile apps it opens in the web portal, in the system browser (helpers/terminalHelper). */

type Target = { app?: DeviceApp; name?: string }

function useConsoleTarget(device?: IDevice, service?: IService) {
  const isConsole = isConsoleService(service)
  const apps = useDeviceApps(isConsole ? device?.id : undefined)
  const name = useSubnetName(isConsole ? device?.id : undefined)
  const app = apps.console
  // A console app that names another service is not this one's: an earlier console service, stopped.
  const mine = !!app && (!app.serviceId || app.serviceId === service?.id)
  return { apps, target: (isConsole && mine && name ? { app, name } : {}) as Target }
}

function open(t: TFunction, { app, name }: Target) {
  if (!app?.serviceId || !app.port || !name) return
  openTerminal({ name, port: app.port, title: t('deviceApps.console', 'Console'), service: app.serviceId })
}

const label = (t: TFunction) =>
  browser.isNative
    ? t('consoleTerminal.openInBrowser', 'Open in web SSH, in your browser')
    : t('consoleTerminal.open', 'Open in web SSH')

/** The console's row in a device's services: a terminal button while the console runs. */
export const ConsoleTerminalButton: React.FC<{ device: IDevice; service: IService }> = ({ device, service }) => {
  const { t } = useTranslation()
  const { target } = useConsoleTarget(device, service)
  if (target.app?.state !== 'running' || !target.app.serviceId || !target.app.port) return null
  return (
    <IconButton
      icon="terminal"
      size="base"
      color="primary"
      title={label(t)}
      onClick={event => {
        // The row opens the service's page: the button is not the row.
        event.stopPropagation()
        open(t, target)
      }}
    />
  )
}

/** The console's connect panel: Open in web SSH while the console runs, whichever way the panel connects it — its
 *  name on this machine, the browser's client (where the panel's own terminal button is this too) or the proxy;
 *  otherwise what it is doing — and, for those who manage the device, turning it on. */
export const ConsoleTerminalOption: React.FC<{ device?: IDevice; service?: IService }> = ({ device, service }) => {
  const { t } = useTranslation()
  const {
    apps: { switching, turn, consoleSetting },
    target,
  } = useConsoleTarget(device, service)
  const { app } = target
  if (!app) return null
  const canManage = !!device?.permissions?.includes('MANAGE') && !settingLocked(consoleSetting)

  if (app.state === 'running' && !switching) {
    if (!app.serviceId || !app.port) return null
    return (
      <Typography variant="caption" component="div" sx={{ marginTop: 0.75, textAlign: 'right' }}>
        <Link onClick={() => open(t, target)}>
          <Icon name="terminal" size="sm" />
          {label(t)}
        </Link>
      </Typography>
    )
  }

  const status = switching
    ? t('deviceApps.switching', 'Waiting for the device…')
    : app.state === 'starting'
    ? t('consoleTerminal.starting', 'The console is starting: web SSH opens it once it runs')
    : app.state === 'unavailable'
    ? t('deviceApps.unavailable', 'Not available here: {{detail}}', { detail: app.detail })
    : t('consoleTerminal.off', 'The console is off: turn it on to open it in web SSH')

  return (
    <Typography
      variant="caption"
      component="div"
      color={app.state === 'unavailable' && !switching ? 'error' : 'textSecondary'}
      sx={{ marginTop: 0.75, textAlign: 'right' }}
    >
      {status}
      {app.state === 'off' && !switching && canManage && (
        <>
          {' '}
          <Link onClick={() => turn(app, true)}>{t('consoleTerminal.turnOn', 'Turn it on')}</Link>
        </>
      )}
    </Typography>
  )
}
