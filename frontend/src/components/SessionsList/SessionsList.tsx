import React from 'react'
import { Title } from '../Title'
import { NetworkListItem } from '../NetworkListItem'
import { NetworkListTitle } from '../NetworkListTitle'
import { StickyTitle } from '../StickyTitle'
import { List, Box } from '@mui/material'

export interface Props {
  networks?: ILookup<INetwork>
  title: string
  action?: React.ReactNode
  forceConnected?: boolean
}

export const SessionsList: React.FC<Props> = ({ networks, title, action }) => {
  if (!networks || !Object.keys(networks).length) return null
  return (
    <>
      <StickyTitle>
        <Title>{title}</Title>
        {action && <Box>{action}</Box>}
      </StickyTitle>
      {Object.keys(networks).map(k => (
        <List key={k}>
          <NetworkListTitle network={networks[k]} enabled noLink />
          {networks[k].sessions?.map((s, i) => (
            <NetworkListItem key={i} serviceId={s.target.id} network={networks[k]} session={s} connectionsPage />
          ))}
        </List>
      ))}
    </>
  )
}
