import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { sshCommand } from '../helpers/sshHelper'
import { openTerminal } from '../helpers/terminalHelper'
import { Icon } from './Icon'
import { useReadAgain } from '../hooks/useReadAgain'

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
}

export const BrowserGatewayConnect: React.FC<Props> = ({ name, port, title, service, byCertificate }) => {
  const { t } = useTranslation()
  // What the last try to open it came to: nothing is said of one that opened, or of none yet.
  const [opened, setOpened] = useState<ReturnType<typeof openTerminal>>(true)
  // Said of the sign-in serving the service then: not left up when another comes to serve it.
  const dropped = useReadAgain()
  useEffect(() => setOpened(true), [dropped])

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
        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={name}>
          {name}
        </Typography>
        {opened === 'OTHER_SIGN_IN' && (
          <Typography variant="caption" color="error" component="div">
            {t(
              'browserGatewayConnect.otherSignIn',
              'Not in this browser: it is reached through another account signed in here. Use Connect instead.'
            )}
          </Typography>
        )}
        {byCertificate && (
          <Typography variant="caption" color="textSecondary" component="div" noWrap>
            {sshCommand(name, port)} —{' '}
            {t('localSubnetConnect.sshHint', 'Works from a machine signed in on its remote.it device app')}
          </Typography>
        )}
      </Box>
      {byCertificate && <CopyIconButton value={sshCommand(name, port)} color="primary" />}
      <IconButton
        icon="terminal"
        color="primary"
        title={t('browserGatewayConnect.terminal', 'Open a terminal')}
        onClick={() => setOpened(openTerminal({ name, port, title, service }))}
      />
    </Box>
  )
}
