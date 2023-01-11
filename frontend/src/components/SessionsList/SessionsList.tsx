import React from 'react'
import { Title } from '../Title'
import { SessionListItem } from '../SessionListItem'
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
  if (!networks) return null
  return (
    <>
      <StickyTitle>
        <Title>{title}</Title>
        {action && <Box>{action}</Box>}
      </StickyTitle>
      {Object.keys(networks).map(k => (
        <List key={k}>
          <NetworkListTitle network={networks[k]} noLink />
          {networks[k].sessions?.map((s, i) => (
            <SessionListItem key={i} session={s} serviceId={s.target.id} />
          ))}
        </List>
      ))}
    </>
  )
}
