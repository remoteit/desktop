import React from 'react'
import { Title } from './Title'
import { NetworkListItem } from './NetworkListItem'
import { Typography } from '@material-ui/core'

export interface Props {
  network?: INetwork
  action?: React.ReactElement
}

export const Network: React.FC<Props> = ({ network, action, ...props }) => {
  // if (!sessions.length && !action && !props.isNew) return null

  return (
    <>
      <Typography variant="subtitle1">
        <Title>{network?.name}</Title>
        {action}
      </Typography>
      <NetworkListItem title network={network} {...props} />
      {network?.serviceIds.map(id => (
        <NetworkListItem serviceId={id} key={id} {...props} />
      ))}
    </>
  )
}
