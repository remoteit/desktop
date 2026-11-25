import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import { sshCommand } from '../helpers/sshHelper'
import { inApp, openTerminal } from '../helpers/terminalHelper'
import { useReadAgain } from '../hooks/useReadAgain'
import { ConnectRoute, ConnectRouteVariant } from './ConnectRoute'

/* An SSH service with no agent here to reach it: a terminal opens in this app (pages/TerminalPage), its session carried
   by this browser's remote.it client — nothing to install, and no connection to start. From the desktop app it opens in
   the web portal (helpers/terminalHelper). The counterpart of LocalSubnetConnect, which is shown instead when an agent
   here does reach it. The plain ssh command of an app's service that signs people in by certificate (byCertificate) is
   offered to copy as well: it works from a machine signed in on its remote.it device app. */
// `service`: the service's id — whose sign-in serves it is looked at: the browser's client is the page's own person's.
type Props = {
  name: string
  port: number
  title?: string
  service: string
  byCertificate?: boolean
  variant?: ConnectRouteVariant
}

export const BrowserGatewayConnect: React.FC<Props> = ({
  name,
  port,
  title,
  service,
  byCertificate,
  variant = 'primary',
}) => {
  const { t } = useTranslation()
  // What the last try to open it came to: nothing is said of one that opened, or of none yet.
  const [opened, setOpened] = useState<ReturnType<typeof openTerminal>>(true)
  // Said of the sign-in serving the service then: not left up when another comes to serve it.
  const dropped = useReadAgain()
  useEffect(() => setOpened(true), [dropped])

  return (
    <ConnectRoute
      variant={variant}
      icon="terminal"
      label={t('connectRoute.openTerminal', 'Open terminal')}
      how={
        inApp()
          ? t('browserGatewayConnect.terminalNative', 'A terminal in your web browser. Nothing to install.')
          : t('browserGatewayConnect.terminalHow', 'A terminal in a new tab. Nothing to install.')
      }
      address={byCertificate ? sshCommand(name, port) : name}
      copyTitle={
        byCertificate ? t('connectRoute.copySsh', 'Copy ssh command') : t('connectRoute.copyAddress', 'Copy address')
      }
      onClick={() => setOpened(openTerminal({ name, port, title, service }))}
      error={
        opened === 'OTHER_SIGN_IN' &&
        t(
          'browserGatewayConnect.otherSignIn',
          'Only another account signed in here reaches this service. Connect through a public address instead.'
        )
      }
      details={
        byCertificate && (
          <Typography variant="caption" color="textSecondary" component="div">
            {t('localSubnetConnect.certificateHint', 'Works from any computer signed in to the Remote.It app.')}
          </Typography>
        )
      }
    />
  )
}
