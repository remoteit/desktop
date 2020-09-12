import React from 'react'
import { List, ListItemIcon, ListItemText } from '@material-ui/core'
import { useLocation } from 'react-router-dom'
import { ListItemLocation } from '../ListItemLocation'
import { Icon } from '../Icon'

export const NetworkScanLocation: React.FC = () => {
  const location = useLocation()

  return (
    <List>
      <ListItemLocation pathname={`${location.pathname}/network`}>
        <ListItemIcon>
          <Icon name="wifi" size="md" type="light" />
        </ListItemIcon>
        <ListItemText primary="Add from network" />
      </ListItemLocation>
    </List>
  )
}
