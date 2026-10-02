import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { gatewayURL, openThroughGateway } from '../services/browserGateway'
import { Icon } from './Icon'

/* A web service with no agent here to reach it (services/browserGateway): it opens in its own tab, carried by this
   browser's remote.it client — nothing to install, and no connection to start. The counterpart of LocalSubnetConnect,
   which is shown instead when an agent here does reach it. */
type Props = { name: string; service?: IService }

export const BrowserGatewayConnect: React.FC<Props> = ({ name, service }) => {
  const { t } = useTranslation()
  const [opening, setOpening] = useState(false)
  const [failed, setFailed] = useState(false)
  const address = gatewayURL(name, service?.port)
    .replace(/^https:\/\//, '')
    .replace(/\/$/, '')

  const open = async () => {
    setOpening(true)
    setFailed(!(await openThroughGateway(name, service?.port)))
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
      </Box>
      <IconButton
        icon={opening ? 'spinner-third' : 'launch'}
        spin={opening}
        color="primary"
        disabled={opening}
        title={t('browserGatewayConnect.launch', 'Open in a new tab')}
        onClick={open}
      />
    </Box>
  )
}
