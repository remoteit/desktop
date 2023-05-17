import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { Typography, List } from '@mui/material'
import { NetworkListTitle } from './NetworkListTitle'
import { ClearButton } from '../buttons/ClearButton'
import { Gutters } from './Gutters'
import { Tags } from './Tags'

export const NetworksJoined: React.FC<{ service?: IService; networks: INetwork[] }> = ({ service, networks }) => {
  const dispatch = useDispatch<Dispatch>()

  if (!networks.length)
    return (
      <Gutters top="sm" bottom="sm">
        <Typography variant="body2" color="textSecondary">
          None
        </Typography>
      </Gutters>
    )

  return (
    <List disablePadding>
      {networks.map(network => (
        <NetworkListTitle key={network.id} network={network}>
          <Tags tags={network?.tags || []} max={0} small />
          <ClearButton onClick={() => dispatch.networks.remove({ serviceId: service?.id, networkId: network.id })} />
        </NetworkListTitle>
      ))}
    </List>
  )
}
