import React from 'react'
import { List, ListItemIcon, ListItemText } from '@material-ui/core'
import { useRouteMatch } from 'react-router-dom'
import { ListItemLocation } from '../ListItemLocation'
import { Icon } from '../Icon'

export const NetworkScanLocation: React.FC = () => {
  const match = useRouteMatch()

  return (
    <List>
      <ListItemLocation pathname={`${match.path}/network`}>
        <ListItemIcon>
          <Icon name="wifi" size="md" weight="light" />
        </ListItemIcon>
        <ListItemText primary="Add from network" />
      </ListItemLocation>
    </List>
  )
}
