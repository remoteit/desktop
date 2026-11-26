import React, { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import { Body } from './Body'
import { Icon } from './Icon'

const ICONS = { network: 'chart-network', exit: 'door-open', proxy: 'server', publicAddress: 'globe' }

let publicAddressCount: number | undefined
const listeners = new Set<() => void>()

// The public addresses page says how many it lists, so the pane beside it asks for one only while there are none.
export const setPublicAddressCount = (count: number | undefined) => {
  if (count === publicAddressCount) return
  publicAddressCount = count
  listeners.forEach(listener => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Beside the list of networks, exits, proxies or public addresses before one is chosen: what choosing one shows.
export const ChooseOne: React.FC<{ kind: keyof typeof ICONS }> = ({ kind }) => {
  const { t } = useTranslation()
  const addresses = useSyncExternalStore(subscribe, () => publicAddressCount)
  return (
    <Body center>
      <Icon name={ICONS[kind]} size="xxl" color="grayLight" />
      <Typography variant="body2" color="textSecondary" marginTop={2}>
        {kind === 'network'
          ? t('chooseOne.network', 'Choose a network to see its map, devices and people.')
          : kind === 'exit'
          ? t('chooseOne.exit', 'Choose an exit to see its devices and who can use it.')
          : kind === 'publicAddress'
          ? addresses
            ? t('chooseOne.publicAddressListed', 'Public addresses open your services from any browser.')
            : t('chooseOne.publicAddress', 'Add a public address to open a service from any browser.')
          : t('chooseOne.proxy', 'Choose a proxy server to see its devices and public addresses.')}
      </Typography>
    </Body>
  )
}
