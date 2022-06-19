import React from 'react'
import { NetworkListItem } from './NetworkListItem'
import { Typography, List, ListItem, ListItemIcon } from '@material-ui/core'

export interface Props {
  network?: INetwork
}

export const Network: React.FC<Props> = props => {
  // if (!sessions.length && !action && !props.isNew) return null

  return (
    <List>
      <NetworkListItem title {...props} />
      {props.network?.serviceIds.map(id => (
        <NetworkListItem serviceId={id} key={id} {...props} />
      ))}
      {!props.network?.serviceIds.length && (
        <ListItem>
          <ListItemIcon />
          <Typography variant="caption">No Services</Typography>
        </ListItem>
      )}
    </List>
  )
}
