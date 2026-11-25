import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Typography } from '@mui/material'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { IconButton } from '../buttons/IconButton'
import { useKnownWebAddress, useOpenWebAddress, useRecheck, useWebTarget } from '../hooks/useWebAddress'
import type { WebTarget } from '../services/webAddress'
import { Icon } from './Icon'

/* A web service with no agent here to reach it: opened at its web address (services/webAddress), through remote.it's
   proxy, signed in — with what that means for who can read it. The counterpart of LocalSubnetConnect, which is shown
   instead when an agent here does reach it. The address, once there is one, is shown and copied as a connection's is. */
export const WebAddressConnect: React.FC<{ service: IService; onOpened?: () => void }> = ({ service, onOpened }) => {
  const { t } = useTranslation()
  const { open, opening, failed } = useOpenWebAddress(service.id)
  const address = useKnownWebAddress(useWebTarget(service), true)

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
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {t('webAddress.title', 'Sign in and open in your browser')}
        </Typography>
        <Typography variant="caption" color="textSecondary" component="div">
          {t(
            'webAddress.caption',
            "Goes through remote.it's proxy, which can read it. Use the remote.it app for an end-to-end connection."
          )}
        </Typography>
        {address && (
          <Typography variant="body2" noWrap title={address}>
            {address.replace(/^https:\/\//, '')}
          </Typography>
        )}
        {failed && <WebAddressFailed reason={failed.reason} />}
      </Box>
      <IconButton
        icon={opening ? 'spinner-third' : 'launch'}
        spin={opening}
        color="primary"
        disabled={opening}
        title={t('webAddress.open', 'Open in the browser')}
        onClick={async () => (await open()) === true && onOpened?.()}
      />
      {address && <CopyIconButton value={address} color="primary" />}
    </Box>
  )
}

// A service that could not be checked for one (services/webAddress Unchecked): nothing is connected, and it is tried again.
export const WebAddressUnchecked: React.FC<{ target?: WebTarget }> = ({ target }) => {
  const { t } = useTranslation()
  const { checking, recheck } = useRecheck(target)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, paddingX: 2, paddingY: 1.25 }}>
      <Typography variant="caption" color="error" component="div" sx={{ minWidth: 0, flex: 1 }} role="alert">
        {t('webAddress.unchecked', 'Could not check how this service opens, so it was not connected. Try again.')}
      </Typography>
      <Button size="small" variant="contained" disabled={checking} onClick={recheck}>
        {t('webAddress.retry', 'Try again')}
      </Button>
    </Box>
  )
}

// What an address that did not open said: graphql's words, where it refused.
export const WebAddressFailed: React.FC<{ reason: string }> = ({ reason }) => {
  const { t } = useTranslation()
  return (
    <Typography variant="caption" color="error" component="div">
      {reason || t('webAddress.failed', 'Could not open it: try again')}
    </Typography>
  )
}
