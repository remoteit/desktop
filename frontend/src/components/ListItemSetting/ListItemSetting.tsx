import React from 'react'
import { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Switch, Button } from '@material-ui/core'
import { Icon } from '../Icon'

// React.ComponentProps<typeof ListItem> &
type Props = {
  icon?: string
  label: string
  subLabel?: string | React.ReactNode
  button?: string
  toggle?: boolean
  disabled?: boolean
  onClick?: () => void
}

export const ListItemSetting: React.FC<Props> = ({ icon, label, subLabel, button, toggle, onClick, disabled }) => {
  const showToggle = toggle !== undefined
  const showButton = button !== undefined
  if (!onClick) disabled = true
  return (
    <ListItem button onClick={onClick} disabled={disabled} style={{ opacity: 1 }}>
      <ListItemIcon>
        <Icon name={icon} size="md" type="light" />
      </ListItemIcon>
      <ListItemText primary={label} secondary={subLabel} />
      {(showToggle || showButton) && (
        <ListItemSecondaryAction>
          {showButton ? (
            <Button onClick={onClick} color="secondary">
              {button}
            </Button>
          ) : (
            <Switch edge="end" color="primary" disabled={disabled} checked={toggle} onClick={onClick} />
          )}
        </ListItemSecondaryAction>
      )}
    </ListItem>
  )
}
