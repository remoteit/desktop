import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { LocalSubnetName } from '../services/localSubnet'
import { Icon } from './Icon'

/* A service reached by its name on this machine: the device daemon here resolves it (services/localSubnet), so there
   is nothing to start — the name and port are the connection. Copy it into ssh, a browser, a database client. */
export const LocalSubnetConnect: React.FC<{ local: LocalSubnetName; port?: number }> = ({ local, port }) => {
  const { t } = useTranslation()
  const endpoint = port ? `${local.name}:${port}` : local.name

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
      <Icon name="laptop" color="primary" />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="textSecondary" component="div">
          {t('localSubnetConnect.title', 'On this machine — no connection to start')}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={endpoint}>
          {endpoint}
        </Typography>
        <Typography variant="caption" color="textSecondary" component="div">
          {t('localSubnetConnect.address', 'resolves here to {{address}}', { address: local.address })}
        </Typography>
      </Box>
      <CopyIconButton value={endpoint} color="primary" />
    </Box>
  )
}
