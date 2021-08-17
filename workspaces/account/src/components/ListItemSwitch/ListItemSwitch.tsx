import React from 'react'
import { Icon } from '../Icon'
import { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Switch } from '@material-ui/core'

type Props = {
  keyProp?: string | number
  label: string | React.ReactNode
  checked?: boolean
  iconCheked?: string
  iconUncheked?: string
  onClick: (checked: boolean) => void
}

export const ListItemSwitch: React.FC<Props> = ({
  label,
  checked,
  onClick,
  iconCheked = 'bell-on',
  iconUncheked = 'bell-slash',
  children,
}) => {
  return (
    <ListItem button onClick={() => onClick(!checked)} dense>
      <ListItemIcon>
        <Icon name={checked ? iconCheked : iconUncheked} size="md" />
      </ListItemIcon>
      <ListItemText primary={label} />
      <ListItemSecondaryAction>
        {children}
        <Switch edge="end" color="primary" checked={checked} onClick={() => onClick(!checked)} />
      </ListItemSecondaryAction>
    </ListItem>
  )
}
