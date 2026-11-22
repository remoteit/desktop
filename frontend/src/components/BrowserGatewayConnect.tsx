import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import { sshCommand } from '../helpers/sshHelper'
import { gatewayURL, openThroughGateway } from '../services/browserGateway'
import browser from '../services/browser'
import { openTerminal } from '../helpers/terminalHelper'
import { ConnectRoute, ConnectRouteVariant } from './ConnectRoute'

/* A web service with no agent here to reach it (services/browserGateway): it opens in its own tab, carried by this
   browser's remote.it client — nothing to install, and no connection to start. An SSH service opens a terminal in
   this app instead (pages/TerminalPage), its session through the same client — from the desktop app, in the web
   portal (helpers/terminalHelper). The counterpart of LocalSubnetConnect,
   which is shown instead when an agent here does reach it. The plain ssh command of an app's service that signs people
   in by certificate (byCertificate) is offered to copy as well: it works from a machine signed in on its remote.it
   device app. */
type Props = {
  name: string
  terminal?: { port: number; title?: string; service?: string; byCertificate?: boolean }
  reachable?: boolean
  variant?: ConnectRouteVariant
}

export const BrowserGatewayConnect: React.FC<Props> = ({ name, terminal, reachable, variant = 'primary' }) => {
  const { t } = useTranslation()
  const [opening, setOpening] = useState(false)
  const [failed, setFailed] = useState(false)
  const address = terminal
    ? terminal.byCertificate
      ? sshCommand(name, terminal.port)
      : name
    : gatewayURL(name)
        .replace(/^https:\/\//, '')
        .replace(/\/$/, '')

  const open = async () => {
    if (terminal) return openTerminal({ name, port: terminal.port, title: terminal.title, service: terminal.service })
    setOpening(true)
    setFailed(!(await openThroughGateway(name)))
    setOpening(false)
  }

  const how = terminal
    ? browser.isNative
      ? t('browserGatewayConnect.terminalNative', 'A terminal in your web browser. Nothing to install.')
      : t('browserGatewayConnect.terminalHow', 'A terminal in a new tab. Nothing to install.')
    : reachable === false
    ? t('browserGatewayConnect.unreachable', "This address doesn't open from here yet. Use another way below.")
    : browser.isIOSDeviceApp
    ? t('browserGatewayConnect.howExternal', 'Opens in your web browser. Nothing to install.')
    : t('browserGatewayConnect.how', 'Opens in a new tab. Nothing to install.')

  return (
    <ConnectRoute
      variant={variant}
      icon={terminal ? 'terminal' : 'globe'}
      label={
        terminal ? t('connectRoute.openTerminal', 'Open terminal') : t('connectRoute.openBrowser', 'Open in browser')
      }
      how={how}
      address={address}
      copyTitle={
        terminal?.byCertificate
          ? t('connectRoute.copySsh', 'Copy ssh command')
          : t('connectRoute.copyAddress', 'Copy address')
      }
      onClick={open}
      loading={opening}
      error={failed && t('browserGatewayConnect.failedRetry', "Couldn't open it. Try again.")}
      details={
        terminal?.byCertificate && (
          <Typography variant="caption" color="textSecondary" component="div">
            {t('localSubnetConnect.certificateHint', 'Works from any computer signed in to the Remote.It app.')}
          </Typography>
        )
      }
    />
  )
}
