import React from 'react'
import { Title } from '../Title'
import { NetworkListItem } from '../NetworkListItem'
import { NetworkListTitle } from '../NetworkListTitle'
import { Typography, List, Box } from '@mui/material'

export interface Props {
  networks: ILookup<INetwork>
  title: string
  action?: React.ReactNode
  forceConnected?: boolean
}

export const SessionsList: React.FC<Props> = ({ networks, title, action }) => {
  const networkKeys = Object.keys(networks)
  // @ts-ignore
  if (!networkKeys.length || (networkKeys.length && !networks[networkKeys[0]]?.sessions.length)) return null
  return (
    <>
      <Typography variant="subtitle1">
        <Title>{title}</Title>
        {action && <Box>{action}</Box>}
      </Typography>
      {networkKeys.map(k => (
        <List key={k}>
          <NetworkListTitle network={networks[k]} />
          {networks[k].sessions?.map((s, i) => (
            <NetworkListItem key={i} network={networks[k]} session={s} serviceId={s.target.id} external />
          ))}
        </List>
      ))}
    </>
  )
}
