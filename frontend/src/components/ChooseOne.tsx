import React from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import { Body } from './Body'
import { Icon } from './Icon'

const ICONS = { network: 'chart-network', exit: 'door-open', proxy: 'server' }

// Beside the list of networks, exits or proxies before one is chosen: what choosing one shows.
export const ChooseOne: React.FC<{ kind: 'network' | 'proxy' | 'exit' }> = ({ kind }) => {
  const { t } = useTranslation()
  return (
    <Body center>
      <Icon name={ICONS[kind]} size="xxl" color="grayLight" />
      <Typography variant="body2" color="textSecondary" marginTop={2}>
        {kind === 'network'
          ? t('chooseOne.network', 'Choose a network to see its map, devices and people.')
          : kind === 'exit'
          ? t('chooseOne.exit', 'Choose an exit to see its devices and who can use it.')
          : t('chooseOne.proxy', 'Choose a proxy server to see its devices and public addresses.')}
      </Typography>
    </Body>
  )
}
