import React from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Button, Typography } from '@mui/material'
import { DeviceApp, DeviceAppService } from '../services/graphQLDeviceApps'
import { ServiceApp, useServiceApp } from '../hooks/useDeviceApps'
import { useAppSwitch } from './AppRootConsent'
import { useSubnetName } from '../hooks/useLocalSubnetName'
import { opensTerminal } from '../helpers/sshHelper'
import { inApp, openTerminal, terminalReaches } from '../helpers/terminalHelper'
import { useReadAgain } from '../hooks/useReadAgain'
import { IconButton } from '../buttons/IconButton'
import { Link } from './Link'
import { Icon } from './Icon'

/* An app's service opened in our web SSH (pages/TerminalPage), for any app's service that is ssh where the app signs
   people in by remote.it certificate (helpers/sshHelper opensTerminal) — from wherever it is picked: the device's Apps
   section and the app's page there, its service's row in the device's services and its connect panel. Always the
   same: the device's name in device subnets, the service's port, the person's own account and a certificate for it,
   and the host key the device reports for the app, which the terminal checks. An option beside the service's own ways
   to connect, which stay as they are. Nothing where the device has no name in device subnets or the API has no apps.
   From an app, the menu's embedded portal too, it opens in the web portal, in the system browser (helpers/terminalHelper). */

function open(app: DeviceApp, serviceId: string, name: string, port: number) {
  openTerminal({ name, port, title: app.name, service: serviceId })
}

const label = (t: TFunction) =>
  inApp()
    ? t('appTerminal.openInBrowser', 'Open in web SSH, in your browser')
    : t('appTerminal.open', 'Open in web SSH')

const servicePort = (device: IDevice | undefined, serviceId: string | null) =>
  device?.services?.find(service => service.id === serviceId)?.port

/** Open terminal, in the device's Apps section and on the app's page there, for one of its services: while it runs. */
export const AppTerminalAction: React.FC<{ device: IDevice; app: DeviceApp; service: DeviceAppService }> = ({
  device,
  app,
  service,
}) => {
  const { t } = useTranslation()
  // Whether the terminal reaches the service is whose sign-in serves it: looked at again when that changes.
  useReadAgain()
  const terminal = opensTerminal(app, service)
  const name = useSubnetName(terminal ? device.id : undefined)
  const port = servicePort(device, service.serviceId)
  if (!terminal || app.state !== 'running' || !name || !port || !service.serviceId) return null
  // Not offered for a service only another sign-in reaches: the terminal's session is the page's own person's.
  if (!terminalReaches(service.serviceId)) return null
  const serviceId = service.serviceId
  return (
    <Button size="small" variant="contained" onClick={() => open(app, serviceId, name, port)} data-app-terminal>
      {t('deviceApps.openTerminal', 'Open terminal')}
    </Button>
  )
}

/** A service's row in its device's services: a terminal button while its app runs. */
export const AppTerminalButton: React.FC<{ device: IDevice; service: IService }> = ({ device, service }) => {
  const { t } = useTranslation()
  const { app, appService } = useServiceApp(device, service)
  useReadAgain()
  const terminal = opensTerminal(app, appService)
  const name = useSubnetName(terminal ? device.id : undefined)
  const port = service.port
  if (!app || !terminal || app.state !== 'running' || appService?.serviceId !== service.id || !name || !port) return null
  if (!terminalReaches(service.id)) return null
  return (
    <IconButton
      icon="terminal"
      size="base"
      color="primary"
      title={label(t)}
      onClick={event => {
        // The row opens the service's page: the button is not the row.
        event.stopPropagation()
        open(app, service.id, name, port)
      }}
    />
  )
}

/** A service's connect panel, where its app opens a terminal (serving: useServiceApp, read by the panel): Open in web
 *  SSH while the app runs, whichever way the panel connects it — its name on this machine, the browser's client (where
 *  the panel's own terminal button is this too) or the proxy; otherwise what the app is doing — and, for those who may
 *  run code on the device (Manage and Scripting), turning it on, with their yes to its running as root
 *  (components/AppRootConsent). */
export const AppTerminalOption: React.FC<{ device?: IDevice; service?: IService; serving: ServiceApp }> = ({
  device,
  service,
  serving: { app, appService, switching, turn, setRelease },
}) => {
  const { t } = useTranslation()
  useReadAgain()
  const terminal = opensTerminal(app, appService)
  const name = useSubnetName(terminal ? device?.id : undefined)
  const { flip, consent } = useAppSwitch({ turn, setRelease }, undefined, undefined, device?.accountId)
  if (!app || !terminal || !name) return null
  // Not where its product holds it off: graphql refuses that, naming the product.
  const canTurnOn =
    !app.locked && !!device?.permissions?.includes('MANAGE') && !!device?.permissions?.includes('SCRIPTING')

  const port = service?.port
  if (app.state === 'running' && !switching) {
    const serviceId = appService?.serviceId
    if (!serviceId || !port || !terminalReaches(serviceId)) return null
    return (
      <Typography variant="caption" component="div" sx={{ marginTop: 0.75, textAlign: 'right' }}>
        <Link onClick={() => open(app, serviceId, name, port)}>
          <Icon name="terminal" size="sm" />
          {label(t)}
        </Link>
      </Typography>
    )
  }

  const status = switching
    ? t('deviceApps.switching', 'Waiting for the device…')
    : app.state === 'starting'
    ? t('appTerminal.starting', '{{app}} is starting: web SSH opens it once it runs', { app: app.name })
    : app.state === 'unavailable'
    ? t('deviceApps.unavailable', 'Not available here: {{detail}}', { detail: app.detail })
    : t('appTerminal.disabled', '{{app}} is disabled: enable it to open it in web SSH', { app: app.name })

  return (
    <Typography
      variant="caption"
      component="div"
      color={app.state === 'unavailable' && !switching ? 'error' : 'textSecondary'}
      sx={{ marginTop: 0.75, textAlign: 'right' }}
      data-app-terminal-status={app.state}
    >
      {status}
      {app.state === 'disabled' && !switching && canTurnOn && (
        <>
          {' '}
          <Link onClick={() => flip(app, true)}>{t('appTerminal.enable', 'Enable it')}</Link>
        </>
      )}
      {consent}
    </Typography>
  )
}
