import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { sshCommand } from '../helpers/sshHelper'
import { OTHER_SIGN_IN, GatewayOpened, gatewayURL, openThroughGateway } from '../services/browserGateway'
import browser from '../services/browser'
import { openTerminal } from '../helpers/terminalHelper'
import { Icon } from './Icon'

/* A web service with no agent here to reach it (services/browserGateway): it opens in its own tab, carried by this
   browser's remote.it client — nothing to install, and no connection to start. An SSH service opens a terminal in
   this app instead (pages/TerminalPage), its session through the same client — from the desktop app, in the web
   portal (helpers/terminalHelper). The counterpart of LocalSubnetConnect,
   which is shown instead when an agent here does reach it. The plain ssh command of an app's service that signs people
   in by certificate (byCertificate) is offered to copy as well: it works from a machine signed in on its remote.it
   device app. */
// `service`: the service's id — whose sign-in serves it is looked at: the browser's client is the page's own person's.
type Props = {
  name: string
  service?: string
  terminal?: { port: number; title?: string; service?: string; byCertificate?: boolean }
}

export const BrowserGatewayConnect: React.FC<Props> = ({ name, service, terminal }) => {
  const { t } = useTranslation()
  const [opening, setOpening] = useState(false)
  // What the last try to open it came to: nothing is said of one that opened, or of none yet.
  const [opened, setOpened] = useState<GatewayOpened>(true)
  const external = !terminal && browser.isIOSDeviceApp
  const address = gatewayURL(name)
    .replace(/^https:\/\//, '')
    .replace(/\/$/, '')

  const open = async () => {
    // An SSH service: a terminal in this app, its session through the browser's client.
    if (terminal) return openTerminal({ name, port: terminal.port, title: terminal.title, service: terminal.service })
    setOpening(true)
    setOpened(await openThroughGateway(name, service))
    setOpening(false)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        paddingX: 2,
        paddingY: 1.25,
        borderRadius: 1,
        bgcolor: 'primaryHighlight.main',
      }}
    >
      <Icon name="globe" color="primary" />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="textSecondary" component="div">
          {external
            ? t('localSubnetConnect.launch', 'Open in the browser')
            : t('browserGatewayConnect.title', 'In this browser — nothing to install')}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={address}>
          {address}
        </Typography>
        {opened !== true && (
          <Typography variant="caption" color="error" component="div">
            {opened === OTHER_SIGN_IN
              ? t(
                  'browserGatewayConnect.otherSignIn',
                  'Not in this browser: it is reached through another account signed in here. Use Connect instead.'
                )
              : t('browserGatewayConnect.failed', 'Could not open it: try again')}
          </Typography>
        )}
        {terminal?.byCertificate && (
          <Typography variant="caption" color="textSecondary" component="div" noWrap>
            {sshCommand(name, terminal.port)} —{' '}
            {t('localSubnetConnect.sshHint', 'Works from a machine signed in on its remote.it device app')}
          </Typography>
        )}
      </Box>
      {terminal?.byCertificate && <CopyIconButton value={sshCommand(name, terminal.port)} color="primary" />}
      <IconButton
        icon={opening ? 'spinner-third' : terminal ? 'terminal' : 'launch'}
        spin={opening}
        color="primary"
        disabled={opening}
        title={
          terminal
            ? t('browserGatewayConnect.terminal', 'Open a terminal')
            : t('browserGatewayConnect.launch', 'Open in a new tab')
        }
        onClick={open}
      />
    </Box>
  )
}
