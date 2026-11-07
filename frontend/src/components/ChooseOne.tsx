import React from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import { Body } from './Body'
import { Icon } from './Icon'

// Beside the list of exits or proxies before one is chosen: what choosing one shows.
export const ChooseOne: React.FC<{ kind: 'proxy' | 'exit' }> = ({ kind }) => {
  const { t } = useTranslation()
  return (
    <Body center>
      <Icon name={kind === 'exit' ? 'door-open' : 'server'} size="xxl" color="grayLight" />
      <Typography variant="body2" color="textSecondary" marginTop={2}>
        {kind === 'exit'
          ? t('chooseOne.exit', 'Choose an exit to see the devices it runs on, those using it, and who it is shared with.')
          : t('chooseOne.proxy', 'Choose a proxy to see its host, its endpoints and the devices it runs on.')}
      </Typography>
    </Body>
  )
}
