import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { sshCommand } from '../helpers/sshHelper'
import { gatewayURL, openThroughGateway } from '../services/browserGateway'
import { Icon } from './Icon'

/* A web service with no agent here to reach it (services/browserGateway): it opens in its own tab, carried by this
   browser's remote.it client — nothing to install, and no connection to start. An SSH service opens a terminal in
   this app instead (pages/TerminalPage), its session through the same client. The counterpart of LocalSubnetConnect,
   which is shown instead when an agent here does reach it. The console's plain ssh command is offered to copy as well:
   it works from a machine signed in on its remote.it device app. */
type Props = { name: string; terminal?: { port: number; title?: string; service?: string; console?: boolean } }

export const BrowserGatewayConnect: React.FC<Props> = ({ name, terminal }) => {
  const { t } = useTranslation()
  const [opening, setOpening] = useState(false)
  const [failed, setFailed] = useState(false)
  const address = gatewayURL(name)
    .replace(/^https:\/\//, '')
    .replace(/\/$/, '')

  const open = async () => {
    // An SSH service: a terminal in this app, its session through the browser's client.
    if (terminal) {
      const query = new URLSearchParams({ name, port: String(terminal.port), title: terminal.title || name })
      if (terminal.service) query.set('service', terminal.service)
      window.open(`${location.origin}${location.pathname}#/terminal?${query}`, '_blank')
      return
    }
    setOpening(true)
    setFailed(!(await openThroughGateway(name)))
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
          {t('browserGatewayConnect.title', 'In this browser — nothing to install')}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={address}>
          {address}
        </Typography>
        {failed && (
          <Typography variant="caption" color="error" component="div">
            {t('browserGatewayConnect.failed', 'Could not open it: try again')}
          </Typography>
        )}
        {terminal?.console && (
          <Typography variant="caption" color="textSecondary" component="div" noWrap>
            {sshCommand(name, terminal.port)} —{' '}
            {t('localSubnetConnect.sshHint', 'Works from a machine signed in on its remote.it device app')}
          </Typography>
        )}
      </Box>
      {terminal?.console && <CopyIconButton value={sshCommand(name, terminal.port)} color="primary" />}
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
