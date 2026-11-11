import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { ListedPort } from '../services/thisDevice'
import { listedHostPort, listedLine } from '../services/localPorts'

/* Local ports of this machine as its daemon lists them to the OS account the app runs in (services/localPorts
   listedPorts), each a line in the words of connectd's menu: its address → what it reaches (whose; its state where it
   is not served). Its address is copied, as the menu copies it — not one that answers no one. */
export const LocalPortsListed: React.FC<{ ports: ListedPort[] }> = ({ ports }) => {
  const { t } = useTranslation()
  if (!ports.length) return null
  return (
    <Box data-testid="local-ports-listed" sx={{ marginTop: 0.75 }}>
      <Typography variant="caption" color="textSecondary" component="div">
        {t('localPortsListed.title', 'Also on a local port of this machine')}
      </Typography>
      {ports.map(p => {
        const line = listedLine(p, t)
        return (
          <Box key={p.id} data-port={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 28 }}>
            <Typography variant="caption" component="div" noWrap title={line} sx={{ flex: 1, minWidth: 0 }}>
              {line}
            </Typography>
            {!p.noOne && <CopyIconButton value={listedHostPort(p)} size="sm" color="primary" />}
          </Box>
        )
      })}
    </Box>
  )
}
