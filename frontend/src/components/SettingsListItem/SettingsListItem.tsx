import React from 'react'
import { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from '@material-ui/core'
import { Icon } from '../Icon'

export const SettingsListItem: React.FC<{ show?: boolean; inset?: boolean }> = ({ show, inset, children }) => {
  return (
    <ListItem>
      <ListItemIcon>
        <Icon name="sign-out" />
      </ListItemIcon>
      <ListItemText primary="Sign out" />
      <ListItemSecondaryAction>
        <Icon name="sign-out" />
      </ListItemSecondaryAction>
    </ListItem>
  )
}
