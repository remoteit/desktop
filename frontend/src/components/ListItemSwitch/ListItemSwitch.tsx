import React from 'react'
import { Icon } from '../Icon'
import { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Switch } from '@material-ui/core'

type Props = {
  keyProp?: string | number
  label: string | React.ReactNode
  checked?: boolean
  onClick: (checked: boolean) => void
}

export const ListItemSwitch: React.FC<Props> = ({ label, checked, onClick, children }) => {
  return (
    <ListItem button onClick={() => onClick(!checked)} dense>
      <ListItemIcon>
        <Icon name={checked ? 'bell-on' : 'bell-slash'} size="md" />
      </ListItemIcon>
      <ListItemText primary={label} />
      <ListItemSecondaryAction>
        {children}
        <Switch edge="end" color="primary" checked={checked} onClick={() => onClick(!checked)} />
      </ListItemSecondaryAction>
    </ListItem>
  )
}
