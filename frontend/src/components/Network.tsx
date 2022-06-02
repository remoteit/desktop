import React from 'react'
import { NetworkListItem } from './NetworkListItem'

export interface Props {
  network?: INetwork
}

export const Network: React.FC<Props> = props => {
  // if (!sessions.length && !action && !props.isNew) return null

  return (
    <>
      <NetworkListItem title {...props} />
      {props.network?.serviceIds.map(id => (
        <NetworkListItem serviceId={id} key={id} {...props} />
      ))}
    </>
  )
}
