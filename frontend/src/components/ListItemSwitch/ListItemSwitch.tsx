import React from 'react'
import { Icon } from '../Icon'
import { ListItemButton, ListItemText, ListItemIcon, ListItemSecondaryAction, Switch } from '@mui/material'

type Props = {
  keyProp?: string | number
  label: string | React.ReactNode
  subLabel?: React.ReactNode
  icon?: string
  offIcon?: string
  checked?: boolean
  children?: React.ReactNode
  onClick: (checked: boolean) => void
}

export const ListItemSwitch: React.FC<Props> = ({
  label,
  subLabel,
  icon = 'bell-on',
  offIcon = 'bell-slash',
  checked,
  onClick,
  children,
}) => {
  return (
    <ListItemButton onClick={() => onClick(!checked)} dense>
      <ListItemIcon>
        <Icon name={checked ? icon : offIcon} size="md" />
      </ListItemIcon>
      <ListItemText primary={label} secondary={subLabel} />
      <ListItemSecondaryAction>
        {children}
        <Switch
          edge="end"
          color="primary"
          checked={checked}
          onClick={event => {
            event.stopPropagation()
            onClick(!checked)
          }}
        />
      </ListItemSecondaryAction>
    </ListItemButton>
  )
}
