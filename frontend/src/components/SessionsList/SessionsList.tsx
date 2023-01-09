import React from 'react'
import { Title } from '../Title'
import { NetworkListItem } from '../NetworkListItem'
import { NetworkListTitle } from '../NetworkListTitle'
import { StickyTitle } from '../StickyTitle'
import { List, Box } from '@mui/material'

export interface Props {
  networks: ILookup<INetwork>
  title: string
  action?: React.ReactNode
  forceConnected?: boolean
}

export const SessionsList: React.FC<Props> = ({ networks, title, action }) => {
  const networkKeys = Object.keys(networks)
  if (!networkKeys.length || (networkKeys.length && !networks[networkKeys[0]]?.sessions?.length)) return null
  return (
    <>
      <StickyTitle>
        <Title>{title}</Title>
        {action && <Box>{action}</Box>}
      </StickyTitle>
      {networkKeys.map(k => (
        <List key={k}>
          <NetworkListTitle network={networks[k]} noLink />
          {networks[k].sessions?.map((s, i) => (
            <NetworkListItem key={i} network={networks[k]} session={s} serviceId={s.target.id} external connections />
          ))}
        </List>
      ))}
    </>
  )
}
